import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeToComplaints } from '../services/complaintService.js';
import { computeWasteHotspots } from '../services/hotspotService.js';
import DashboardCards from '../components/DashboardCards.jsx';
import OperationalAlerts from '../components/OperationalAlerts.jsx';
import WasteHotspots from '../components/WasteHotspots.jsx';
import ComplaintMap from '../components/ComplaintMap.jsx';
import ComplaintTable from '../components/ComplaintTable.jsx';
import FilterBar from '../components/FilterBar.jsx';
import DispatchModal from '../components/DispatchModal.jsx';

export default function DashboardPage() {
  const location = useLocation();
  const [complaints, setComplaints] = useState([]);
  const [firestoreError, setFirestoreError] = useState(null);
  const [serviceVertical, setServiceVertical] = useState('all'); // 'all' | 'civic' | 'commercial'
  const [filters, setFilters] = useState({
    status: 'all',
    wasteType: 'all',
    urgentOnly: false,
    duplicateOnly: false,
    search: '',
  });
  const [sortField, setSortField] = useState('priorityScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  // Handle cross-route section scrolling (e.g. /?section=map or /?section=queue)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, [location.search]);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const unsubscribe = subscribeToComplaints(
      (data) => {
        setComplaints(data);
        setFirestoreError(null);
      },
      (err) => {
        setFirestoreError(
          `Firestore subscription error (${err.code || 'unknown'}): ${err.message}. ` +
          `Verify security rules and collection permissions.`
        );
      }
    );
    return () => unsubscribe();
  }, []);

  // Compute live geographic concentration hotspots from complaints (civic items primarily)
  const hotspots = useMemo(() => {
    const civicComplaints = complaints.filter((c) => c.serviceType !== 'commercial_bulk');
    return computeWasteHotspots(civicComplaints, 800);
  }, [complaints]);

  // Commercial KPIs computation
  const commercialStats = useMemo(() => {
    const commercialList = complaints.filter((c) => c.serviceType === 'commercial_bulk');
    const totalRequests = commercialList.length;
    const awaitingDispatch = commercialList.filter(
      (c) => c.status === 'requested' || c.status === 'approved' || c.status === 'quoted'
    ).length;
    const inOperations = commercialList.filter(
      (c) => c.status === 'assigned' || c.status === 'arrived' || c.status === 'in_progress'
    ).length;
    const completedVerified = commercialList.filter(
      (c) => c.status === 'completed_pending_verification' || c.status === 'resolved'
    ).length;
    const totalQuotedTariff = commercialList.reduce((sum, c) => {
      const val = c.commercialQuote?.totalQuote || c.quotedTariff || 0;
      return sum + Number(val);
    }, 0);
    const recoverableCount = commercialList.filter(
      (c) => c.commercialAssessment?.recyclingPotential?.material || c.wasteStream !== 'mixed'
    ).length;

    return {
      totalRequests,
      awaitingDispatch,
      inOperations,
      completedVerified,
      totalQuotedTariff,
      recoverableCount,
    };
  }, [complaints]);

  // Handle one-click alert filter application
  const handleApplyFilter = (newFilters) => {
    setSelectedHotspot(null);
    setFilters((prev) => ({ ...prev, ...newFilters }));
    const queueEl = document.getElementById('queue');
    if (queueEl) {
      queueEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle one-click hotspot filter
  const handleSelectHotspot = (hs) => {
    setSelectedHotspot(hs);
    setFilters((prev) => ({
      ...prev,
      search: '',
    }));
    const queueEl = document.getElementById('queue');
    if (queueEl) {
      queueEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // Filter by service vertical
    if (serviceVertical === 'civic') {
      result = result.filter((c) => c.serviceType !== 'commercial_bulk');
    } else if (serviceVertical === 'commercial') {
      result = result.filter((c) => c.serviceType === 'commercial_bulk');
    }

    // Filter by selected geographic hotspot cluster if active
    if (selectedHotspot && Array.isArray(selectedHotspot.complaintIds)) {
      result = result.filter((c) => selectedHotspot.complaintIds.includes(c.id));
    }

    if (filters.status !== 'all') {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.wasteType !== 'all') {
      result = result.filter((c) => (c.aiResult?.wasteType === filters.wasteType || c.wasteStream === filters.wasteType));
    }
    if (filters.urgentOnly) {
      result = result.filter((c) => c.urgentEscalation || c.serviceWindow === 'immediate');
    }
    if (filters.duplicateOnly) {
      result = result.filter((c) => !!c.isDuplicateOf);
    }
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.complaintNumber?.toLowerCase().includes(q) ||
          c.serviceNumber?.toLowerCase().includes(q) ||
          c.eventName?.toLowerCase().includes(q) ||
          c.citizenName?.toLowerCase().includes(q) ||
          c.customerContact?.contactPerson?.toLowerCase().includes(q) ||
          c.customerContact?.organizationName?.toLowerCase().includes(q) ||
          c.aiResult?.wasteType?.toLowerCase().includes(q) ||
          c.wasteStream?.toLowerCase().includes(q) ||
          c.comment?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'priorityScore':
          aVal = a.priorityScore || 0;
          bVal = b.priorityScore || 0;
          break;
        case 'timestamp':
          aVal = a.timestamp || 0;
          bVal = b.timestamp || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'wasteType':
          aVal = a.aiResult?.wasteType || a.wasteStream || '';
          bVal = b.aiResult?.wasteType || b.wasteStream || '';
          break;
        default:
          return 0;
      }
      if (typeof aVal === 'string') {
        return sortDir === 'desc'
          ? bVal.localeCompare(aVal)
          : aVal.localeCompare(bVal);
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [complaints, serviceVertical, filters, sortField, sortDir, selectedHotspot]);

  const handleSort = (field, dir) => {
    setSortField(field);
    setSortDir(dir);
  };

  const civicCount = complaints.filter((c) => c.serviceType !== 'commercial_bulk').length;
  const commercialCount = complaints.filter((c) => c.serviceType === 'commercial_bulk').length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-bar">
        <div>
          <h2>Operations Command Center</h2>
          <p className="page-subtitle">
            Real-time citizen waste reports, automated priority triage, and field response routing.
          </p>
        </div>
      </div>

      {/* Operational Vertical Switcher */}
      <div className="operations-vertical-switcher">
        <div className="vertical-segmented-tabs">
          <button
            type="button"
            className={`vertical-tab-btn ${serviceVertical === 'all' ? 'active' : ''}`}
            onClick={() => {
              setServiceVertical('all');
              setSelectedHotspot(null);
            }}
          >
            <span>All Operations</span>
            <span className="vertical-tab-count">{complaints.length}</span>
          </button>
          <button
            type="button"
            className={`vertical-tab-btn ${serviceVertical === 'civic' ? 'active' : ''}`}
            onClick={() => {
              setServiceVertical('civic');
              setSelectedHotspot(null);
            }}
          >
            <span>🏛️ Civic Incidents</span>
            <span className="vertical-tab-count">{civicCount}</span>
          </button>
          <button
            type="button"
            className={`vertical-tab-btn ${serviceVertical === 'commercial' ? 'active' : ''}`}
            onClick={() => {
              setServiceVertical('commercial');
              setSelectedHotspot(null);
            }}
          >
            <span>🏢 Commercial &amp; Bulk Services</span>
            <span className="vertical-tab-count commercial-pill-count">{commercialCount}</span>
          </button>
        </div>
      </div>

      {/* Firestore connectivity banner */}
      {firestoreError && (
        <div className="firestore-error-banner">
          <strong>⚠️ Firestore connection issue:</strong> {firestoreError}
        </div>
      )}

      {/* Contextual KPI Section */}
      {serviceVertical === 'commercial' ? (
        <div className="commercial-kpi-banner">
          <div className="commercial-kpi-header">
            <div className="commercial-title-box">
              <span className="commercial-badge-tag">ENTERPRISE &amp; EVENT OPERATIONS</span>
              <h3>SwachhLens Commercial Services Overview</h3>
              <p>Bulk event waste planning, resource recovery quotas, and scheduled team mobilizations.</p>
            </div>
            <div className="commercial-tariff-highlight">
              <span className="tariff-k">Total Quoted Tariff</span>
              <span className="tariff-v">₹{commercialStats.totalQuotedTariff.toLocaleString('en-IN')}</span>
              <span className="tariff-sub">Indicative operator rate card</span>
            </div>
          </div>
          <div className="commercial-kpi-cards-grid">
            <div className="comm-card">
              <span className="comm-k">Total Orders</span>
              <span className="comm-v">{commercialStats.totalRequests}</span>
              <span className="comm-sub">Commercial bookings</span>
            </div>
            <div className="comm-card comm-card-pending">
              <span className="comm-k">Awaiting Dispatch</span>
              <span className="comm-v">{commercialStats.awaitingDispatch}</span>
              <span className="comm-sub">Requested / Approved</span>
            </div>
            <div className="comm-card comm-card-active">
              <span className="comm-k">In Operations</span>
              <span className="comm-v">{commercialStats.inOperations}</span>
              <span className="comm-sub">Dispatched &amp; Active</span>
            </div>
            <div className="comm-card comm-card-verified">
              <span className="comm-k">Completed &amp; Verified</span>
              <span className="comm-v">{commercialStats.completedVerified}</span>
              <span className="comm-sub">Services closed</span>
            </div>
            <div className="comm-card comm-card-recovery">
              <span className="comm-k">Resource Recovery</span>
              <span className="comm-v">{commercialStats.recoverableCount}</span>
              <span className="comm-sub">Circularity opportunities</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Real-time KPI summary */}
          <DashboardCards
            complaints={serviceVertical === 'civic' ? complaints.filter((c) => c.serviceType !== 'commercial_bulk') : complaints}
            onApplyFilter={handleApplyFilter}
          />

          {/* Derived Operational Alert Center */}
          <OperationalAlerts
            complaints={serviceVertical === 'civic' ? complaints.filter((c) => c.serviceType !== 'commercial_bulk') : complaints}
            onApplyFilter={handleApplyFilter}
          />

          {/* Live Waste Hotspots Concentration Analysis */}
          <WasteHotspots
            hotspots={hotspots}
            onSelectHotspot={handleSelectHotspot}
          />
        </>
      )}

      {/* Live Map Section with Hotspot Overlays */}
      <section className="portal-section" id="map">
        <ComplaintMap
          complaints={complaints.filter((c) => c.status !== 'resolved')}
          hotspots={hotspots}
          onMarkerClick={setSelectedComplaint}
        />
      </section>

      {/* Priority Queue Section */}
      <section className="portal-section" id="queue">
        <div className="section-title-row">
          <div>
            <h3>
              {serviceVertical === 'commercial'
                ? '🏢 Commercial & Bulk Services Queue'
                : serviceVertical === 'civic'
                ? '🚨 Civic Incident Priority Queue'
                : '🚨 Incident & Service Operations Queue'}
            </h3>
            <p className="section-subtext">
              Showing {filteredComplaints.length} of{' '}
              {serviceVertical === 'commercial'
                ? commercialStats.totalRequests
                : serviceVertical === 'civic'
                ? civicCount
                : complaints.length}{' '}
              {serviceVertical === 'commercial' ? 'commercial requests' : 'total items'}
            </p>
          </div>
        </div>

        {selectedHotspot && (
          <div className="hotspot-filter-banner" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '12px',
            fontSize: '0.88rem',
            color: '#92400e',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔥</span>
              <span>
                Active Hotspot Filter: <strong>{selectedHotspot.areaName}</strong> ({selectedHotspot.complaintIds?.length || 0} incidents in cluster)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                color: '#b45309',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Clear hotspot filter"
            >
              <span>Clear Filter</span>
              <span>✕</span>
            </button>
          </div>
        )}

        <FilterBar filters={filters} onFilterChange={setFilters} />

        <ComplaintTable
          complaints={filteredComplaints}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onAction={setSelectedComplaint}
        />
      </section>

      {selectedComplaint && (
        <DispatchModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}
