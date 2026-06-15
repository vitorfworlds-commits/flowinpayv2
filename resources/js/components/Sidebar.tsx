import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Receipt,
    FileText,
    ArrowDownToLine,
    Key,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    ShieldAlert,
    Plug,
    ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen?: boolean;
    onMobileToggle?: () => void;
}

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/charges', icon: Receipt, label: 'Cobranças' },
    { to: '/transactions', icon: FileText, label: 'Extrato' },
    { to: '/withdrawals', icon: ArrowDownToLine, label: 'Saques' },
    { to: '/disputes', icon: ShieldAlert, label: 'Contestações' },
    { to: '/acquirers', icon: Plug, label: 'Adquirentes' },
    { to: '/api-keys', icon: Key, label: 'API Keys' },
    { to: '/admin', icon: ShieldCheck, label: 'Painel Admin', adminOnly: true },
    { to: '/account', icon: Settings, label: 'Conta' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileToggle }: SidebarProps) {
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
        ? user.name
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'U';

    return (
        <aside className={`app-sidebar ${collapsed ? 'collapsed' : 'expanded'} ${mobileOpen ? 'mobile-open' : ''}`}>
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="gradient-green sidebar-logo-icon">
                    <span>F</span>
                </div>
                {!collapsed && (
                    <motion.span
                        className="sidebar-logo-text"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        FlowinPay
                    </motion.span>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems
                    .filter((item) => !item.adminOnly || user?.role === 'admin')
                    .map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
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
                    <div className="avatar avatar-sm">
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
                            <div className="sidebar-user-email">{user?.email}</div>
                        </motion.div>
                    )}
                </div>

                <div className="sidebar-actions">
                    <button
                        className="btn-icon"
                        onClick={toggle}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button className="btn-icon" onClick={handleLogout} title="Sair">
                        <LogOut size={16} />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={onToggle}
                        title={collapsed ? 'Expandir' : 'Recolher'}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>
            </div>
        </aside>
    );
}
