import { useState, useEffect, useCallback } from 'react';
import { Search, X, Shield, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';

interface KycDoc {
    id: number; user_id: number; status: string;
    rg_frente_path: string; rg_frente_name: string;
    rg_verso_path: string; rg_verso_name: string;
    selfie_path: string; selfie_name: string;
    rejection_reason: string | null; reviewed_at: string | null;
    created_at: string;
    user: { id: number; name: string; email: string; tax_id: string | null; phone: string | null } | null;
}

export default function AdminKyc() {
    const [items, setItems] = useState<KycDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [viewDoc, setViewDoc] = useState<KycDoc | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showReject, setShowReject] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 15 };
            if (statusFilter) params.status = statusFilter;
            const { data } = await api.get('/admin/kyc', { params });
            setItems(data.data); setTotal(data.total); setLastPage(data.last_page);
        } catch { toast.error('Erro ao carregar KYC.'); }
        finally { setLoading(false); }
    }, [page, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [statusFilter]);

    const handleApprove = async (id: number) => {
        if (!confirm('Aprovar este KYC?')) return;
        setActionLoading(true);
        try {
            await api.post(`/admin/kyc/${id}/approve`);
            toast.success('KYC aprovado!');
            setViewDoc(null);
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Erro.'); }
        finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!viewDoc || !rejectReason.trim()) { toast.error('Informe o motivo.'); return; }
        setActionLoading(true);
        try {
            await api.post(`/admin/kyc/${viewDoc.id}/reject`, { reason: rejectReason.trim() });
            toast.success('KYC rejeitado.');
            setViewDoc(null); setShowReject(false); setRejectReason('');
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Erro.'); }
        finally { setActionLoading(false); }
    };

    const imageUrl = (path: string) => `/storage/${path}`;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="dashboard-header"><div className="dashboard-header-top"><div>
                <h1 className="dashboard-header-title">KYC — Verificação de Identidade</h1>
                <p className="dashboard-header-subtitle">{total} documento{total !== 1 ? 's' : ''}</p>
            </div></div></div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160 }}>
                    <option value="">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="approved">Aprovados</option>
                    <option value="rejected">Rejeitados</option>
                </select>
            </div>

            <div className="table-wrap"><div className="table-scroll">
                <table className="table">
                    <thead><tr><th>ID</th><th>Usuário</th><th>Email</th><th>CPF</th><th>Status</th><th>Enviado em</th><th>Ações</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7}><EmptyState icon={Shield} title="Nenhum documento encontrado" description={statusFilter ? 'Tente trocar o filtro.' : ''} /></td></tr>
                        ) : items.map(d => (
                            <tr key={d.id}>
                                <td style={{ fontSize: 13 }}>#{d.id}</td>
                                <td style={{ fontWeight: 600 }}>{d.user?.name || '—'}</td>
                                <td style={{ fontSize: 13 }}>{d.user?.email || '—'}</td>
                                <td style={{ fontSize: 13 }}>{d.user?.tax_id || '—'}</td>
                                <td><StatusBadge status={d.status} /></td>
                                <td style={{ fontSize: 13 }}>{formatDateTime(d.created_at)}</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm" title="Ver documentos" onClick={() => setViewDoc(d)}>
                                        <Eye size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div></div>

            {lastPage > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
                    {Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
                        const p = i + 1;
                        return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                    })}
                    {lastPage > 7 && <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => setPage(lastPage)}>{lastPage}</button>}
                    <button className="page-btn" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>→</button>
                </div>
            )}

            {viewDoc && (
                <Modal open={true} onClose={() => { setViewDoc(null); setShowReject(false); setRejectReason(''); }} title={`KYC — ${viewDoc.user?.name || 'Usuário #' + viewDoc.user_id}`} maxWidth="700px">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                            <div style={{ fontSize: 13 }}><strong>Email:</strong> {viewDoc.user?.email}</div>
                            <div style={{ fontSize: 13 }}><strong>CPF:</strong> {viewDoc.user?.tax_id || '—'}</div>
                            <div style={{ fontSize: 13 }}><strong>Telefone:</strong> {viewDoc.user?.phone || '—'}</div>
                            <div style={{ fontSize: 13 }}><strong>Status:</strong> <StatusBadge status={viewDoc.status} /></div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {[
                                { label: 'RG Frente', path: viewDoc.rg_frente_path },
                                { label: 'RG Verso', path: viewDoc.rg_verso_path },
                                { label: 'Selfie', path: viewDoc.selfie_path },
                            ].map(img => (
                                <div key={img.label}>
                                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted-foreground)' }}>{img.label}</div>
                                    <a href={imageUrl(img.path)} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={imageUrl(img.path)}
                                            alt={img.label}
                                            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                                        />
                                    </a>
                                </div>
                            ))}
                        </div>

                        {viewDoc.rejection_reason && (
                            <div style={{ padding: 12, background: 'hsl(0 84% 60% / 0.1)', borderRadius: 8, fontSize: 13 }}>
                                <strong>Motivo da rejeição:</strong> {viewDoc.rejection_reason}
                            </div>
                        )}

                        {viewDoc.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleApprove(viewDoc.id)} disabled={actionLoading}>
                                    <CheckCircle size={14} /> Aprovar
                                </button>
                                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReject(true)} disabled={actionLoading}>
                                    <XCircle size={14} /> Rejeitar
                                </button>
                            </div>
                        )}

                        {showReject && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, background: 'hsl(var(--muted) / 0.3)', borderRadius: 8 }}>
                                <div className="input-group">
                                    <label className="input-label">Motivo da rejeição</label>
                                    <textarea className="input" rows={3} placeholder="Descreva o motivo..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} required style={{ resize: 'vertical' }} />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { setShowReject(false); setRejectReason(''); }}>Cancelar</button>
                                    <button className="btn btn-primary btn-sm" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
                                        {actionLoading ? 'Enviando...' : 'Confirmar Rejeição'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
