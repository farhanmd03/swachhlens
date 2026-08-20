import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import ImageCapture from '../components/ImageCapture.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PriorityExplainer from '../components/PriorityExplainer.jsx';
import InterventionCard from '../components/InterventionCard.jsx';
import { compressImage } from '../services/imageCompressor.js';
import { getCurrentPosition } from '../services/geolocation.js';
import { analyzeWasteImage } from '../services/gemini.js';
import { findDuplicate } from '../services/duplicateDetection.js';
import { calculatePriority, calculateUrgentEscalation } from '../services/priorityCalculator.js';
import { createComplaint } from '../services/complaintService.js';
import { getInterventionRecommendation } from '../services/interventionRecommendation.js';
import { getProfile } from '../services/profileService.js';
import {
  VOLUME_WEIGHTS,
  LOCATION_SENSITIVITY_WEIGHTS,
  WASTE_TYPE_LABELS,
  VOLUME_LABELS,
  generateComplaintNumber,
} from '../config/constants.js';
import {
  Sparkles,
  MapPin,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Check,
  ArrowRight,
  PlusCircle,
  FileCheck,
  Bot,
} from 'lucide-react';

const DEMO_LOCATION = { lat: 28.6315, lng: 77.2167 };

const STEPS = {
  CAPTURE: 'capture',
  COMPRESSING: 'compressing',
  LOCATING: 'locating',
  LOCATION_ERROR: 'location_error',
  ANALYZING: 'analyzing',
  REVIEW: 'review',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function ReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.CAPTURE);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [compressedData, setCompressedData] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsIsDemo, setGpsIsDemo] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [submittedId, setSubmittedId] = useState(null);
  const [submittedNumber, setSubmittedNumber] = useState(null);
  const [priorityScore, setPriorityScore] = useState(null);
  const [priorityReasons, setPriorityReasons] = useState([]);
  const [citizenProfile, setCitizenProfile] = useState(null);
  const [analysisStage, setAnalysisStage] = useState('Analyzing image with Gemini Vision...');

  // Load citizen profile on auth ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        getProfile(user.uid).then((p) => setCitizenProfile(p)).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageSelect = (file) => {
    if (!file) {
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setCompressedData(null);
      setAiResult(null);
      setRecommendation(null);
      setGps(null);
      setGpsIsDemo(false);
      setStep(STEPS.CAPTURE);
      return;
    }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError('Please select or capture an image first.');
      return;
    }
    setError(null);
    setLocationError(null);

    // Step 1: Compress
    setStep(STEPS.COMPRESSING);
    let compressed;
    try {
      compressed = await compressImage(imageFile);
    } catch (e) {
      setError(`Image compression failed: ${e.message}`);
      setStep(STEPS.ERROR);
      return;
    }
    setCompressedData(compressed);

    // Step 2: GPS
    await doGetLocation(compressed);
  };

  const doGetLocation = async (compressed) => {
    setStep(STEPS.LOCATING);
    setLocationError(null);
    try {
      const position = await getCurrentPosition();
      setGps(position);
      setGpsIsDemo(false);
      await doAnalyze(compressed || compressedData, position);
    } catch (gpsErr) {
      setLocationError(gpsErr.message);
      setStep(STEPS.LOCATION_ERROR);
    }
  };

  const handleRetryLocation = () => doGetLocation(compressedData);

  const handleUseDemoLocation = async () => {
    setGps(DEMO_LOCATION);
    setGpsIsDemo(true);
    await doAnalyze(compressedData, DEMO_LOCATION);
  };

  const doAnalyze = async (compressed, position) => {
    try {
      setStep(STEPS.ANALYZING);
      setAnalysisStage('Classifying waste category & estimating volume...');

      const result = await analyzeWasteImage(compressed.base64, compressed.mimeType);
      setAiResult(result);

      // Get recommendation
      const rec = getInterventionRecommendation({
        wasteType: result.wasteType,
        volumeEstimate: result.volumeEstimate,
        locationSensitivityHint: result.locationSensitivityHint,
      });
      setRecommendation(rec);

      setStep(STEPS.REVIEW);
    } catch (aiErr) {
      setError(`AI analysis failed: ${aiErr.message}`);
      setStep(STEPS.ERROR);
    }
  };

  const handleSubmit = async () => {
    try {
      setStep(STEPS.SUBMITTING);
      setError(null);

      const timestamp = Date.now();
      const citizenId = auth.currentUser?.uid;
      if (!citizenId) throw new Error('Not authenticated. Please refresh and try again.');
      if (!compressedData?.base64) throw new Error('Image data missing. Please re-select the image.');
      if (!gps) throw new Error('Location missing. Please provide location.');
      if (!aiResult) throw new Error('AI analysis missing. Please re-analyze.');

      // Priority calculation (non-fatal)
      let score = 0;
      let reasons = [];
      try {
        const res = await calculatePriority({
          volumeEstimate: aiResult.volumeEstimate,
          locationSensitivityHint: aiResult.locationSensitivityHint,
          gps,
          timestamp,
          wasteType: aiResult.wasteType,
        });
        score = res.priorityScore;
        reasons = res.priorityReasons;
      } catch (e) {
        console.warn('Priority calculation fallback:', e.message);
        const vw = VOLUME_WEIGHTS[aiResult.volumeEstimate] ?? 0.5;
        const lw = LOCATION_SENSITIVITY_WEIGHTS[aiResult.locationSensitivityHint] ?? 0;
        score = Math.round(vw * 40 + lw * 30);
      }
      setPriorityScore(score);
      setPriorityReasons(reasons);

      // Duplicate check (non-fatal)
      let isDuplicateOf = null;
      try {
        isDuplicateOf = await findDuplicate(aiResult.wasteType, gps);
      } catch (e) {
        console.warn('Duplicate check fallback:', e.message);
      }

      const urgentEscalation = calculateUrgentEscalation(
        aiResult.wasteType,
        aiResult.locationSensitivityHint
      );
      const complaintNumber = generateComplaintNumber();
      const rec =
        recommendation ||
        getInterventionRecommendation({
          wasteType: aiResult.wasteType,
          volumeEstimate: aiResult.volumeEstimate,
          locationSensitivityHint: aiResult.locationSensitivityHint,
        });

      const complaintData = {
        citizenId,
        citizenName: citizenProfile?.name || '',
        citizenPhone: citizenProfile?.phone || '',
        complaintNumber,
        imageBase64: compressedData.base64,
        gps,
        timestamp,
        comment: comment.trim(),
        aiResult: {
          wasteType: aiResult.wasteType,
          volumeEstimate: aiResult.volumeEstimate,
          confidence: aiResult.confidence,
          locationSensitivityHint: aiResult.locationSensitivityHint,
          reasoning: aiResult.reasoning,
        },
        isDuplicateOf,
        priorityScore: score,
        priorityReasons: reasons,
        recommendedIntervention: rec,
        status: 'reported',
        assignedTeam: null,
        assignedVehicle: null,
        urgentEscalation,
        verifiedAt: null,
        assignedAt: null,
        inProgressAt: null,
        resolvedAt: null,
        feedback: null,
      };

      const docId = await createComplaint(complaintData);
      setSubmittedId(docId);
      setSubmittedNumber(complaintNumber);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep(STEPS.CAPTURE);
    setImageFile(null);
    setPreviewUrl(null);
    setCompressedData(null);
    setGps(null);
    setGpsIsDemo(false);
    setAiResult(null);
    setRecommendation(null);
    setComment('');
    setError(null);
    setLocationError(null);
    setSubmittedId(null);
    setSubmittedNumber(null);
    setPriorityScore(null);
    setPriorityReasons([]);
  };

  return (
    <div className="report-page">
      <div className="page-header">
        <h2>Report Waste Issue</h2>
        <p className="page-subtitle">
          Submit photo evidence with GPS to trigger AI routing to municipal teams.
        </p>
      </div>

      {/* ── STEP 1: CAPTURE & DESCRIPTION ───────────────────────── */}
      {step === STEPS.CAPTURE && (
        <div className="report-flow-card">
          <div className="form-section-title">
            <span className="step-badge">Step 1</span>
            <h3>Add Photo Evidence</h3>
          </div>

          <ImageCapture
            onImageSelect={handleImageSelect}
            previewUrl={previewUrl}
            disabled={false}
          />

          {previewUrl && (
            <div className="image-ready-notice">
              <Check size={16} className="ready-icon" />
              <span>Image ready for AI analysis & compression</span>
            </div>
          )}

          <div className="form-section-title" style={{ marginTop: '20px' }}>
            <span className="step-badge">Step 2</span>
            <h3>Describe Issue (Optional)</h3>
          </div>

          <div className="form-group">
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Overflowing garbage has been blocking the footpath since morning..."
              rows={3}
            />
          </div>

          {previewUrl ? (
            <button className="btn btn-primary btn-full btn-lg" onClick={handleAnalyze}>
              <Sparkles size={18} />
              <span>Analyze with Gemini AI →</span>
            </button>
          ) : (
            <p className="hint-text">
              Select or take a photo above to start AI waste classification.
            </p>
          )}
        </div>
      )}

      {/* ── PROCESSING STATES ─────────────────────────────────── */}
      {step === STEPS.COMPRESSING && (
        <LoadingSpinner message="Optimizing & compressing image for zero-cost storage..." />
      )}
      {step === STEPS.LOCATING && (
        <LoadingSpinner message="Detecting GPS coordinates... (please allow browser access)" />
      )}
      {step === STEPS.ANALYZING && (
        <LoadingSpinner message={analysisStage} />
      )}
      {step === STEPS.SUBMITTING && (
        <LoadingSpinner message="Creating complaint record in Firestore..." />
      )}

      {/* ── LOCATION ERROR RECOVERY ───────────────────────────── */}
      {step === STEPS.LOCATION_ERROR && (
        <div className="report-flow-card location-error-card">
          <div className="error-icon-box">
            <MapPin size={32} className="text-red" />
          </div>
          <h3>Location Access Required</h3>
          <p className="error-message">{locationError}</p>
          <div className="location-actions">
            <button className="btn btn-primary" onClick={handleRetryLocation}>
              <RotateCcw size={16} />
              <span>Retry GPS Location</span>
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              <span>Start Over</span>
            </button>
          </div>
          <div className="demo-location-block">
            <hr />
            <p className="demo-location-warning">
              🧪 <strong>Test Mode</strong> — If browser GPS is unavailable on your device,
              you can use a preset test location (Connaught Place, New Delhi).
            </p>
            <button className="btn btn-demo" onClick={handleUseDemoLocation}>
              🧪 Use Demo Location (Testing Only)
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: AI REVIEW ─────────────────────────────────── */}
      {step === STEPS.REVIEW && aiResult && (
        <div className="report-flow-card review-flow-card">
          <div className="form-section-title">
            <span className="step-badge step-badge-review">Step 3</span>
            <h3>Review AI Assessment</h3>
          </div>

          {compressedData?.dataUrl && (
            <div className="review-image-wrapper">
              <img
                src={compressedData.dataUrl}
                alt="Compressed waste evidence"
                className="review-image"
              />
              <span className="image-verified-pill">✓ Compressed for Spark</span>
            </div>
          )}

          {/* AI Waste Assessment */}
          <div className="ai-assessment-card">
            <div className="card-top-tag">
              <Bot size={15} />
              <span>AI Waste Assessment</span>
            </div>

            <div className="assessment-main-type">
              <span className="assessment-type-label">Detected Category</span>
              <h4 className="assessment-type-value">
                {WASTE_TYPE_LABELS[aiResult.wasteType] || aiResult.wasteType}
              </h4>
            </div>

            <div className="assessment-grid">
              <div className="assessment-item">
                <span className="assessment-label">Volume</span>
                <span className="assessment-value">
                  {VOLUME_LABELS[aiResult.volumeEstimate] || aiResult.volumeEstimate}
                </span>
              </div>
              <div className="assessment-item">
                <span className="assessment-label">Confidence</span>
                <span className="assessment-value">
                  {Math.round((aiResult.confidence || 0) * 100)}%
                </span>
              </div>
              <div className="assessment-item full-span">
                <span className="assessment-label">Location Context</span>
                <span className="assessment-value">
                  {aiResult.locationSensitivityHint?.replace(/_/g, ' ') || 'Standard Area'}
                </span>
              </div>
            </div>

            {aiResult.reasoning && (
              <p className="assessment-reasoning">
                <strong>AI Reasoning:</strong> {aiResult.reasoning}
              </p>
            )}
          </div>

          {/* Priority Score Explainer */}
          {priorityScore != null && (
            <div className="review-section-block">
              <h4 className="sub-block-title">Priority & Urgency</h4>
              <PriorityExplainer score={priorityScore} reasons={priorityReasons} />
            </div>
          )}

          {/* Recommended Response */}
          {recommendation && (
            <div className="review-section-block">
              <h4 className="sub-block-title">AI Recommended Response</h4>
              <InterventionCard recommendation={recommendation} />
            </div>
          )}

          {/* Location Badge */}
          {gps && (
            <div className={`gps-status-bar ${gpsIsDemo ? 'gps-status-demo' : ''}`}>
              <MapPin size={16} className="gps-icon" />
              <span className="gps-text">
                GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                {gpsIsDemo && <strong> (Demo Test Location)</strong>}
              </span>
            </div>
          )}

          <div className="review-actions-bar">
            <button className="btn btn-primary btn-full btn-lg" onClick={handleSubmit}>
              <CheckCircle2 size={18} />
              <span>Confirm & Submit Report</span>
            </button>
            <button className="btn btn-secondary btn-full" onClick={handleReset}>
              <span>Retake / Start Over</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: SUBMISSION SUCCESS ────────────────────────── */}
      {step === STEPS.SUCCESS && (
        <div className="report-flow-card success-card">
          <div className="success-hero-icon">
            <CheckCircle2 size={56} className="text-emerald" />
          </div>
          <h3 className="success-title">Report Submitted Successfully!</h3>
          <p className="success-subtitle">
            Your complaint is registered in Firestore and queued for municipal dispatch.
          </p>

          {submittedNumber && (
            <div className="tracking-number-banner">
              <span className="tracking-label">Complaint Tracking ID</span>
              <code className="tracking-code">{submittedNumber}</code>
            </div>
          )}

          {aiResult && (
            <div className="success-summary-grid">
              <div className="summary-pill">
                <span className="pill-lbl">Waste</span>
                <strong>{WASTE_TYPE_LABELS[aiResult.wasteType] || aiResult.wasteType}</strong>
              </div>
              <div className="summary-pill">
                <span className="pill-lbl">Volume</span>
                <strong>{VOLUME_LABELS[aiResult.volumeEstimate] || aiResult.volumeEstimate}</strong>
              </div>
              <div className="summary-pill">
                <span className="pill-lbl">Priority</span>
                <strong>{priorityScore || 0}/100</strong>
              </div>
              <div className="summary-pill">
                <span className="pill-lbl">Status</span>
                <strong style={{ color: '#059669' }}>Reported</strong>
              </div>
            </div>
          )}

          <div className="success-action-buttons">
            {submittedId && (
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/report/${submittedId}`)}
              >
                <FileCheck size={18} />
                <span>Track Complaint Details</span>
              </button>
            )}
            <button
              className="btn btn-outline btn-full"
              onClick={() => navigate('/my-reports')}
            >
              <span>View in My Reports</span>
            </button>
            <button
              className="btn btn-secondary btn-full"
              onClick={handleReset}
            >
              <PlusCircle size={18} />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR STATE ──────────────────────────────────────── */}
      {step === STEPS.ERROR && (
        <div className="report-flow-card error-card">
          <div className="error-icon-box">
            <AlertCircle size={40} className="text-red" />
          </div>
          <h3>Submission Error</h3>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button className="btn btn-primary" onClick={handleReset}>
              <RotateCcw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
