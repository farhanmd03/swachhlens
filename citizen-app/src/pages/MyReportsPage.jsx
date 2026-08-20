import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getCitizenComplaints } from '../services/complaintService.js';
import ComplaintCard from '../components/ComplaintCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { STATUSES, STATUS_LABELS } from '../config/constants.js';
import { Search, X, Inbox, PlusCircle } from 'lucide-react';

export default function MyReportsPage() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = c.complaintNumber?.toLowerCase().includes(q);
        const matchType = c.aiResult?.wasteType?.toLowerCase().includes(q);
        const matchComment = c.comment?.toLowerCase().includes(q);
        const matchId = c.id?.toLowerCase().includes(q);
        return matchNumber || matchType || matchComment || matchId;
      }
      return true;
    });
  }, [complaints, statusFilter, searchQuery]);

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

      {/* ── Search & Filter Bar ───────────────────────────────── */}
      <div className="reports-controls-card">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="reports-search-input"
            placeholder="Search by ID (e.g. SWL-26) or waste type..."
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
        <div className="empty-state-card">
          <Inbox size={40} className="empty-icon-muted" />
          <h3>
            {complaints.length === 0
              ? 'No reports found'
              : 'No matching reports'}
          </h3>
          <p>
            {complaints.length === 0
              ? 'You have not submitted any waste reports yet. Report waste in your locality to start tracking!'
              : 'No reports matched your current status filter or search term.'}
          </p>
          {complaints.length === 0 && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/report')}
            >
              <PlusCircle size={16} />
              <span>+ Report Waste Now</span>
            </button>
          )}
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
