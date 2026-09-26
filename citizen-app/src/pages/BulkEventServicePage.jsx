import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { getProfile } from '../services/profileService.js';
import { createComplaint } from '../services/complaintService.js';
import { generateCommercialAssessment } from '../services/commercialAssessmentService.js';
import { calculateCommercialQuote } from '../services/commercialQuoteService.js';
import { compressImage } from '../services/imageCompressor.js';
import { getCurrentPosition } from '../services/geolocation.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import AppLogoIcon from '../components/AppLogoIcon.jsx';
import {
  ESTABLISHMENT_TYPES,
  ESTABLISHMENT_TYPE_LABELS,
  SERVICE_FREQUENCIES,
  SERVICE_FREQUENCY_LABELS,
  WASTE_STREAMS,
  WASTE_STREAM_LABELS,
  COMMERCIAL_SCALES,
  COMMERCIAL_SCALE_LABELS,
  SERVICE_WINDOWS,
  SERVICE_WINDOW_LABELS,
  KOLKATA_OPERATING_ZONES,
  generateCommercialServiceNumber,
} from '../config/commercialConstants.js';
import {
  Building2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  HardHat,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Camera,
  FileCheck,
  ShieldCheck,
  Leaf,
  Info,
  Repeat,
  Compass,
} from 'lucide-react';

const DEFAULT_DEMO_GPS = { lat: 22.5726, lng: 88.3639 }; // Central Kolkata

