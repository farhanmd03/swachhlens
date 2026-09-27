import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getCitizenComplaints } from '../services/complaintService.js';
import ComplaintCard from '../components/ComplaintCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { STATUSES, STATUS_LABELS } from '../config/constants.js';
import { Search, X, Inbox, PlusCircle, Building, Building2 } from 'lucide-react';

export default function MyReportsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'civic' | 'commercial'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser?.uid) {
        try {
          const list = await getCitizenComplaints(currentUser.uid);
          setComplaints(list || []);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const countsByCategory = useMemo(() => {
    const civic = complaints.filter((c) => c.serviceType !== 'commercial_bulk').length;
    const commercial = complaints.filter((c) => c.serviceType === 'commercial_bulk').length;
    return { all: complaints.length, civic, commercial };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Category filter (Civic vs Commercial)
      if (categoryFilter === 'civic' && c.serviceType === 'commercial_bulk') {
        return false;
      }
      if (categoryFilter === 'commercial' && c.serviceType !== 'commercial_bulk') {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = c.complaintNumber?.toLowerCase().includes(q);
        const matchType = c.aiResult?.wasteType?.toLowerCase().includes(q);
        const matchEstablishment = c.businessDetails?.establishmentLabel?.toLowerCase().includes(q);
        const matchComment = c.comment?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        return matchNumber || matchType || matchEstablishment || matchComment || matchId;
      }
      return true;
    });
  }, [complaints, categoryFilter, statusFilter, searchQuery]);

  if (loading) return <LoadingSpinner message="Loading your reports..." />;

  const countsByStatus = {
    all: complaints.length,
    reported: complaints.filter((c) => c.status === 'reported').length,
    verified: complaints.filter((c) => c.status === 'verified').length,
    assigned: complaints.filter((c) => c.status === 'assigned').length,
    in_progress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <div className="my-reports-page">
      <div className="page-header">
        <h2>My Waste Reports</h2>
        <p className="page-subtitle">
          Track the live cleanup lifecycle of your submitted civic complaints.
        </p>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* ── Category Segment Tabs ───────────────────────────── */}
      <div className="reports-category-tabs">
        <button
          type="button"
          className={`category-tab-btn ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All ({countsByCategory.all})
        </button>
        <button
          type="button"
          className={`category-tab-btn ${categoryFilter === 'civic' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('civic')}
        >
          <Building size={14} />
          <span>Civic ({countsByCategory.civic})</span>
        </button>
        <button
          type="button"
          className={`category-tab-btn ${categoryFilter === 'commercial' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('commercial')}
        >
          <Building2 size={14} />
          <span>Bulk Services ({countsByCategory.commercial})</span>
        </button>
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────── */}
      <div className="reports-controls-card">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="reports-search-input"
            placeholder="Search by ID (e.g. SWL-26, SL-BULK) or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-pills-bar">
          <button
            className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({countsByStatus.all})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABELS[s]} ({countsByStatus[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* ── Complaints List ───────────────────────────────────── */}
      {filteredComplaints.length === 0 ? (
        <div className="empty-state-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <img
            src="/assets/branding/citizen-report-waste.png"
            alt="Report Waste"
            style={{ width: '130px', height: 'auto', borderRadius: '10px', margin: '0 auto 14px', display: 'block', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
          />
          <h3>
            {categoryFilter === 'commercial' && countsByCategory.commercial === 0
              ? 'No bulk service bookings yet'
              : complaints.length === 0
              ? 'No reports found'
              : 'No matching records'}
          </h3>
          <p>
            {categoryFilter === 'commercial' && countsByCategory.commercial === 0
              ? 'Planning a wedding, festival, or commercial gathering? Book dedicated bulk collection and recycling logistics.'
              : complaints.length === 0
              ? 'You have not submitted any waste reports yet. Report waste in your locality to start tracking!'
              : 'No records matched your current status filter or search term.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
            {categoryFilter === 'commercial' ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/bulk-service')}
              >
                <PlusCircle size={16} />
                <span>Book Bulk Waste Service</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/report')}
              >
                <PlusCircle size={16} />
                <span>Report Waste Now</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="complaints-list">
          {filteredComplaints.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
