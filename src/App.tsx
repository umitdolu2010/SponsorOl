/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
import AdminDashboard from './pages/admin/AdminDashboard';
import SponsorDashboard from './pages/sponsor/SponsorDashboard';
import LandingPage from './pages/LandingPage';
import FirmShowcase from './pages/FirmShowcase';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/firms" element={<FirmShowcase />} />
          
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/sponsor/*" element={
            <ProtectedRoute allowedRoles={['sponsor']}>
              <SponsorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/r/:qrCode" element={<LandingPage />} />
          
          <Route path="/" element={<FirmShowcase />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
