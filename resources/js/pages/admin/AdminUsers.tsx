import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Ban, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatBRL, formatDate } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import toast from 'react-hot-toast';

interface UserRow {
    id: number;
    name: string;
    email: string;
    tax_id: string | null;
    role: string;
    status: string;
    balance: string;
    balance_blocked: string;
    charges_count: number;
    withdrawals_count: number;
    transactions_count: number;
    created_at: string;
}

interface PaginatedResponse {
    data: UserRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function AdminUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: 15 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            if (statusFilter) params.status = statusFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const { data } = await api.get<PaginatedResponse>('/admin/users', { params });
            setUsers(data.data);
            setTotal(data.total);
            setLastPage(data.last_page);
        } catch { toast.error('Erro ao carregar usuários.'); }
        finally { setLoading(false); }
    }, [page, search, roleFilter, statusFilter, startDate, endDate]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, startDate, endDate]);

    const handleToggleBlock = async (userId: number, currentStatus: string) => {
        const action = currentStatus === 'blocked' ? 'unblock' : 'block';
        const msg = action === 'block' ? 'bloquear' : 'desbloquear';
        if (!confirm(`Tem certeza que deseja ${msg} este usuário?`)) return;
        try {
            await api.post(`/admin/users/${userId}/${action}`);
            toast.success(action === 'block' ? 'Usuário bloqueado' : 'Usuário desbloqueado');
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao alterar status.');
        }
    };

    const clearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
    };

    const hasFilters = search || roleFilter || statusFilter || startDate || endDate;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div>
                        <h1 className="dashboard-header-title">Usuários</h1>
                        <p className="dashboard-header-subtitle">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div className="input-with-icon" style={{ flex: '1 1 250px' }}>
                    <Search size={16} className="input-icon" />
                    <input
                        className="input"
                        placeholder="Buscar por nome, email ou CPF..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select className="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 140 }}>
                    <option value="">Todas funções</option>
                    <option value="admin">Admin</option>
                    <option value="user">Usuário</option>
                </select>
                <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 140 }}>
                    <option value="">Todos status</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="pending">Pendente</option>
                    <option value="blocked">Bloqueado</option>
                </select>
                <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: 150 }} title="Data início" />
                <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: 150 }} title="Data fim" />
                {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Limpar</button>}
            </div>

            <div className="table-wrap">
                <div className="table-scroll">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th className="hide-mobile">CPF</th>
                                <th>Função</th>
                                <th>Status</th>
                                <th className="hide-mobile">Saldo</th>
                                <th className="hide-mobile">Cobranças</th>
                                <th className="hide-mobile">Criado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={9}><EmptyState icon={Users} title="Nenhum usuário encontrado" description={hasFilters ? 'Tente ajustar os filtros.' : 'Nenhum usuário cadastrado.'} /></td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${u.id}`)}>
                                    <td><span style={{ fontWeight: 600 }}>{u.name}</span></td>
                                    <td style={{ fontSize: 13 }}>{u.email}</td>
                                    <td className="hide-mobile" style={{ fontSize: 13 }}>{u.tax_id || '—'}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-amber' : 'badge-blue'}`}>
                                            <span className="badge-dot" />
                                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                                        </span>
                                    </td>
                                    <td><StatusBadge status={u.status} /></td>
                                    <td className="hide-mobile" style={{ fontWeight: 600 }}>{formatBRL(Math.max(0, parseFloat(u.balance) - parseFloat(u.balance_blocked || '0')))}</td>
                                    <td className="hide-mobile">{u.charges_count}</td>
                                    <td className="hide-mobile" style={{ fontSize: 13 }}>{formatDate(u.created_at)}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        {u.role !== 'admin' && (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                title={u.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                                                onClick={() => handleToggleBlock(u.id, u.status)}
                                            >
                                                {u.status === 'blocked' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                            </button>
                                        )}
                                    </td>
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
