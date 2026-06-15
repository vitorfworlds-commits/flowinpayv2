import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, TrendingUp, Calendar, Clock, CreditCard,
    ArrowUpRight, ArrowDownRight, ArrowRight,
    Plus, ArrowDownToLine, Eye, BarChart3, Activity,
    Zap, Shield, Globe, RefreshCw, ExternalLink, CheckCircle, AlertTriangle, Link2, KeyRound, BookOpen,
    Bell, X as XIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/useAuthStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import toast from 'react-hot-toast';

// ------------------------------------------------------------------ //
// INTERFACES                                                         //
// ------------------------------------------------------------------ //
interface SummaryData {
    today: { received: number; fees: number; net: number; withdrawals: number };
    week: { received: number };
    month: { received: number; fees: number; net: number };
    counts: { total_charges: number; paid_charges: number; pending_charges: number; total_withdrawals: number; conversion_rate: number };
}

interface BalanceData {
    available: number;
    blocked: number;
    total: number;
}

interface Transaction {
    id: number;
    type: string;
    description: string;
    amount: number;
    status: string;
    created_at: string;
}

interface TimeOption {
    value: string;
    label: string;
}

// ------------------------------------------------------------------ //
// CONSTANTS                                                          //
// ------------------------------------------------------------------ //
const PERIOD_OPTIONS: TimeOption[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
];

// ------------------------------------------------------------------ //
// ANIMATIONS                                                          //
// ------------------------------------------------------------------ //
const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ------------------------------------------------------------------ //
// CHART TOOLTIP                                                       //
// ------------------------------------------------------------------ //
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length || !payload[0].value) return null;
    return (
        <div className="chart-tooltip-card">
            <p className="chart-tooltip-label">{label}</p>
            <p className="chart-tooltip-value">{formatBRL(payload[0].value)}</p>
        </div>
    );
}

