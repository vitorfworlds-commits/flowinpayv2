import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Plus, X, ChevronLeft, ChevronRight, Ban,
  CreditCard, Mail, Phone, Hash, Shuffle, ArrowDownToLine,
  RefreshCw, CheckCircle, Clock, AlertTriangle, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/useAuthStore';

interface Withdrawal {
  id: number;
  value: number | string;
  fee_value: number | string;
  net_value: number | string;
  status: string;
  pix_key_type: string;
  pix_key: string;
  description: string | null;
  created_at: string;
  processed_at: string | null;
}

interface PaginatedResponse {
  data: Withdrawal[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF', icon: CreditCard, placeholder: '000.000.000-00' },
  { value: 'cnpj', label: 'CNPJ', icon: Hash, placeholder: '00.000.000/0000-00' },
  { value: 'email', label: 'E-mail', icon: Mail, placeholder: 'email@exemplo.com' },
  { value: 'phone', label: 'Telefone', icon: Phone, placeholder: '+55 11 99999-9999' },
  { value: 'random', label: 'Aleatória', icon: Shuffle, placeholder: 'Chave aleatória' },
];

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Pendente', badge: 'badge-amber', dot: 'bg-amber-500' },
  processing: { label: 'Processando', badge: 'badge-blue', dot: 'bg-blue-500' },
  completed: { label: 'Concluído', badge: 'badge-green', dot: 'bg-green-500' },
  failed: { label: 'Falhou', badge: 'badge-red', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelado', badge: 'badge-muted', dot: 'bg-gray-400' },
};

export default function Withdrawals() {
  const { user, fetchUser } = useAuthStore();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [createAmount, setCreateAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKey, setPixKey] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const balance = parseFloat(user?.balance || '0');
  const [feeConfig, setFeeConfig] = useState({ withdrawal_fee: 2, minimum_withdrawal: 5, maximum_withdrawal: 1000 });
  const parsedAmount = parseFloat(createAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const netAmount = Math.max(0, parsedAmount - feeConfig.withdrawal_fee);

  useEffect(() => {
    api.get('/fees/current').then(({ data }) => {
      const f = data.fee;
      setFeeConfig({
        withdrawal_fee: parseFloat(f.withdrawal_fee) || 2,
        minimum_withdrawal: parseFloat(f.minimum_withdrawal) || 5,
        maximum_withdrawal: parseFloat(f.maximum_withdrawal) || 1000,
      });
    }).catch(() => {});
  }, []);

  const fetchWithdrawals = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get('/withdrawals', { params: { page: p, per_page: 15 } });
      const res: PaginatedResponse = data;
      setWithdrawals(res.data);
      setPage(res.current_page);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch {
      toast.error('Erro ao carregar saques');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWithdrawals(1); fetchUser(); }, [fetchWithdrawals, fetchUser]);

  const resetCreate = () => {
    setShowCreate(false); setCreateStep(0);
    setCreateAmount(''); setPixKey(''); setCreateDescription(''); setPixKeyType('cpf');
  };

  const handleCreate = async () => {
    if (!pixKey.trim()) { toast.error('Informe a chave PIX'); return; }
    setCreating(true);
    try {
      await api.post('/withdrawals', {
        value: parsedAmount,
        pix_key_type: pixKeyType,
        pix_key: pixKey.trim(),
        description: createDescription || undefined,
      });
      toast.success('Solicitação de saque enviada');
      resetCreate();
      fetchWithdrawals(1);
      fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao solicitar saque');
    } finally { setCreating(false); }
  };

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await api.post(`/withdrawals/${id}/cancel`);
      toast.success('Saque cancelado');
      fetchWithdrawals(page);
      fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar');
    } finally { setCancellingId(null); }
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

  // Stats
  const pendingCount = withdrawals.filter(w => ['pending', 'processing'].includes(w.status)).length;
  const completedCount = withdrawals.filter(w => w.status === 'completed').length;
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + Number(w.value), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1 className="dashboard-header-title">Saques</h1>
            <p className="dashboard-header-subtitle">
              Solicite transferências PIX e acompanhe o status dos seus saques.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="dashboard-refresh-btn" onClick={() => fetchWithdrawals(page)}>
              <RefreshCw size={14} /> Atualizar
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={balance <= 0}>
              <Plus size={16} /> Solicitar saque
            </button>
          </div>
        </div>
      </div>

