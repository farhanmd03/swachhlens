import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { WASTE_TYPE_LABELS } from '../config/constants.js';
import { AlertTriangle, Link2, Users, Calendar } from 'lucide-react';

/**
 * Compact complaint card for the My Reports list.
 * Shows: thumbnail, complaintNumber, wasteType, priority, status, date,
 *        assignedTeam indicator, duplicate indicator.
 */
export default function ComplaintCard({ complaint }) {
  const navigate = useNavigate();
  const {
    id,
    imageBase64,
    aiResult,
    status,
    priorityScore,
    timestamp,
    complaintNumber,
    assignedTeam,
    isDuplicateOf,
    urgentEscalation,
  } = complaint;

  const isCommercial = complaint.serviceType === 'commercial_bulk';
  const wasteLabel = isCommercial
    ? (complaint.businessDetails?.establishmentLabel || complaint.comment || 'Bulk & Event Waste')
    : (WASTE_TYPE_LABELS[aiResult?.wasteType] || aiResult?.wasteType || 'Waste Issue');

  const date = new Date(timestamp).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`complaint-card ${isCommercial ? 'commercial-item-card' : ''}`}
      onClick={() => navigate(`/report/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/report/${id}`)}
    >
      <div className="complaint-card-image">
        {imageBase64 ? (
          <img src={`data:image/jpeg;base64,${imageBase64}`} alt={wasteLabel} />
        ) : (
          <div className="placeholder-image">
            {isCommercial ? '🏢 Bulk' : 'No Image'}
          </div>
        )}
        {urgentEscalation && (
          <span className="card-urgent-badge" title="Urgent Hazard">
            <AlertTriangle size={12} />
          </span>
        )}
      </div>

      <div className="complaint-card-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          {complaintNumber && (
            <span className="card-complaint-number">{complaintNumber}</span>
          )}
          {isCommercial && (
            <span className="card-commercial-badge">
              🏢 Bulk Service
            </span>
          )}
        </div>

        <h3 className="card-waste-title">{wasteLabel}</h3>

        <div className="card-date-line">
          <Calendar size={12} className="card-cal-icon" />
          <span>{isCommercial && complaint.businessDetails?.eventDate ? `Event: ${complaint.businessDetails.eventDate}` : date}</span>
          {isCommercial && complaint.commercialQuote?.indicativeTotal && (
            <span style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--primary)' }}>
              ₹{complaint.commercialQuote.indicativeTotal.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="complaint-card-badges">
          <StatusBadge status={status} />
          <PriorityBadge score={priorityScore} />
        </div>

        {(assignedTeam || isDuplicateOf) && (
          <div className="card-meta">
            {assignedTeam && (
              <span className="card-assigned">
                <Users size={11} />
                <span>Assigned</span>
              </span>
            )}
            {isDuplicateOf && (
              <span className="card-duplicate">
                <Link2 size={11} />
                <span>Duplicate</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
