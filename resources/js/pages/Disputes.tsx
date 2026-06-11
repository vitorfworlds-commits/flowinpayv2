import { useState, useEffect, useCallback } from 'react';
import {
  Search, X, ChevronLeft, ChevronRight, RefreshCw,
  ShieldAlert, Clock, CheckCircle, AlertTriangle, Eye,
  Ban, DollarSign, FileText, Scale,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';

interface Dispute {
  id: number;
  charge_id: number | null;
  external_id: string | null;
  type: string;
  status: string;
  amount: number;
  reason: string | null;
  description: string | null;
  evidence: string | null;
  resolution: string | null;
  acquirer: string | null;
  due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  auto_defense?: boolean;
  evidence_sent_at?: string | null;
  charge?: { id: number; correlation_id: string } | null;
}

interface PaginatedResponse {
  data: Dispute[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface DisputeStats {
  total: number;
  open_count: number;
  review_count: number;
  resolved_count: number;
  rejected_count: number;
  total_amount: number;
  pending_amount: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Aberta' },
  { value: 'under_review', label: 'Em análise' },
  { value: 'accepted', label: 'Aceita' },
  { value: 'rejected', label: 'Rejeitada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'resolved', label: 'Resolvida' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'med', label: 'MED' },
  { value: 'chargeback', label: 'Chargeback' },
];

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  open: { label: 'Aberta', badge: 'badge-amber', dot: 'bg-amber-500' },
  under_review: { label: 'Em análise', badge: 'badge-blue', dot: 'bg-blue-500' },
  accepted: { label: 'Aceita', badge: 'badge-green', dot: 'bg-green-500' },
  rejected: { label: 'Rejeitada', badge: 'badge-red', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelada', badge: 'badge-muted', dot: 'bg-gray-400' },
  resolved: { label: 'Resolvida', badge: 'badge-green', dot: 'bg-green-500' },
};

const TYPE_MAP: Record<string, { label: string; badge: string }> = {
  med: { label: 'MED', badge: 'badge-amber' },
  chargeback: { label: 'Chargeback', badge: 'badge-red' },
};

const renderStatus = (status: string) => {
  const s = STATUS_MAP[status] || STATUS_MAP.open;
  return (
    <span className={`badge ${s.badge}`}>
      <span className={`badge-dot ${s.dot}`} />
      {s.label}
    </span>
  );
};

const renderType = (type: string) => {
  const t = TYPE_MAP[type] || TYPE_MAP.other;
  return <span className={`badge ${t.badge}`}>{t.label}</span>;
};

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [stats, setStats] = useState<DisputeStats>({ total: 0, open_count: 0, review_count: 0, resolved_count: 0, rejected_count: 0, total_amount: 0, pending_amount: 0 });

  const [showDetail, setShowDetail] = useState(false);
  const [detailDispute, setDetailDispute] = useState<Dispute | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchDisputes = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (dateStart) params.date_start = dateStart;
      if (dateEnd) params.date_end = dateEnd;
      const { data } = await api.get('/disputes', { params });
      const res: PaginatedResponse = data;
      setDisputes(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error('Erro ao carregar contestações');
    } finally { setLoading(false); }
  }, [search, statusFilter, typeFilter, dateStart, dateEnd]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/disputes/stats');
      setStats(data || { total: 0, open_count: 0, review_count: 0, resolved_count: 0, rejected_count: 0, total_amount: 0, pending_amount: 0 });
    } catch {}
  }, []);

  useEffect(() => { fetchDisputes(1); fetchStats(); }, [fetchDisputes, fetchStats]);

  const openDetail = async (id: number) => {
    setDetailLoading(true); setShowDetail(true);
    try {
      const { data } = await api.get(`/disputes/${id}`);
      setDetailDispute(data);
    } catch {
      toast.error('Erro ao carregar detalhes'); setShowDetail(false);
    } finally { setDetailLoading(false); }
  };

  const handleCancel = async () => {
    if (!detailDispute) return;
    setCancelling(true);
    try {
      await api.post(`/disputes/${detailDispute.id}/cancel`);
      toast.success('Contestação cancelada');
      setDetailDispute({ ...detailDispute, status: 'cancelled' });
      fetchDisputes(page);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar');
    } finally { setCancelling(false); }
  };

  const hasFilters = search || statusFilter || typeFilter || dateStart || dateEnd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1 className="dashboard-header-title">Contestações</h1>
            <p className="dashboard-header-subtitle">
              Acompanhe chargebacks, disputas e reclamações. Filtre por período, status ou tipo.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="dashboard-refresh-btn" onClick={() => { fetchDisputes(page); fetchStats(); }}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS */}
      {stats && stats.total !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: String(stats.total), icon: Scale, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
            { label: 'Abertas', value: String(Number(stats.open_count) + Number(stats.review_count)), icon: AlertTriangle, color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
            { label: 'Resolvidas', value: String(stats.resolved_count), icon: CheckCircle, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
            { label: 'Valor em disputa', value: formatBRL(stats.pending_amount), icon: DollarSign, color: 'hsl(0 84% 55%)', bg: 'hsl(0 84% 60% / 0.1)' },
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '14px 18px', borderRadius: 'var(--radius)',
        background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      }}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="input-icon" size={16} />
          <input
            type="text"
            className="input input-with-icon"
            placeholder="Buscar por motivo, descrição ou ID externo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchDisputes(1)}
          />
        </div>
        <select className="select" style={{ minWidth: 140, width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="select" style={{ minWidth: 140, width: 'auto' }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" className="input" style={{ width: 'auto', minWidth: 0 }} value={dateStart} onChange={e => { setDateStart(e.target.value); setPage(1); }} />
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>até</span>
          <input type="date" className="input" style={{ width: 'auto', minWidth: 0 }} value={dateEnd} onChange={e => { setDateEnd(e.target.value); setPage(1); }} />
        </div>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setDateStart(''); setDateEnd(''); }}>
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Motivo</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th className="hide-mobile">Adquirente</th>
                <th className="hide-mobile">Prazo</th>
                <th>Data</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="spinner"><div className="spinner-ring" /></div></td></tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-container">
                      <div className="empty-icon"><ShieldAlert size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhuma contestação encontrada</p>
                      <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                        {hasFilters ? 'Tente ajustar os filtros' : 'Suas contestações aparecerão aqui'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                disputes.map(d => (
                  <tr key={d.id} className="cursor-pointer" onClick={() => openDetail(d.id)}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>#{d.id}</span>
                      {d.external_id && <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', marginTop: 2 }}>{d.external_id}</p>}
                    </td>
                    <td>{renderType(d.type)}</td>
                    <td>{renderStatus(d.status)}</td>
                    <td>
                      <p style={{ fontWeight: 500, color: 'hsl(var(--foreground))', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason || '---'}</p>
                      {d.description && <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</p>}
                    </td>
                    <td style={{ fontWeight: 700, textAlign: 'right', color: 'hsl(0 84% 55%)' }}>{formatBRL(d.amount)}</td>
                    <td className="hide-mobile"><span className="badge badge-muted" style={{ fontSize: 10 }}>{d.acquirer || '---'}</span></td>
                    <td className="hide-mobile" style={{ fontSize: 12, whiteSpace: 'nowrap', color: d.due_at && new Date(d.due_at) < new Date() ? 'hsl(0 84% 55%)' : 'hsl(var(--muted-foreground))' }}>
                      {d.due_at ? formatDateTime(d.due_at) : '---'}
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'hsl(var(--muted-foreground))' }}>{formatDateTime(d.created_at)}</td>
                    <td>
                      <button className="btn-icon" onClick={e => { e.stopPropagation(); openDetail(d.id); }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && disputes.length > 0 && (
          <div className="pagination">
            <span>{total} resultado{total !== 1 ? 's' : ''} — Página {page} de {lastPage}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchDisputes(page - 1); }}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const p = i + 1;
                return <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => { setPage(p); fetchDisputes(p); }}>{p}</button>;
              })}
              {lastPage > 5 && <span className="page-btn">...</span>}
              {lastPage > 5 && <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => { setPage(lastPage); fetchDisputes(lastPage); }}>{lastPage}</button>}
              <button className="page-btn" disabled={page >= lastPage} onClick={() => { setPage(page + 1); fetchDisputes(page + 1); }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => { setShowDetail(false); setDetailDispute(null); }}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Detalhe da contestação</h2>
                {detailDispute?.external_id && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', marginTop: 2 }}>ID externo: {detailDispute.external_id}</p>}
              </div>
              <button className="btn-icon" onClick={() => { setShowDetail(false); setDetailDispute(null); }}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {detailLoading ? (
                <div className="spinner"><div className="spinner-ring" /></div>
              ) : detailDispute ? (
                <div className="flex flex-col gap-5">
                  {/* Status + Actions */}
                  <div className="flex items-center justify-between">
                    {renderStatus(detailDispute.status)}
                    <div className="flex items-center gap-2">
                      {detailDispute.auto_defense && detailDispute.evidence_sent_at && (
                        <span className="badge badge-green" style={{ fontSize: 10 }}>
                          <CheckCircle size={10} /> Defesa enviada automaticamente em {formatDateTime(detailDispute.evidence_sent_at)}
                        </span>
                      )}
                      {detailDispute.status === 'open' && (
                        <button className="btn btn-destructive btn-sm" disabled={cancelling} onClick={handleCancel}>
                          <Ban size={14} /> {cancelling ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Type + Amount */}
                  <div className="flex items-center justify-between">
                    {renderType(detailDispute.type)}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>Valor em disputa</p>
                      <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'hsl(0 84% 55%)' }}>{formatBRL(detailDispute.amount)}</p>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                    {[
                      { label: 'ID', value: `#${detailDispute.id}`, mono: true },
                      { label: 'Tipo', value: TYPE_MAP[detailDispute.type]?.label || detailDispute.type },
                      detailDispute.reason ? { label: 'Motivo', value: detailDispute.reason } : null,
                      detailDispute.description ? { label: 'Descrição', value: detailDispute.description } : null,
                      detailDispute.acquirer ? { label: 'Adquirente', value: detailDispute.acquirer } : null,
                      detailDispute.charge ? { label: 'Cobrança', value: `#${detailDispute.charge.id}`, mono: true } : null,
                      { label: 'Criado em', value: formatDateTime(detailDispute.created_at) },
                      detailDispute.due_at ? { label: 'Prazo', value: formatDateTime(detailDispute.due_at), highlight: new Date(detailDispute.due_at) < new Date() } : null,
                      detailDispute.resolved_at ? { label: 'Resolvido em', value: formatDateTime(detailDispute.resolved_at) } : null,
                      detailDispute.resolution ? { label: 'Resolução', value: detailDispute.resolution } : null,
                    ].filter(Boolean).map((row: any, i, arr) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '11px 16px',
                        background: i % 2 === 0 ? 'hsl(var(--muted) / 0.3)' : 'transparent',
                        borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                      }}>
                        <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{row.label}</span>
                        <span style={{
                          fontSize: 12, fontWeight: row.highlight ? 600 : 500,
                          color: row.highlight ? 'hsl(0 84% 55%)' : row.mono ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
                          fontFamily: row.mono ? 'monospace' : 'inherit',
                          textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all',
                        }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
