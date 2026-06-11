import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuthStore } from '@/store/useAuthStore';
import { formatBRL } from '@/lib/format';

interface HeaderProps {
    title: string;
    subtitle?: string;
    onMobileMenuToggle?: () => void;
    right?: React.ReactNode;
}

export default function Header({ title, subtitle, onMobileMenuToggle, right }: HeaderProps) {
    const { theme, toggle } = useTheme();
    const { user } = useAuthStore();

    const balance = parseFloat(user?.balance ?? '0');

    return (
        <header className="app-header">
            <div className="header-left">
                {onMobileMenuToggle && (
                    <button
                        className="btn-icon mobile-menu-btn"
                        onClick={onMobileMenuToggle}
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div>
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
            </div>

            <div className="header-right">
                {right}

                {user && (
                    <div className="gradient-green-subtle balance-pill">
                        <span className="balance-label">Saldo</span>
                        <span>{formatBRL(balance)}</span>
                    </div>
                )}

                <button className="btn-icon" title="Notificações">
                    <Bell size={18} />
                </button>

                <button className="btn-icon" onClick={toggle} title="Alternar tema">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </header>
    );
}
