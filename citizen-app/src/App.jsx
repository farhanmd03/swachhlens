import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from './config/firebase.js';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import ReportDetailPage from './pages/ReportDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Anonymous sign-in failed:', error);
          setAuthLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <LoadingSpinner message="Signing in..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="my-reports" element={<MyReportsPage />} />
          <Route path="report/:id" element={<ReportDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
