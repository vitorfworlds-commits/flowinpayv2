import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './components/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Charges from './pages/Charges';
import Transactions from './pages/Transactions';
import Withdrawals from './pages/Withdrawals';
import ApiKeys from './pages/ApiKeys';
import Disputes from './pages/Disputes';
import Acquirers from './pages/Acquirers';
import Fees from './pages/Fees';
import Account from './pages/Account';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import ChargeDetail from './pages/ChargeDetail';
import Pay from './pages/Pay';
import Docs from './pages/Docs';
import Landing from './pages/Landing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import '../css/app.css';

// Registrar service worker globalmente (PWA + Push)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const root = createRoot(document.getElementById('app')!);

root.render(
    <ThemeProvider>
        <BrowserRouter>
            <Toaster position="top-right" toastOptions={{
                duration: 3000,
                style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '13px',
                },
            }} />
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/pay/:correlationId" element={<Pay />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/charges" element={<Charges />} />
                    <Route path="/charges/:id" element={<ChargeDetail />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/withdrawals" element={<Withdrawals />} />
                    <Route path="/disputes" element={<Disputes />} />
                    <Route path="/acquirers" element={<Acquirers />} />
                    <Route path="/api-keys" element={<ApiKeys />} />
                    <Route path="/fees" element={<Fees />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    </ThemeProvider>
);
