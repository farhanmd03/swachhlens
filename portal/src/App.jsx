import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase.js';
import { signOut } from './services/authService.js';
import { MUNICIPAL_ROLES } from './config/constants.js';
import Layout from './components/Layout.jsx';
import SupervisorLayout from './components/SupervisorLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ComplaintDetailPage from './pages/ComplaintDetailPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import SupervisorDashboardPage from './pages/SupervisorDashboardPage.jsx';
import SupervisorJobDetailPage from './pages/SupervisorJobDetailPage.jsx';
import SupervisorTeamPage from './pages/SupervisorTeamPage.jsx';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Only allow non-anonymous users (email/password auth)
      if (currentUser && !currentUser.isAnonymous) {
        try {
          // Explicitly verify this UID exists in the municipalUsers collection
          const docRef = doc(db, 'municipalUsers', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists() && docSnap.data().active !== false) {
            const data = docSnap.data();
            const role = data.role || MUNICIPAL_ROLES.OPERATOR;
            const teamId = data.teamId || null;

            setUser({
              ...currentUser,
              role,
              teamId,
              name: data.name || currentUser.email?.split('@')[0] || 'Municipal Staff',
            });
            setIsAuthorized(true);
          } else {
            // Valid Firebase user, but NOT a provisioned municipal user (e.g. ordinary citizen)
            setUser(currentUser);
            setIsAuthorized(false);
          }
        } catch (err) {
          console.warn('Municipal authorization verification error:', err);
          setUser(currentUser);
          setIsAuthorized(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <div className="loading-screen">Authenticating Municipal Operations...</div>;
  }

  // Handle case where user is logged in, but lacks municipal authorization (e.g. ordinary citizen account)
  if (user && !isAuthorized) {
    return (
      <div className="login-container">
        <div className="login-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
          <div style={{ color: '#dc2626', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <ShieldAlert size={48} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
            The signed-in account (<code>{user.email}</code>) is not registered in the municipal personnel directory.
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '0.8rem', color: '#991b1b', textAlign: 'left' }}>
            <strong>Security Notice:</strong> Ordinary citizen accounts cannot access municipal operational workspaces. Access is restricted to personnel provisioned in the <code>municipalUsers</code> directory.
          </div>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => signOut()}
            type="button"
          >
            <LogOut size={16} />
            <span>Sign Out and Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          // Unauthenticated: show login, redirect any other path to /
          <>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : user.role === MUNICIPAL_ROLES.SUPERVISOR ? (
          // ── Field Supervisor Workspace ─────────────────────────────
          <Route path="/" element={<SupervisorLayout user={user} />}>
            <Route index element={<SupervisorDashboardPage user={user} />} />
            <Route path="job/:id" element={<SupervisorJobDetailPage user={user} />} />
            <Route path="my-team" element={<SupervisorTeamPage user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          // ── Municipal Head Office / Operator Command Center ─────────
          <Route path="/" element={<Layout user={user} />}>
            <Route index element={<DashboardPage />} />
            <Route path="complaint/:id" element={<ComplaintDetailPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
