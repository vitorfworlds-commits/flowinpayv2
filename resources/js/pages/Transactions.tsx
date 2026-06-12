import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, ArrowDownLeft, ArrowUpRight, RefreshCw,
  ChevronLeft, ChevronRight, Receipt, TrendingUp, TrendingDown,
  Percent, FileText, Calendar, ArrowLeftRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';

interface Transaction {
  id: number;
  type: string;
  amount: number | string;
  balance_before: number | string;
  balance_after: number | string;
  description: string;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

interface PaginatedResponse {
  data: Transaction[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'credit', label: 'Crédito' },
  { value: 'debit', label: 'Débito' },
  { value: 'fee', label: 'Taxa' },
  { value: 'withdrawal', label: 'Saque' },
  { value: 'refund', label: 'Reembolso' },
  { value: 'adjustment', label: 'Ajuste' },
];

const TYPE_MAP: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  credit: { label: 'Crédito', badge: 'badge-green', icon: <ArrowDownLeft size={12} /> },
  debit: { label: 'Débito', badge: 'badge-red', icon: <ArrowUpRight size={12} /> },
  fee: { label: 'Taxa', badge: 'badge-amber', icon: <RefreshCw size={12} /> },
  withdrawal: { label: 'Saque', badge: 'badge-purple', icon: <ArrowUpRight size={12} /> },
  refund: { label: 'Reembolso', badge: 'badge-blue', icon: <ArrowDownLeft size={12} /> },
  adjustment: { label: 'Ajuste', badge: 'badge-muted', icon: <RefreshCw size={12} /> },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const [stats, setStats] = useState({ credits: 0, debits: 0, fees: 0, count: 0 });

  const fetchTransactions = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: 20 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;
      const { data } = await api.get('/transactions', { params });
      const res: PaginatedResponse = data;
      setTransactions(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
      setTotal(res.total);

      setStats({
        credits: res.data.filter((t: Transaction) => Number(t.amount) > 0).reduce((s: number, t: Transaction) => s + Math.abs(Number(t.amount)), 0),
        debits: res.data.filter((t: Transaction) => Number(t.amount) < 0 && t.type !== 'fee').reduce((s: number, t: Transaction) => s + Math.abs(Number(t.amount)), 0),
        fees: res.data.filter((t: Transaction) => t.type === 'fee').reduce((s: number, t: Transaction) => s + Math.abs(Number(t.amount)), 0),
        count: res.total,
      });
    } catch {
      toast.error('Erro ao carregar extrato');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, dateStart, dateEnd]);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;
      const { data } = await api.get('/transactions/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Exportação concluída');
    } catch {
      toast.error('Erro ao exportar');
    }
  };

  const renderType = (type: string) => {
    const t = TYPE_MAP[type] || TYPE_MAP.adjustment;
    return (
      <span className={`badge ${t.badge}`}>
        {t.icon}
        {t.label}
      </span>
    );
  };

  const hasFilters = search || typeFilter || dateStart || dateEnd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1 className="dashboard-header-title">Extrato</h1>
            <p className="dashboard-header-subtitle">
              Histórico completo de movimentações, entradas, saídas e taxas da sua conta.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="dashboard-refresh-btn" onClick={() => fetchTransactions(page)}>
              <RefreshCw size={14} /> Atualizar
            </button>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} /> Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de registros', value: String(stats.count), icon: FileText, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
            { label: 'Entradas', value: formatBRL(stats.credits), icon: TrendingUp, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
            { label: 'Saídas', value: formatBRL(stats.debits), icon: TrendingDown, color: 'hsl(0 84% 55%)', bg: 'hsl(0 84% 60% / 0.1)' },
            { label: 'Taxas pagas', value: formatBRL(stats.fees), icon: Percent, color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
          ].map((stat, i) => (
            <div key={i} className="card card-glow stat-card">
              <div className="stat-card-top">
                <div className="stat-card-label">{stat.label}</div>
                <div className="stat-icon-ring" style={{ background: stat.bg, color: stat.color }}>
                  <stat.icon size={18} />
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* TOOLBAR */}
      <div className="filters-bar" style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 'var(--radius)',
        background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="input-icon" size={16} />
          <input
            type="text"
            className="input input-with-icon"
            placeholder="Buscar por descrição ou referência..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchTransactions(1)}
          />
        </div>
        <select
          className="select"
          style={{ minWidth: 140, width: 'auto' }}
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        >
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input"
            style={{ width: 'auto', minWidth: 0 }}
            value={dateStart}
            onChange={e => { setDateStart(e.target.value); setPage(1); }}
          />
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>até</span>
          <input
            type="date"
            className="input"
            style={{ width: 'auto', minWidth: 0 }}
            value={dateEnd}
            onChange={e => { setDateEnd(e.target.value); setPage(1); }}
          />
        </div>
        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setTypeFilter(''); setDateStart(''); setDateEnd(''); }}
          >
            Limpar
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th className="hide-mobile" style={{ textAlign: 'right' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="spinner"><div className="spinner-ring" /></div></td></tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-container">
                      <div className="empty-icon"><ArrowLeftRight size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhuma transação encontrada</p>
                      <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                        {hasFilters ? 'Tente ajustar os filtros' : 'Suas movimentações aparecerão aqui'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'hsl(var(--muted-foreground))' }}>
                      {formatDateTime(t.created_at)}
                    </td>
                    <td>{renderType(t.type)}</td>
                    <td>
                      <p style={{ fontWeight: 600, color: 'hsl(var(--foreground))', wordBreak: 'break-word' }}>
                        {(t.description || '---').replace(/\s*\(taxa R\$[\d.,]+ descontada\)/i, '')}
                      </p>
                      {t.reference_type && (
                        <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', marginTop: 2 }}>
                          {t.reference_type.replace(/.*\\/, '')}#{t.reference_id}
                        </p>
                      )}
                    </td>
                    <td style={{
                      fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right',
                      color: Number(t.amount) >= 0 ? 'hsl(142 76% 40%)' : 'hsl(0 84% 55%)',
                    }}>
                      {Number(t.amount) >= 0 ? '+' : ''}{formatBRL(Number(t.amount))}
                    </td>
                    <td className="hide-mobile" style={{ fontWeight: 600, textAlign: 'right', color: 'hsl(var(--foreground))' }}>
                      {formatBRL(Number(t.balance_after))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && transactions.length > 0 && (
          <div className="pagination">
            <span>{total} resultado{total !== 1 ? 's' : ''} — Página {page} de {lastPage}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchTransactions(page - 1); }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => { setPage(p); fetchTransactions(p); }}>
                    {p}
                  </button>
                );
              })}
              {lastPage > 5 && <span className="page-btn">...</span>}
              {lastPage > 5 && (
                <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => { setPage(lastPage); fetchTransactions(lastPage); }}>
                  {lastPage}
                </button>
              )}
              <button className="page-btn" disabled={page >= lastPage} onClick={() => { setPage(page + 1); fetchTransactions(page + 1); }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
