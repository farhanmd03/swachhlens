import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from '../services/profileService.js';
import { getCitizenComplaints } from '../services/complaintService.js';
import ComplaintCard from '../components/ComplaintCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Inbox,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser?.uid) {
        try {
          const [userProfile, userComplaints] = await Promise.all([
            getProfile(currentUser.uid).catch(() => null),
            getCitizenComplaints(currentUser.uid).catch(() => []),
          ]);
          setProfile(userProfile);
          setComplaints(userComplaints || []);
        } catch (err) {
          console.error('Error loading home data:', err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  const totalReports = complaints.length;
  const activeReports = complaints.filter(
    (c) => ['reported', 'verified', 'assigned', 'in_progress'].includes(c.status)
  ).length;
  const resolvedReports = complaints.filter((c) => c.status === 'resolved').length;
  const urgentReports = complaints.filter((c) => c.urgentEscalation).length;

  const recentComplaints = complaints.slice(0, 3);
  const greetingName = profile?.name ? profile.name.trim() : 'Citizen';

  return (
    <div className="home-page">
      {/* ── Welcome Hero ────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={13} className="hero-sparkle" />
            <span>AI-Powered Civic Response</span>
          </div>
          <h1 className="hero-title">Hello, {greetingName}</h1>
          <p className="hero-subtitle">
            See waste. Report it. Route the response.
          </p>
          <button
            className="btn btn-primary btn-hero-cta"
            onClick={() => navigate('/report')}
          >
            <PlusCircle size={18} />
            <span>+ Report Waste</span>
          </button>
        </div>
      </section>

      {/* ── Live Stats ─────────────────────────────────────────── */}
      <section className="home-stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-card-header">
            <FileText size={16} className="stat-icon stat-icon-blue" />
            <span className="stat-label">Total Reports</span>
          </div>
          <span className="stat-number">{totalReports}</span>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-card-header">
            <Clock size={16} className="stat-icon stat-icon-amber" />
            <span className="stat-label">In Progress</span>
          </div>
          <span className="stat-number">{activeReports}</span>
        </div>

        <div className="stat-card stat-resolved">
          <div className="stat-card-header">
            <CheckCircle2 size={16} className="stat-icon stat-icon-green" />
            <span className="stat-label">Resolved</span>
          </div>
          <span className="stat-number">{resolvedReports}</span>
        </div>
      </section>

      {/* ── Your Impact ────────────────────────────────────────── */}
      <section className="home-card impact-card">
        <div className="card-header">
          <h2 className="card-title">Your Civic Impact</h2>
        </div>
        <div className="impact-grid">
          <div className="impact-item">
            <div className="impact-icon-box impact-icon-blue">
              <FileText size={18} />
            </div>
            <div className="impact-info">
              <strong>{totalReports} Reports Submitted</strong>
              <p>Directly geo-tagged & routed to municipal response.</p>
            </div>
          </div>

          <div className="impact-item">
            <div className="impact-icon-box impact-icon-green">
              <CheckCircle2 size={18} />
            </div>
            <div className="impact-info">
              <strong>{resolvedReports} Issues Resolved</strong>
              <p>Cleaned up and verified on the ground.</p>
            </div>
          </div>

          {urgentReports > 0 && (
            <div className="impact-item impact-urgent">
              <div className="impact-icon-box impact-icon-red">
                <AlertTriangle size={18} />
              </div>
              <div className="impact-info">
                <strong>{urgentReports} Urgent Hazard{urgentReports > 1 ? 's' : ''} Flagged</strong>
                <p>Escalated for immediate priority intervention.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Reports ─────────────────────────────────────── */}
      <section className="home-card recent-card">
        <div className="card-header">
          <h2 className="card-title">Recent Reports</h2>
          {complaints.length > 0 && (
            <button
              className="btn-link"
              onClick={() => navigate('/my-reports')}
            >
              <span>View all ({complaints.length})</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {recentComplaints.length === 0 ? (
          <div className="empty-state-box">
            <Inbox size={32} className="empty-icon-muted" />
            <h3>No reports submitted yet</h3>
            <p>Help keep your neighborhood clean by submitting your first waste report.</p>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => navigate('/report')}
            >
              + Submit First Report
            </button>
          </div>
        ) : (
          <div className="recent-list">
            {recentComplaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
