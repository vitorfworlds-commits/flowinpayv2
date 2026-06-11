import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/store/useAuthStore';

export default function Layout() {
    const { user, token } = useAuthStore();
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('fp_sidebar_collapsed') === 'true';
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('fp_sidebar_collapsed', String(next));
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile sidebar on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [mobileOpen]);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-layout">
            {/* Mobile backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="sidebar-backdrop visible"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            <Sidebar
                collapsed={collapsed}
                onToggle={toggle}
                mobileOpen={mobileOpen}
                onMobileToggle={() => setMobileOpen((p) => !p)}
            />

            <main className={`app-main ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                {/* Mobile menu button */}
                <button
                    className="btn-icon mobile-menu-btn"
                    onClick={() => setMobileOpen((p) => !p)}
                    style={{
                        position: 'fixed', top: 14, left: 14, zIndex: 30,
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        boxShadow: '0 2px 8px rgb(0 0 0 / 0.15)',
                    }}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}
