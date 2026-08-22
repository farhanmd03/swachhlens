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
 * Clicking a card filters the Priority Queue table and scrolls down to it.
 */
export default function DashboardCards({ complaints, onApplyFilter }) {
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
      filterAction: () =>
        onApplyFilter?.({ status: 'all', wasteType: 'all', urgentOnly: false, duplicateOnly: false, search: '' }),
    },
    {
      label: 'Urgent Action',
      value: urgent,
      color: '#dc2626',
      icon: AlertTriangle,
      sub: 'High risk / hazards',
      filterAction: () =>
        onApplyFilter?.({ urgentOnly: true, status: 'all', duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      label: 'Pending Dispatch',
      value: pending,
      color: '#d97706',
      icon: Clock,
      sub: 'Awaiting team',
      filterAction: () =>
        onApplyFilter?.({ status: 'reported', urgentOnly: false, duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      label: 'In Progress',
      value: inProgress,
      color: '#0891b2',
      icon: Wrench,
      sub: 'Field units active',
      filterAction: () =>
        onApplyFilter?.({ status: 'in_progress', urgentOnly: false, duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      label: 'Resolved',
      value: resolved,
      color: '#059669',
      icon: CheckCircle2,
      sub: 'Cleaned & verified',
      filterAction: () =>
        onApplyFilter?.({ status: 'resolved', urgentOnly: false, duplicateOnly: false, wasteType: 'all', search: '' }),
    },
    {
      label: 'Avg Priority',
      value: `${avgPriority}/100`,
      color: '#7c3aed',
      icon: Zap,
      sub: 'Dynamic score',
      filterAction: () =>
        onApplyFilter?.({ status: 'all', wasteType: 'all', urgentOnly: false, duplicateOnly: false, search: '' }),
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
            onClick={card.filterAction}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && card.filterAction?.()}
            title={`Click to filter queue for: ${card.label}`}
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
