import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { WASTE_TYPE_LABELS, VOLUME_LABELS } from '../config/constants.js';
import {
  ESTABLISHMENT_TYPE_LABELS,
  COMMERCIAL_SCALE_LABELS,
  WASTE_STREAM_LABELS,
} from '../config/commercialConstants.js';
import { CANONICAL_TEAM_NAMES } from '../services/teamService.js';
import {
  AlertTriangle,
  Link2,
  Send,
  Eye,
  ChevronUp,
  ChevronDown,
  Users,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export default function ComplaintTable({ complaints, sortField, sortDir, onSort, onAction }) {
  const navigate = useNavigate();

  const handleSort = (field) => {
    if (sortField === field) {
      onSort(field, sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      onSort(field, 'desc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDir === 'desc' ? (
      <ChevronDown size={14} className="sort-icon" />
    ) : (
      <ChevronUp size={14} className="sort-icon" />
    );
  };

  const getAge = (timestamp) => {
    const hours = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  return (
    <div className="complaint-table-wrapper">
      <table className="complaint-table">
        <thead>
          <tr>
            <th>Tracking ID</th>
            <th>Photo</th>
            <th onClick={() => handleSort('wasteType')} className="sortable-th">
              <div className="th-content">
                <span>Issue / Service Category</span>
                {renderSortIndicator('wasteType')}
              </div>
            </th>
            <th>Reporter / Client</th>
            <th>Scale / Volume</th>
            <th onClick={() => handleSort('priorityScore')} className="sortable-th">
              <div className="th-content">
                <span>Priority / Tariff</span>
                {renderSortIndicator('priorityScore')}
              </div>
            </th>
            <th onClick={() => handleSort('status')} className="sortable-th">
              <div className="th-content">
                <span>Status</span>
                {renderSortIndicator('status')}
              </div>
            </th>
            <th className="text-center">Urgent</th>
            <th className="text-center">Dup</th>
            <th onClick={() => handleSort('timestamp')} className="sortable-th">
              <div className="th-content">
                <span>Age</span>
                {renderSortIndicator('timestamp')}
              </div>
            </th>
            <th>Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan="11" className="empty-table-row">
                <div className="empty-table-msg" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="/assets/branding/municipal-all-clear.png"
                    alt="All Clear"
                    style={{ width: '80px', height: 'auto', borderRadius: '8px', opacity: 0.9 }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No records match the selected filter criteria.</span>
                </div>
              </td>
            </tr>
          ) : (
            complaints.map((complaint) => {
              const isCommercial = complaint.serviceType === 'commercial_bulk';
              const isUrgent = !!complaint.urgentEscalation || complaint.serviceWindow === 'immediate';
              const isAwaitingVerification = complaint.status === 'completed_pending_verification';

              const trackingNumber = isCommercial
                ? (complaint.serviceNumber || complaint.complaintNumber || complaint.id.slice(0, 8))
                : (complaint.complaintNumber || complaint.id.slice(0, 8));

              const quoteTariff = complaint.commercialQuote?.totalQuote || complaint.quotedTariff || 0;

              return (
                <tr
                  key={complaint.id}
                  className={`table-row ${isUrgent ? 'urgent-highlight-row' : ''} ${isAwaitingVerification ? 'awaiting-verification-row' : ''} ${isCommercial ? 'commercial-item-row' : ''}`}
                  onClick={() => navigate(`/complaint/${complaint.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/complaint/${complaint.id}`)}
                  title={`Open incident dossier ${trackingNumber}`}
                >
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span
                        className="table-complaint-id-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/complaint/${complaint.id}`);
                        }}
                        title={`Inspect full report ${complaint.id}`}
                      >
                        {trackingNumber}
                      </span>
                      {isCommercial && (
                        <span className="table-bulk-badge" style={{
                          fontSize: '0.68rem',
                          background: '#ecfdf5',
                          color: '#065f46',
                          border: '1px solid #a7f3d0',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          width: 'fit-content',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Building2 size={11} /> Bulk Service</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {complaint.imageBase64 ? (
                      <div
                        className="table-thumbnail-box"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/complaint/${complaint.id}`);
                        }}
                      >
                        <img
                          src={`data:image/jpeg;base64,${complaint.imageBase64}`}
                          alt="Waste"
                          className="table-thumbnail-img"
                        />
                      </div>
                    ) : isCommercial ? (
                      <div className="table-thumbnail-placeholder" style={{ background: '#f0fdf4', color: '#059669', fontSize: '1rem' }} title="Commercial Service Record">
                        <Building2 size={16} />
                      </div>
                    ) : (
                      <div className="table-thumbnail-placeholder">—</div>
                    )}
                  </td>
                  <td>
                    <div className="table-waste-info">
                      {isCommercial ? (
                        <>
                          <strong>{ESTABLISHMENT_TYPE_LABELS[complaint.establishmentType] || complaint.eventName || 'Commercial Bulk'}</strong>
                          {complaint.eventName && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                              {complaint.eventName}
                            </span>
                          )}
                        </>
                      ) : (
                        <strong>{WASTE_TYPE_LABELS[complaint.aiResult?.wasteType] || '—'}</strong>
                      )}

                      {complaint.assignedTeam && (
                        <span className="table-team-pill" title={`Unit ID: ${complaint.assignedTeam}`}>
                          <Users size={10} />
                          <span>{CANONICAL_TEAM_NAMES[complaint.assignedTeam] || complaint.assignedTeam}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {isCommercial ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="table-reporter-name">
                          {complaint.customerContact?.contactPerson || complaint.citizenName || 'Client'}
                        </span>
                        {complaint.customerContact?.organizationName && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {complaint.customerContact.organizationName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="table-reporter-name">
                        {complaint.citizenName || <span className="text-muted">Anonymous</span>}
                      </span>
                    )}
                  </td>
                  <td>
                    {isCommercial ? (
                      <span className="table-vol-tag" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                        {COMMERCIAL_SCALE_LABELS[complaint.scale]?.split(' ')[0] || 'Bulk'}
                      </span>
                    ) : (
                      <span className="table-vol-tag">
                        {VOLUME_LABELS[complaint.aiResult?.volumeEstimate] || '—'}
                      </span>
                    )}
                  </td>
                  <td>
                    {isCommercial && quoteTariff > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.88rem' }}>
                          ₹{quoteTariff.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          Score: {complaint.priorityScore}
                        </span>
                      </div>
                    ) : (
                      <PriorityBadge score={complaint.priorityScore} />
                    )}
                  </td>
                  <td>
                    <StatusBadge status={complaint.status} />
                  </td>
                  <td className="text-center">
                    {isUrgent ? (
                      <span className="badge-urgent-symbol" title="Urgent Hazard Escalation or Immediate Service Window">
                        <AlertTriangle size={15} className="text-red" />
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-center">
                    {complaint.isDuplicateOf ? (
                      <span className="badge-duplicate-symbol" title={`Duplicate of ${complaint.isDuplicateOf}`}>
                        <Link2 size={15} className="text-amber" />
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-muted text-nowrap">
                    {getAge(complaint.timestamp)}
                  </td>
                  <td>
                    <div className="table-action-btns" onClick={(e) => e.stopPropagation()}>
                      {isAwaitingVerification ? (
                        <button
                          className="btn btn-small btn-verify-cta"
                          onClick={() => navigate(`/complaint/${complaint.id}`)}
                          title="Review Completion Evidence & Verify"
                        >
                          <ShieldCheck size={13} />
                          <span>Verify</span>
                        </button>
                      ) : (
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => onAction(complaint)}
                          title="Open Dispatch & Team Assignment"
                        >
                          <Send size={12} />
                          <span>{isCommercial ? 'Dispatch' : 'Dispatch'}</span>
                        </button>
                      )}
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => navigate(`/complaint/${complaint.id}`)}
                        title="View Full Dossier"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
