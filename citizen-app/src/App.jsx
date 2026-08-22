import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase.js';
import { getAuthMode } from './services/authService.js';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import ReportDetailPage from './pages/ReportDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

/**
 * Root of the citizen app.
 *
 * Auth state machine:
 *  'loading'    → spinner (waiting for Firebase to resolve auth state)
 *  'signed_out' → auth screen stack (AuthPage / SignInPage / RegisterPage)
 *  'anonymous'  → main app shell (guest mode)
 *  'registered' → main app shell (registered citizen)
 *
 * NOTE: Anonymous (guest) sign-in is not performed automatically on
 * startup. The user must explicitly choose "Continue as Guest" on AuthPage.
 */
export default function App() {
  // undefined = not yet resolved; null = no user; User object = authenticated
  const [user, setUser] = useState(undefined);

  // Which auth screen to show when signed_out: 'auth' | 'sign-in' | 'register'
  const [authScreen, setAuthScreen] = useState('auth');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser((prev) => {
        // If transitioning from signed out to signed in, ensure we start on Home (/)
        if (!prev && currentUser) {
          if (window.location.pathname !== '/') {
            window.history.replaceState(null, '', '/');
          }
        }
        return currentUser ?? null;
      });

      // Reset to the landing auth screen whenever the user signs out.
      if (!currentUser) {
        setAuthScreen('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const authMode = getAuthMode(user);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (authMode === 'loading') {
    return <LoadingSpinner message="Loading…" />;
  }

  // ── Signed out — show auth screen stack (no BrowserRouter needed) ────────
  if (authMode === 'signed_out') {
    if (authScreen === 'sign-in') {
      return <SignInPage onNavigate={setAuthScreen} />;
    }
    if (authScreen === 'register') {
      return <RegisterPage onNavigate={setAuthScreen} />;
    }
    // Default: landing
    return <AuthPage onNavigate={setAuthScreen} />;
  }

  // ── Authenticated (anonymous or registered) — main app shell ────────────
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout authMode={authMode} />}>
          <Route index element={<HomePage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="my-reports" element={<MyReportsPage />} />
          <Route path="report/:id" element={<ReportDetailPage />} />
          <Route path="profile" element={<ProfilePage authMode={authMode} onNavigateAuth={setAuthScreen} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
