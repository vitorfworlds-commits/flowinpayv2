import { useState, useEffect, useCallback } from 'react';
import {
  Plug, RefreshCw, CheckCircle, Star, Globe, Zap,
  ExternalLink, ShieldCheck, CreditCard, ArrowRight,
  Settings, ToggleLeft, ToggleRight, Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { useAuthStore } from '@/store/useAuthStore';

interface Acquirer {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  color: string;
  fee_percent: number;
  fee_fixed: number;
  description: string | null;
  environment: string;
  is_active: boolean;
  is_default: boolean;
  has_api_key: boolean;
  config?: Record<string, any>;
}

interface FeeConfig {
  id: number;
  percentual: number;
  fixed_value: number;
  withdrawal_fee: number;
  minimum_charge: number;
  maximum_charge: number;
}

export default function Acquirers() {
  const { user, fetchUser } = useAuthStore();
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultId, setDefaultId] = useState<number | null>(null);
  const [settingDefault, setSettingDefault] = useState<number | null>(null);

  const fetchAcquirers = useCallback(async () => {
    try {
      const [acqRes, feeRes] = await Promise.allSettled([
        api.get('/acquirers'),
        api.get('/fees/current'),
      ]);
      if (acqRes.status === 'fulfilled') {
        const data = acqRes.value.data;
        const list = Array.isArray(data.acquirers) ? data.acquirers : [];
        setAcquirers(list);
        setDefaultId(data.user_default_id || list.find((a: Acquirer) => a.is_default)?.id || null);
      }
      if (feeRes.status === 'fulfilled') {
        const fd = feeRes.value.data;
        setFeeConfig(fd && typeof fd === 'object' && fd.percentual ? fd : null);
      }
    } catch {
      toast.error('Erro ao carregar adquirentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAcquirers(); }, [fetchAcquirers]);

  const handleSetDefault = async (id: number) => {
    setSettingDefault(id);
    try {
      await api.post(`/acquirers/${id}/set-default`);
      setDefaultId(id);
      setAcquirers(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Adquirente padrão atualizada!');
      fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao definir padrão');
    } finally {
      setSettingDefault(null);
    }
  };

  const activeCount = acquirers.filter(a => a.is_active).length;
  const currentDefault = acquirers.find(a => a.id === defaultId);

  if (loading) return <div className="spinner"><div className="spinner-ring" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div>
            <h1 className="dashboard-header-title">Adquirentes</h1>
            <p className="dashboard-header-subtitle">
              Gerencie suas gateways de pagamento. Escolha qual adquirente usar como padrão para suas cobranças.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="dashboard-refresh-btn" onClick={() => fetchAcquirers()}>
              <RefreshCw size={14} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* CURRENT DEFAULT HERO */}
      {currentDefault && (
        <div className="card glow-green-strong" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ padding: '28px', background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.08) 0%, hsl(142 76% 36% / 0.02) 100%)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div style={{
                  width: 56, height: 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${currentDefault.color}18`, border: `2px solid ${currentDefault.color}40`,
                }}>
                  {currentDefault.logo_url ? (
                    <img src={currentDefault.logo_url} alt={currentDefault.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                  ) : (
                    <Plug size={28} style={{ color: currentDefault.color }} />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
                    Adquirente padrão
                  </p>
                  <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: currentDefault.color }}>{currentDefault.name}</h2>
                  {feeConfig && (
                    <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                      Taxa: {feeConfig.percentual}%{feeConfig.fixed_value > 0 ? ` + ${formatBRL(feeConfig.fixed_value)} fixo` : ''} por transação · Saque: {formatBRL(feeConfig.withdrawal_fee)}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${currentDefault.environment === 'production' ? 'badge-green' : 'badge-amber'}`}>
                  <span className="badge-dot" style={{ background: currentDefault.environment === 'production' ? 'hsl(142 76% 36%)' : 'hsl(38 92% 50%)' }} />
                  {currentDefault.environment === 'production' ? 'Produção' : 'Sandbox'}
                </span>
              </div>
            </div>
          </div>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
            background: `radial-gradient(circle at right, ${currentDefault.color}08, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* KPI STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Disponíveis', value: String(acquirers.length), icon: Plug, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
          { label: 'Ativas', value: String(activeCount), icon: CheckCircle, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
          { label: 'Padrão', value: currentDefault?.name || 'Nenhuma', icon: Star, color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)' },
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

      {/* ACQUIRER CARDS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {acquirers.map((acquirer) => {
          const isDefault = acquirer.id === defaultId;
          return (
            <div key={acquirer.id} className={`card card-glow ${isDefault ? 'glow-border-strong' : ''}`} style={{ padding: 24 }}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: info */}
                <div className="flex items-center gap-4" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    background: `${acquirer.color}12`, border: `2px solid ${acquirer.color}30`,
                  }}>
                    {acquirer.logo_url ? (
                      <img src={acquirer.logo_url} alt={acquirer.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    ) : (
                      <Plug size={24} style={{ color: acquirer.color }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="flex items-center gap-3">
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{acquirer.name}</h3>
                      {isDefault && (
                        <span className="badge badge-green" style={{ fontSize: 10 }}>
                          <Star size={10} /> Padrão
                        </span>
                      )}
                      <span className={`badge ${acquirer.is_active ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                        <span className="badge-dot" style={{ background: acquirer.is_active ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))' }} />
                        {acquirer.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className={`badge ${acquirer.environment === 'production' ? 'badge-blue' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                        {acquirer.environment === 'production' ? 'Produção' : 'Sandbox'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {acquirer.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                  {!isDefault && acquirer.is_active && (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={settingDefault === acquirer.id}
                      onClick={() => handleSetDefault(acquirer.id)}
                      style={{ gap: 6 }}
                    >
                      {settingDefault === acquirer.id ? (
                        <div className="spinner-ring" style={{ width: 14, height: 14 }} />
                      ) : (
                        <><Star size={14} /> Definir como padrão</>
                      )}
                    </button>
                  )}
                  {isDefault && (
                    <span className="badge badge-green" style={{ fontSize: 11, padding: '6px 12px' }}>
                      <CheckCircle size={12} /> Padrão ativa
                    </span>
                  )}
                </div>
              </div>

              {/* Config section */}
              {acquirer.config && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-4 flex-wrap">
                    {(acquirer.config as any).supports_pix && (
                      <span className="badge badge-green" style={{ fontSize: 10 }}>
                        <CreditCard size={10} /> PIX
                      </span>
                    )}
                    {(acquirer.config as any).supports_disputes && (
                      <span className="badge badge-blue" style={{ fontSize: 10 }}>
                        <ShieldCheck size={10} /> Defesa automática
                      </span>
                    )}
                    {(acquirer.config as any).auto_defend_disputes && (
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>
                        <Zap size={10} /> Auto-defesa MED
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {acquirers.length === 0 && (
        <div className="card">
          <div className="empty-container">
            <div className="empty-icon"><Plug size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nenhuma adquirente configurada</h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', textAlign: 'center', maxWidth: 360 }}>
              Configure pelo menos uma adquirente para começar a receber pagamentos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
