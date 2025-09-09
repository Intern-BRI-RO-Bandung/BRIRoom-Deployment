import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './styles/custom.css';

// Landing Page Component
import LandingPage from './components/landing/LandingPage';

// Auth Components
import Login from './components/auth/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import { AuthProvider } from './contexts/AuthContext';

// User Components
import UserDashboard from './components/user/UserDashboard';
import BookingForm from './components/user/BookingForm';
import MyBookings from './components/user/MyBookings';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AllBookings from './components/admin/AllBookings';
import ManageZoom from './components/admin/ManageZoom';

// Logistik Components
import LogistikDashboard from './components/logistik/LogistikDashboard';
import ManageRooms from './components/logistik/ManageRooms';
import RoomBookings from './components/logistik/RoomBookings';

import { USER_ROLES } from './utils/constants';
import { isAuthenticated, getDashboardRoute, getUser } from './utils/auth';

// Root redirect component - Modified to show landing page first
const RootRedirect = () => {
  // Always show landing page for root path
  return <LandingPage />;
};

// Dashboard redirect component for authenticated users
const DashboardRedirect = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  const user = getUser();
  const dashboardRoute = getDashboardRoute(user?.role);
  return <Navigate to={dashboardRoute} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Landing Page - Public Route */}
            <Route path="/" element={<RootRedirect />} />

            {/* Login - Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard redirect for authenticated users */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* USER */}
            <Route
              path="/user"
              element={
                <ProtectedRoute requiredRole={USER_ROLES.USER}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="booking" element={<BookingForm />} />
              <Route path="mybookings" element={<MyBookings />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="bookings" element={<AllBookings />} />
              <Route path="zoom" element={<ManageZoom />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* LOGISTIK */}
            <Route
              path="/logistik"
              element={
                <ProtectedRoute requiredRole={USER_ROLES.LOGISTIK}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<LogistikDashboard />} />
              <Route path="rooms" element={<ManageRooms />} />
              <Route path="bookings" element={<RoomBookings />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Catch all route - redirect to landing page */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;