import React, { useState, useMemo } from 'react';
import CommercialServiceTable from './CommercialServiceTable.jsx';
import {
  Building2,
  Calendar,
  Clock,
  Wrench,
  CheckCircle2,
  Check,
  Leaf,
  Search,
  X,
  Filter,
  ArrowDown,
  RotateCcw,
  Sparkles,
  MapPin,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export default function CommercialDashboard({
  commercialComplaints = [],
  onAction,
}) {
  const [activeKpiFilter, setActiveKpiFilter] = useState('total'); // 'total' | 'awaiting_dispatch' | 'in_operations' | 'completed' | 'resource_recovery'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Dynamic Commercial Metrics Computation ──────────────────────
  const stats = useMemo(() => {
    const total = commercialComplaints.length;

    const awaitingDispatch = commercialComplaints.filter(
      (c) =>
        (c.status === 'requested' ||
          c.status === 'approved' ||
          c.status === 'quoted' ||
          c.status === 'confirmed' ||
          c.commercialStatus === 'confirmed' ||
          c.commercialStatus === 'approved') &&
        !c.assignedTeam &&
        c.priceAdjustment?.status !== 'pending_customer_approval'
    ).length;

    const inOperations = commercialComplaints.filter(
      (c) =>
        c.status === 'assigned' ||
        c.status === 'arrived' ||
        c.status === 'in_progress' ||
        c.commercialStatus === 'assigned' ||
        c.commercialStatus === 'in_progress' ||
        c.commercialStatus === 'arrived'
    ).length;

    const completed = commercialComplaints.filter(
      (c) =>
        c.status === 'completed_pending_verification' ||
        c.status === 'resolved' ||
        c.status === 'completed' ||
        c.commercialStatus === 'resolved'
    ).length;

    const resourceRecovery = commercialComplaints.filter(
      (c) =>
        Boolean(c.commercialAssessment?.recoverableMaterials?.length > 0) ||
        Boolean(c.commercialAssessment?.recoveryOpportunity) ||
        Boolean(c.commercialAssessment?.recoveryPathway) ||
        Boolean(c.commercialAssessment?.recyclingPotential?.material) ||
        Boolean(c.wasteStream && c.wasteStream !== 'mixed')
    ).length;

    const totalQuotedTariff = commercialComplaints.reduce((sum, c) => {
      const val =
        c.commercialQuote?.indicativeTotal ||
        c.commercialQuote?.totalQuote ||
        c.quotedTariff ||
        0;
      return sum + Number(val);
    }, 0);

    return {
      total,
      awaitingDispatch,
      inOperations,
      completed,
      resourceRecovery,
      totalQuotedTariff,
    };
  }, [commercialComplaints]);

  // ── KPI Cards Definition ────────────────────────────────────────
  const kpiCards = [
    {
      key: 'total',
      label: 'Total Orders',
      value: stats.total,
      sub: 'Commercial bookings',
      themeClass: 'kpi-total',
      badgeClass: 'badge-total',
    },
    {
      key: 'awaiting_dispatch',
      label: 'Awaiting Dispatch',
      value: stats.awaitingDispatch,
      sub: 'Requested / Approved',
      themeClass: 'kpi-pending',
      badgeClass: 'badge-pending',
    },
    {
      key: 'in_operations',
      label: 'In Operations',
      value: stats.inOperations,
      sub: 'Dispatched & Active',
      themeClass: 'kpi-active',
      badgeClass: 'badge-active',
    },
    {
      key: 'completed',
      label: 'Completed Services',
      value: stats.completed,
      sub: 'Services closed',
      themeClass: 'kpi-verified',
      badgeClass: 'badge-verified',
    },
    {
      key: 'resource_recovery',
      label: 'Resource Recovery',
      value: stats.resourceRecovery,
      sub: 'Circularity opportunities',
      themeClass: 'kpi-recovery',
      badgeClass: 'badge-recovery',
    },
  ];

  // ── Handle KPI Card Click ───────────────────────────────────────
  const handleKpiCardClick = (kpiKey) => {
    setActiveKpiFilter(kpiKey);
    // Smooth scroll down to the commercial queue
    const queueEl = document.getElementById('commercial-queue');
    if (queueEl) {
      queueEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClearFilter = () => {
    setActiveKpiFilter('total');
    setStatusFilter('all');
    setSearchQuery('');
  };

  // ── Multi-criteria Filtering (KPI + Status + Search) ────────────
  const filteredCommercialComplaints = useMemo(() => {
    let result = [...commercialComplaints];

    // 1. KPI Filter
    if (activeKpiFilter === 'awaiting_dispatch') {
      result = result.filter(
        (c) =>
          (c.status === 'requested' ||
            c.status === 'approved' ||
            c.status === 'quoted' ||
            c.status === 'confirmed' ||
            c.commercialStatus === 'confirmed' ||
            c.commercialStatus === 'approved') &&
          !c.assignedTeam &&
          c.priceAdjustment?.status !== 'pending_customer_approval'
      );
    } else if (activeKpiFilter === 'in_operations') {
      result = result.filter(
        (c) =>
          c.status === 'assigned' ||
          c.status === 'arrived' ||
          c.status === 'in_progress' ||
          c.commercialStatus === 'assigned' ||
          c.commercialStatus === 'in_progress' ||
          c.commercialStatus === 'arrived'
      );
    } else if (activeKpiFilter === 'completed') {
      result = result.filter(
        (c) =>
          c.status === 'completed_pending_verification' ||
          c.status === 'resolved' ||
          c.status === 'completed' ||
          c.commercialStatus === 'resolved'
      );
    } else if (activeKpiFilter === 'resource_recovery') {
      result = result.filter(
        (c) =>
          Boolean(c.commercialAssessment?.recoverableMaterials?.length > 0) ||
          Boolean(c.commercialAssessment?.recoveryOpportunity) ||
          Boolean(c.commercialAssessment?.recoveryPathway) ||
          Boolean(c.commercialAssessment?.recyclingPotential?.material) ||
          Boolean(c.wasteStream && c.wasteStream !== 'mixed')
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'under_review') {
        result = result.filter(
          (c) =>
            c.status === 'reported' ||
            c.status === 'requested' ||
            c.commercialStatus === 'requested' ||
            c.status === 'under_review'
        );
      } else if (statusFilter === 'awaiting_price_approval') {
        result = result.filter(
          (c) =>
            c.status === 'awaiting_price_approval' ||
            c.priceAdjustment?.status === 'pending_customer_approval'
        );
      } else if (statusFilter === 'confirmed') {
        result = result.filter(
          (c) => c.status === 'confirmed' || c.commercialStatus === 'confirmed'
        );
      } else if (statusFilter === 'assigned') {
        result = result.filter(
          (c) => c.status === 'assigned' || c.commercialStatus === 'assigned'
        );
      } else if (statusFilter === 'in_progress') {
        result = result.filter(
          (c) =>
            c.status === 'in_progress' ||
            c.status === 'arrived' ||
            c.commercialStatus === 'in_progress'
        );
      } else if (statusFilter === 'completed') {
        result = result.filter(
          (c) =>
            c.status === 'completed_pending_verification' ||
            c.status === 'resolved' ||
            c.status === 'completed' ||
            c.commercialStatus === 'resolved'
        );
      } else if (statusFilter === 'cancelled') {
        result = result.filter((c) => c.status === 'cancelled');
      }
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.serviceNumber?.toLowerCase().includes(q) ||
          c.complaintNumber?.toLowerCase().includes(q) ||
          c.eventName?.toLowerCase().includes(q) ||
          c.citizenName?.toLowerCase().includes(q) ||
          c.customerContact?.contactPerson?.toLowerCase().includes(q) ||
          c.customerContact?.organizationName?.toLowerCase().includes(q) ||
          c.businessDetails?.venueName?.toLowerCase().includes(q) ||
          c.businessDetails?.address?.toLowerCase().includes(q) ||
          c.venueName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [commercialComplaints, activeKpiFilter, statusFilter, searchQuery]);

  // Active filter label description
  const getFilterDescription = () => {
    switch (activeKpiFilter) {
      case 'awaiting_dispatch':
        return {
          title: 'Awaiting Dispatch',
          text:
            filteredCommercialComplaints.length === 0
              ? 'No commercial services are currently awaiting dispatch.'
              : `Showing ${filteredCommercialComplaints.length} commercial service${filteredCommercialComplaints.length !== 1 ? 's' : ''} awaiting operational dispatch`,
        };
      case 'in_operations':
        return {
          title: 'In Operations',
          text: `Showing ${filteredCommercialComplaints.length} active commercial service${filteredCommercialComplaints.length !== 1 ? 's' : ''}`,
        };
      case 'completed':
        return {
          title: 'Completed Services',
          text: `Showing ${filteredCommercialComplaints.length} completed commercial service${filteredCommercialComplaints.length !== 1 ? 's' : ''}`,
        };
      case 'resource_recovery':
        return {
          title: 'Resource Recovery',
          text: 'Showing commercial services with identified recovery opportunities',
        };
      default:
        return {
          title: 'All Orders',
          text: `Showing all ${filteredCommercialComplaints.length} commercial services`,
        };
    }
  };

  const activeInfo = getFilterDescription();
  const isFiltered = activeKpiFilter !== 'total' || statusFilter !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="commercial-dashboard-root">
      {/* 1. Commercial Header */}
      <div className="commercial-header-banner">
        <div className="commercial-header-main">
          <div className="commercial-brand-tag-row">
            <span className="comm-badge-tag">ENTERPRISE &amp; EVENT OPERATIONS</span>
          </div>
          <h2 className="commercial-main-title">Commercial Services</h2>
          <p className="commercial-main-subtitle">
            Planned waste collection and field operations
          </p>
          <p className="commercial-main-desc">
            Manage scheduled bulk waste collection, dispatch, field execution and verified completion.
          </p>
        </div>

        {/* Quoted Tariff Highlight */}
        <div className="commercial-tariff-highlight-box">
          <span className="comm-tariff-label">INDICATIVE QUOTED VALUE</span>
          <span className="comm-tariff-amount">
            ₹{stats.totalQuotedTariff.toLocaleString('en-IN')}
          </span>
          <span className="comm-tariff-subtext">Aggregate indicative estimate</span>
        </div>
      </div>

      {/* 2. KPI Summary Cards (Clickable) */}
      <div className="commercial-kpi-grid">
        {kpiCards.map((card) => {
          const isSelected = activeKpiFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              className={`comm-kpi-card ${card.themeClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleKpiCardClick(card.key)}
              aria-pressed={isSelected}
            >
              <div className="comm-kpi-top">
                <span className="comm-kpi-title">{card.label}</span>
                {isSelected && <span className="comm-kpi-active-tag"><Check size={11} strokeWidth={2.5} /> Active</span>}
              </div>
              <div className="comm-kpi-count">{card.value}</div>
              <div className="comm-kpi-sub">{card.sub}</div>
            </button>
          );
        })}
      </div>

      {/* 3. Commercial Service Queue Section */}
      <section className="commercial-queue-section" id="commercial-queue">
        <div className="commercial-queue-header-row">
          <div>
            <h3 className="commercial-queue-title">Commercial Service Queue</h3>
            <p className="commercial-queue-subtext">
              Showing {filteredCommercialComplaints.length} of {stats.total} commercial services
            </p>
          </div>
        </div>

        {/* Active KPI/Filter Indicator Banner */}
        {isFiltered && (
          <div className="commercial-active-filter-strip">
            <div className="active-filter-left">
              <span className="active-filter-chip">
                <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                <span>{activeInfo.title}</span>
              </span>
              <span className="active-filter-detail">
                Active filter: <strong>Commercial Services → {activeInfo.title}</strong> — {activeInfo.text}
              </span>
            </div>
            <button
              type="button"
              className="btn-clear-commercial-filter"
              onClick={handleClearFilter}
              title="Reset all filters and show all orders"
            >
              <X size={13} />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="commercial-controls-bar">
          {/* Search Box */}
          <div className="comm-search-input-wrap">
            <Search size={15} className="comm-search-icon" />
            <input
              type="text"
              placeholder="Search by ID (e.g. SL-BULK-26), customer name, venue, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="comm-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="comm-clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="comm-status-filter-wrap">
            <label htmlFor="commStatusSelect" className="comm-filter-label">
              <Filter size={13} />
              <span>Status:</span>
            </label>
            <select
              id="commStatusSelect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="comm-status-select"
            >
              <option value="all">All Statuses</option>
              <option value="under_review">Submitted / Under Review</option>
              <option value="awaiting_price_approval">Awaiting Customer Approval</option>
              <option value="confirmed">Confirmed</option>
              <option value="assigned">Unit Assigned</option>
              <option value="in_progress">In Operations</option>
              <option value="completed">Completed / Verified</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* 4. Commercial Table */}
        <CommercialServiceTable
          complaints={filteredCommercialComplaints}
          activeKpiFilter={activeKpiFilter}
          onAction={onAction}
          onResetFilters={handleClearFilter}
        />
      </section>

      {/* 5. Secondary Operational / Recovery Section */}
      <section className="commercial-secondary-section">
        <div className="comm-secondary-card">
          <div className="comm-sec-header">
            <Leaf size={18} className="text-emerald" />
            <h4>Resource Recovery &amp; Circularity Governance</h4>
          </div>
          <p className="comm-sec-desc">
            All commercial event bookings include AI waste-profile assessment, identifying compostable
            food leftovers, PET packaging, and baled corrugated materials for authorized recycling delivery.
          </p>
          <div className="comm-sec-metrics-grid">
            <div className="comm-sec-metric">
              <span className="sec-k">Circularity Identified</span>
              <strong className="sec-v">{stats.resourceRecovery} / {stats.total} Orders</strong>
              <span className="sec-sub">Material recovery pathways flagged</span>
            </div>
            <div className="comm-sec-metric">
              <span className="sec-k">Active Operations</span>
              <strong className="sec-v">{stats.inOperations} Mobilized</strong>
              <span className="sec-sub">Field units on scheduled routes</span>
            </div>
            <div className="comm-sec-metric">
              <span className="sec-k">Kolkata Operating Zones</span>
              <strong className="sec-v">Zones A–E Covered</strong>
              <span className="sec-sub">Salt Lake, Rajarhat, Central, South &amp; North</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
