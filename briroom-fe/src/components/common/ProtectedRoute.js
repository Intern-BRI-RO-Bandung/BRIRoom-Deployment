import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    // Bisa tampilkan spinner atau null
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect ke dashboard sesuai role user
    const redirectPath =
      user.role === 'admin_it'
        ? '/admin/dashboard'
        : user.role === 'logistik'
        ? '/logistik/dashboard'
        : '/user/dashboard';

    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;