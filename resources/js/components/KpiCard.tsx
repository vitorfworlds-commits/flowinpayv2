import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
    icon: LucideIcon;
    iconColor?: string;
    title: string;
    value: string;
    subtitle?: string;
}

const KPI_COLORS: Array<{ color: string; bg: string }> = [
    { color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.12)' },
    { color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.12)' },
    { color: 'hsl(262 83% 58%)', bg: 'hsl(262 83% 58% / 0.12)' },
    { color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.12)' },
    { color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.12)' },
];

export default function KpiCard({ icon: Icon, iconColor, title, value, subtitle }: KpiCardProps) {
    const palette = KPI_COLORS.find((c) => c.color === iconColor) ?? KPI_COLORS[0];

    return (
        <div className="card card-glow kpi-card">
            <div
                className="kpi-icon"
                style={{ background: palette.bg }}
            >
                <Icon size={20} style={{ color: palette.color }} />
            </div>
            <div className="kpi-content">
                <div className="kpi-title">{title}</div>
                <div className="kpi-value">{value}</div>
                {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
            </div>
        </div>
    );
}
