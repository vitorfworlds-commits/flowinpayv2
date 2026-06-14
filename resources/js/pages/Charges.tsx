import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Eye, Copy, X, ChevronLeft, ChevronRight,
  Receipt, FileText, Download, CreditCard, CheckCircle,
  AlertTriangle, Clock, TrendingUp, Ban, ExternalLink, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface Charge {
  id: number;
  correlation_id: string;
  value: number | string;
  fee_value: number | string;
  fee_percent: number | string;
  status: string;
  description: string | null;
  customer_name?: string | null;
  br_code: string | null;
  payment_link_url: string | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
  acquirer?: { name: string; slug: string } | null;
}

interface PaginatedResponse {
  data: Charge[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'active', label: 'Ativa' },
  { value: 'paid', label: 'Paga' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'expired', label: 'Expirada' },
];

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Pendente', badge: 'badge-amber', dot: 'bg-amber-500' },
  active: { label: 'Pendente', badge: 'badge-amber', dot: 'bg-amber-500' },
  paid: { label: 'Paga', badge: 'badge-green', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelada', badge: 'badge-red', dot: 'bg-red-500' },
  expired: { label: 'Expirada', badge: 'badge-muted', dot: 'bg-gray-400' },
};

const renderStatus = (status: string) => {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span className={`badge ${s.badge}`}>
      <span className={`badge-dot ${s.dot}`} />
      {s.label}
    </span>
  );
};