export default function BulkEventServicePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(1); // 1: Type & Frequency, 2: Location & Schedule, 3: Waste Profile, 4: AI Plan & Quote, 5: Success

  // Form State
  const [establishmentType, setEstablishmentType] = useState('housing_society');
  const [serviceFrequency, setServiceFrequency] = useState('one_time'); // 'one_time' | 'recurring'
  const [operatingZone, setOperatingZone] = useState('zone_a');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [siteInstructions, setSiteInstructions] = useState('');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [serviceWindow, setServiceWindow] = useState('morning');
  const [estimatedPeople, setEstimatedPeople] = useState('300');
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedLocationName, setDetectedLocationName] = useState('');

  const [wasteTypes, setWasteTypes] = useState(['food', 'plastic', 'paper']);
  const [estimatedWasteScale, setEstimatedWasteScale] = useState('medium');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // AI Assessment & Quote State
  const [assessment, setAssessment] = useState(null);
  const [quote, setQuote] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [submittedNumber, setSubmittedNumber] = useState(null);
  const [error, setError] = useState(null);

  // Load user profile
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      getProfile(uid)
        .then((p) => {
          if (p) {
            setProfile(p);
            if (p.area && !address) {
              setAddress(`${p.area}${p.ward ? `, Ward ${p.ward}` : ''}`);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Use Current Location
  const handleDetectLocation = async () => {
    setGpsLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setGpsLocation(pos);
      setDetectedLocationName('GPS Verified via Device Sensor');
      if (!address) {
        setAddress('Kolkata Metropolitan Area');
      }
    } catch (err) {
      console.warn('Geolocation fallback to Kolkata Central:', err.message);
      setGpsLocation(DEFAULT_DEMO_GPS);
      setDetectedLocationName('Kolkata Operating Center (Demo Tag)');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    try {
      const comp = await compressImage(file);
      setCompressedImage(comp);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const toggleWasteType = (typeKey) => {
    setWasteTypes((prev) => {
      if (prev.includes(typeKey)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((t) => t !== typeKey);
      }
      return [...prev, typeKey];
    });
  };

  // Step 3 -> 4: Run AI assessment & Quote Engine
  const handleGenerateServicePlan = async () => {
    setError(null);
    setAnalyzing(true);
    try {
      const businessDetails = {
        establishmentType,
        serviceFrequency,
        operatingZone,
        venueName: venueName.trim() || 'Establishment / Society',
        address: address.trim() || 'Kolkata Metropolitan Area',
        siteInstructions: siteInstructions.trim(),
        eventDate,
        serviceWindow,
        estimatedPeople: parseInt(estimatedPeople, 10) || 300,
        estimatedWasteScale,
        wasteTypes,
        location: gpsLocation || DEFAULT_DEMO_GPS,
        specialInstructions,
      };

      const aiPlan = await generateCommercialAssessment({
        establishmentType,
        estimatedPeople,
        estimatedWasteScale,
        wasteTypes,
        serviceWindow,
        specialInstructions,
        imageBase64: compressedImage?.base64 || null,
        mimeType: compressedImage?.mimeType || 'image/jpeg',
      });

      const quoteResult = calculateCommercialQuote(aiPlan, businessDetails);

      setAssessment(aiPlan);
      setQuote(quoteResult);
      setStep(4);
    } catch (err) {
      setError(`Failed to generate service plan: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Step 4 -> 5: Customer accepts quote and submits service request
  const handleSubmitServiceRequest = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const citizenId = auth.currentUser?.uid;
      if (!citizenId) {
        throw new Error('User session not authenticated. Please refresh.');
      }

      const trackingNumber = generateCommercialServiceNumber();
      const location = gpsLocation || DEFAULT_DEMO_GPS;

      const businessDetails = {
        establishmentType,
        establishmentLabel: ESTABLISHMENT_TYPE_LABELS[establishmentType] || establishmentType,
        serviceFrequency,
        serviceFrequencyLabel: SERVICE_FREQUENCY_LABELS[serviceFrequency] || serviceFrequency,
        operatingZone,
        operatingZoneLabel: KOLKATA_OPERATING_ZONES[operatingZone]?.label || operatingZone,
        venueName: venueName.trim() || 'Establishment / Society',
        address: address.trim() || 'Kolkata Metropolitan Area',
        siteInstructions: siteInstructions.trim(),
        eventDate,
        serviceWindow,
        serviceWindowLabel: SERVICE_WINDOW_LABELS[serviceWindow] || serviceWindow,
        estimatedPeople: parseInt(estimatedPeople, 10) || 300,
        estimatedWasteScale,
        scaleLabel: COMMERCIAL_SCALE_LABELS[estimatedWasteScale] || estimatedWasteScale,
        wasteTypes,
        wasteTypeLabels: wasteTypes.map((t) => WASTE_STREAM_LABELS[t] || t),
        location,
        specialInstructions: specialInstructions.trim(),
      };

      const complaintDoc = {
        serviceType: 'commercial_bulk',
        requestType: 'bulk_event',
        status: 'reported',
        commercialStatus: 'requested',
        complaintNumber: trackingNumber,
        citizenId,
        citizenName: profile?.name?.trim() || 'Commercial Customer',
        citizenPhone: profile?.phone?.trim() || '',
        timestamp: Date.now(),
        imageBase64: compressedImage?.base64 || '',
        gps: location,
        comment: `${venueName ? `${venueName} — ` : ''}${ESTABLISHMENT_TYPE_LABELS[establishmentType] || establishmentType} (${SERVICE_FREQUENCY_LABELS[serviceFrequency] || 'One-time'})`,
        businessDetails,
        commercialAssessment: assessment,
        commercialQuote: quote,
        customerApproval: {
          status: 'accepted',
          approvedAt: Date.now(),
          lockedPrice: quote.indicativeTotal,
          priceLocked: false, // will be confirmed by operator
          decision: 'initial_booking',
        },

        // Civic compatibility fields
        aiResult: {
          wasteType: 'mixed_commercial',
          volumeEstimate: estimatedWasteScale,
          confidence: assessment?.confidence || 0.9,
          reasoning: assessment?.wasteProfile || 'Bulk waste collection',
        },
        priorityScore: 70, // Commercial SLA priority
        priorityReasons: [
          'Commercial Bulk Service Request',
          `${ESTABLISHMENT_TYPE_LABELS[establishmentType] || establishmentType}`,
          `Kolkata ${KOLKATA_OPERATING_ZONES[operatingZone]?.label.split('—')[1]?.trim() || 'Zone'}`,
          `Service Window: ${SERVICE_WINDOW_LABELS[serviceWindow] || serviceWindow}`,
        ],
        urgentEscalation: false,
        isDuplicateOf: null,
        assignedTeam: null,
        assignedVehicle: null,
        verifiedAt: null,
        assignedAt: null,
        inProgressAt: null,
        completedAt: null,
        resolvedAt: null,
        feedback: null,
      };

      const docId = await createComplaint(complaintDoc);
      setSubmittedId(docId);
      setSubmittedNumber(trackingNumber);
      setStep(5);
    } catch (err) {
      console.error('Error submitting commercial request:', err);
      setError(`Failed to submit service booking: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bulk-service-page">
      {/* ── Brand Header ─────────────────────────────────────────── */}
      <header className="commercial-hero-header">
        <div className="commercial-badge">
          <AppLogoIcon size={14} className="hero-sparkle" />
          <span>SwachhLens Services</span>
        </div>
        <h1 className="commercial-title">Commercial & Bulk Waste Operations</h1>
        <p className="commercial-subtitle">
          Dedicated resource planning, segregated collection & municipal logistics for Kolkata housing societies, venues & establishments.
        </p>

        {/* Stepper Indicator */}
        <div className="stepper-bar">
          <div className={`step-node ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-name">Service</span>
          </div>
          <div className="step-connector" />
          <div className={`step-node ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-name">Location</span>
          </div>
          <div className="step-connector" />
          <div className={`step-node ${step >= 3 ? 'active' : ''} ${step > 3 ? 'done' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-name">Waste</span>
          </div>
          <div className="step-connector" />
          <div className={`step-node ${step >= 4 ? 'active' : ''} ${step > 4 ? 'done' : ''}`}>
            <span className="step-num">4</span>
            <span className="step-name">Quote</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="commercial-error-box">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Establishment & Service Frequency ──────────────── */}
      {step === 1 && (
        <div className="commercial-card step-card">
          <div className="card-header">
            <Building2 size={20} className="card-header-icon" />
            <div>
              <h2 className="card-title">Select Establishment & Service Frequency</h2>
              <p className="card-desc">Choose the Kolkata facility type and operational collection frequency.</p>
            </div>
          </div>

          {/* Service Frequency Selector */}
          <div className="frequency-selector-block">
            <span className="section-label">Service Frequency</span>
            <div className="frequency-toggle-group">
              {SERVICE_FREQUENCIES.map((freqKey) => {
                const isSelected = serviceFrequency === freqKey;
                return (
                  <button
                    key={freqKey}
                    type="button"
                    className={`frequency-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setServiceFrequency(freqKey)}
                  >
                    <Repeat size={15} />
                    <span>{SERVICE_FREQUENCY_LABELS[freqKey]}</span>
                  </button>
                );
              })}
            </div>
            {serviceFrequency === 'recurring' && (
              <p className="frequency-hint-note">
                ℹ️ Regular scheduled collections receive allocated fixed route slots and dedicated container servicing.
              </p>
            )}
          </div>

          <div className="section-divider" />

          <span className="section-label">Establishment / Venue Category</span>
          <div className="establishment-grid">
            {ESTABLISHMENT_TYPES.map((typeKey) => {
              const selected = establishmentType === typeKey;
              return (
                <button
                  key={typeKey}
                  type="button"
                  className={`establishment-option ${selected ? 'selected' : ''}`}
                  onClick={() => setEstablishmentType(typeKey)}
                >
                  <div className="establishment-icon-box">
                    <Building2 size={18} />
                  </div>
                  <div className="establishment-info">
                    <span className="establishment-name">{ESTABLISHMENT_TYPE_LABELS[typeKey]}</span>
                    <span className="establishment-sub">Planned collection & segregation</span>
                  </div>
                  {selected && <CheckCircle2 size={18} className="option-check" />}
                </button>
              );
            })}
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(2)}
            >
              <span>Continue to Location & Logistics</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Service Location & Site Access Instructions ─────── */}
      {step === 2 && (
        <div className="commercial-card step-card">
          <div className="card-header">
            <MapPin size={20} className="card-header-icon" />
            <div>
              <h2 className="card-title">Service Location & Site Access</h2>
              <p className="card-desc">Provide establishment details, transit zone and on-ground access directions.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="venueName">
                <Building2 size={14} />
                <span>Establishment / Venue / Society Name</span>
              </label>
              <input
                id="venueName"
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Greenwood Park Housing Society / Hiland Park / Eco Park Banquet"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">
                <MapPin size={14} />
                <span>Address / Area / Locality</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Street 4, Sector V, Salt Lake / Action Area II, New Town"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="operatingZone">
                <Compass size={14} />
                <span>Kolkata Operating & Transit Zone</span>
              </label>
              <select
                id="operatingZone"
                value={operatingZone}
                onChange={(e) => setOperatingZone(e.target.value)}
              >
                {Object.entries(KOLKATA_OPERATING_ZONES).map(([k, z]) => (
                  <option key={k} value={k}>
                    {z.label} (+₹{z.transportAllowance} transit)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="serviceWindow">
                <Clock size={14} />
                <span>Preferred Service Window</span>
              </label>
              <select
                id="serviceWindow"
                value={serviceWindow}
                onChange={(e) => setServiceWindow(e.target.value)}
              >
                {SERVICE_WINDOWS.map((winKey) => (
                  <option key={winKey} value={winKey}>
                    {SERVICE_WINDOW_LABELS[winKey]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="eventDate">
                <Calendar size={14} />
                <span>Service / Collection Date</span>
              </label>
              <input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="estimatedPeople">
                <Users size={14} />
                <span>Approximate Occupancy / Attendees</span>
              </label>
              <input
                id="estimatedPeople"
                type="number"
                value={estimatedPeople}
                onChange={(e) => setEstimatedPeople(e.target.value)}
                placeholder="e.g. 300"
                min="20"
                max="50000"
                required
              />
            </div>

            {/* Geolocation Tagging */}
            <div className="form-group full-width location-detection-box">
              <div className="location-row">
                <div className="location-status">
                  <MapPin size={16} className={gpsLocation ? 'text-green' : 'text-muted'} />
                  <span>
                    {gpsLocation
                      ? `✓ Geotagged for routing: ${detectedLocationName || 'Location Verified'}`
                      : 'Coordinates not yet attached to request'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={handleDetectLocation}
                  disabled={gpsLoading}
                >
                  <RefreshCw size={13} className={gpsLoading ? 'spin' : ''} />
                  <span>{gpsLoading ? 'Locating...' : 'Use Current Location'}</span>
                </button>
              </div>
            </div>

            {/* Site & Collection Instructions */}
            <div className="form-group full-width">
              <label htmlFor="siteInstructions">
                <Info size={14} />
                <span>Site & Collection Instructions</span>
              </label>
              <textarea
                id="siteInstructions"
                value={siteInstructions}
                onChange={(e) => setSiteInstructions(e.target.value)}
                placeholder="e.g. Entry via Gate 2; loading bay near basement ramp; mini-truck clearance height 3.2m; waste bins stored near utility block on west side; service lift available."
                rows={3}
              />
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!address.trim() && !venueName.trim()}
              onClick={() => setStep(3)}
            >
              <span>Continue to Waste Profile</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Waste Profile & Material Streams ───────────────── */}
      {step === 3 && (
        <div className="commercial-card step-card">
          <div className="card-header">
            <Trash2 size={20} className="card-header-icon" />
            <div>
              <h2 className="card-title">Waste Profile & Material Streams</h2>
              <p className="card-desc">Identify expected waste streams to generate resource planning and recovery recommendations.</p>
            </div>
          </div>

          <div className="section-block">
            <label className="section-label">Expected Material Streams (Multi-select)</label>
            <div className="stream-chip-grid">
              {WASTE_STREAMS.map((streamKey) => {
                const checked = wasteTypes.includes(streamKey);
                return (
                  <button
                    key={streamKey}
                    type="button"
                    className={`stream-chip ${checked ? 'active' : ''}`}
                    onClick={() => toggleWasteType(streamKey)}
                  >
                    <span>{checked ? '✓ ' : '+ '}</span>
                    <span>{WASTE_STREAM_LABELS[streamKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="section-block">
            <label className="section-label">Estimated Waste Scale</label>
            <div className="scale-options-grid">
              {COMMERCIAL_SCALES.map((scaleKey) => {
                const selected = estimatedWasteScale === scaleKey;
                return (
                  <div
                    key={scaleKey}
                    className={`scale-option ${selected ? 'selected' : ''}`}
                    onClick={() => setEstimatedWasteScale(scaleKey)}
                  >
                    <div className="scale-radio">{selected ? '●' : '○'}</div>
                    <div className="scale-info">
                      <strong>{COMMERCIAL_SCALE_LABELS[scaleKey]?.split('(')[0]}</strong>
                      <span className="scale-sub">
                        {COMMERCIAL_SCALE_LABELS[scaleKey]?.includes('(')
                          ? `(${COMMERCIAL_SCALE_LABELS[scaleKey].split('(')[1]}`
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-block">
            <label className="section-label">Site Photo (Optional — Visual Assessment)</label>
            <div className="image-upload-zone">
              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Site Preview" className="uploaded-site-img" />
                  <button
                    type="button"
                    className="btn btn-secondary btn-small remove-img-btn"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setCompressedImage(null);
                    }}
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="upload-dropzone">
                  <Camera size={26} className="upload-icon" />
                  <span className="upload-prompt">Tap or click to photograph collection area or waste bins</span>
                  <span className="upload-sub">Assists in verifying vehicle access and container sizing</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(2)}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={analyzing}
              onClick={handleGenerateServicePlan}
            >
              <Sparkles size={16} />
              <span>{analyzing ? 'Analyzing with AI...' : 'Generate Service Plan & Quote'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: AI Service Plan & Transparent Indicative Quote ─── */}
      {step === 4 && assessment && quote && (
        <div className="commercial-card step-card step-quote-card">
          <div className="card-header">
            <Sparkles size={20} className="card-header-icon text-sparkle" />
            <div>
              <h2 className="card-title">AI Operational Assessment & Indicative Quote</h2>
              <p className="card-desc">Review the transparent 8-part rate calculation and operational recommendations.</p>
            </div>
          </div>

          {/* AI Operational Assessment Card */}
          <div className="plan-summary-card">
            <div className="plan-summary-header">
              <span className="plan-tag">OPERATIONAL RESOURCE PLAN</span>
              <span className="confidence-pill">{Math.round((assessment.confidence || 0.9) * 100)}% Match</span>
            </div>

            <div className="plan-spec-grid">
              <div className="spec-item">
                <span className="spec-label">Waste Profile</span>
                <strong className="spec-value">{assessment.wasteProfile}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Recommended Crew</span>
                <strong className="spec-value highlight-blue">
                  <HardHat size={16} />
                  <span>{assessment.recommendedCrewSize || assessment.estimatedCrew} Personnel</span>
                </strong>
                {assessment.crewReasons?.length > 0 && (
                  <ul className="spec-reason-list">
                    {assessment.crewReasons.map((r, idx) => (
                      <li key={idx}>• {r}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="spec-item">
                <span className="spec-label">Recommended Fleet Unit</span>
                <strong className="spec-value highlight-blue">
                  <Truck size={16} />
                  <span>{assessment.recommendedVehicle}</span>
                </strong>
                {assessment.vehicleReasons?.length > 0 && (
                  <ul className="spec-reason-list">
                    {assessment.vehicleReasons.map((r, idx) => (
                      <li key={idx}>• {r}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="spec-item">
                <span className="spec-label">Estimated Service Window</span>
                <strong className="spec-value">
                  <Clock size={16} />
                  <span>~{assessment.estimatedDuration}</span>
                </strong>
              </div>
            </div>

            {/* Potential Recoverable Materials */}
            {assessment.recoverableMaterials?.length > 0 && (
              <div className="recovery-spotlight-box">
                <div className="recovery-header">
                  <Leaf size={16} className="text-green" />
                  <strong>Potential Recoverable Materials</strong>
                </div>
                <div className="recoverable-streams-tags">
                  {assessment.recoverableMaterials.map((mat, i) => (
                    <span key={i} className="stream-tag">♻️ {mat}</span>
                  ))}
                </div>
                <p className="recovery-notes">
                  <strong>Potential recovery / recycling pathway:</strong> Segregated on-site loading facilitates direct routing to authorized dry waste sorting and organic composting streams.
                </p>
              </div>
            )}

            <div className="plan-disclaimer">
              <Info size={14} />
              <span>{assessment.disclaimer}</span>
            </div>
          </div>

          {/* Transparent 8-Part Quotation Breakdown */}
          <div className="quote-breakdown-card">
            <div className="quote-card-header">
              <span className="quote-title">TRANSPARENT QUOTE BREAKDOWN (KOLKATA BASELINE)</span>
              <span className="rate-version-tag">Rate Card v{quote.rateCardVersion}</span>
            </div>

            <div className="quote-line-items">
              {quote.lineItems?.map((item, idx) => (
                <div key={idx} className="quote-line-item">
                  <div className="line-item-desc">
                    <span className="line-item-label">{item.label}</span>
                    <span className="line-item-detail">{item.detail}</span>
                  </div>
                  <span className="line-item-amount">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}

              <div className="quote-total-row">
                <div>
                  <strong className="total-label">Total Indicative Estimate</strong>
                  <span className="total-sub">Includes mobilization, workforce, fleet logistics & zone transport</span>
                </div>
                <strong className="total-amount">₹{quote.indicativeTotal.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            <div className="quote-footer-notice">
              <ShieldCheck size={14} />
              <span>{quote.disclaimer}</span>
            </div>
          </div>

          <div className="step-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setStep(3)}
            >
              <ArrowLeft size={16} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-success-cta"
              disabled={submitting}
              onClick={handleSubmitServiceRequest}
            >
              <FileCheck size={18} />
              <span>{submitting ? 'Submitting Service Request...' : 'Accept Indicative Quote & Submit'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5: Success & Confirmation ────────────────────────── */}
      {step === 5 && (
        <div className="commercial-card step-card success-card">
          <div className="success-badge-icon">
            <CheckCircle2 size={44} className="text-green" />
          </div>
          <h2 className="success-title">Service Request Registered!</h2>
          <p className="success-subtitle">
            Your commercial bulk waste collection request has been submitted to the Kolkata municipal operations queue.
          </p>

          <div className="success-tracking-box">
            <span className="tracking-label">Commercial Service Tracking ID</span>
            <code className="tracking-code">{submittedNumber}</code>
          </div>

          <div className="confirmation-details-grid">
            <div className="confirm-row">
              <span className="confirm-label">Establishment / Venue</span>
              <span className="confirm-value">{venueName || ESTABLISHMENT_TYPE_LABELS[establishmentType]}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Service Type & Frequency</span>
              <span className="confirm-value">
                {ESTABLISHMENT_TYPE_LABELS[establishmentType]} • {SERVICE_FREQUENCY_LABELS[serviceFrequency]}
              </span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Scheduled Date & Window</span>
              <span className="confirm-value">{eventDate} ({SERVICE_WINDOW_LABELS[serviceWindow]})</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Allocated Fleet Unit</span>
              <span className="confirm-value">{assessment?.recommendedVehicle} ({assessment?.recommendedCrewSize || assessment?.estimatedCrew} Operatives)</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Indicative Estimate</span>
              <span className="confirm-value bold text-primary">₹{quote?.indicativeTotal?.toLocaleString('en-IN')}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Customer Status</span>
              <span className="confirm-value text-green">Quote Accepted • Awaiting Operator Review & Lock</span>
            </div>
          </div>

          <div className="success-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/report/${submittedId}`)}
            >
              <span>View Service Dossier</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setStep(1);
                setSubmittedId(null);
                setSubmittedNumber(null);
              }}
            >
              <span>Book Another Service</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
