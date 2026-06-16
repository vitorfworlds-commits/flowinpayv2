import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Ban, CheckCircle, DollarSign, Receipt, ArrowDownToLine, FileText, Key, X } from 'lucide-react';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

interface UserData {
    id: number; name: string; email: string; role: string; status: string;
    balance: string; balance_blocked: string; tax_id: string | null;
    phone: string | null; pix_key: string | null; created_at: string;
    charges_count: number; withdrawals_count: number; transactions_count: number; api_keys_count: number;
    kyc_documents: Array<{ status: string; created_at: string }>;
}

interface Item { id: number; [k: string]: any }

export default function AdminUserDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'charges' | 'transactions' | 'withdrawals'>('charges');
    const [items, setItems] = useState<Item[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [showBalanceModal, setShowBalanceModal] = useState(false);

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await api.get(`/admin/users/${id}`);
            setUser(data.user);
        } catch { toast.error('Erro ao carregar usuário.'); navigate('/admin/users'); }
        finally { setLoading(false); }
    }, [id, navigate]);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    const fetchTab = useCallback(async () => {
        if (!id) return;
        setTabLoading(true);
        try {
            const { data } = await api.get(`/admin/users/${id}/${tab}`, { params: { page, per_page: 10 } });
            setItems(data.data);
            setLastPage(data.last_page);
        } catch { toast.error('Erro ao carregar dados.'); }
        finally { setTabLoading(false); }
    }, [id, tab, page]);

    useEffect(() => { fetchTab(); }, [fetchTab]);
    useEffect(() => { setPage(1); }, [tab]);

    const handleToggleBlock = async () => {
        if (!user) return;
        const action = user.status === 'blocked' ? 'unblock' : 'block';
        const msg = action === 'block' ? 'bloquear' : 'desbloquear';
        if (!confirm(`Tem certeza que deseja ${msg} ${user.name}?`)) return;
        try {
            await api.post(`/admin/users/${id}/${action}`);
            toast.success(action === 'block' ? 'Usuário bloqueado' : 'Usuário desbloqueado');
            fetchUser();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Erro.'); }
    };

    if (loading) return <LoadingSpinner fullPage />;
    if (!user) return null;

    const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const kycStatus = user.kyc_documents?.[0]?.status || 'Nenhum';

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/users')} style={{ marginBottom: 16 }}>
                <ArrowLeft size={14} /> Voltar
            </button>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'hsl(142 76% 36% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'hsl(142 76% 36%)' }}>
                        {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{user.name}</h2>
                        <div style={{ fontSize: 13, color: 'var(--muted-foreground)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span>{user.email}</span>
                            {user.tax_id && <span>CPF: {user.tax_id}</span>}
                            {user.phone && <span>Tel: {user.phone}</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${user.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                            <span className="badge-dot" />{user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                        <StatusBadge status={user.status} />
                        <span className={`badge ${kycStatus === 'approved' ? 'badge-green' : kycStatus === 'rejected' ? 'badge-red' : 'badge-amber'}`}>
                            <span className="badge-dot" />KYC: {kycStatus === 'approved' ? 'Aprovado' : kycStatus === 'rejected' ? 'Rejeitado' : kycStatus === 'pending' ? 'Pendente' : 'Nenhum'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {user.role !== 'admin' && (
                            <button className={`btn btn-sm ${user.status === 'blocked' ? 'btn-primary' : 'btn-secondary'}`} onClick={handleToggleBlock}>
                                {user.status === 'blocked' ? <><CheckCircle size={14} /> Desbloquear</> : <><Ban size={14} /> Bloquear</>}
                            </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => setShowBalanceModal(true)}>
                            <DollarSign size={14} /> Ajustar Saldo
                        </button>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { icon: DollarSign, label: 'Saldo disponível', value: formatBRL(Math.max(0, parseFloat(user.balance) - parseFloat(user.balance_blocked || '0'))), color: 'hsl(142 76% 36%)' },
                    { icon: Receipt, label: 'Cobranças', value: String(user.charges_count), color: 'hsl(217 91% 60%)' },
                    { icon: ArrowDownToLine, label: 'Saques', value: String(user.withdrawals_count), color: 'hsl(38 92% 50%)' },
                    { icon: FileText, label: 'Transações', value: String(user.transactions_count), color: 'hsl(262 83% 58%)' },
                ].map((s, i) => (
                    <div key={i} className="card card-glow kpi-card">
                        <div className="kpi-icon" style={{ background: `${s.color} / 0.12` }}>
                            <s.icon size={20} style={{ color: s.color }} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-title">{s.label}</div>
                            <div className="kpi-value">{s.value}</div>
                        </div>
                    </div>
                ))}
            </motion.div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {([['charges', 'Cobranças'], ['transactions', 'Transações'], ['withdrawals', 'Saques']] as const).map(([key, label]) => (
                    <button key={key} className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="table-wrap">
                <div className="table-scroll">
                    <table className="table">
                        <thead>
                            <tr>
                                {tab === 'charges' && <><th>ID</th><th>Descrição</th><th>Valor</th><th>Status</th><th className="hide-mobile">Gateway</th><th>Data</th></>}
                                {tab === 'transactions' && <><th>ID</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th className="hide-mobile">Saldo Antes</th><th className="hide-mobile">Saldo Depois</th><th>Data</th></>}
                                {tab === 'withdrawals' && <><th>ID</th><th>Valor</th><th>Taxa</th><th>Líquido</th><th>Status</th><th className="hide-mobile">PIX</th><th>Data</th></>}
                            </tr>
                        </thead>
                        <tbody>
                            {tabLoading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--muted-foreground)' }}>Nenhum registro</td></tr>
                            ) : items.map((item) => (
                                <tr key={item.id}>
                                    {tab === 'charges' && <>
                                        <td style={{ fontSize: 13 }}>#{item.id}</td>
                                        <td>{item.description || '—'}</td>
                                        <td style={{ fontWeight: 600 }}>{formatBRL(item.value)}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                        <td className="hide-mobile" style={{ fontSize: 13 }}>{item.acquirer?.name || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{formatDateTime(item.created_at)}</td>
                                    </>}
                                    {tab === 'transactions' && <>
                                        <td style={{ fontSize: 13 }}>#{item.id}</td>
                                        <td><span className="badge badge-blue">{item.type}</span></td>
                                        <td style={{ fontSize: 13 }}>{item.description || '—'}</td>
                                        <td style={{ fontWeight: 600, color: item.amount >= 0 ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)' }}>
                                            {item.amount >= 0 ? '+' : ''}{formatBRL(item.amount)}
                                        </td>
                                        <td className="hide-mobile" style={{ fontSize: 13 }}>{formatBRL(item.balance_before)}</td>
                                        <td className="hide-mobile" style={{ fontSize: 13 }}>{formatBRL(item.balance_after)}</td>
                                        <td style={{ fontSize: 13 }}>{formatDateTime(item.created_at)}</td>
                                    </>}
                                    {tab === 'withdrawals' && <>
                                        <td style={{ fontSize: 13 }}>#{item.id}</td>
                                        <td style={{ fontWeight: 600 }}>{formatBRL(item.value)}</td>
                                        <td style={{ fontSize: 13 }}>{formatBRL(item.fee_value)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatBRL(item.net_value)}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                        <td className="hide-mobile" style={{ fontSize: 13 }}>{item.pix_key || '—'}</td>
                                        <td style={{ fontSize: 13 }}>{formatDateTime(item.created_at)}</td>
                                    </>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {lastPage > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
                    {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                        const p = i + 1;
                        return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                    })}
                    {lastPage > 5 && <span style={{ padding: '0 8px' }}>...</span>}
                    {lastPage > 5 && <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => setPage(lastPage)}>{lastPage}</button>}
                    <button className="page-btn" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>→</button>
                </div>
            )}

            {showBalanceModal && (
                <AdjustBalanceModal userId={user.id} userName={user.name} onClose={() => setShowBalanceModal(false)} onSaved={fetchUser} />
            )}
        </div>
    );
}

function AdjustBalanceModal({ userId, userName, onClose, onSaved }: { userId: number; userName: string; onClose: () => void; onSaved: () => void }) {
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
            onSaved(); onClose();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao ajustar saldo.'); }
        finally { setSubmitting(false); }
    };

    return (
        <Modal open={true} onClose={onClose} title={`Ajustar Saldo — ${userName}`} maxWidth="480px">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                    <label className="input-label">Valor (R$)</label>
                    <input className="input" type="number" step="0.01" placeholder="Positivo = crédito, negativo = débito" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label className="input-label">Motivo</label>
                    <textarea className="input" rows={3} placeholder="Descreva o motivo do ajuste..." value={reason} onChange={e => setReason(e.target.value)} required style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
                    {submitting ? <><div className="spinner-ring" style={{ width: 14, height: 14 }} /> Salvando...</> : 'Confirmar Ajuste'}
                </button>
            </form>
        </Modal>
    );
}
