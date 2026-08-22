import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile, saveProfile } from '../services/profileService.js';
import { getCitizenComplaints } from '../services/complaintService.js';
import { signOutCitizen } from '../services/authService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import {
  UserRound,
  Lock,
  Save,
  LogOut,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  ShieldCheck,
  Edit3,
  X,
  UserPlus,
  AlertTriangle,
  Camera,
  ClipboardList,
  Sparkles,
  Activity,
} from 'lucide-react';

/**
 * Generate 1-2 character initials for user avatar.
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * ProfilePage — Polished Civic-Tech Citizen Profile & Impact Dashboard.
 */
export default function ProfilePage({ authMode, onNavigateAuth }) {
  const navigate = useNavigate();
  const isRegistered = authMode === 'registered';

  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    ward: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [error, setError] = useState(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [profileData, userComplaints] = await Promise.all([
          getProfile(currentUser.uid).catch(() => null),
          getCitizenComplaints(currentUser.uid).catch(() => []),
        ]);

        if (profileData) {
          setProfile(profileData);
          setFormData({
            name: profileData.name || '',
            phone: profileData.phone || '',
            area: profileData.area || '',
            ward: profileData.ward || '',
          });
        } else {
          setProfile(null);
          setFormData({ name: '', phone: '', area: '', ward: '' });
        }
        setComplaints(userComplaints || []);
      } catch (err) {
        setError(`Failed to load profile data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isRegistered]);

  // Enter Edit mode
  const handleStartEdit = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      area: profile?.area || '',
      ward: profile?.ward || '',
    });
    setError(null);
    setSuccessMsg(null);
    setIsEditing(true);
  };

  // Cancel editing — restore saved values
  const handleCancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      area: profile?.area || '',
      ward: profile?.ward || '',
    });
    setError(null);
    setIsEditing(false);
  };

  // Save profile updates to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Full Name is required.');
      return;
    }
    const citizenId = auth.currentUser?.uid;
    if (!citizenId) {
      setError('Not authenticated. Please wait and try again.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const email = isRegistered ? auth.currentUser.email : (profile?.email || '');
      const updatedData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email,
        area: formData.area.trim(),
        ward: formData.ward.trim(),
      };

      await saveProfile(citizenId, updatedData);
      setProfile(updatedData);
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Sign out confirmation execution
  const handleConfirmSignOut = async () => {
    setShowSignOutModal(false);
    try {
      await signOutCitizen();
    } catch (err) {
      setError(`Sign out failed: ${err.message}`);
    }
  };

  // Guest wants to create account
  const handleCreateAccountFromGuest = async () => {
    try {
      await signOutCitizen();
      if (onNavigateAuth) {
        onNavigateAuth('register');
      }
    } catch (err) {
      setError(`Failed to switch to registration: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile dashboard…" />;

  const displayName = profile?.name ? profile.name.trim() : (isRegistered ? 'Registered Citizen' : 'Anonymous Guest');
  const userEmail = isRegistered ? (auth.currentUser?.email || profile?.email || 'Registered User') : null;
  const initials = isRegistered && profile?.name ? getInitials(profile.name) : null;

  // ── Civic Impact Calculations (User-Owned Complaints Only) ───────
  const totalReports = complaints.length;
  const activeReports = complaints.filter((c) =>
    ['reported', 'verified', 'assigned', 'in_progress'].includes(c.status)
  ).length;
  const resolvedReports = complaints.filter((c) => c.status === 'resolved').length;

  // Average resolution time (only if reliable timestamp and resolvedAt exist)
  const resolvedWithTimes = complaints.filter(
    (c) => c.status === 'resolved' && c.resolvedAt && c.timestamp && c.resolvedAt > c.timestamp
  );
  let avgResolutionTimeStr = null;
  if (resolvedWithTimes.length > 0) {
    const totalMs = resolvedWithTimes.reduce((acc, c) => acc + (c.resolvedAt - c.timestamp), 0);
    const avgHours = totalMs / resolvedWithTimes.length / (1000 * 60 * 60);
    if (avgHours < 24) {
      avgResolutionTimeStr = `${Math.round(avgHours * 10) / 10} hrs`;
    } else {
      avgResolutionTimeStr = `${Math.round((avgHours / 24) * 10) / 10} days`;
    }
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>Citizen Profile</h2>
        <p className="page-subtitle">
          {isRegistered
            ? 'Civic activity dashboard, contact details, and account preferences.'
            : 'Anonymous civic reporting session and local impact.'}
        </p>
      </div>

      {/* ── PROFILE HERO CARD ────────────────────────────────────── */}
      <div className="profile-hero-card">
        {initials ? (
          <div className="profile-avatar-circle profile-avatar-initials" aria-hidden="true">
            <span>{initials}</span>
          </div>
        ) : (
          <div className="profile-avatar-circle" aria-hidden="true">
            <UserRound size={32} className="avatar-icon" />
          </div>
        )}
        <div className="profile-hero-info">
          <h3 className="profile-hero-name">{displayName}</h3>
          {isRegistered ? (
            <span className="profile-uid-text profile-account-type registered">
              <ShieldCheck size={13} />
              Registered Citizen Account
            </span>
          ) : (
            <span className="profile-uid-text profile-account-type guest">
              <Lock size={13} />
              Anonymous Guest Session
            </span>
          )}
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="success-banner-box">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && <div className="error-banner-box">{error}</div>}

      {/* ── QUICK ACTIONS CARD ─────────────────────────────────── */}
      <div className="profile-card profile-quick-actions-card">
        <div className="profile-card-header">
          <div className="card-header-title">
            <Activity size={16} className="text-emerald" />
            <span>Quick Actions</span>
          </div>
        </div>
        <div className="quick-actions-grid">
          <button
            className="btn btn-outline quick-action-btn"
            onClick={() => navigate('/report')}
            type="button"
          >
            <Camera size={16} className="quick-action-icon" />
            <span>Report Waste</span>
          </button>
          <button
            className="btn btn-outline quick-action-btn"
            onClick={() => navigate('/my-reports')}
            type="button"
          >
            <ClipboardList size={16} className="quick-action-icon" />
            <span>My Reports</span>
          </button>
          {isRegistered && !isEditing && (
            <button
              className="btn btn-outline quick-action-btn"
              onClick={handleStartEdit}
              type="button"
            >
              <Edit3 size={16} className="quick-action-icon" />
              <span>Edit Profile</span>
            </button>
          )}
          {!isRegistered && (
            <button
              className="btn btn-outline quick-action-btn"
              onClick={handleCreateAccountFromGuest}
              type="button"
            >
              <UserPlus size={16} className="quick-action-icon" />
              <span>Create Account</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MY CIVIC IMPACT CARD ───────────────────────────────── */}
      <div className="profile-card profile-impact-card">
        <div className="profile-card-header">
          <div className="card-header-title">
            <Sparkles size={16} className="text-emerald" />
            <span>My Civic Impact</span>
          </div>
        </div>

        <div className="impact-stats-grid">
          <div className="impact-stat-item">
            <div className="impact-stat-number stat-total">{totalReports}</div>
            <div className="impact-stat-label">Reports Submitted</div>
          </div>
          <div className="impact-stat-item">
            <div className="impact-stat-number stat-active">{activeReports}</div>
            <div className="impact-stat-label">Active Reports</div>
          </div>
          <div className="impact-stat-item">
            <div className="impact-stat-number stat-resolved">{resolvedReports}</div>
            <div className="impact-stat-label">Resolved</div>
          </div>
          {avgResolutionTimeStr && (
            <div className="impact-stat-item">
              <div className="impact-stat-number stat-time">{avgResolutionTimeStr}</div>
              <div className="impact-stat-label">Avg. Resolution</div>
            </div>
          )}
        </div>

        {totalReports === 0 && (
          <p className="impact-empty-text">
            No reports submitted yet. When you report civic waste, your community contributions and resolution progress will appear here.
          </p>
        )}
      </div>

      {/* ── REGISTERED USER VIEW: ACCOUNT INFORMATION ───────────── */}
      {isRegistered && (
        <>
          {/* Default State: READ-ONLY DETAILS CARD */}
          {!isEditing ? (
            <div className="profile-card profile-details-card">
              <div className="profile-card-header">
                <div className="card-header-title">
                  <User size={16} />
                  <span>Account Information</span>
                </div>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleStartEdit}
                  type="button"
                >
                  <Edit3 size={13} />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-row">
                  <span className="info-label">Full Name</span>
                  <strong className="info-value">{profile?.name || 'Not provided'}</strong>
                </div>

                <div className="profile-info-row">
                  <span className="info-label">Email Address</span>
                  <strong className="info-value">{userEmail}</strong>
                </div>

                {profile?.phone && (
                  <div className="profile-info-row">
                    <span className="info-label">Phone Number</span>
                    <strong className="info-value">{profile.phone}</strong>
                  </div>
                )}

                {profile?.area && (
                  <div className="profile-info-row">
                    <span className="info-label">Area / Locality</span>
                    <strong className="info-value">{profile.area}</strong>
                  </div>
                )}

                {profile?.ward && (
                  <div className="profile-info-row">
                    <span className="info-label">Municipal Ward</span>
                    <strong className="info-value">{profile.ward}</strong>
                  </div>
                )}
              </div>

              <div className="profile-actions-stack" style={{ marginTop: '20px' }}>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => setShowSignOutModal(true)}
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Edit Mode: FORM WITH SAVE / CANCEL */
            <div className="profile-card profile-form-card">
              <div className="profile-card-header">
                <div className="card-header-title">
                  <Edit3 size={16} />
                  <span>Edit Profile Details</span>
                </div>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  type="button"
                >
                  <X size={13} />
                  <span>Cancel</span>
                </button>
              </div>

              <form onSubmit={handleSave}>
                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="edit-name">
                    <User size={13} />
                    <span>Full Name <span className="required">*</span></span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    disabled={saving}
                    autoFocus
                  />
                </div>

                {/* Email Address (Read-only) */}
                <div className="form-group">
                  <label htmlFor="edit-email">
                    <Mail size={13} />
                    <span>
                      Email Address
                      <span className="form-label-badge">Account Email</span>
                    </span>
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={userEmail || ''}
                    readOnly
                    className="input-readonly"
                    disabled={saving}
                  />
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="edit-phone">
                    <Phone size={13} />
                    <span>Phone Number (Optional)</span>
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Mobile number for municipal updates"
                    disabled={saving}
                  />
                </div>

                {/* Area */}
                <div className="form-group">
                  <label htmlFor="edit-area">
                    <MapPin size={13} />
                    <span>Area / Locality (Optional)</span>
                  </label>
                  <input
                    id="edit-area"
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Connaught Place / Sector V"
                    disabled={saving}
                  />
                </div>

                {/* Ward */}
                <div className="form-group">
                  <label htmlFor="edit-ward">
                    <Building size={13} />
                    <span>Municipal Ward (Optional)</span>
                  </label>
                  <input
                    id="edit-ward"
                    type="text"
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    placeholder="e.g. Ward 23"
                    disabled={saving}
                  />
                </div>

                <div className="profile-edit-actions">
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={saving}
                  >
                    <Save size={16} />
                    <span>{saving ? 'Saving Changes…' : 'Save Profile'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-full"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* ── GUEST USER VIEW: COMPACT CARD ──────────────────────── */}
      {!isRegistered && (
        <div className="profile-card guest-profile-card">
          <div className="guest-card-header">
            <div className="guest-badge-icon">
              <UserRound size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="guest-card-title">Guest Account</h3>
              <p className="guest-card-subtitle">You're currently using anonymous reporting.</p>
            </div>
          </div>

          <div className="guest-explanation-box">
            <p className="guest-explanation-text">
              Your waste complaints are linked to this browser session. You can report immediately without an account.
            </p>
            <p className="guest-explanation-sub">
              To keep your report history permanently accessible across devices, create a free citizen account.
            </p>
          </div>

          <div className="guest-actions-stack">
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleCreateAccountFromGuest}
              type="button"
            >
              <UserPlus size={16} />
              <span>Create Account</span>
            </button>

            <button
              className="btn btn-secondary btn-full"
              onClick={() => setShowSignOutModal(true)}
              type="button"
            >
              <LogOut size={16} />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      )}

      {/* ── PRIVACY & SECURITY SECTION ─────────────────────────── */}
      <div className="profile-card profile-privacy-card">
        <div className="profile-card-header">
          <div className="card-header-title">
            <Lock size={16} className="text-emerald" />
            <span>Privacy &amp; Security</span>
          </div>
        </div>
        <div className="privacy-info-content">
          <div className="privacy-bullet">
            <ShieldCheck size={16} className="text-emerald privacy-bullet-icon" />
            <span>Your contact information is available strictly to authorized municipal response teams for complaint verification and resolution.</span>
          </div>
          <div className="privacy-bullet">
            <Lock size={16} className="text-emerald privacy-bullet-icon" />
            <span>
              {isRegistered
                ? 'Your account is secured and permanently linked to your registered Firebase identity.'
                : 'Your guest session is local to this browser. Clearing browser cache removes session continuity.'}
            </span>
          </div>
        </div>
      </div>

      {/* ── SIGN-OUT CONFIRMATION MODAL ────────────────────────── */}
      {showSignOutModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal-card">
            <div className="confirm-modal-icon-box">
              <AlertTriangle size={28} className="text-amber" />
            </div>
            <h3 className="confirm-modal-title">Sign out?</h3>
            <p className="confirm-modal-desc">
              {isRegistered
                ? 'Are you sure you want to sign out of this session?'
                : 'Signing out will end this anonymous browser session. You may not be able to recover these reports after browser data is cleared.'}
            </p>
            <div className="confirm-modal-actions">
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setShowSignOutModal(false)}
                type="button"
                autoFocus
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-full"
                onClick={handleConfirmSignOut}
                type="button"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
