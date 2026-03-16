import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // If user has no role yet, they are pending approval
    if (userProfile.role === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hesabınız Onay Bekliyor</h2>
            <p className="text-gray-600">
              Hesabınız başarıyla oluşturuldu ancak henüz bir yetki atanmadı. Lütfen sistem yöneticisinin hesabınızı onaylamasını bekleyin.
            </p>
          </div>
        </div>
      );
    }
    
    // Redirect to their respective dashboard if they try to access an unauthorized route
    if (userProfile.role === 'admin') return <Navigate to="/admin" replace />;
    if (userProfile.role === 'sponsor') return <Navigate to="/sponsor" replace />;
    if (userProfile.role === 'firm') return <Navigate to="/firm" replace />;
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
