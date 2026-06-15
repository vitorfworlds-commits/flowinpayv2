import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Ban, CheckCircle, Wallet, Receipt, ArrowDownToLine, FileText, Key, Shield, Settings } from 'lucide-react';
import api from '@/lib/api';
import { formatBRL, formatDateTime, formatDate } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';

interface UserDetail {
    id: number;
    name: string;
    email: string;
    tax_id: string | null;
    phone: string | null;
    role: string;
    status: string;
    balance: string;
    balance_blocked: string;
    pix_key: string | null;
    created_at: string;
    charges_count: number;
    withdrawals_count: number;
    transactions_count: number;
    api_keys_count: number;
    kyc_documents: { status: string; created_at: string }[];
}

interface TabItem { id: string; label: string; icon: typeof Receipt }

const TABS: TabItem[] = [
    { id: 'charges', label: 'Cobranças', icon: Receipt },
    { id: 'transactions', label: 'Transações', icon: FileText },
    { id: 'withdrawals', label: 'Saques', icon: ArrowDownToLine },
];

export default function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('charges');
    const [tabData, setTabData] = useState<any[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [tabPage, setTabPage] = useState(1);
    const [tabLastPage, setTabLastPage] = useState(1);
    const [showBalanceModal, setShowBalanceModal] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await api.get(`/admin/users/${id}`);
            setUser(data.user);
        } catch { toast.error('Erro ao carregar usuário.'); navigate('/admin/users'); }
        finally { setLoading(false); }
    }, [id, navigate]);

    const fetchTab = useCallback(async () => {
        if (!id) return;
        setTabLoading(true);
        try {
            const { data } = await api.get(`/admin/users/${id}/${activeTab}`, { params: { page: tabPage, per_page: 10 } });
            setTabData(data.data);
            setTabLastPage(data.last_page);
        } catch { setTabData([]); }
        finally { setTabLoading(false); }
    }, [id, activeTab, tabPage]);

    useEffect(() => { fetchUser(); }, [fetchUser]);
    useEffect(() => { setTabPage(1); fetchTab(); }, [activeTab, fetchTab]);
    useEffect(() => { fetchTab(); }, [tabPage, fetchTab]);

    const handleToggleBlock = async () => {
        if (!user) return;
        const action = user.status === 'blocked' ? 'unblock' : 'block';
        const msg = action === 'block' ? 'bloquear' : 'desbloquear';
        if (!confirm(`Tem certeza que deseja ${msg} este usuário?`)) return;
        try {
            await api.post(`/admin/users/${user.id}/${action}`);
            toast.success(action === 'block' ? 'Usuário bloqueado' : 'Usuário desbloqueado');
            fetchUser();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao alterar status.');
        }
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!user) return null;

    const kycStatus = user.kyc_documents?.[0]?.status ?? 'Não enviado';

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/users')} style={{ marginBottom: 16 }}>
                <ArrowLeft size={14} /> Voltar
            </button>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 20,
                    }}>
                        {user.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{user.name}</h2>
                        <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                            {user.email}{user.tax_id ? ` • ${user.tax_id}` : ''}{user.phone ? ` • ${user.phone}` : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <span className={`badge ${user.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                                <span className="badge-dot" />{user.role === 'admin' ? 'Admin' : 'Usuário'}
                            </span>
                            <StatusBadge status={user.status} />
                            <span className={`badge ${kycStatus === 'approved' ? 'badge-green' : kycStatus === 'rejected' ? 'badge-red' : 'badge-muted'}`}>
                                <span className="badge-dot" />KYC: {kycStatus}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {user.role !== 'admin' && (
                            <button className={`btn btn-sm ${user.status === 'blocked' ? 'btn-primary' : 'btn-secondary'}`} onClick={handleToggleBlock}>
                                {user.status === 'blocked' ? <><CheckCircle size={14} /> Desbloquear</> : <><Ban size={14} /> Bloquear</>}
                            </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => setShowBalanceModal(true)}>
                            <Wallet size={14} /> Ajustar Saldo
                        </button>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { icon: Wallet, label: 'Saldo Disponível', value: formatBRL(parseFloat(user.balance)), color: 'hsl(142 76% 36%)' },
                    { icon: Shield, label: 'Saldo Bloqueado', value: formatBRL(parseFloat(user.balance_blocked)), color: 'hsl(0 84% 60%)' },
                    { icon: Receipt, label: 'Cobranças', value: String(user.charges_count), color: 'hsl(217 91% 60%)' },
                    { icon: ArrowDownToLine, label: 'Saques', value: String(user.withdrawals_count), color: 'hsl(262 83% 58%)' },
                    { icon: FileText, label: 'Transações', value: String(user.transactions_count), color: 'hsl(38 92% 50%)' },
                    { icon: Key, label: 'API Keys', value: String(user.api_keys_count), color: 'hsl(0 84% 60%)' },
                ].map((k, i) => (
                    <div key={i} className="card card-glow kpi-card">
                        <div className="kpi-icon" style={{ background: k.color.replace(')', ' / 0.12)').replace('hsl(', 'hsl(') }}>
                            <k.icon size={20} style={{ color: k.color }} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-title">{k.label}</div>
                            <div className="kpi-value">{k.value}</div>
                        </div>
                    </div>
                ))}
            </motion.div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid hsl(var(--border))', paddingBottom: 0 }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 13, fontWeight: 500,
                            background: 'none', border: 'none', cursor: 'pointer', borderBottom: '2px solid transparent',
                            color: activeTab === tab.id ? 'hsl(142 76% 36%)' : 'var(--muted-foreground)',
                            borderBottomColor: activeTab === tab.id ? 'hsl(142 76% 36%)' : 'transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="table-wrap">
                <div className="table-scroll">
                    <table className="table">
                        <thead>
                            {activeTab === 'charges' && (
                                <tr><th>ID</th><th>Correlation</th><th>Valor</th><th>Status</th><th>Data</th></tr>
                            )}
                            {activeTab === 'transactions' && (
                                <tr><th>ID</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Data</th></tr>
                            )}
                            {activeTab === 'withdrawals' && (
                                <tr><th>ID</th><th>Valor</th><th>Taxa</th><th>Líquido</th><th>Status</th><th>Data</th></tr>
                            )}
                        </thead>
                        <tbody>
                            {tabLoading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                            ) : tabData.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)' }}>Nenhum registro encontrado.</td></tr>
                            ) : activeTab === 'charges' ? tabData.map((c: any) => (
                                <tr key={c.id}>
                                    <td style={{ fontSize: 13 }}>{c.id}</td>
                                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{c.correlation_id?.slice(0, 12)}...</td>
                                    <td style={{ fontWeight: 600 }}>{formatBRL(parseFloat(c.value))}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td style={{ fontSize: 13 }}>{formatDate(c.created_at)}</td>
                                </tr>
                            )) : activeTab === 'transactions' ? tabData.map((t: any) => (
                                <tr key={t.id}>
                                    <td style={{ fontSize: 13 }}>{t.id}</td>
                                    <td style={{ fontSize: 13 }}>{t.type}</td>
                                    <td style={{ fontSize: 13 }}>{t.description}</td>
                                    <td style={{ fontWeight: 600, color: parseFloat(t.amount) >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)' }}>
                                        {parseFloat(t.amount) >= 0 ? '+' : ''}{formatBRL(parseFloat(t.amount))}
                                    </td>
                                    <td style={{ fontSize: 13 }}>{formatDate(t.created_at)}</td>
                                </tr>
                            )) : tabData.map((w: any) => (
                                <tr key={w.id}>
                                    <td style={{ fontSize: 13 }}>{w.id}</td>
                                    <td style={{ fontWeight: 600 }}>{formatBRL(parseFloat(w.value))}</td>
                                    <td style={{ fontSize: 13 }}>{formatBRL(parseFloat(w.fee_value))}</td>
                                    <td style={{ fontWeight: 600 }}>{formatBRL(parseFloat(w.net_value))}</td>
                                    <td><StatusBadge status={w.status} /></td>
                                    <td style={{ fontSize: 13 }}>{formatDate(w.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {tabLastPage > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={tabPage <= 1} onClick={() => setTabPage(tabPage - 1)}>←</button>
                    {Array.from({ length: Math.min(tabLastPage, 5) }, (_, i) => {
                        const p = i + 1;
                        return <button key={p} className={`page-btn ${p === tabPage ? 'active' : ''}`} onClick={() => setTabPage(p)}>{p}</button>;
                    })}
                    {tabLastPage > 5 && <button className={`page-btn ${tabLastPage === tabPage ? 'active' : ''}`} onClick={() => setTabPage(tabLastPage)}>{tabLastPage}</button>}
                    <button className="page-btn" disabled={tabPage >= tabLastPage} onClick={() => setTabPage(tabPage + 1)}>→</button>
                </div>
            )}

            {showBalanceModal && (
                <AdjustBalanceModal userId={user.id} onClose={() => setShowBalanceModal(false)} onSaved={() => { setShowBalanceModal(false); fetchUser(); }} />
            )}
        </div>
    );
}

function AdjustBalanceModal({ userId, onClose, onSaved }: { userId: number; onClose: () => void; onSaved: () => void }) {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) { toast.error('Informe o motivo.'); return; }
        if (!amount || parseFloat(amount) === 0) { toast.error('Informe um valor válido.'); return; }
        setSubmitting(true);
        try {
            await api.post(`/admin/users/${userId}/adjust-balance`, { amount: parseFloat(amount), reason: reason.trim() });
            toast.success('Saldo ajustado com sucesso!');
            onSaved();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao ajustar saldo.');
        } finally { setSubmitting(false); }
    };

    return (
        <Modal open={true} onClose={onClose} title="Ajustar Saldo" maxWidth="480px">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                    <label className="input-label">Valor (R$)</label>
                    <input
                        className="input"
                        type="number"
                        step="0.01"
                        placeholder="Positivo para crédito, negativo para débito"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">Motivo</label>
                    <textarea
                        className="input"
                        rows={3}
                        placeholder="Descreva o motivo do ajuste..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        style={{ resize: 'vertical' }}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><div className="spinner-ring" style={{ width: 14, height: 14 }} /> Salvando...</> : 'Confirmar Ajuste'}
                </button>
            </form>
        </Modal>
    );
}
