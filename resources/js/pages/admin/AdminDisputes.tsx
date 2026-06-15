import { useState, useEffect, useCallback } from 'react';
import { Search, X, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';

interface DisputeRow {
    id: number; external_id: string; type: string; status: string; amount: string;
    reason: string | null; description: string | null; due_at: string | null; created_at: string;
    user: { id: number; name: string; email: string } | null;
    charge: { id: number; correlation_id: string; value: string } | null;
}

const TYPE_LABELS: Record<string, string> = { chargeback: 'Chargeback', refund: 'Reembolso', fraud: 'Fraude' };

export default function AdminDisputes() {
    const [items, setItems] = useState<DisputeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const { data } = await api.get('/admin/disputes', { params });
            setItems(data.data); setTotal(data.total); setLastPage(data.last_page);
        } catch { toast.error('Erro ao carregar contestações.'); }
        finally { setLoading(false); }
    }, [page, search, statusFilter, typeFilter, startDate, endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, startDate, endDate]);

    const clearFilters = () => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setStartDate(''); setEndDate(''); };
    const hasFilters = search || statusFilter || typeFilter || startDate || endDate;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="dashboard-header"><div className="dashboard-header-top"><div>
                <h1 className="dashboard-header-title">Contestações</h1>
                <p className="dashboard-header-subtitle">{total} contestaç{total !== 1 ? 'ões' : 'ão'}</p>
            </div></div></div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div className="input-with-icon" style={{ flex: '1 1 250px' }}>
                    <Search size={16} className="input-icon" />
                    <input className="input" placeholder="Buscar por ID externo ou motivo..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 150 }}>
                    <option value="">Todos status</option>
                    <option value="open">Aberta</option>
                    <option value="under_review">Em análise</option>
                    <option value="accepted">Aceita</option>
                    <option value="won">Ganha</option>
                    <option value="lost">Perdida</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="expired">Expirada</option>
                </select>
                <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 140 }}>
                    <option value="">Todos tipos</option>
                    <option value="chargeback">Chargeback</option>
                    <option value="refund">Reembolso</option>
                    <option value="fraud">Fraude</option>
                </select>
                <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 150 }} />
                <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 150 }} />
                {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Limpar</button>}
            </div>

            <div className="table-wrap"><div className="table-scroll">
                <table className="table">
                    <thead><tr><th>ID</th><th>Usuário</th><th>Tipo</th><th>Valor</th><th>Motivo</th><th>Status</th><th>Prazo</th><th>Data</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={8}><EmptyState icon={ShieldAlert} title="Nenhuma contestação encontrada" /></td></tr>
                        ) : items.map(d => (
                            <tr key={d.id}>
                                <td style={{ fontSize: 13 }}>#{d.id}</td>
                                <td style={{ fontSize: 13 }}>{d.user?.name || '—'}</td>
                                <td><span className="badge badge-amber">{TYPE_LABELS[d.type] || d.type}</span></td>
                                <td style={{ fontWeight: 600 }}>{formatBRL(parseFloat(d.amount))}</td>
                                <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason || '—'}</td>
                                <td><StatusBadge status={d.status} /></td>
                                <td style={{ fontSize: 13 }}>{d.due_at ? formatDateTime(d.due_at) : '—'}</td>
                                <td style={{ fontSize: 13 }}>{formatDateTime(d.created_at)}</td>
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
        </div>
    );
}