      {/* BALANCE HERO */}
      <div className="card glow-green-strong" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: '28px', background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.08) 0%, hsl(142 76% 36% / 0.02) 100%)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="balance-hero-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
                <Wallet size={24} />
              </div>
              <div>
                <div className="balance-hero-label">Saldo disponível para saque</div>
                <div className="balance-hero-value" style={{ fontSize: 34 }}>{formatBRL(balance)}</div>
                {balance <= 0 && (
                  <p style={{ fontSize: 12, color: 'hsl(38 92% 50%)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={12} /> Saldo insuficiente para saque
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} disabled={balance <= 0} style={{ boxShadow: '0 4px 14px hsl(142 76% 36% / 0.4)' }}>
                <ArrowDownToLine size={16} /> Sacar agora
              </button>
            </div>
          </div>
        </div>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
          background: 'radial-gradient(circle at right, hsl(142 76% 36% / 0.06), transparent 70%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* KPI STATS */}
      {!loading && withdrawals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de saques', value: String(total), icon: ArrowDownToLine, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
            { label: 'Concluídos', value: String(completedCount), icon: CheckCircle, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
            { label: 'Pendentes', value: String(pendingCount), icon: Clock, color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
            { label: 'Total sacado', value: formatBRL(totalWithdrawn), icon: DollarSign, color: 'hsl(262 83% 58%)', bg: 'hsl(262 83% 58% / 0.1)' },
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

      {/* TABLE */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Valor</th>
                <th>Taxa</th>
                <th style={{ textAlign: 'right' }}>Líquido</th>
                <th className="hide-mobile">Chave PIX</th>
                <th>Data</th>
                <th style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="spinner"><div className="spinner-ring" /></div></td></tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-container">
                      <div className="empty-icon"><ArrowDownToLine size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Nenhum saque encontrado</p>
                      <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                        Solicite seu primeiro saque clicando no botão acima
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                withdrawals.map(w => (
                  <tr key={w.id}>
                    <td>{renderStatus(w.status)}</td>
                    <td style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{formatBRL(Number(w.value))}</td>
                    <td style={{ color: 'hsl(var(--muted-foreground))' }}>{formatBRL(Number(w.fee_value))}</td>
                    <td style={{ fontWeight: 700, textAlign: 'right', color: 'hsl(142 76% 40%)' }}>{formatBRL(Number(w.net_value))}</td>
                    <td className="hide-mobile">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>{w.pix_key_type?.toUpperCase()}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{w.pix_key}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap', color: 'hsl(var(--muted-foreground))' }}>{formatDateTime(w.created_at)}</td>
                    <td>
                      {['pending', 'processing'].includes(w.status) && (
                        <button className="btn-icon" style={{ color: 'hsl(var(--destructive))' }} disabled={cancellingId === w.id} onClick={() => handleCancel(w.id)} title="Cancelar saque">
                          <Ban size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && withdrawals.length > 0 && (
          <div className="pagination">
            <span>{total} resultado{total !== 1 ? 's' : ''} — Página {page} de {lastPage}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => { setPage(page - 1); fetchWithdrawals(page - 1); }}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => { setPage(p); fetchWithdrawals(p); }}>
                    {p}
                  </button>
                );
              })}
              {lastPage > 5 && <span className="page-btn">...</span>}
              {lastPage > 5 && (
                <button className={`page-btn ${lastPage === page ? 'active' : ''}`} onClick={() => { setPage(lastPage); fetchWithdrawals(lastPage); }}>
                  {lastPage}
                </button>
              )}
              <button className="page-btn" disabled={page >= lastPage} onClick={() => { setPage(page + 1); fetchWithdrawals(page + 1); }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL — stepped */}
      {showCreate && (
        <div className="modal-overlay" onClick={resetCreate}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Solicitar saque</h2>
                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                  Passo {createStep + 1} de 3
                </p>
              </div>
              <button className="btn-icon" onClick={resetCreate}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-5">
                {/* Step indicators */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '4px 0' }}>
                  {['Valor', 'Chave PIX', 'Confirmar'].map((label, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        background: createStep >= i ? 'hsl(142 76% 36%)' : 'hsl(var(--muted))',
                        color: createStep >= i ? '#fff' : 'hsl(var(--muted-foreground))',
                        border: createStep === i ? '2px solid hsl(142 76% 36%)' : '2px solid transparent',
                        transition: 'all 0.2s ease',
                      }}>{i + 1}</div>
                      <span style={{
                        fontSize: 12, fontWeight: createStep === i ? 600 : 500,
                        color: createStep === i ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                      }}>{label}</span>
                      {i < 2 && <div style={{ width: 24, height: 1, background: createStep > i ? 'hsl(142 76% 36%)' : 'hsl(var(--border))' }} />}
                    </div>
                  ))}
                </div>

                {/* Step 0: Amount */}
                {createStep === 0 && (
                  <div className="flex flex-col gap-5">
                    <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>Valor do saque</p>
                      <p style={{
                        fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1,
                        background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>
                        {parsedAmount > 0 ? formatBRL(parsedAmount) : 'R$ 0,00'}
                      </p>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Valor (R$)</label>
                      <input type="text" className="input" placeholder="0,00" value={createAmount} onChange={e => setCreateAmount(e.target.value)} autoFocus style={{ fontSize: 18, fontWeight: 600, textAlign: 'center' }} />
                      <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Mínimo: {formatBRL(feeConfig.minimum_withdrawal)} · Máximo: {formatBRL(feeConfig.maximum_withdrawal)} · Disponível: {formatBRL(balance)}</p>
                    </div>
                    {parsedAmount > 0 && (
                      <div style={{ padding: 16, borderRadius: 14, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Taxa de saque</span>
                          <span style={{ fontWeight: 500 }}>{formatBRL(feeConfig.withdrawal_fee)}</span>
                        </div>
                        <div style={{ height: 1, background: 'hsl(var(--border))', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
                          <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Você receberá</span>
                          <span style={{ fontWeight: 700, color: 'hsl(142 76% 40%)', fontSize: 15 }}>{formatBRL(netAmount)}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary flex-1" onClick={resetCreate}>Cancelar</button>
                      <button className="btn btn-primary flex-1" onClick={() => {
                        if (!parsedAmount || parsedAmount <= 0) { toast.error('Informe um valor válido'); return; }
                        if (parsedAmount < feeConfig.minimum_withdrawal) { toast.error(`Valor mínimo do saque: ${formatBRL(feeConfig.minimum_withdrawal)}`); return; }
                        if (parsedAmount > feeConfig.maximum_withdrawal) { toast.error(`Valor máximo do saque: ${formatBRL(feeConfig.maximum_withdrawal)}`); return; }
                        if (parsedAmount > balance) { toast.error('Saldo insuficiente'); return; }
                        setCreateStep(1);
                      }}>Próximo</button>
                    </div>
                  </div>
                )}

                {/* Step 1: PIX Key */}
                {createStep === 1 && (
                  <div className="flex flex-col gap-5">
                    <div className="input-group">
                      <label className="input-label">Tipo da chave PIX</label>
                      <div className="grid grid-cols-3 gap-2">
                        {PIX_KEY_TYPES.map(t => {
                          const Icon = t.icon;
                          return (
                            <button key={t.value} className={`btn btn-sm ${pixKeyType === t.value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPixKeyType(t.value)} style={{ gap: 6 }}>
                              <Icon size={14} /> {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Chave PIX</label>
                      <input type="text" className="input" placeholder={PIX_KEY_TYPES.find(t => t.value === pixKeyType)?.placeholder || ''} value={pixKey} onChange={e => setPixKey(e.target.value)} autoFocus />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Descrição (opcional)</label>
                      <input type="text" className="input" placeholder="Ex: Saque mensal" value={createDescription} onChange={e => setCreateDescription(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary flex-1" onClick={() => setCreateStep(0)}>Voltar</button>
                      <button className="btn btn-primary flex-1" onClick={() => {
                        if (!pixKey.trim()) { toast.error('Informe a chave PIX'); return; }
                        setCreateStep(2);
                      }}>Próximo</button>
                    </div>
                  </div>
                )}

                {/* Step 2: Confirm */}
                {createStep === 2 && (
                  <div className="flex flex-col gap-5">
                    <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Valor solicitado</p>
                      <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{formatBRL(parsedAmount)}</p>
                    </div>
                    <div style={{ padding: 18, borderRadius: 14, background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Chave PIX</span>
                        <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pixKey}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Tipo</span>
                        <span style={{ fontWeight: 500 }}>{PIX_KEY_TYPES.find(t => t.value === pixKeyType)?.label}</span>
                      </div>
                      <div style={{ height: 1, background: 'hsl(var(--border))' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Taxa</span>
                        <span style={{ fontWeight: 500 }}>{formatBRL(feeConfig.withdrawal_fee)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700 }}>Você receberá</span>
                        <span style={{ fontWeight: 800, color: 'hsl(142 76% 40%)', fontSize: 18 }}>{formatBRL(netAmount)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary flex-1" onClick={() => setCreateStep(1)}>Voltar</button>
                      <button className="btn btn-primary flex-1" disabled={creating} onClick={handleCreate}>
                        {creating ? 'Solicitando...' : 'Confirmar saque'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
