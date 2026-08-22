import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToTeamComplaints } from '../services/complaintService.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import {
  WASTE_TYPE_LABELS,
  VOLUME_LABELS,
  TEAM_TYPE_LABELS,
  STATUS_LABELS,
} from '../config/constants.js';
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  Truck,
  Users,
  ChevronRight,
  HardHat,
  Biohazard,
  RotateCcw,
} from 'lucide-react';

export default function SupervisorDashboardPage({ user }) {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'urgent' | 'in_progress' | 'completed'

  useEffect(() => {
    if (!user?.teamId) {
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeToTeamComplaints(
      user.teamId,
      (data) => {
        setComplaints(data || []);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching team complaints:', err);
        setError('Unable to load assigned jobs. Please check network connection or try refreshing.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.teamId]);

  const assignedCount = complaints.filter((c) => c.status === 'assigned').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const activeCount = assignedCount + inProgressCount;
  const urgentCount = complaints.filter(
    (c) =>
      (c.urgentEscalation || c.aiResult?.bioWasteRisk || (c.priorityScore && c.priorityScore >= 70)) &&
      (c.status === 'assigned' || c.status === 'in_progress')
  ).length;
  const completedCount = complaints.filter(
    (c) => c.status === 'completed_pending_verification' || c.status === 'resolved'
  ).length;

  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'active') return c.status === 'assigned' || c.status === 'in_progress';
    if (filter === 'urgent')
      return (
        (c.urgentEscalation || c.aiResult?.bioWasteRisk || (c.priorityScore && c.priorityScore >= 70)) &&
        (c.status === 'assigned' || c.status === 'in_progress')
      );
    if (filter === 'in_progress') return c.status === 'in_progress';
    if (filter === 'completed') return c.status === 'completed_pending_verification' || c.status === 'resolved';
    return true;
  });

  return (
    <div className="supervisor-dashboard-page">
      <div className="page-header">
        <div className="header-title-box">
          <h2>Field Operations Queue</h2>
          <p className="page-subtitle">
            Assigned cleanup tasks, on-site execution, and completion evidence submission for your unit.
          </p>
        </div>
      </div>

      {/* ── KPI METRICS STRIP ──────────────────────────────────── */}
      <div className="supervisor-kpi-grid">
        <div
          className={`supervisor-kpi-card card-total ${filter === 'all' ? 'active-kpi' : ''}`}
          onClick={() => setFilter('all')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('all')}
        >
          <div className="kpi-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <ClipboardList size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Assigned</span>
            <strong className="kpi-num">{complaints.length}</strong>
          </div>
        </div>

        <div
          className={`supervisor-kpi-card card-urgent ${filter === 'urgent' ? 'active-kpi' : ''}`}
          onClick={() => setFilter('urgent')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('urgent')}
        >
          <div className="kpi-icon-box" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Urgent Priority</span>
            <strong className="kpi-num text-danger">{urgentCount}</strong>
          </div>
        </div>

        <div
          className={`supervisor-kpi-card card-progress ${filter === 'in_progress' ? 'active-kpi' : ''}`}
          onClick={() => setFilter('in_progress')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('in_progress')}
        >
          <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">In Progress</span>
            <strong className="kpi-num text-amber">{inProgressCount}</strong>
          </div>
        </div>

        <div
          className={`supervisor-kpi-card card-completed ${filter === 'completed' ? 'active-kpi' : ''}`}
          onClick={() => setFilter('completed')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setFilter('completed')}
        >
          <div className="kpi-icon-box" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed / Verified</span>
            <strong className="kpi-num text-emerald">{completedCount}</strong>
          </div>
        </div>
      </div>

      {/* ── FILTER BUTTONS ─────────────────────────────────────── */}
      <div className="supervisor-filter-bar">
        <div className="filter-btn-group">
          <button
            className={`btn-filter ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Assigned ({complaints.length})
          </button>
          <button
            className={`btn-filter ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active Work ({activeCount})
          </button>
          <button
            className={`btn-filter ${filter === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilter('urgent')}
          >
            Urgent ({urgentCount})
          </button>
          <button
            className={`btn-filter ${filter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilter('in_progress')}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            className={`btn-filter ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* ── ASSIGNED JOBS LIST ─────────────────────────────────── */}
      {error && (
        <div className="portal-error-card" style={{ marginBottom: '16px' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="portal-loading-card">Loading team assignments...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="empty-jobs-card">
          <HardHat size={36} className="text-muted" />
          <h3>No assigned jobs found in this view</h3>
          <p>When municipal operators dispatch jobs to your unit, they will appear here in real-time.</p>
        </div>
      ) : (
        <div className="supervisor-jobs-grid">
          {filteredComplaints.map((job) => {
            const wasteLabel =
              WASTE_TYPE_LABELS[job.aiResult?.wasteType] || job.aiResult?.wasteType || 'Waste Issue';
            const rec = job.recommendedIntervention;
            const hasRework = !!job.reworkReason;
            const isJobDone = job.status === 'completed_pending_verification' || job.status === 'resolved';
            const completionTime = job.completedAt || job.completionEvidence?.completedAt || job.resolvedAt;

            return (
              <div
                key={job.id}
                className={`supervisor-job-card ${hasRework ? 'job-rework-border' : ''}`}
                onClick={() => navigate(`/job/${job.id}`)}
              >
                {/* Rework Alert Banner */}
                {hasRework && (
                  <div className="job-rework-banner">
                    <RotateCcw size={14} />
                    <span><strong>Rework Required:</strong> {job.reworkReason}</span>
                  </div>
                )}

                <div className="job-card-header">
                  <div className="job-id-wrap">
                    <span className="job-tracking-badge">
                      {job.complaintNumber || job.id.slice(0, 8)}
                    </span>
                    {job.urgentEscalation && (
                      <span className="urgent-badge-pill">
                        <AlertTriangle size={11} /> Urgent
                      </span>
                    )}
                    {job.aiResult?.bioWasteRisk && (
                      <span className="urgent-badge-pill" style={{ background: '#7c3aed', color: '#fff' }}>
                        <Biohazard size={11} /> Bio-Risk
                      </span>
                    )}
                    {isJobDone && (
                      <span className="evidence-badge-pill">
                        <CheckCircle2 size={11} /> Evidence Submitted
                      </span>
                    )}
                  </div>
                  <div className="job-badges">
                    <StatusBadge status={job.status} />
                    <PriorityBadge score={job.priorityScore} />
                  </div>
                </div>

                <div className="job-card-body">
                  <div className="job-photo-preview">
                    {job.imageBase64 ? (
                      <img
                        src={`data:image/jpeg;base64,${job.imageBase64}`}
                        alt={wasteLabel}
                      />
                    ) : (
                      <div className="no-photo-thumb">No Image</div>
                    )}
                  </div>

                  <div className="job-details-col">
                    <h3 className="job-waste-title">{wasteLabel}</h3>
                    <p className="job-volume-tag">
                      Volume: <strong>{VOLUME_LABELS[job.aiResult?.volumeEstimate] || 'Medium'}</strong>
                    </p>

                    <div className="job-meta-lines">
                      <div className="job-meta-row">
                        <MapPin size={13} className="text-muted flex-shrink-0" />
                        <span>
                          {job.gps ? `${job.gps.lat.toFixed(4)}, ${job.gps.lng.toFixed(4)}` : 'Location not provided'}
                        </span>
                      </div>
                      <div className="job-meta-row">
                        <Truck size={13} className="text-muted flex-shrink-0" />
                        <span>{job.assignedVehicle || rec?.vehicle || 'Unit Van'}</span>
                      </div>
                      {rec?.estimatedCleanupTime && (
                        <div className="job-meta-row">
                          <Clock size={13} className="text-muted flex-shrink-0" />
                          <span>Est. Cleanup: {rec.estimatedCleanupTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="job-card-footer">
                  <span className="job-time-ago">
                    {isJobDone && completionTime
                      ? `Completed: ${new Date(completionTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : `Reported: ${new Date(job.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                  <button className="btn btn-secondary btn-small btn-view-job">
                    <span>{isJobDone ? 'Review Evidence' : 'Inspect & Update'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