// ------------------------------------------------------------------ //
// TX ICON                                                            //
// ------------------------------------------------------------------ //
function TxIcon({ type }: { type: string }) {
    if (type === 'payment' || type === 'charge' || type === 'received' || type === 'charge_received') {
        return (
            <div className="tx-icon" style={{ background: 'hsl(142 76% 36% / 0.12)', color: 'hsl(142 76% 40%)' }}>
                <ArrowDownRight size={16} />
            </div>
        );
    }
    if (type === 'withdrawal') {
        return (
            <div className="tx-icon" style={{ background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 55%)' }}>
                <ArrowUpRight size={16} />
            </div>
        );
    }
    return (
        <div className="tx-icon" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
            <Activity size={16} />
        </div>
    );
}

function TxTypeLabel({ type }: { type: string }) {
    const map: Record<string, { label: string; style: React.CSSProperties }> = {
        payment: { label: 'Entrada', style: { background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142 76% 36%)' } },
        received: { label: 'Entrada', style: { background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142 76% 36%)' } },
        charge_received: { label: 'Entrada', style: { background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142 76% 36%)' } },
        withdrawal: { label: 'Saque', style: { background: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 55%)' } },
        fee: { label: 'Taxa', style: { background: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 50%)' } },
        refund: { label: 'Reembolso', style: { background: 'hsl(217 91% 60% / 0.1)', color: 'hsl(217 91% 60%)' } },
    };
    const t = map[type] || { label: type, style: { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' } };
    return (
        <span className="tx-type-badge" style={t.style}>
            {t.label}
        </span>
    );
}

// ------------------------------------------------------------------ //
// HELPERS                                                            //
// ------------------------------------------------------------------ //
function buildChartData(transactions: Transaction[], period: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isIncome = (tx: Transaction) =>
        tx.type === 'payment' || tx.type === 'charge' || tx.type === 'received' || tx.type === 'charge_received';

    if (period === 'today') {
        const todayKey = today.toISOString().slice(0, 10);
        const buckets: number[] = new Array(24).fill(0);
        transactions.forEach(tx => {
            if (!isIncome(tx)) return;
            if (new Date(tx.created_at).toISOString().slice(0, 10) !== todayKey) return;
            buckets[new Date(tx.created_at).getHours()] += Math.abs(tx.amount);
        });
        return buckets.map((value, h) => ({ label: `${String(h).padStart(2, '0')}:00`, value }));
    }

    if (period === 'yesterday') {
        const yKey = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
        const buckets: number[] = new Array(24).fill(0);
        transactions.forEach(tx => {
            if (!isIncome(tx)) return;
            if (new Date(tx.created_at).toISOString().slice(0, 10) !== yKey) return;
            buckets[new Date(tx.created_at).getHours()] += Math.abs(tx.amount);
        });
        return buckets.map((value, h) => ({ label: `${String(h).padStart(2, '0')}:00`, value }));
    }

    const days = period === '30d' ? 30 : 7;
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
        map.set(new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10), 0);
    }
    transactions.forEach(tx => {
        if (!isIncome(tx)) return;
        const k = new Date(tx.created_at).toISOString().slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) || 0) + Math.abs(tx.amount));
    });
    return Array.from(map.entries()).map(([k, v]) => ({
        label: new Date(k + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: v,
    }));
}

// ------------------------------------------------------------------ //
// DASHBOARD COMPONENT                                                 //
// ------------------------------------------------------------------ //
export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { supported, subscribed, loading: pushLoading, subscribe } = usePushNotifications();
    const [pushDismissed, setPushDismissed] = useState(() => localStorage.getItem('fp_push_dismissed') === 'true');
    const showPushPrompt = supported && !subscribed && !pushDismissed;
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [balance, setBalance] = useState<BalanceData | null>(null);
    const [allTx, setAllTx] = useState<Transaction[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState('7d');
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const isInitialMount = useRef(true);

    const fetchData = async (showToast = false) => {
        if (showToast) toast.loading('Atualizando dados...');
        try {
            const [summaryRes, balanceRes, txRes] = await Promise.allSettled([
                api.get('/summary'),
                api.get('/balance'),
                api.get('/transactions', { params: { per_page: 200 } }),
            ]);

            if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.summary || summaryRes.value.data);
            if (balanceRes.status === 'fulfilled') setBalance(balanceRes.value.data.balance || balanceRes.value.data);
            if (txRes.status === 'fulfilled') {
                const txData = txRes.value.data;
                const txList = txData.data || txData;
                setAllTx(txList);
                setTransactions(txList.slice(0, 5));
            }
            setLastRefresh(new Date());
            if (showToast) {
                toast.dismiss();
                toast.success('Dashboard atualizado!');
            }
        } catch (err) {
            if (showToast) {
                toast.dismiss();
                toast.error('Erro ao atualizar');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 30000); // Auto refresh 30s
        return () => clearInterval(interval);
    }, []);

    const chartData = useMemo(() => buildChartData(allTx, chartPeriod), [allTx, chartPeriod]);

    if (loading) return <LoadingSpinner fullPage />;

    const todayReceived = summary?.today?.received || 0;
    const weekReceived = summary?.week?.received || 0;
    const monthReceived = summary?.month?.received || 0;
    const totalCharges = summary?.counts?.total_charges || 0;
    const paidCharges = summary?.counts?.paid_charges || 0;
    const pendingCharges = summary?.counts?.pending_charges || 0;
    const conversionRate = summary?.counts?.conversion_rate || 0;
    const availableBalance = balance?.available || 0;
    const blockedBalance = balance?.blocked || 0;
    const chartTotal = chartData.reduce((sum, d) => sum + d.value, 0);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <div
            className="w-full"
            style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
        >
            {/* PUSH NOTIFICATION PROMPT */}
            {showPushPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.12), hsl(142 76% 36% / 0.04))',
                        border: '1px solid hsl(142 76% 36% / 0.2)',
                        borderRadius: 14,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: 'hsl(142 76% 36% / 0.15)',
                        color: 'hsl(142 76% 36%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Bell size={22} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                            Ative as notificações
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.7 }}>
                            Receba alertas instantâneos quando seus pagamentos forem confirmados.
                        </div>
                    </div>
                    <motion.button
                        className="btn btn-primary"
                        style={{ flexShrink: 0, fontSize: 13, padding: '8px 16px' }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={pushLoading}
                        onClick={async () => {
                            await subscribe();
                            toast.success('Notificações ativadas!');
                        }}
                    >
                        {pushLoading ? 'Ativando...' : 'Ativar'}
                    </motion.button>
                    <button
                        className="btn-icon"
                        style={{ flexShrink: 0, opacity: 0.5 }}
                        onClick={() => {
                            localStorage.setItem('fp_push_dismissed', 'true');
                            setPushDismissed(true);
                        }}
                        title="Dispensar"
                    >
                        <XIcon size={16} />
                    </button>
                    {/* Deco */}
                    <div style={{
                        position: 'absolute', right: -20, top: -20, width: 100, height: 100,
                        background: 'radial-gradient(circle, hsl(142 76% 36% / 0.1), transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                </motion.div>
            )}

            {/* HEADER RICH */}
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div>
                        <h1 className="dashboard-header-title">
                            {greeting()}, {user?.name?.split(' ')[0] || 'Desenvolvedor'}
                        </h1>
                        <p className="dashboard-header-subtitle">
                            Aqui está o resumo das suas finanças e cobranças recentes.
                        </p>
                        <div className="dashboard-header-meta">
                            <span className="dashboard-meta-pill">
                                <Clock size={12} /> Última atualização: {lastRefresh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="dashboard-meta-pill">
                                <Activity size={12} /> Sistema operacional
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="dashboard-refresh-btn" onClick={() => fetchData(true)}>
                            <RefreshCw size={14} /> Atualizar
                        </button>
                    </div>
                </div>
            </div>

            {/* BALANCE HERO */}
            <div className="card glow-green-strong" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    padding: '32px',
                    background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.08) 0%, hsl(142 76% 36% / 0.02) 100%)',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="balance-hero-icon">
                                <Wallet size={28} />
                            </div>
                            <div>
                                <div className="balance-hero-label">Saldo disponível</div>
                                <div className="balance-hero-value">
                                    {formatBRL(availableBalance)}
                                </div>
                                {blockedBalance > 0 && (
                                    <div className="balance-hero-blocked flex items-center gap-2">
                                        <div style={{ width: 6, height: 6, borderRadius: 3, background: 'hsl(38 92% 50%)' }} />
                                        <span>{formatBRL(blockedBalance)} bloqueado</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <motion.button
                                className="btn btn-primary"
                                style={{ boxShadow: '0 4px 14px hsl(142 76% 36% / 0.4)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/charges')}
                            >
                                <Plus size={18} /> Nova cobrança
                            </motion.button>
                            <motion.button
                                className="btn btn-secondary"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/withdrawals')}
                            >
                                <ArrowDownToLine size={16} /> Sacar agora
                            </motion.button>
                        </div>
                    </div>
                </div>
                {/* Deco gradient */}
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
                    background: 'radial-gradient(circle at right, hsl(142 76% 36% / 0.08), transparent 70%)',
                    pointerEvents: 'none'
                }} />
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        icon: Zap,
                        title: 'Criar cobrança',
                        desc: 'Gere um link ou QR Code PIX',
                        color: 'hsl(142 76% 36%)',
                        bg: 'hsl(142 76% 36% / 0.1)',
                        to: '/charges'
                    },
                    {
                        icon: ArrowDownToLine,
                        title: 'Solicitar saque',
                        desc: 'Transfira para sua conta',
                        color: 'hsl(217 91% 60%)',
                        bg: 'hsl(217 91% 60% / 0.1)',
                        to: '/withdrawals'
                    },
                    {
                        icon: Eye,
                        title: 'Extrato completo',
                        desc: 'Movimentações e filtros',
                        color: 'hsl(262 83% 58%)',
                        bg: 'hsl(262 83% 58% / 0.1)',
                        to: '/transactions'
                    },
                    {
                        icon: KeyRound,
                        title: 'API Keys',
                        desc: 'Acesse a documentação',
                        color: 'hsl(38 92% 50%)',
                        bg: 'hsl(38 92% 50% / 0.1)',
                        to: '/api-keys'
                    },
                ].map((action, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -4, boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)' }}
                        className="card card-glow quick-action"
                        onClick={() => navigate(action.to)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="quick-action-icon" style={{ background: action.bg, color: action.color }}>
                            <action.icon size={22} />
                        </div>
                        <div className="quick-action-info">
                            <div className="quick-action-title">{action.title}</div>
                            <div className="quick-action-desc">{action.desc}</div>
                        </div>
                        <div className="quick-action-arrow">
                            <ArrowRight size={16} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Recebido hoje',
                        value: formatBRL(todayReceived),
                        icon: TrendingUp,
                        color: 'hsl(142 76% 36%)',
                        bg: 'hsl(142 76% 36% / 0.1)'
                    },
                    {
                        label: 'Esta semana',
                        value: formatBRL(weekReceived),
                        icon: Calendar,
                        color: 'hsl(217 91% 60%)',
                        bg: 'hsl(217 91% 60% / 0.1)'
                    },
                    {
                        label: 'Este mês',
                        value: formatBRL(monthReceived),
                        icon: Clock,
                        color: 'hsl(262 83% 58%)',
                        bg: 'hsl(262 83% 58% / 0.1)'
                    },
                    {
                        label: 'Cobranças',
                        value: String(totalCharges),
                        icon: CreditCard,
                        color: 'hsl(38 92% 50%)',
                        bg: 'hsl(38 92% 50% / 0.1)',
                        sub: (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-emerald-500 flex items-center gap-1 text-xs font-semibold">
                                    <CheckCircle size={12} /> {paidCharges} pagas
                                </span>
                                <span className="text-amber-500 flex items-center gap-1 text-xs font-semibold">
                                    <AlertTriangle size={12} /> {pendingCharges} pendentes
                                </span>
                                <span className="text-blue-400 flex items-center gap-1 text-xs font-semibold">
                                    <BarChart3 size={12} /> {conversionRate}% conversão
                                </span>
                            </div>
                        )
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        className="card card-glow stat-card"
                        whileHover={{ y: -2 }}
                    >
                        <div className="stat-card-top">
                            <div className="stat-card-label">{stat.label}</div>
                            <div className="stat-icon-ring" style={{ background: stat.bg, color: stat.color }}>
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <div className="stat-value">{stat.value}</div>
                        {stat.sub && <div className="stat-sub">{stat.sub}</div>}
                    </motion.div>
                ))}
            </div>

            {/* CHART + TRANSACTIONS */}
            <div className="dash-grid">
                {/* Chart */}
                <div className="card dash-panel">
                    <div className="chart-header-row">
                        <div>
                            <div className="chart-total-label">Receita Total</div>
                            <div className="chart-total-value">{formatBRL(chartTotal)}</div>
                        </div>
                        <div className="chart-period-switcher">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`chart-period-btn ${chartPeriod === opt.value ? 'active' : ''}`}
                                    onClick={() => setChartPeriod(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="dash-chart-box">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={chartPeriod === 'today' || chartPeriod === 'yesterday' ? 32 : 18}
                                    height={28}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                                    width={50}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(142, 76%, 36%)', strokeWidth: 2, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(142, 76%, 36%)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                    activeDot={{
                                        r: 7,
                                        strokeWidth: 3,
                                        fill: 'hsl(142, 76%, 36%)',
                                        stroke: 'hsl(var(--card))',
                                        style: { filter: 'drop-shadow(0 0 6px hsl(142 76% 36% / 0.5))' }
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card dash-activity">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="section-title flex items-center gap-2">
                            <Activity size={16} className="text-[hsl(var(--primary))]" />
                            Atividade Recente
                        </h3>
                        <button className="btn btn-ghost text-xs font-semibold h-8 px-2" onClick={() => navigate('/transactions')}>
                            Ver tudo <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="tx-empty-card h-full">
                                <div className="tx-empty-icon">
                                    <Activity size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                </div>
                                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Sem movimentações</p>
                                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Suas transações aparecerão aqui.</p>
                            </div>
                        ) : (
                            <div className="tx-list">
                                <AnimatePresence>
                                    {transactions.map((tx, i) => (
                                        <motion.div
                                            key={tx.id}
                                            className="tx-item"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => navigate('/transactions')}
                                        >
                                            <TxIcon type={tx.type} />
                                            <div className="tx-info">
                                                <div className="tx-label">{(tx.description || tx.type).replace(/\s*\(taxa R\$[\d.,]+ descontada\)/i, '')}</div>
                                                <div className="tx-meta">
                                                    <span className="tx-date">{formatDateTime(tx.created_at)}</span>
                                                    <TxTypeLabel type={tx.type} />
                                                </div>
                                            </div>
                                            <div className="tx-amount" style={{ color: tx.type === 'withdrawal' ? 'hsl(0 84% 55%)' : 'hsl(142 76% 40%)' }}>
                                                {tx.type === 'withdrawal' ? '-' : '+'}{formatBRL(Math.abs(tx.amount))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* INTEGRATION STATUS */}
            <div className="card" style={{ padding: 24 }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="section-title flex items-center gap-2">
                        <Link2 size={16} className="text-[hsl(var(--primary))]" />
                        Integrações
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            name: 'Gateway Woovi',
                            desc: 'Processamento de pagamentos PIX',
                            icon: Globe,
                            color: 'hsl(142 76% 36%)',
                            bg: 'hsl(142 76% 36% / 0.1)',
                            status: 'Ativo',
                            connected: true,
                            to: '/acquirers',
                        },
                        {
                            name: 'API Keys & Webhooks',
                            desc: 'Chaves, permissões e eventos',
                            icon: KeyRound,
                            color: 'hsl(217 91% 60%)',
                            bg: 'hsl(217 91% 60% / 0.1)',
                            status: 'Gerenciar',
                            connected: true,
                            to: '/api-keys',
                        },
                        {
                            name: 'Documentação',
                            desc: 'Guias e exemplos em 8 linguagens',
                            icon: BookOpen,
                            color: 'hsl(262 83% 58%)',
                            bg: 'hsl(262 83% 58% / 0.1)',
                            status: 'Ver docs',
                            connected: true,
                            to: '/docs',
                        },
                    ].map((integration, i) => (
                        <motion.div
                            key={i}
                            className="card card-glow integration-card"
                            whileHover={{ y: -2, borderColor: 'hsl(var(--primary) / 0.3)' }}
                            onClick={() => navigate(integration.to)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="integration-icon-ring" style={{ background: integration.bg, color: integration.color }}>
                                <integration.icon size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="integration-name">{integration.name}</div>
                                <div className="integration-desc">{integration.desc}</div>
                            </div>
                            <div className="integration-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="badge badge-green" style={{ fontSize: 10 }}>
                                    <span className="badge-dot" />
                                    {integration.status}
                                </span>
                                <ArrowRight size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
