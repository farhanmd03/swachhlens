import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase.js';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ComplaintDetailPage from './pages/ComplaintDetailPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Only allow non-anonymous users (email/password auth)
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <div className="loading-screen">Authenticating Municipal Portal...</div>;
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
        ) : (
          // Authenticated: show portal command center
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
