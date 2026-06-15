import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Receipt } from 'lucide-react';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';

interface ChargeRow {
    id: number; correlation_id: string; value: string; fee_value: string; status: string;
    description: string | null; created_at: string;
    user: { id: number; name: string; email: string } | null;
    acquirer: { id: number; name: string } | null;
}

export default function AdminCharges() {
    const navigate = useNavigate();
    const [items, setItems] = useState<ChargeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const { data } = await api.get('/admin/charges', { params });
            setItems(data.data); setTotal(data.total); setLastPage(data.last_page);
        } catch { toast.error('Erro ao carregar cobranças.'); }
        finally { setLoading(false); }
    }, [page, search, statusFilter, startDate, endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search, statusFilter, startDate, endDate]);

    const clearFilters = () => { setSearch(''); setStatusFilter(''); setStartDate(''); setEndDate(''); };
    const hasFilters = search || statusFilter || startDate || endDate;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div>
                        <h1 className="dashboard-header-title">Cobranças</h1>
                        <p className="dashboard-header-subtitle">{total} cobrança{total !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div className="input-with-icon" style={{ flex: '1 1 250px' }}>
                    <Search size={16} className="input-icon" />
                    <input className="input" placeholder="Buscar por descrição ou correlation..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
                    <option value="">Todos status</option>
                    <option value="active">Ativa</option>
                    <option value="paid">Paga</option>
                    <option value="expired">Expirada</option>
                    <option value="cancelled">Cancelada</option>
                </select>
                <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: 150 }} />
                <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: 150 }} />
                {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Limpar</button>}
            </div>

            <div className="table-wrap">
                <div className="table-scroll">
                    <table className="table">
                        <thead>
                            <tr><th>ID</th><th>Usuário</th><th>Descrição</th><th>Valor</th><th>Taxa</th><th>Gateway</th><th>Status</th><th>Data</th></tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={8}><EmptyState icon={Receipt} title="Nenhuma cobrança encontrada" /></td></tr>
                            ) : items.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontSize: 13 }}>#{c.id}</td>
                                    <td style={{ fontSize: 13 }}>{c.user?.name || '—'}</td>
                                    <td style={{ fontSize: 13 }}>{c.description || c.correlation_id?.slice(0, 16) + '...'}</td>
                                    <td style={{ fontWeight: 600 }}>{formatBRL(parseFloat(c.value))}</td>
                                    <td style={{ fontSize: 13 }}>{formatBRL(parseFloat(c.fee_value))}</td>
                                    <td style={{ fontSize: 13 }}>{c.acquirer?.name || '—'}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                    <td style={{ fontSize: 13 }}>{formatDateTime(c.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {lastPage > 1 && (
                <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
                    {Array.from({ length: Math.min(lastPage, 7) }, (_, i) => {
                        const p = i + 1;
                        return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                    })}
                    {lastPage > 7 && <span style={{ padding: '0 8px' }}>...</span>}
                    {lastPage > 7 && <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => setPage(lastPage)}>{lastPage}</button>}
                    <button className="page-btn" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>→</button>
                </div>
            )}
        </div>
    );
}
