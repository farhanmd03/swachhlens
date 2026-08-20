import React from 'react';

const LIFECYCLE_STEPS = [
  { key: 'reported',    label: 'Reported',    tsKey: 'timestamp',    icon: '📝' },
  { key: 'verified',   label: 'Verified',    tsKey: 'verifiedAt',   icon: '✓' },
  { key: 'assigned',   label: 'Assigned',    tsKey: 'assignedAt',   icon: '👥' },
  { key: 'in_progress',label: 'In Progress', tsKey: 'inProgressAt', icon: '🔧' },
  { key: 'resolved',   label: 'Resolved',    tsKey: 'resolvedAt',   icon: '✅' },
];

const STATUS_ORDER = ['reported', 'verified', 'assigned', 'in_progress', 'resolved'];

function formatTs(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

export default function LifecycleTimeline({ complaint }) {
  if (!complaint) return null;
  const currentIdx = STATUS_ORDER.indexOf(complaint.status);

  return (
    <div className="lifecycle-timeline">
      {LIFECYCLE_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;
        const ts = complaint[step.tsKey];

        return (
          <div
            key={step.key}
            className={`timeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
          >
            <div className="timeline-icon">{isDone ? '✓' : isCurrent ? '●' : '○'}</div>
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
