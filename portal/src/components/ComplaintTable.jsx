import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { WASTE_TYPE_LABELS, VOLUME_LABELS } from '../config/constants.js';
import {
  AlertTriangle,
  Link2,
  Send,
  Eye,
  Inbox,
  ChevronUp,
  ChevronDown,
  Users,
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
                <span>Issue Category</span>
                {renderSortIndicator('wasteType')}
              </div>
            </th>
            <th>Reporter</th>
            <th>Volume</th>
            <th onClick={() => handleSort('priorityScore')} className="sortable-th">
              <div className="th-content">
                <span>Priority Score</span>
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
                <div className="empty-table-msg">
                  <Inbox size={20} className="text-muted" />
                  <span>No complaints match the selected filter criteria.</span>
                </div>
              </td>
            </tr>
          ) : (
            complaints.map((complaint) => {
              const isUrgent = !!complaint.urgentEscalation;
              return (
                <tr
                  key={complaint.id}
                  className={`table-row ${isUrgent ? 'urgent-highlight-row' : ''}`}
                >
                  <td>
                    <span
                      className="table-complaint-id-link"
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                      title={`Inspect full report ${complaint.id}`}
                    >
                      {complaint.complaintNumber || complaint.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>
                    {complaint.imageBase64 ? (
                      <div
                        className="table-thumbnail-box"
                        onClick={() => navigate(`/complaint/${complaint.id}`)}
                      >
                        <img
                          src={`data:image/jpeg;base64,${complaint.imageBase64}`}
                          alt="Waste"
                          className="table-thumbnail-img"
                        />
                      </div>
                    ) : (
                      <div className="table-thumbnail-placeholder">—</div>
                    )}
                  </td>
                  <td>
                    <div className="table-waste-info">
                      <strong>{WASTE_TYPE_LABELS[complaint.aiResult?.wasteType] || '—'}</strong>
                      {complaint.assignedTeam && (
                        <span className="table-team-pill">
                          <Users size={10} />
                          <span>{complaint.assignedTeam}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="table-reporter-name">
                      {complaint.citizenName || <span className="text-muted">Anonymous</span>}
                    </span>
                  </td>
                  <td>
                    <span className="table-vol-tag">
                      {VOLUME_LABELS[complaint.aiResult?.volumeEstimate] || '—'}
                    </span>
                  </td>
                  <td>
                    <PriorityBadge score={complaint.priorityScore} />
                  </td>
                  <td>
                    <StatusBadge status={complaint.status} />
                  </td>
                  <td className="text-center">
                    {isUrgent ? (
                      <span className="badge-urgent-symbol" title="Urgent Hazard Escalation">
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
                    <div className="table-action-btns">
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => onAction(complaint)}
                        title="Open Dispatch & Team Assignment"
                      >
                        <Send size={12} />
                        <span>Dispatch</span>
                      </button>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => navigate(`/complaint/${complaint.id}`)}
                        title="View Full Incident Details"
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
