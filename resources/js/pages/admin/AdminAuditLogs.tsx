import { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';

interface LogRow {
    id: number; user_id: number | null; action: string; subject_type: string | null;
    subject_id: number | null; old_values: Record<string, any> | null;
    new_values: Record<string, any> | null; metadata: Record<string, any> | null;
    ip_address: string | null; user_agent: string | null; created_at: string;
    user: { id: number; name: string; email: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
    user_blocked: 'hsl(0 84% 60%)',
    user_unblocked: 'hsl(142 76% 36%)',
    balance_adjusted: 'hsl(38 92% 50%)',
    kyc_approved: 'hsl(142 76% 36%)',
    kyc_rejected: 'hsl(0 84% 60%)',
    charge_created: 'hsl(217 91% 60%)',
    charge_cancelled: 'hsl(0 84% 60%)',
    withdrawal_requested: 'hsl(262 83% 58%)',
};

export default function AdminAuditLogs() {
    const [items, setItems] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expanded, setExpanded] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (actionFilter) params.action = actionFilter;
            if (userIdFilter) params.user_id = userIdFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const { data } = await api.get('/admin/audit-logs', { params });
            setItems(data.data); setTotal(data.total); setLastPage(data.last_page);
        } catch { toast.error('Erro ao carregar logs.'); }
        finally { setLoading(false); }
    }, [page, actionFilter, userIdFilter, startDate, endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [actionFilter, userIdFilter, startDate, endDate]);

    const clearFilters = () => { setActionFilter(''); setUserIdFilter(''); setStartDate(''); setEndDate(''); };
    const hasFilters = actionFilter || userIdFilter || startDate || endDate;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="dashboard-header"><div className="dashboard-header-top"><div>
                <h1 className="dashboard-header-title">Audit Logs</h1>
                <p className="dashboard-header-subtitle">{total} registro{total !== 1 ? 's' : ''}</p>
            </div></div></div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <select className="select" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ width: 200 }}>
                    <option value="">Todas ações</option>
                    <option value="user_blocked">Usuário bloqueado</option>
                    <option value="user_unblocked">Usuário desbloqueado</option>
                    <option value="balance_adjusted">Saldo ajustado</option>
                    <option value="kyc_approved">KYC aprovado</option>
                    <option value="kyc_rejected">KYC rejeitado</option>
                    <option value="charge_created">Cobrança criada</option>
                    <option value="charge_cancelled">Cobrança cancelada</option>
                    <option value="withdrawal_requested">Saque solicitado</option>
                </select>
                <input className="input" placeholder="User ID" value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)} style={{ width: 100 }} />
                <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 150 }} />
                <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 150 }} />
                {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Limpar</button>}
            </div>

            <div className="table-wrap"><div className="table-scroll">
                <table className="table">
                    <thead><tr><th>ID</th><th>Usuário</th><th>Ação</th><th>Subject</th><th>IP</th><th>Data</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6}><EmptyState icon={FileText} title="Nenhum log encontrado" /></td></tr>
                        ) : items.map(l => (
                            <>
                                <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                                    <td style={{ fontSize: 13 }}>#{l.id}</td>
                                    <td style={{ fontSize: 13 }}>{l.user?.name || `User #${l.user_id}` || '—'}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                                            fontSize: 11, fontWeight: 600, color: '#fff',
                                            background: ACTION_COLORS[l.action] || 'hsl(var(--muted-foreground))',
                                        }}>
                                            {l.action}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 13 }}>{l.subject_type ? `${l.subject_type.split('\\').pop()}#${l.subject_id}` : '—'}</td>
                                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{l.ip_address || '—'}</td>
                                    <td style={{ fontSize: 13 }}>{formatDateTime(l.created_at)}</td>
                                </tr>
                                {expanded === l.id && (
                                    <tr key={`${l.id}-detail`}>
                                        <td colSpan={6} style={{ padding: '12px 20px', background: 'hsl(var(--muted) / 0.15)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, fontSize: 12 }}>
                                                {l.old_values && (
                                                    <div>
                                                        <strong>Valores anteriores:</strong>
                                                        <pre style={{ margin: '4px 0', padding: 8, background: 'hsl(var(--card))', borderRadius: 6, overflow: 'auto', maxHeight: 120 }}>
                                                            {JSON.stringify(l.old_values, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {l.new_values && (
                                                    <div>
                                                        <strong>Novos valores:</strong>
                                                        <pre style={{ margin: '4px 0', padding: 8, background: 'hsl(var(--card))', borderRadius: 6, overflow: 'auto', maxHeight: 120 }}>
                                                            {JSON.stringify(l.new_values, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {l.metadata && (
                                                    <div>
                                                        <strong>Metadata:</strong>
                                                        <pre style={{ margin: '4px 0', padding: 8, background: 'hsl(var(--card))', borderRadius: 6, overflow: 'auto', maxHeight: 120 }}>
                                                            {JSON.stringify(l.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                            {l.user_agent && <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8 }}>UA: {l.user_agent}</div>}
                                        </td>
                                    </tr>
                                )}
                            </>
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
        </div>
    );
}
