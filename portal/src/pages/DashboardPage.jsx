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
import CommercialDashboard from '../components/CommercialDashboard.jsx';

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

  // Split datasets cleanly
  const civicComplaints = useMemo(
    () => complaints.filter((c) => c.serviceType !== 'commercial_bulk'),
    [complaints]
  );
  const commercialComplaints = useMemo(
    () => complaints.filter((c) => c.serviceType === 'commercial_bulk'),
    [complaints]
  );

  // Compute live geographic concentration hotspots from civic complaints
  const hotspots = useMemo(() => {
    return computeWasteHotspots(civicComplaints, 800);
  }, [civicComplaints]);

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

  // Filter and sort civic complaints
  const filteredCivicComplaints = useMemo(() => {
    let result = [...civicComplaints];

    // Filter by selected geographic hotspot cluster if active
    if (selectedHotspot && Array.isArray(selectedHotspot.complaintIds)) {
      result = result.filter((c) => selectedHotspot.complaintIds.includes(c.id));
    }

    if (filters.status !== 'all') {
      result = result.filter((c) => c.status === filters.status);
    }
    if (filters.wasteType !== 'all') {
      result = result.filter((c) => c.aiResult?.wasteType === filters.wasteType);
    }
    if (filters.urgentOnly) {
      result = result.filter((c) => c.urgentEscalation);
    }
    if (filters.duplicateOnly) {
      result = result.filter((c) => !!c.isDuplicateOf);
    }
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.complaintNumber?.toLowerCase().includes(q) ||
          c.citizenName?.toLowerCase().includes(q) ||
          c.aiResult?.wasteType?.toLowerCase().includes(q) ||
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
          aVal = a.aiResult?.wasteType || '';
          bVal = b.aiResult?.wasteType || '';
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
  }, [civicComplaints, filters, sortField, sortDir, selectedHotspot]);

  const handleSort = (field, dir) => {
    setSortField(field);
    setSortDir(dir);
  };

  // ── Render Civic Operations Sub-view ────────────────────────────
  const renderCivicOperations = (isEmbedded = false) => (
    <div className={`civic-operations-block ${isEmbedded ? 'embedded-vertical' : ''}`}>
      {isEmbedded && (
        <div className="vertical-section-header">
          <div className="section-title-wrap">
            <span className="vertical-tag-pill civic">MUNICIPAL CIVIC OPERATIONS</span>
            <h3 className="vertical-title">🏛️ Civic Waste Incidents</h3>
            <p className="vertical-subtitle">
              Real-time citizen waste reports, automated priority triage, and field response routing.
            </p>
          </div>
        </div>
      )}

      {/* Real-time KPI summary */}
      <DashboardCards
        complaints={civicComplaints}
        onApplyFilter={handleApplyFilter}
      />

      {/* Derived Operational Alert Center */}
      <OperationalAlerts
        complaints={civicComplaints}
        onApplyFilter={handleApplyFilter}
      />

      {/* Live Waste Hotspots Concentration Analysis */}
      <WasteHotspots
        hotspots={hotspots}
        onSelectHotspot={handleSelectHotspot}
      />

      {/* Live Map Section with Hotspot Overlays */}
      <section className="portal-section" id="map">
        <ComplaintMap
          complaints={civicComplaints.filter((c) => c.status !== 'resolved')}
          hotspots={hotspots}
          onMarkerClick={setSelectedComplaint}
        />
      </section>

      {/* Priority Queue Section */}
      <section className="portal-section" id="queue">
        <div className="section-title-row">
          <div>
            <h3>🚨 Civic Incident Priority Queue</h3>
            <p className="section-subtext">
              Showing {filteredCivicComplaints.length} of {civicComplaints.length} active civic incident reports
            </p>
          </div>
        </div>

        {selectedHotspot && (
          <div
            className="hotspot-filter-banner"
            style={{
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🔥</span>
              <span>
                Active Hotspot Filter: <strong>{selectedHotspot.areaName}</strong> (
                {selectedHotspot.complaintIds?.length || 0} incidents in cluster)
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
          complaints={filteredCivicComplaints}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onAction={setSelectedComplaint}
        />
      </section>
    </div>
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-bar">
        <div>
          <h2>Operations Command Center</h2>
          <p className="page-subtitle">
            Integrated municipal operations command: civic incident triage and scheduled commercial services.
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
            <span className="vertical-tab-count">{civicComplaints.length}</span>
          </button>
          <button
            type="button"
            className={`vertical-tab-btn ${serviceVertical === 'commercial' ? 'active' : ''}`}
            onClick={() => {
              setServiceVertical('commercial');
              setSelectedHotspot(null);
            }}
          >
            <span>🏢 Commercial Services</span>
            <span className="vertical-tab-count commercial-pill-count">{commercialComplaints.length}</span>
          </button>
        </div>
      </div>

      {/* Firestore connectivity banner */}
      {firestoreError && (
        <div className="firestore-error-banner">
          <strong>⚠️ Firestore connection issue:</strong> {firestoreError}
        </div>
      )}

      {/* ── VERTICAL VIEW ROUTING ── */}
      {serviceVertical === 'commercial' && (
        <CommercialDashboard
          commercialComplaints={commercialComplaints}
          onAction={setSelectedComplaint}
        />
      )}

      {serviceVertical === 'civic' && renderCivicOperations(false)}

      {serviceVertical === 'all' && (
        <div className="all-operations-split-view">
          {renderCivicOperations(true)}

          <div className="vertical-divider-band">
            <hr className="vertical-section-divider" />
          </div>

          <div className="commercial-vertical-section">
            <div className="vertical-section-header">
              <div className="section-title-wrap">
                <span className="vertical-tag-pill commercial">ENTERPRISE &amp; EVENT SERVICES</span>
                <h3 className="vertical-title">🏢 Commercial &amp; Bulk Operations</h3>
                <p className="vertical-subtitle">
                  Scheduled bulk event collections, resource recovery quotas, and commercial dispatch.
                </p>
              </div>
            </div>
            <CommercialDashboard
              commercialComplaints={commercialComplaints}
              onAction={setSelectedComplaint}
            />
          </div>
        </div>
      )}

      {selectedComplaint && (
        <DispatchModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
}
