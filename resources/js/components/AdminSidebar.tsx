import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Receipt,
    ShieldAlert,
    Shield,
    ScrollText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen?: boolean;
    onMobileToggle?: () => void;
}

const adminNavItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Usuários' },
    { to: '/admin/charges', icon: Receipt, label: 'Cobranças' },
    { to: '/admin/disputes', icon: ShieldAlert, label: 'Contestações' },
    { to: '/admin/kyc', icon: Shield, label: 'KYC' },
    { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
    { to: '/fees', icon: Settings, label: 'Taxas' },
];

export default function AdminSidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }: SidebarProps) {
    const { user, logout } = useAuthStore();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const handleNavClick = () => {
        if (window.innerWidth <= 768 && onMobileToggle) {
            onMobileToggle();
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : 'A';

    return (
        <aside className={`app-sidebar ${collapsed ? 'collapsed' : 'expanded'} ${mobileOpen ? 'mobile-open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(0 72% 51%))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 16,
                }}>
                    A
                </div>
                {!collapsed && (
                    <motion.span
                        className="sidebar-logo-text"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        Admin Panel
                    </motion.span>
                )}
            </div>

            {/* Back to app */}
            <div style={{ padding: '0 12px', marginBottom: 8 }}>
                <NavLink
                    to="/dashboard"
                    onClick={handleNavClick}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                        borderRadius: 8, fontSize: 12, fontWeight: 500,
                        color: 'var(--muted-foreground)', textDecoration: 'none',
                        transition: 'all 0.2s',
                    }}
                    className="nav-item-back"
                >
                    <ArrowLeft size={14} />
                    {!collapsed && <span>Voltar ao app</span>}
                </NavLink>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {adminNavItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/admin'}
                        className={({ isActive }) =>
                            `nav-item${isActive ? ' active' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                        onClick={handleNavClick}
                    >
                        <item.icon size={18} className="sidebar-nav-item-icon" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="avatar avatar-sm" style={{
                        background: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(0 72% 51%))',
                    }}>
                        <span>{initials}</span>
                    </div>
                    {!collapsed && (
                        <motion.div
                            className="sidebar-user-info"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="sidebar-user-name">{user?.name}</div>
                            <div className="sidebar-user-email" style={{ color: 'hsl(0 84% 60%)', fontSize: 11, fontWeight: 600 }}>ADMINISTRADOR</div>
                        </motion.div>
                    )}
                </div>

                <div className="sidebar-actions">
                    <button className="btn-icon" onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button className="btn-icon" onClick={handleLogout} title="Sair">
                        <LogOut size={16} />
                    </button>
                    <button className="btn-icon" onClick={onToggle} title={collapsed ? 'Expandir' : 'Recolher'}>
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>
            </div>
        </aside>
    );
}
