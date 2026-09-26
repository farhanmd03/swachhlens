import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ESTABLISHMENT_TYPE_LABELS,
  COMMERCIAL_SCALE_LABELS,
  SERVICE_WINDOW_LABELS,
  COMMERCIAL_STATUS_LABELS,
} from '../config/commercialConstants.js';
import { CANONICAL_TEAM_NAMES } from '../services/teamService.js';
import {
  Building2,
  Users,
  Eye,
  Send,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  Leaf,
  Phone,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function CommercialServiceTable({
  complaints = [],
  activeKpiFilter = 'total',
  onAction,
  onResetFilters,
}) {
  const navigate = useNavigate();

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Scheduled';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper for commercial status pill class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'reported':
      case 'requested':
      case 'under_review':
        return 'comm-status-review';
      case 'awaiting_price_approval':
        return 'comm-status-price';
      case 'confirmed':
        return 'comm-status-confirmed';
      case 'assigned':
        return 'comm-status-assigned';
      case 'arrived':
      case 'in_progress':
        return 'comm-status-progress';
      case 'completed_pending_verification':
        return 'comm-status-verification';
      case 'resolved':
      case 'completed':
        return 'comm-status-closed';
      case 'cancelled':
        return 'comm-status-cancelled';
      default:
        return 'comm-status-default';
    }
  };

  if (complaints.length === 0) {
    if (activeKpiFilter === 'awaiting_dispatch') {
      return (
        <div className="commercial-empty-state">
          <div className="empty-state-icon">📋</div>
          <h4>No commercial services are currently awaiting dispatch.</h4>
          <p>
            All active bookings are either currently dispatched, awaiting customer price review, or verified and closed.
          </p>
          {onResetFilters && (
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetFilters}>
              <RotateCcw size={13} />
              <span>Show All Commercial Services</span>
            </button>
          )}
        </div>
      );
    }

    if (activeKpiFilter === 'in_operations') {
      return (
        <div className="commercial-empty-state">
          <div className="empty-state-icon">🚚</div>
          <h4>No commercial services are currently active in operations.</h4>
          <p>There are no field response teams currently deployed on active commercial runs.</p>
          {onResetFilters && (
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetFilters}>
              <RotateCcw size={13} />
              <span>Show All Commercial Services</span>
            </button>
          )}
        </div>
      );
    }

    if (activeKpiFilter === 'completed') {
      return (
        <div className="commercial-empty-state">
          <div className="empty-state-icon">✅</div>
          <h4>No completed commercial services found.</h4>
          <p>Completed, verified and closed commercial bookings will appear here.</p>
          {onResetFilters && (
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetFilters}>
              <RotateCcw size={13} />
              <span>Show All Commercial Services</span>
            </button>
          )}
        </div>
      );
    }

    if (activeKpiFilter === 'resource_recovery') {
      return (
        <div className="commercial-empty-state">
          <div className="empty-state-icon">♻️</div>
          <h4>No commercial services currently have identified recovery opportunities.</h4>
          <p>Bookings with recoverable materials and circular diversion potential will be listed here.</p>
          {onResetFilters && (
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetFilters}>
              <RotateCcw size={13} />
              <span>Show All Commercial Services</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="commercial-empty-state">
        <div className="empty-state-icon">🔍</div>
        <h4>No commercial service records match the selected filter criteria.</h4>
        <p>Try clearing your search term or adjusting status filter settings.</p>
        {onResetFilters && (
          <button type="button" className="btn btn-secondary btn-small" onClick={onResetFilters}>
            <RotateCcw size={13} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="commercial-table-wrapper">
      <table className="commercial-table">
        <thead>
          <tr>
            <th>Service / Event</th>
            <th>Customer / Organization</th>
            <th>Location</th>
            <th>Service Date</th>
            <th>Scale</th>
            <th>Quoted Value</th>
            <th>Assigned Unit</th>
            <th>Status</th>
            <th>Recovery</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((item) => {
            const trackingNumber = item.serviceNumber || item.complaintNumber || item.id.slice(0, 8);
            const establishmentLabel =
              item.businessDetails?.establishmentLabel ||
              ESTABLISHMENT_TYPE_LABELS[item.establishmentType] ||
              item.eventName ||
              'Commercial Service';
            const isRecurring =
              item.businessDetails?.serviceFrequency === 'recurring' ||
              item.serviceFrequency === 'recurring';

            const contactName =
              item.customerContact?.contactPerson || item.citizenName || 'Client Contact';
            const orgName =
              item.customerContact?.organizationName || item.businessDetails?.venueName || '';
            const phone = item.customerContact?.contactPhone || item.citizenPhone || '';

            const venueAddr =
              item.businessDetails?.address ||
              item.venueName ||
              item.comment?.split('—')[0]?.trim() ||
              'Kolkata Venue';
            const zoneLabel =
              item.businessDetails?.operatingZoneLabel ||
              item.operatingZone ||
              'Kolkata Zone';

            const eventDate = item.businessDetails?.eventDate || item.eventDate;
            const windowLabel =
              item.businessDetails?.serviceWindowLabel ||
              SERVICE_WINDOW_LABELS[item.serviceWindow] ||
              'Standard Window';

            const scaleLabel =
              item.businessDetails?.scaleLabel ||
              COMMERCIAL_SCALE_LABELS[item.scale] ||
              'Bulk Scale';
            const peopleCount = item.businessDetails?.estimatedPeople;

            const totalTariff =
              item.commercialQuote?.indicativeTotal ||
              item.commercialQuote?.totalQuote ||
              item.quotedTariff ||
              0;

            const assignedTeamName = item.assignedTeam
              ? CANONICAL_TEAM_NAMES[item.assignedTeam] || item.assignedTeam
              : null;
            const assignedVehicle = item.assignedVehicle || item.commercialAssessment?.recommendedVehicle;

            const displayStatus =
              COMMERCIAL_STATUS_LABELS[item.commercialStatus || item.status] ||
              item.status;
            const statusClass = getStatusBadgeClass(item.commercialStatus || item.status);

            const recoverableList =
              item.commercialAssessment?.recoverableMaterials || [];
            const recoveryOpportunity =
              item.commercialAssessment?.recoveryOpportunity || '';

            const isAwaitingVerification =
              item.status === 'completed_pending_verification';

            return (
              <tr
                key={item.id}
                className="commercial-table-row"
                onClick={() => navigate(`/complaint/${item.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/complaint/${item.id}`)}
                title={`Open Commercial Dossier ${trackingNumber}`}
              >
                {/* Service / Event */}
                <td>
                  <div className="comm-col-service">
                    <span
                      className="comm-id-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/complaint/${item.id}`);
                      }}
                      title="Inspect full commercial record"
                    >
                      {trackingNumber}
                    </span>
                    <strong className="comm-event-title">{establishmentLabel}</strong>
                    <div className="comm-badges-subrow">
                      <span className={`comm-freq-pill ${isRecurring ? 'recurring' : 'onetime'}`}>
                        {isRecurring ? '🔁 Recurring' : '🗓️ One-time'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Customer / Organization */}
                <td>
                  <div className="comm-col-client">
                    <span className="comm-contact-person">{contactName}</span>
                    {orgName && <span className="comm-org-name">{orgName}</span>}
                    {phone && (
                      <span className="comm-phone-line">
                        <Phone size={11} />
                        <span>{phone}</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* Location */}
                <td>
                  <div className="comm-col-location">
                    <span className="comm-venue-text" title={venueAddr}>
                      {venueAddr}
                    </span>
                    <span className="comm-zone-tag">{zoneLabel.split('—')[0].trim()}</span>
                  </div>
                </td>

                {/* Service Date */}
                <td>
                  <div className="comm-col-date">
                    <div className="comm-date-line">
                      <Calendar size={13} className="text-muted" />
                      <span>{formatDate(eventDate)}</span>
                    </div>
                    <span className="comm-window-text" title={windowLabel}>
                      {windowLabel.split('(')[0].trim()}
                    </span>
                  </div>
                </td>

                {/* Scale */}
                <td>
                  <div className="comm-col-scale">
                    <span className="comm-scale-tag">
                      {scaleLabel.split('(')[0].trim()}
                    </span>
                    {peopleCount && (
                      <span className="comm-people-sub">{peopleCount.toLocaleString()} attendees</span>
                    )}
                  </div>
                </td>

                {/* Quoted Value */}
                <td>
                  <div className="comm-col-tariff">
                    <strong className="comm-tariff-val">₹{totalTariff.toLocaleString('en-IN')}</strong>
                    {item.priceAdjustment?.status === 'pending_customer_approval' ? (
                      <span className="comm-tariff-adjustment-badge" title="Revised tariff pending customer sign-off">
                        Revision Pending
                      </span>
                    ) : item.customerApproval?.status === 'accepted' ? (
                      <span className="comm-tariff-locked-badge">Locked &amp; Confirmed</span>
                    ) : (
                      <span className="comm-tariff-sub">Indicative Quote</span>
                    )}
                  </div>
                </td>

                {/* Assigned Unit */}
                <td>
                  <div className="comm-col-team">
                    {assignedTeamName ? (
                      <div className="comm-assigned-pill">
                        <Users size={12} />
                        <div>
                          <strong>{assignedTeamName}</strong>
                          {assignedVehicle && <span className="comm-vehicle-sub">{assignedVehicle}</span>}
                        </div>
                      </div>
                    ) : (
                      <span className="comm-unassigned-tag">⏳ Unassigned</span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td>
                  <span className={`comm-status-badge ${statusClass}`}>
                    {displayStatus}
                  </span>
                </td>

                {/* Recovery */}
                <td>
                  <div className="comm-col-recovery">
                    {recoverableList.length > 0 ? (
                      <div
                        className="comm-recovery-pill"
                        title={recoverableList.join(', ')}
                      >
                        <Leaf size={12} className="text-emerald" />
                        <span>{recoverableList.length} Stream{recoverableList.length > 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                    {recoveryOpportunity && (
                      <span className="comm-recovery-sub" title={recoveryOpportunity}>
                        {recoveryOpportunity.split('(')[0].trim()}
                      </span>
                    )}
                  </div>
                </td>

                {/* Action */}
                <td className="text-right">
                  <div className="comm-actions-group" onClick={(e) => e.stopPropagation()}>
                    {isAwaitingVerification ? (
                      <button
                        type="button"
                        className="btn btn-small btn-verify-cta"
                        onClick={() => navigate(`/complaint/${item.id}`)}
                        title="Review Completion Evidence & Verify"
                      >
                        <ShieldCheck size={13} />
                        <span>Verify</span>
                      </button>
                    ) : !assignedTeamName && onAction ? (
                      <button
                        type="button"
                        className="btn btn-small btn-primary"
                        onClick={() => onAction(item)}
                        title="Assign Field Response Unit"
                      >
                        <Send size={12} />
                        <span>Dispatch</span>
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={() => navigate(`/complaint/${item.id}`)}
                      title="Inspect full commercial record"
                    >
                      <Eye size={12} />
                      <span>View Details</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
