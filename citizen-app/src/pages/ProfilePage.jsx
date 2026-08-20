import React, { useState, useEffect } from 'react';
import { auth } from '../config/firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getProfile, saveProfile } from '../services/profileService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { UserRound, Lock, Save, LogOut, CheckCircle2, User, Phone, Mail, MapPin, Building } from 'lucide-react';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [area, setArea] = useState('');
  const [ward, setWard] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const profile = await getProfile(currentUser.uid);
        if (profile) {
          setName(profile.name || '');
          setPhone(profile.phone || '');
          setEmail(profile.email || '');
          setArea(profile.area || '');
          setWard(profile.ward || '');
        }
      } catch (err) {
        setError(`Failed to load profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    const citizenId = auth.currentUser?.uid;
    if (!citizenId) {
      setError('Not authenticated. Please wait and try again.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await saveProfile(citizenId, { name, phone, email, area, ward });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(`Failed to save profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setName('');
      setPhone('');
      setEmail('');
      setArea('');
      setWard('');
    } catch (err) {
      setError(`Sign out failed: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>Citizen Profile</h2>
        <p className="page-subtitle">
          Personal details attached to your verified waste reports.
        </p>
      </div>

      {/* Profile Header Avatar Box */}
      <div className="profile-hero-card">
        <div className="profile-avatar-circle">
          <UserRound size={32} className="avatar-icon" />
        </div>
        <div className="profile-hero-info">
          <h3 className="profile-hero-name">{name ? name.trim() : 'Anonymous Citizen'}</h3>
          <span className="profile-uid-text">Session ID: {auth.currentUser?.uid?.slice(0, 10)}...</span>
        </div>
      </div>

      {/* Informational Privacy & Account Card */}
      <div className="profile-privacy-card">
        <div className="privacy-card-title">
          <Lock size={15} className="privacy-icon" />
          <span>Privacy & Account</span>
        </div>
        <p className="privacy-card-text">
          Your profile currently uses a temporary anonymous account linked to this browser session.
          For this prototype, clearing browser data may remove access to previous reports.
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}
      {success && (
        <p className="success-message">
          <CheckCircle2 size={16} />
          <span>Profile saved successfully!</span>
        </p>
      )}

      {/* Form Card */}
      <div className="profile-form-card">
        <div className="form-group">
          <label htmlFor="pname">
            <User size={13} />
            <span>Full Name <span className="required">*</span></span>
          </label>
          <input
            id="pname"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pphone">
            <Phone size={13} />
            <span>Phone Number (Optional)</span>
          </label>
          <input
            id="pphone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile number for municipal updates"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pemail">
            <Mail size={13} />
            <span>Email Address (Optional)</span>
          </label>
          <input
            id="pemail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="parea">
            <MapPin size={13} />
            <span>Area / Locality</span>
          </label>
          <input
            id="parea"
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Connaught Place"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pward">
            <Building size={13} />
            <span>Municipal Ward</span>
          </label>
          <input
            id="pward"
            type="text"
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="e.g. Ward 23"
            disabled={saving}
          />
        </div>

        <div className="profile-actions-stack">
          <button
            className="btn btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>

          <button
            className="btn btn-secondary btn-full"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
