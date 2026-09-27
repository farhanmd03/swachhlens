import React from 'react';
import { Check } from 'lucide-react';

const LIFECYCLE_STEPS = [
  { key: 'reported', label: 'Reported', tsKey: 'timestamp' },
  { key: 'verified', label: 'Verified', tsKey: 'verifiedAt' },
  { key: 'assigned', label: 'Assigned', tsKey: 'assignedAt' },
  { key: 'arrived', label: 'Arrived On Site', tsKey: 'arrivedAt' },
  { key: 'in_progress', label: 'In Progress', tsKey: 'inProgressAt' },
  { key: 'resolved', label: 'Resolved', tsKey: 'resolvedAt' },
];

function formatTs(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates step status (done, current, pending) according to status and arrival timestamp.
 *
 * @param {string} stepKey
 * @param {Object} complaint
 * @returns {{ isDone: boolean, isCurrent: boolean, isPending: boolean }}
 */
export function getStepStatus(stepKey, complaint) {
  const status = complaint?.status || 'reported';
  const hasArrived = Boolean(complaint?.arrivedAt);

  // Progressive status rank:
  // 0: reported
  // 1: verified
  // 2: assigned (pre-arrival)
  // 3: arrived on site
  // 4: in_progress
  // 5: completed_pending_verification
  // 6: resolved
  let currentRank = 0;
  if (status === 'resolved') {
    currentRank = 6;
  } else if (status === 'completed_pending_verification') {
    currentRank = 5;
  } else if (status === 'in_progress') {
    currentRank = 4;
  } else if (status === 'assigned') {
    currentRank = hasArrived ? 3 : 2;
  } else if (status === 'verified') {
    currentRank = 1;
  } else {
    currentRank = 0;
  }

  const stepRanks = {
    reported: 0,
    verified: 1,
    assigned: 2,
    arrived: 3,
    in_progress: 4,
    resolved: 6,
  };

  const stepRank = stepRanks[stepKey];

  if (currentRank === 6) {
    return { isDone: true, isCurrent: false, isPending: false };
  }

  if (stepRank < currentRank) {
    return { isDone: true, isCurrent: false, isPending: false };
  } else if (stepRank === currentRank || (currentRank === 5 && stepKey === 'in_progress')) {
    return { isDone: false, isCurrent: true, isPending: false };
  } else {
    return { isDone: false, isCurrent: false, isPending: true };
  }
}

export default function LifecycleTimeline({ complaint }) {
  if (!complaint) return null;

  const isCommercial = complaint.serviceType === 'commercial_bulk';
  const steps = isCommercial
    ? [
        { key: 'reported', label: 'Service Requested', tsKey: 'timestamp' },
        { key: 'verified', label: 'Reviewed & Approved', tsKey: 'verifiedAt' },
        { key: 'assigned', label: 'Unit Assigned', tsKey: 'assignedAt' },
        { key: 'arrived', label: 'Arrived On Site', tsKey: 'arrivedAt' },
        { key: 'in_progress', label: 'Cleanup In Progress', tsKey: 'inProgressAt' },
        { key: 'resolved', label: 'Verified & Completed', tsKey: 'resolvedAt' },
      ]
    : LIFECYCLE_STEPS;

  return (
    <div className="lifecycle-timeline">
      {steps.map((step) => {
        const { isDone, isCurrent, isPending } = getStepStatus(step.key, complaint);
        const ts = complaint[step.tsKey];

        return (
          <div
            key={step.key}
            className={`timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
          >
            <div className="timeline-icon">
              {isDone ? <Check size={12} strokeWidth={2.5} /> : isCurrent ? <span className="timeline-pulse-dot" /> : <span className="timeline-pending-dot" />}
            </div>
            <div className="timeline-content">
              <span className="timeline-label">{step.label}</span>
              {(isDone || isCurrent) && ts && (
                <span className="timeline-ts">{formatTs(ts)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
