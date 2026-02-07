import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './lib/store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { Dashboard } from './pages/Dashboard';
import { Channels } from './pages/Channels';
import { Conversations } from './pages/Conversations';
import { Customers } from './pages/Customers';
import { Orders } from './pages/Orders';
import { Bookings } from './pages/Bookings';
import { AITraining } from './pages/AITraining';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

// Admin Imports
import { AdminLayout } from './layouts/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminTransactions } from './pages/admin/Transactions';
import { AdminPricing } from './pages/admin/Pricing';
import { AdminSettings } from './pages/admin/Settings';

function App() {
  const validateSession = useStore((state) => state.validateSession);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Merchant Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/business" element={<AITraining />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
           <Route index element={<Navigate to="/admin/dashboard" replace />} />
           <Route path="dashboard" element={<AdminDashboard />} />
           <Route path="transactions" element={<AdminTransactions />} />
           <Route path="pricing" element={<AdminPricing />} />
           <Route path="settings" element={<AdminSettings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
