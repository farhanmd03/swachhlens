import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  Zap,
} from 'lucide-react';

/**
 * Summary KPI cards showing real-time complaint operations metrics.
 */
export default function DashboardCards({ complaints }) {
  const total = complaints.length;
  const pending = complaints.filter((c) =>
    ['reported', 'verified'].includes(c.status)
  ).length;
  const urgent = complaints.filter((c) => c.urgentEscalation).length;
  const inProgress = complaints.filter((c) =>
    ['assigned', 'in_progress'].includes(c.status)
  ).length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;

  const avgPriority =
    total > 0
      ? Math.round(
          complaints.reduce((acc, c) => acc + (c.priorityScore || 0), 0) / total
        )
      : 0;

  const cards = [
    {
      label: 'Total Complaints',
      value: total,
      color: '#0284c7',
      icon: FileText,
      sub: 'Logged in system',
    },
    {
      label: 'Urgent Action',
      value: urgent,
      color: '#dc2626',
      icon: AlertTriangle,
      sub: 'High risk / hazards',
    },
    {
      label: 'Pending Dispatch',
      value: pending,
      color: '#d97706',
      icon: Clock,
      sub: 'Awaiting team',
    },
    {
      label: 'In Progress',
      value: inProgress,
      color: '#0891b2',
      icon: Wrench,
      sub: 'Field units active',
    },
    {
      label: 'Resolved',
      value: resolved,
      color: '#059669',
      icon: CheckCircle2,
      sub: 'Cleaned & verified',
    },
    {
      label: 'Avg Priority',
      value: `${avgPriority}/100`,
      color: '#7c3aed',
      icon: Zap,
      sub: 'Dynamic score',
    },
  ];

  return (
    <div className="dashboard-cards-grid">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.label}
            className="kpi-card"
            style={{ borderTop: `3px solid ${card.color}` }}
          >
            <div className="kpi-top">
              <span className="kpi-label">{card.label}</span>
              <IconComponent size={18} style={{ color: card.color }} />
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-sub">{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
