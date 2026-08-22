import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Link2,
  Building2,
  Biohazard,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

/**
 * Derived Operational Alerts Center component for the Municipal Dashboard.
 * Computes live operational alert cards from current Firestore complaint state.
 */
export default function OperationalAlerts({ complaints, onApplyFilter }) {
  if (!complaints || complaints.length === 0) return null;

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // 1. Urgent action required (unresolved urgent complaints)
  const urgentUnresolved = complaints.filter(
    (c) => c.urgentEscalation && c.status !== 'resolved'
  );

  // 2. High priority unassigned (score >= 70 and not yet assigned/resolved)
  const highPriorityUnassigned = complaints.filter(
    (c) =>
      (c.priorityScore || 0) >= 70 &&
      ['reported', 'verified'].includes(c.status) &&
      !c.assignedTeam
  );

  // 3. Potential duplicate cases
  const duplicateCases = complaints.filter(
    (c) => !!c.isDuplicateOf && c.status !== 'resolved'
  );

  // 4. Aging complaints (>24h unresolved)
  const agingComplaints = complaints.filter(
    (c) =>
      c.status !== 'resolved' &&
      c.timestamp &&
      now - c.timestamp > ONE_DAY_MS
  );

  // 5. Sensitive locations (near school / hospital)
  const sensitiveLocationComplaints = complaints.filter(
    (c) =>
      ['near_school', 'near_hospital'].includes(c.aiResult?.locationSensitivityHint) &&
      c.status !== 'resolved'
  );

  // 6. Bio-waste / Hazardous alerts
  const bioOrHazardComplaints = complaints.filter(
    (c) =>
      (c.aiResult?.wasteType === 'hazardous_waste' || c.aiResult?.bioWasteRisk) &&
      c.status !== 'resolved'
  );

  const alerts = [
    {
      id: 'urgent',
      count: urgentUnresolved.length,
      label: 'Critical / Urgent Action Needed',
      desc: 'Severe hazards requiring immediate field response',
      icon: AlertOctagon,
      color: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      filterAction: () => onApplyFilter?.({ urgentOnly: true, status: 'all', duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      id: 'unassigned-high',
      count: highPriorityUnassigned.length,
      label: 'High-Priority Unassigned',
      desc: 'Score ≥70 awaiting team or vehicle assignment',
      icon: AlertTriangle,
      color: '#ea580c',
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      filterAction: () => onApplyFilter?.({ status: 'reported', urgentOnly: false, duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      id: 'biohazard',
      count: bioOrHazardComplaints.length,
      label: 'Biohazard & Specialized Cases',
      desc: 'Hazardous or clinical waste flagged for containment',
      icon: Biohazard,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      borderColor: '#ddd6fe',
      filterAction: () => onApplyFilter?.({ wasteType: 'hazardous_waste', status: 'all', urgentOnly: false, duplicateOnly: false, search: '' }),
    },
    {
      id: 'aging',
      count: agingComplaints.length,
      label: 'Aging Unresolved (>24h)',
      desc: 'Backlogged complaints exceeding target cleanup SLA',
      icon: Clock,
      color: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
      filterAction: () => onApplyFilter?.({ status: 'reported', urgentOnly: false, duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      id: 'sensitive',
      count: sensitiveLocationComplaints.length,
      label: 'School / Hospital Sensitive',
      desc: 'Vulnerable zone waste reports prioritized',
      icon: Building2,
      color: '#0284c7',
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd',
      filterAction: () => onApplyFilter?.({ urgentOnly: true, status: 'all', duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      id: 'duplicates',
      count: duplicateCases.length,
      label: 'Duplicate Incident Clusters',
      desc: 'Corroborating reports identified by GPS & visual AI',
      icon: Link2,
      color: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      filterAction: () => onApplyFilter?.({ duplicateOnly: true, status: 'all', urgentOnly: false, wasteType: 'all', search: '' }),
    },
  ];

  // Only display alerts with active count > 0
  const activeAlerts = alerts.filter((a) => a.count > 0);

  if (activeAlerts.length === 0) {
    return (
      <div className="operational-alerts-container alerts-all-clear">
        <div className="alerts-clear-box">
          <CheckCircle2 size={20} className="text-emerald" />
          <span>All operational priority queues clear — No immediate hazard escalations pending.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="operational-alerts-container">
      <div className="alerts-section-header">
        <div className="alerts-title-box">
          <AlertTriangle size={18} className="text-red" />
          <h4>Operational Alert Center</h4>
        </div>
        <span className="alerts-count-badge">
          {activeAlerts.length} Active Operational Notice{activeAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="alerts-grid">
        {activeAlerts.map((alert) => {
          const IconComponent = alert.icon;
          return (
            <div
              key={alert.id}
              className="alert-card-item"
              style={{
                background: alert.bgColor,
                borderColor: alert.borderColor,
              }}
              onClick={alert.filterAction}
              role="button"
              tabIndex={0}
              title={`Click to filter queue for: ${alert.label}`}
            >
              <div className="alert-card-left">
                <div
                  className="alert-icon-wrap"
                  style={{ background: alert.color, color: '#fff' }}
                >
                  <IconComponent size={16} />
                </div>
                <div className="alert-text-wrap">
                  <div className="alert-top-line">
                    <strong className="alert-item-label" style={{ color: alert.color }}>
                      {alert.label}
                    </strong>
                    <span className="alert-num-badge" style={{ background: alert.color }}>
                      {alert.count}
                    </span>
                  </div>
                  <p className="alert-desc">{alert.desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className="alert-arrow-icon" style={{ color: alert.color }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
