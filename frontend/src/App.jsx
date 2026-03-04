import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ChangePassword from './pages/ChangePassword';
import CustomerApplications from './pages/CustomerApplications';
import Packages from './pages/Packages';
import Contracts from './pages/Contracts';
import ContractDocument from './pages/ContractDocument';
import PaymentPlans from './pages/PaymentPlans';
import PaymentStatement from './pages/PaymentStatement';
import Collections from './pages/Collections';
import Installations from './pages/Installations';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route
                path="/customer-applications"
                element={<CustomerApplications />}
              />
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Agent', 'Technician', 'Collections Officer', 'Customer']} />}>
                <Route
                  path="/contracts"
                  element={<Contracts />}
                />
                <Route
                  path="/contracts/:id/document"
                  element={<ContractDocument />}
                />
                <Route
                  path="/payment-plans"
                  element={<PaymentPlans />}
                />
                <Route
                  path="/payment-plans/:contractId/statement"
                  element={<PaymentStatement />}
                />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Agent', 'Technician', 'Customer']} />}>
                <Route
                  path="/installations"
                  element={<Installations />}
                />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Agent', 'Collections Officer']} />}>
                <Route
                  path="/collections"
                  element={<Collections />}
                />
              </Route>

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/packages" element={<Packages />} />
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
