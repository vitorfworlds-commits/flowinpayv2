import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserPlus, BarChart3, DollarSign, TrendingUp, Clock, Activity, RefreshCw, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatBRL } from '@/lib/format';
import KpiCard from '@/components/KpiCard';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DashboardData {
    users: { total: number; active: number; new_today: number; new_week: number; new_month: number };
    revenue: { total: number; fees: number; net: number };
    charges: { active: number; paid: number; expired: number };
    withdrawals: { pending: number; processed: number };
    conversion_rate: number;
}

interface ChartPoint { date: string; label: string; value: number }

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [chart, setChart] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [dashRes, chartRes] = await Promise.allSettled([
                api.get('/admin/dashboard'),
                api.get('/admin/dashboard/chart'),
            ]);
            if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data.dashboard);
            if (chartRes.status === 'fulfilled') setChart(chartRes.value.data.chart);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

    if (loading) return <LoadingSpinner fullPage />;
    if (!dashboard) return null;

    const d = dashboard;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div>
                        <h1 className="dashboard-header-title">Painel Administrativo</h1>
                        <p className="dashboard-header-subtitle">Visão geral da plataforma</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={14} /> Atualizar</button>
                </div>
            </div>

            <motion.div {...fadeUp} transition={{ delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <KpiCard icon={Users} iconColor="hsl(217 91% 60%)" title="Total Usuários" value={String(d.users.total)} />
                <KpiCard icon={UserCheck} iconColor="hsl(142 76% 36%)" title="Ativos" value={String(d.users.active)} />
                <KpiCard icon={UserPlus} iconColor="hsl(262 83% 58%)" title="Novos Hoje" value={String(d.users.new_today)} subtitle={`Semana: ${d.users.new_week} | Mês: ${d.users.new_month}`} />
                <KpiCard icon={BarChart3} iconColor="hsl(38 92% 50%)" title="Conversão" value={`${d.conversion_rate}%`} />
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <KpiCard icon={DollarSign} iconColor="hsl(142 76% 36%)" title="Receita Total" value={formatBRL(d.revenue.total)} />
                <KpiCard icon={Zap} iconColor="hsl(38 92% 50%)" title="Taxas Coletadas" value={formatBRL(d.revenue.fees)} />
                <KpiCard icon={TrendingUp} iconColor="hsl(217 91% 60%)" title="Receita Líquida" value={formatBRL(d.revenue.net)} />
                <KpiCard icon={Clock} iconColor="hsl(0 84% 60%)" title="Saques Pendentes" value={String(d.withdrawals.pending)} subtitle={`Processados: ${d.withdrawals.processed}`} />
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.15 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Cobranças Ativas', value: d.charges.active, color: 'hsl(38 92% 50%)' },
                    { label: 'Cobranças Pagas', value: d.charges.paid, color: 'hsl(142 76% 36%)' },
                    { label: 'Cobranças Expiradas', value: d.charges.expired, color: 'hsl(0 84% 60%)' },
                ].map((c, i) => (
                    <div key={i} className="card card-glow" style={{ padding: 20, textAlign: 'center' }}>
                        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Receita — Últimos 30 dias</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chart}>
                        <defs>
                            <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={(v: number) => `R$${v}`} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip formatter={(v: number) => [formatBRL(v), 'Receita']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="hsl(142 76% 36%)" fill="url(#adminGrad)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.25 }} style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>Ver Usuários</button>
                <button className="btn btn-secondary" onClick={() => navigate('/fees')}>Gerenciar Taxas</button>
            </motion.div>
        </div>
    );
}