export default function Charges() {
  const navigate = useNavigate();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createAmount, setCreateAmount] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCustomer, setCreateCustomer] = useState('');
  const [creating, setCreating] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailCharge, setDetailCharge] = useState<Charge | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // KPI stats from ALL charges (not just current page)
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, totalAmount: 0, conversionRate: 0 });

  const fetchCharges = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const { data } = await api.get('/charges', { params });
      const res: PaginatedResponse = data;
      setCharges(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
      setTotal(res.total);

      // Calc stats from current page data
      const paid = res.data.filter((c: Charge) => c.status === 'paid').length;
      const pending = res.data.filter((c: Charge) => ['pending', 'active'].includes(c.status)).length;
      const conversionDenom = paid + pending;
      setStats({
        total: res.total,
        paid,
        pending,
        totalAmount: res.data.reduce((s: number, c: Charge) => s + Number(c.value || 0), 0),
        conversionRate: conversionDenom > 0 ? Math.round((paid / conversionDenom) * 1000) / 10 : 0,
      });
    } catch {
      toast.error('Erro ao carregar cobranças');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, startDate, endDate]);

  useEffect(() => { fetchCharges(1); }, [fetchCharges]);

  const handleCreate = async () => {
    const amount = parseFloat(createAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!amount || amount <= 0) { toast.error('Informe um valor válido'); return; }
    setCreating(true);
    try {
      const payload: Record<string, any> = {
        value: amount,
        acquirer_id: 1,
        description: createDescription || undefined,
      };
      // Only send customer if we have enough data (Woovi requires email + tax_id/phone)
      if (createCustomer.trim()) {
        payload.customer_name = createCustomer.trim();
      }
      const { data } = await api.post('/charges', payload);
      toast.success('Cobrança criada com sucesso');
      setShowCreate(false);
      setCreateAmount(''); setCreateDescription(''); setCreateCustomer('');
      fetchCharges(1);
      if (data?.charge?.id) openDetail(data.charge.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar cobrança');
    } finally { setCreating(false); }
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true); setShowDetail(true);
    try {
      const { data } = await api.get(`/charges/${id}`);
      setDetailCharge(data.charge || data);
    } catch {
      toast.error('Erro ao carregar detalhes'); setShowDetail(false);
    } finally { setDetailLoading(false); }
  };

  const handleCancel = async () => {
    if (!detailCharge) return;
    setCancelling(true);
    try {
      await api.post(`/charges/${detailCharge.id}/cancel`);
      toast.success('Cobrança cancelada');
      setDetailCharge({ ...detailCharge, status: 'cancelled' });
      fetchCharges(page);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar');
    } finally { setCancelling(false); }
  };

  const copyPix = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copiado!'); }
    catch { toast.error('Erro ao copiar'); }
  };

  const parseAmount = (v: string) => {
    const n = parseFloat(v.replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const hasFilters = search || statusFilter || startDate || endDate;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1 className="dashboard-header-title">Cobranças</h1>
            <p className="dashboard-header-subtitle">
              Crie, acompanhe e gerencie todas as suas cobranças PIX em um só lugar.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ opacity: 0.6 }}>
              <Download size={16} /> Exportar
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Nova cobrança
            </button>
          </div>
        </div>
      </div>

      {/* KPI STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: String(stats.total), icon: Receipt, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
          { label: 'Pagas', value: String(stats.paid), icon: CheckCircle, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
          { label: 'Pendentes', value: String(stats.pending), icon: AlertTriangle, color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
          { label: 'Volume', value: formatBRL(stats.totalAmount), icon: TrendingUp, color: 'hsl(262 83% 58%)', bg: 'hsl(262 83% 58% / 0.1)' },
          { label: 'Conversão', value: `${stats.conversionRate}%`, icon: Activity, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
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
            placeholder="Buscar por ID, descrição ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCharges(1)}
          />
        </div>
        <select
          className="select"
          style={{ minWidth: 160, width: 'auto' }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" className="input" style={{ width: 140, fontSize: 12 }} value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} placeholder="De" />
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>até</span>
          <input type="date" className="input" style={{ width: 140, fontSize: 12 }} value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} placeholder="Até" />
        </div>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setStartDate(''); setEndDate(''); }}>
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
                <th>Cliente</th>
                <th>Valor</th>
                <th>Taxa</th>
                <th>Líquido</th>
                <th>Status</th>
                <th className="hide-mobile">Adquirente</th>
                <th>Data</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9}><div className="spinner"><div className="spinner-ring" /></div></td></tr>
              ) : charges.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-container">
                      <div className="empty-icon"><Receipt size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhuma cobrança encontrada</p>
                      <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                        {hasFilters ? 'Tente ajustar os filtros' : 'Crie sua primeira cobrança'}
                      </p>
                      {!hasFilters && (
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                          <Plus size={16} /> Criar cobrança
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                charges.map(c => (
                  <tr key={c.id} className="cursor-pointer" onClick={() => openDetail(c.id)}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>#{c.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'hsl(var(--foreground))', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.customer_name || c.description || '---'}
                      </div>
                      {c.description && c.customer_name && (
                        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{formatBRL(Number(c.value))}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{formatBRL(Number(c.fee_value))}</td>
                    <td style={{ fontWeight: 600, color: 'hsl(142 76% 40%)' }}>{formatBRL(Number(c.value) - Number(c.fee_value))}</td>
                    <td>{renderStatus(c.status)}</td>
                    <td className="hide-mobile">
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>{c.acquirer?.name || '---'}</span>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'hsl(var(--muted-foreground))' }}>{formatDateTime(c.created_at)}</td>
                    <td>
                      <button className="btn-icon" onClick={e => { e.stopPropagation(); openDetail(c.id); }}>
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
        {!loading && charges.length > 0 && (
          <div className="pagination">
            <span>{total} resultado{total !== 1 ? 's' : ''} — Página {page} de {lastPage}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchCharges(page - 1); }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => { setPage(p); fetchCharges(p); }}>
                    {p}
                  </button>
                );
              })}
              {lastPage > 5 && <span className="page-btn">...</span>}
              {lastPage > 5 && (
                <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => { setPage(lastPage); fetchCharges(lastPage); }}>
                  {lastPage}
                </button>
              )}
              <button className="page-btn" disabled={page >= lastPage} onClick={() => { setPage(page + 1); fetchCharges(page + 1); }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Nova cobrança</h2>
                  <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Gere um link ou QR Code PIX instantâneo</p>
                </div>
                <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="flex flex-col gap-5">
                  {/* Amount preview */}
                  <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>Valor da cobrança</p>
                    <p style={{
                      fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
                      background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      {createAmount ? formatBRL(parseAmount(createAmount)) : 'R$ 0,00'}
                    </p>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Valor (R$)</label>
                    <input type="text" className="input" placeholder="0,00" value={createAmount} onChange={e => setCreateAmount(e.target.value)} autoFocus style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Descrição (opcional)</label>
                    <input type="text" className="input" placeholder="Ex: Assinatura mensal" value={createDescription} onChange={e => setCreateDescription(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Nome do cliente (opcional)</label>
                    <input type="text" className="input" placeholder="Ex: João Silva" value={createCustomer} onChange={e => setCreateCustomer(e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
                <button className="btn btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button className="btn btn-primary flex-1" disabled={creating} onClick={handleCreate}>
                  {creating ? 'Criando...' : 'Criar cobrança'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {showDetail && (
          <div className="modal-overlay" onClick={() => { setShowDetail(false); setDetailCharge(null); }}>
            <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Detalhe da cobrança</h2>
                  {detailCharge && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace', marginTop: 2 }}>{detailCharge.correlation_id}</p>}
                </div>
                <button className="btn-icon" onClick={() => { setShowDetail(false); setDetailCharge(null); }}><X size={18} /></button>
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="spinner"><div className="spinner-ring" /></div>
                ) : detailCharge ? (
                  <div className="flex flex-col gap-5">
                    {/* Status + Cancel */}
                    <div className="flex items-center justify-between">
                      {renderStatus(detailCharge.status)}
                      {['pending', 'active'].includes(detailCharge.status) && (
                        <button className="btn btn-destructive btn-sm" disabled={cancelling} onClick={handleCancel}>
                          <Ban size={14} /> {cancelling ? 'Cancelando...' : 'Cancelar'}
                        </button>
                      )}
                    </div>

                    {/* Amount hero */}
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Valor</p>
                      <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{formatBRL(Number(detailCharge.value))}</p>
                    </div>

                    {/* Fee breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: 16, borderRadius: 14, background: 'hsl(var(--muted))', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Taxa</p>
                        <p style={{ fontSize: 18, fontWeight: 700 }}>{formatBRL(Number(detailCharge.fee_value))}</p>
                      </div>
                      <div style={{ padding: 16, borderRadius: 14, background: 'hsl(142 76% 36% / 0.08)', border: '1px solid hsl(142 76% 36% / 0.12)', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Líquido</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: 'hsl(142 76% 40%)' }}>{formatBRL(Number(detailCharge.value) - Number(detailCharge.fee_value))}</p>
                      </div>
                    </div>

                    {/* QR Code + PIX */}
                    {detailCharge.br_code && (
                      <div style={{ padding: 24, borderRadius: 14, border: '1px solid hsl(var(--border))', textAlign: 'center', background: 'hsl(var(--card))' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>QR Code PIX</p>
                        <div style={{ display: 'inline-block', padding: 16, background: '#ffffff', borderRadius: 14, marginBottom: 14, boxShadow: '0 4px 16px rgb(0 0 0 / 0.06)' }}>
                          <QRCode value={detailCharge.br_code} size={180} bgColor="#ffffff" fgColor="#1a1a2e" level="M" />
                        </div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 10, marginTop: 6 }}>PIX Copia e Cola</p>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <pre style={{
                            flex: 1, fontSize: 11, fontFamily: 'monospace', padding: 12,
                            borderRadius: 10, background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))',
                            wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: 1.5,
                            textAlign: 'left', maxHeight: 100, overflowY: 'auto',
                            border: '1px solid hsl(var(--border))',
                          }}>
                            {detailCharge.br_code}
                          </pre>
                          <button className="btn btn-secondary shrink-0" onClick={() => copyPix(detailCharge.br_code)}>
                            <Copy size={14} />
                          </button>
                        </div>
                        {detailCharge.br_code && (
                          <a href={`/pay/${detailCharge.correlation_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full" style={{ marginTop: 14 }}>
                            <ExternalLink size={16} /> Abrir link de pagamento
                          </a>
                        )}
                      </div>
                    )}

                    {/* Info rows */}
                    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                      {[
                        { label: 'ID', value: `#${detailCharge.id}`, mono: true },
                        { label: 'Correlation ID', value: detailCharge.correlation_id, mono: true },
                        { label: 'Adquirente', value: detailCharge.acquirer?.name || '---' },
                        detailCharge.description ? { label: 'Descrição', value: detailCharge.description } : null,
                        detailCharge.customer_name ? { label: 'Cliente', value: detailCharge.customer_name } : null,
                        { label: 'Criado em', value: formatDateTime(detailCharge.created_at) },
                        detailCharge.paid_at ? { label: 'Pago em', value: formatDateTime(detailCharge.paid_at), highlight: true } : null,
                        detailCharge.expires_at ? { label: 'Expira em', value: formatDateTime(detailCharge.expires_at) } : null,
                      ].filter(Boolean).map((row: any, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '11px 16px',
                          background: i % 2 === 0 ? 'hsl(var(--muted) / 0.3)' : 'transparent',
                          borderBottom: i < 7 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                        }}>
                          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{row.label}</span>
                          <span style={{
                            fontSize: 12, fontWeight: row.highlight ? 600 : 500,
                            color: row.highlight ? 'hsl(142 76% 40%)' : 'hsl(var(--foreground))',
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
      </AnimatePresence>
    </div>
  );
}
