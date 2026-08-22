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

  // Compute live geographic concentration hotspots from complaints
  const hotspots = useMemo(() => {
    return computeWasteHotspots(complaints, 800);
  }, [complaints]);

  // Handle one-click alert filter application
  const handleApplyFilter = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    const queueEl = document.getElementById('queue');
    if (queueEl) {
      queueEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle one-click hotspot filter
  const handleSelectHotspot = (hs) => {
    setFilters({
      status: 'all',
      wasteType: 'all',
      urgentOnly: false,
      duplicateOnly: false,
      search: hs.areaName.split('/')[0].trim(),
    });
    const queueEl = document.getElementById('queue');
    if (queueEl) {
      queueEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter and sort complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

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
  }, [complaints, filters, sortField, sortDir]);

  const handleSort = (field, dir) => {
    setSortField(field);
    setSortDir(dir);
  };

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

      {/* Firestore connectivity banner */}
      {firestoreError && (
        <div className="firestore-error-banner">
          <strong>⚠️ Firestore connection issue:</strong> {firestoreError}
        </div>
      )}

      {/* Real-time KPI summary */}
      <DashboardCards complaints={complaints} onApplyFilter={handleApplyFilter} />

      {/* Derived Operational Alert Center */}
      <OperationalAlerts
        complaints={complaints}
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
          complaints={complaints.filter((c) => c.status !== 'resolved')}
          hotspots={hotspots}
          onMarkerClick={setSelectedComplaint}
        />
      </section>

      {/* Priority Queue Section */}
      <section className="portal-section" id="queue">
        <div className="section-title-row">
          <div>
            <h3>🚨 Incident Priority Queue</h3>
            <p className="section-subtext">
              Showing {filteredComplaints.length} of {complaints.length} total logged complaints
            </p>
          </div>
        </div>

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
