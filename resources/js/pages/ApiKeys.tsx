import { useState, useEffect, useCallback } from 'react';
import {
  KeyRound, Plus, Eye, EyeOff, RefreshCw, Trash2,
  Copy, Check, AlertTriangle, X, Clock, Shield,
  Code2, Globe, Zap, ExternalLink, ToggleLeft, ToggleRight,
  Link2, Send, Unplug, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/format';

// ------------------------------------------------------------------ //
// TYPES                                                               //
// ------------------------------------------------------------------ //
type Tab = 'keys' | 'webhooks';

interface WebhookConfig {
  id: number;
  url: string;
  secret: string | null;
  secret_preview: string | null;
  events: string[];
  is_active: boolean;
  description: string | null;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
}

interface ApiKey {
    id: string;
    name: string;
    key: string;
    is_active: boolean;
    permissions: string[];
    last_used_at: string | null;
    created_at: string;
}

interface CreatedKey {
    key: string;
    id: string;
}

// Maps friendly permission IDs → backend permission strings
const PERMISSION_TO_BACKEND: Record<string, string[]> = {
    payments: ['charge:create', 'charge:read', 'charge:cancel'],
    webhooks: ['webhook:create'],
    customers: ['customer:read'],
    reports: ['balance:read'],
    settings: ['withdrawal:create', 'withdrawal:read'],
};

// Maps backend permission strings → friendly permission IDs
function backendToFrontend(perms: string[] | null): string[] {
    if (!perms || !Array.isArray(perms)) return [];
    if (perms.includes('*')) return ALL_PERMISSIONS.map(p => p.id);
    const friendly = new Set<string>();
    for (const bp of perms) {
        for (const [fid, bps] of Object.entries(PERMISSION_TO_BACKEND)) {
            if (bps.includes(bp)) friendly.add(fid);
        }
    }
    return [...friendly];
}

function frontendToBackend(friendlyIds: string[]): string[] {
    const out: string[] = [];
    for (const fid of friendlyIds) {
        const bps = PERMISSION_TO_BACKEND[fid];
        if (bps) out.push(...bps);
    }
    return [...new Set(out)];
}

const ALL_PERMISSIONS = [
    { id: 'payments', label: 'Pagamentos', icon: Zap },
    { id: 'webhooks', label: 'Webhooks', icon: Globe },
    { id: 'customers', label: 'Clientes', icon: Shield },
    { id: 'reports', label: 'Relatórios', icon: Code2 },
    { id: 'settings', label: 'Configurações', icon: KeyRound },
];

function SecretKeyModal({ secret, onClose }: { secret: { key: string }; onClose: () => void }) {
    const handleCopy = (value: string, label: string) => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copiado!`);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Sua App ID</h2>
                        <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Copie e guarde em local seguro</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, background: 'hsl(38 92% 50% / 0.08)', border: '1px solid hsl(38 92% 50% / 0.2)' }}>
                        <AlertTriangle size={18} style={{ color: 'hsl(38 92% 50%)', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: 13 }}>
                            <p style={{ fontWeight: 700, color: 'hsl(38 92% 50%)' }}>Aviso importante</p>
                            <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: 4, lineHeight: 1.6 }}>
                                Esta é a credencial de autenticação da API (header X-Api-Key). Não compartilhe com terceiros.
                            </p>
                        </div>
                    </div>

                    {secret.key && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span className="input-label">App ID</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'hsl(var(--background))', border: '1px solid hsl(var(--input))', borderRadius: 12 }}>
                                <code style={{ fontFamily: 'monospace', fontSize: 13, color: 'hsl(var(--foreground))', wordBreak: 'break-all', flex: 1 }}>{secret.key}</code>
                                <button className="btn-icon" style={{ flexShrink: 0 }} onClick={() => handleCopy(secret.key, 'App ID')}><Copy size={16} /></button>
                            </div>
                        </div>
                    )}

                    <button className="btn btn-primary w-full" onClick={onClose}>Entendido</button>
                </div>
            </div>
        </div>
    );
}

function CreateKeyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);

    const togglePermission = (id: string) => {
        setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('Informe um nome para a chave.'); return; }
        setSubmitting(true); setError('');
        try {
            const { data } = await api.post('/api-keys', { name: name.trim(), permissions: frontendToBackend(permissions) });
            setCreatedKey(data.api_key || data);
            onCreated();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao criar chave.');
        } finally { setSubmitting(false); }
    };

    if (createdKey) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-panel" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div>
                            <h2 className="modal-title">Chave criada com sucesso!</h2>
                            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>A App ID será exibida apenas esta vez</p>
                        </div>
                        <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                    </div>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, background: 'hsl(38 92% 50% / 0.08)', border: '1px solid hsl(38 92% 50% / 0.2)' }}>
                            <AlertTriangle size={18} style={{ color: 'hsl(38 92% 50%)', flexShrink: 0, marginTop: 2 }} />
                            <div style={{ fontSize: 13 }}>
                                <p style={{ fontWeight: 700, color: 'hsl(38 92% 50%)' }}>Guarde em local seguro</p>
                                <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>A App ID não será exibida novamente após fechar este modal.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span className="input-label">App ID</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'hsl(var(--background))', border: '1px solid hsl(var(--input))', borderRadius: 12 }}>
                                <code style={{ fontFamily: 'monospace', fontSize: 13, color: 'hsl(var(--foreground))', wordBreak: 'break-all', flex: 1 }}>{createdKey.key}</code>
                                <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(createdKey.key); toast.success('App ID copiada!'); }}><Copy size={14} /></button>
                            </div>
                        </div>

                        <button className="btn btn-primary w-full" onClick={() => { onCreated(); onClose(); }}>Entendido, fechar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Nova API Key</h2>
                        <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Crie uma chave para integrar com a API</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <div style={{ padding: 14, borderRadius: 14, background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 55%)', fontSize: 13, fontWeight: 600 }}>{error}</div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Nome da chave</label>
                            <input className="input" placeholder="Ex: Produção, Desenvolvimento, Integração..." value={name} onChange={e => setName(e.target.value)} autoFocus />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <span className="input-label">Permissões</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {ALL_PERMISSIONS.map(perm => {
                                    const active = permissions.includes(perm.id);
                                    const Icon = perm.icon;
                                    return (
                                        <button
                                            key={perm.id}
                                            type="button"
                                            className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => togglePermission(perm.id)}
                                            style={{ justifyContent: 'flex-start', gap: 8 }}
                                        >
                                            {active ? <Check size={14} /> : <Icon size={14} />}
                                            {perm.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                                {permissions.length === 0 ? 'Selecione pelo menos uma permissão' : `${permissions.length} permissão${permissions.length !== 1 ? 'ões' : ''} selecionada${permissions.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                    <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
                        <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>Cancelar</button>
                        <button type="submit" className="btn btn-primary flex-1" disabled={submitting || !name.trim()}>
                            {submitting ? <div className="spinner-ring" style={{ width: 16, height: 16 }} /> : <><Plus size={16} /> Criar chave</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ApiKeys() {
    const [activeTab, setActiveTab] = useState<Tab>('keys');
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [secretKey, setSecretKey] = useState<{ key: string } | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

    // Webhook state
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [webhooksLoading, setWebhooksLoading] = useState(false);
    const [availableEvents, setAvailableEvents] = useState<Record<string, string>>({
        'charge.created': 'Cobrança criada',
        'charge.completed': 'Pagamento confirmado',
        'charge.expired': 'Cobrança expirada',
        'charge.cancelled': 'Cobrança cancelada',
        'withdrawal.completed': 'Saque processado',
        'withdrawal.failed': 'Saque falhou',
        'dispute.opened': 'Contestação aberta',
        'dispute.accepted': 'Contestação aceita',
        'dispute.rejected': 'Contestação rejeitada',
    });
    const [showCreateWebhook, setShowCreateWebhook] = useState(false);
    const [whUrl, setWhUrl] = useState('');
    const [whDescription, setWhDescription] = useState('');
    const [whEvents, setWhEvents] = useState<string[]>([]);
    const [whCreating, setWhCreating] = useState(false);
    const [whTogglingId, setWhTogglingId] = useState<number | null>(null);
    const [whDeletingId, setWhDeletingId] = useState<number | null>(null);
    const [whTestingId, setWhTestingId] = useState<number | null>(null);
    const [whRegeneratingId, setWhRegeneratingId] = useState<number | null>(null);
    const [visibleWhSecrets, setVisibleWhSecrets] = useState<Set<number>>(new Set());
    const [createdWhSecret, setCreatedWhSecret] = useState<string | null>(null);

    const fetchKeys = useCallback(async () => {
        try {
            const { data } = await api.get('/api-keys');
            const raw = data.api_keys || data.keys || data.data || data;
            const list = Array.isArray(raw) ? raw : [];
            // Normalize: backend sends `status`, frontend expects `is_active` + `permissions` as friendly IDs
            setKeys(list.map((k: any) => ({
                ...k,
                is_active: k.status === 'active',
                permissions: backendToFrontend(k.permissions),
            })));
        } catch { toast.error('Erro ao carregar API keys.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);

    const toggleVisibility = (id: string) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleToggle = async (id: string) => {
        setTogglingId(id);
        try {
            const { data } = await api.patch(`/api-keys/${id}/toggle`);
            const newStatus = data.api_key?.status;
            setKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: newStatus ? newStatus === 'active' : !k.is_active } : k));
            toast.success('Status atualizado!');
        } catch { toast.error('Erro ao alterar status.'); }
        finally { setTogglingId(null); }
    };

    const handleRegenerate = async (id: string) => {
        setRegeneratingId(id);
        try {
            const { data } = await api.post(`/api-keys/${id}/regenerate`, {});
            toast.success('Chave regenerada!');
            setSecretKey(data.api_key || data);
            await fetchKeys();
        } catch { toast.error('Erro ao regenerar chave.'); }
        finally { setRegeneratingId(null); }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await api.delete(`/api-keys/${id}`);
            toast.success('Chave removida.');
            await fetchKeys();
        } catch { toast.error('Erro ao remover chave.'); }
        finally { setDeletingId(null); }
    };

    const getKeyPreview = (id: string, secret?: string) => {
        if (visibleKeys.has(id)) return secret;
        return '•'.repeat(30) + '...';
    };

    const activeCount = keys.filter(k => k.is_active).length;
    const inactiveCount = keys.filter(k => !k.is_active).length;

    // Webhook functions
    const fetchWebhooks = useCallback(async () => {
        setWebhooksLoading(true);
        try {
            const { data } = await api.get('/webhooks');
            setWebhooks(Array.isArray(data) ? data : (Array.isArray(data.webhooks) ? data.webhooks : []));
        } catch { toast.error('Erro ao carregar webhooks.'); }
        finally { setWebhooksLoading(false); }
    }, []);

    useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

    const handleCreateWebhook = async () => {
        if (!whUrl.trim()) { toast.error('Informe a URL do webhook.'); return; }
        if (whEvents.length === 0) { toast.error('Selecione pelo menos um evento.'); return; }
        setWhCreating(true);
        try {
            const { data } = await api.post('/webhooks', { url: whUrl.trim(), events: whEvents, description: whDescription.trim() || null });
            if (data.webhook?.secret) {
                setCreatedWhSecret(data.webhook.secret);
            }
            toast.success('Webhook criado! Guarde o secret — não será exibido novamente.');
            setShowCreateWebhook(false); setWhUrl(''); setWhDescription(''); setWhEvents([]);
            fetchWebhooks();
        } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao criar webhook.'); }
        finally { setWhCreating(false); }
    };

    const handleToggleWh = async (id: number) => {
        setWhTogglingId(id);
        try {
            await api.post(`/webhooks/${id}/toggle`, {});
            setWebhooks(prev => prev.map(w => w.id === id ? { ...w, is_active: !w.is_active } : w));
            toast.success('Status atualizado!');
        } catch { toast.error('Erro ao alterar status.'); }
        finally { setWhTogglingId(null); }
    };

    const handleDeleteWh = async (id: number) => {
        setWhDeletingId(id);
        try {
            await api.delete(`/webhooks/${id}`);
            toast.success('Webhook removido!');
            fetchWebhooks();
        } catch { toast.error('Erro ao remover webhook.'); }
        finally { setWhDeletingId(null); }
    };

    const handleTestWh = async (id: number) => {
        setWhTestingId(id);
        try {
            const { data } = await api.post(`/webhooks/${id}/test`, {});
            toast.success(data.message || 'Teste enviado!');
        } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao testar webhook.'); }
        finally { setWhTestingId(null); }
    };

    const handleRegenerateWhSecret = async (id: number) => {
        setWhRegeneratingId(id);
        try {
            const { data } = await api.post(`/webhooks/${id}/regenerate-secret`, {});
            if (data.webhook?.secret) {
                setCreatedWhSecret(data.webhook.secret);
            }
            toast.success('Secret regenerado!');
            fetchWebhooks();
        } catch { toast.error('Erro ao regenerar secret.'); }
        finally { setWhRegeneratingId(null); }
    };

    const toggleWhSecretVisibility = (id: number) => {
        setVisibleWhSecrets(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleWhEvent = (event: string) => {
        setWhEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
    };

    if (loading) return <div className="spinner"><div className="spinner-ring" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* HEADER */}
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div>
                        <h1 className="dashboard-header-title">Integração</h1>
                        <p className="dashboard-header-subtitle">
                            Gerencie suas chaves de API e webhooks para integrar com o FlowinPay.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="dashboard-refresh-btn" onClick={() => { fetchKeys(); if (activeTab === 'webhooks') fetchWebhooks(); }}>
                            <RefreshCw size={14} /> Atualizar
                        </button>
                        {activeTab === 'keys' && (
                            <button className="btn btn-primary" onClick={() => setCreating(true)}>
                                <Plus size={16} /> Nova API Key
                            </button>
                        )}
                        {activeTab === 'webhooks' && (
                            <button className="btn btn-primary" onClick={() => setShowCreateWebhook(true)}>
                                <Plus size={16} /> Novo Webhook
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: 4, marginTop: 20, borderBottom: '2px solid hsl(var(--border))', paddingBottom: 0 }}>
                    {[
                        { id: 'keys' as Tab, label: 'API Keys', icon: KeyRound },
                        { id: 'webhooks' as Tab, label: 'Webhooks', icon: Link2 },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 20px', fontSize: 13, fontWeight: 600,
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                borderBottom: activeTab === tab.id ? '2px solid hsl(142 76% 36%)' : '2px solid transparent',
                                marginBottom: '-2px',
                                background: 'transparent',
                                color: activeTab === tab.id ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.id === 'keys' && <span style={{ fontSize: 11, opacity: 0.6 }}>({keys.length})</span>}
                            {tab.id === 'webhooks' && <span style={{ fontSize: 11, opacity: 0.6 }}>({webhooks.length})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* ========= API KEYS TAB ========= */}
            {activeTab === 'keys' && <>
            {/* DOCS BANNER */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, hsl(217 91% 60% / 0.08), hsl(262 83% 58% / 0.06))',
                border: '1px solid hsl(217 91% 60% / 0.15)',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: 'hsl(217 91% 60% / 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <BookOpen size={18} style={{ color: 'hsl(217 91% 60%)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>Documentação da API</p>
                    <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                        Veja exemplos em cURL, PHP, Node.js, Python e mais para integrar com a API FlowinPay.
                    </p>
                </div>
                <a href="/docs" className="btn btn-sm btn-secondary" style={{ gap: 6, flexShrink: 0, textDecoration: 'none' }}>
                    <ExternalLink size={14} /> Ver Docs
                </a>
            </div>

            {/* KPI STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total de chaves', value: String(keys.length), icon: KeyRound, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
                    { label: 'Ativas', value: String(activeCount), icon: Check, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
                    { label: 'Inativas', value: String(inactiveCount), icon: ToggleLeft, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))' },
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

            {/* Empty State */}
            {keys.length === 0 && (
                <div className="card">
                    <div className="empty-container">
                        <div className="empty-icon"><Code2 size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nenhuma API key</h3>
                        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 24, textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>
                            Crie sua primeira chave para começar a integrar com a API REST do FlowinPay
                        </p>
                        <button className="btn btn-primary" onClick={() => setCreating(true)}>
                            <Plus size={16} /> Criar primeira chave
                        </button>
                    </div>
                </div>
            )}

            {/* Key Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {keys.map((key) => (
                    <div key={key.id} className="card card-glow" style={{ padding: 24 }}>
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            {/* Left: info */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Name + status */}
                                <div className="flex items-center gap-3">
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        background: key.is_active ? 'hsl(142 76% 36% / 0.12)' : 'hsl(var(--muted))',
                                    }}>
                                        <KeyRound size={20} style={{ color: key.is_active ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key.name}</h3>
                                        <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                                            <span className={`badge ${key.is_active ? 'badge-green' : 'badge-muted'}`}>
                                                <span className="badge-dot" style={{ background: key.is_active ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))' }} />
                                                {key.is_active ? 'Ativa' : 'Inativa'}
                                            </span>
                                            {key.last_used_at && (
                                                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={11} /> Último uso: {formatDateTime(key.last_used_at)}
                                                </span>
                                            )}
                                            {!key.last_used_at && (
                                                <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={11} /> Nunca utilizada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Key preview */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                                    background: 'hsl(var(--background))', border: '1px solid hsl(var(--input))', borderRadius: 12,
                                }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>App ID</span>
                                    <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'hsl(var(--foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {getKeyPreview(key.id, key.key)}
                                    </code>
                                    <button className="btn-icon" style={{ width: 32, height: 32, flexShrink: 0 }} onClick={() => toggleVisibility(key.id)} title={visibleKeys.has(key.id) ? 'Ocultar' : 'Revelar'}>
                                        {visibleKeys.has(key.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button className="btn-icon" style={{ width: 32, height: 32, flexShrink: 0 }} onClick={() => { navigator.clipboard.writeText(key.key); toast.success('Copiado!'); }} title="Copiar">
                                        <Copy size={14} />
                                    </button>
                                </div>

                                {/* Permissions */}
                                {key.permissions && key.permissions.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {key.permissions.map(perm => {
                                            const permData = ALL_PERMISSIONS.find(p => p.id === perm);
                                            const Icon = permData?.icon || Shield;
                                            return (
                                                <span key={perm} className="badge badge-muted" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px' }}>
                                                    <Icon size={10} /> {permData?.label || perm}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Created date */}
                                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                    Criada em {formatDateTime(key.created_at)}
                                </p>
                            </div>

                            {/* Right: actions */}
                            <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    title={key.is_active ? 'Desativar' : 'Ativar'}
                                    disabled={togglingId === key.id}
                                    onClick={() => handleToggle(key.id)}
                                    style={{ gap: 6 }}
                                >
                                    {togglingId === key.id ? (
                                        <div className="spinner-ring" style={{ width: 14, height: 14 }} />
                                    ) : key.is_active ? (
                                        <ToggleRight size={16} style={{ color: 'hsl(142 76% 36%)' }} />
                                    ) : (
                                        <ToggleLeft size={16} />
                                    )}
                                    {key.is_active ? 'Ativa' : 'Inativa'}
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    title="Regenerar chave"
                                    disabled={regeneratingId === key.id}
                                    onClick={() => handleRegenerate(key.id)}
                                    style={{ gap: 6 }}
                                >
                                    {regeneratingId === key.id ? <div className="spinner-ring" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
                                    Regenerar
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    style={{ color: 'hsl(var(--destructive))', gap: 6 }}
                                    title="Excluir chave"
                                    disabled={deletingId === key.id}
                                    onClick={() => handleDelete(key.id)}
                                >
                                    {deletingId === key.id ? <div className="spinner-ring" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            </>}

            {/* ========= WEBHOOKS TAB ========= */}
            {activeTab === 'webhooks' && <>
                {webhooksLoading ? (
                    <div className="spinner"><div className="spinner-ring" /></div>
                ) : (
                    <>
                        {/* Webhook KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Total', value: String(webhooks.length), icon: Link2, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
                                { label: 'Ativos', value: String(webhooks.filter(w => w.is_active).length), icon: Check, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
                                { label: 'Eventos disponíveis', value: String(Object.keys(availableEvents).length), icon: Zap, color: 'hsl(262 83% 58%)', bg: 'hsl(262 83% 58% / 0.1)' },
                            ].map((stat, i) => (
                                <div key={i} className="card card-glow stat-card">
                                    <div className="stat-card-top">
                                        <div className="stat-card-label">{stat.label}</div>
                                        <div className="stat-icon-ring" style={{ background: stat.bg, color: stat.color }}><stat.icon size={18} /></div>
                                    </div>
                                    <div className="stat-value">{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Empty state */}
                        {webhooks.length === 0 && (
                            <div className="card">
                                <div className="empty-container">
                                    <div className="empty-icon"><Link2 size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Nenhum webhook configurado</h3>
                                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 24, textAlign: 'center', maxWidth: 360 }}>
                                        Configure webhooks para receber notificações em tempo real sobre eventos da sua conta.
                                    </p>
                                    <button className="btn btn-primary" onClick={() => setShowCreateWebhook(true)}><Plus size={16} /> Criar primeiro webhook</button>
                                </div>
                            </div>
                        )}

                        {/* Webhook cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {webhooks.map((wh) => (
                                <div key={wh.id} className="card card-glow" style={{ padding: 24 }}>
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {/* Status + URL */}
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: wh.is_active ? 'hsl(142 76% 36% / 0.12)' : 'hsl(var(--muted))' }}>
                                                    <Link2 size={20} style={{ color: wh.is_active ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))' }} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</h3>
                                                    <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                                                        <span className={`badge ${wh.is_active ? 'badge-green' : 'badge-muted'}`}>
                                                            <span className="badge-dot" style={{ background: wh.is_active ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))' }} />
                                                            {wh.is_active ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                        {wh.last_triggered_at && (
                                                            <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                                                Último disparo: {formatDateTime(wh.last_triggered_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {wh.description && <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{wh.description}</p>}

                                            {/* Events */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {wh.events.map(event => (
                                                    <span key={event} className="badge badge-muted" style={{ fontSize: 10 }}>{availableEvents[event] || event}</span>
                                                ))}
                                            </div>

                                            {/* Secret preview */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--input))', borderRadius: 10 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>Secret</span>
                                                <code style={{ fontFamily: 'monospace', fontSize: 11, color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                    {wh.secret_preview || 'N/A'}
                                                </code>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                                            <button className="btn btn-sm btn-ghost" disabled={whTogglingId === wh.id} onClick={() => handleToggleWh(wh.id)} style={{ gap: 6 }}>
                                                {whTogglingId === wh.id ? <div className="spinner-ring" style={{ width: 14, height: 14 }} /> : wh.is_active ? <ToggleRight size={16} style={{ color: 'hsl(142 76% 36%)' }} /> : <ToggleLeft size={16} />}
                                                {wh.is_active ? 'Ativo' : 'Inativo'}
                                            </button>
                                            <button className="btn btn-sm btn-secondary" disabled={whTestingId === wh.id} onClick={() => handleTestWh(wh.id)} style={{ gap: 6 }}>
                                                {whTestingId === wh.id ? <div className="spinner-ring" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
                                                Testar
                                            </button>
                                            <button className="btn btn-sm btn-secondary" disabled={whRegeneratingId === wh.id} onClick={() => handleRegenerateWhSecret(wh.id)} style={{ gap: 6 }}>
                                                {whRegeneratingId === wh.id ? <div className="spinner-ring" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
                                                Regenerar
                                            </button>
                                            <button className="btn btn-sm btn-ghost" style={{ color: 'hsl(var(--destructive))', gap: 6 }} disabled={whDeletingId === wh.id} onClick={() => handleDeleteWh(wh.id)}>
                                                {whDeletingId === wh.id ? <div className="spinner-ring" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </>}

            {/* Modals */}
            {creating && <CreateKeyModal onClose={() => setCreating(false)} onCreated={() => fetchKeys()} />}
            {secretKey && <SecretKeyModal secret={secretKey} onClose={() => setSecretKey(null)} />}

            {/* Webhook Secret Modal */}
            {createdWhSecret && (
                <div className="modal-overlay" onClick={() => setCreatedWhSecret(null)}>
                    <div className="modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Secret do Webhook</h2>
                                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Copie e guarde — não será exibido novamente</p>
                            </div>
                            <button className="btn-icon" onClick={() => setCreatedWhSecret(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 14, background: 'hsl(38 92% 50% / 0.08)', border: '1px solid hsl(38 92% 50% / 0.2)' }}>
                                <AlertTriangle size={18} style={{ color: 'hsl(38 92% 50%)', flexShrink: 0, marginTop: 2 }} />
                                <div style={{ fontSize: 13 }}>
                                    <p style={{ fontWeight: 700, color: 'hsl(38 92% 50%)' }}>Aviso importante</p>
                                    <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: 4, lineHeight: 1.6 }}>
                                        Este secret é usado para verificar a assinatura dos webhooks. Após fechar este modal, não será possível visualizá-lo novamente.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span className="input-label">Webhook Secret</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'hsl(var(--background))', border: '1px solid hsl(var(--input))', borderRadius: 12 }}>
                                    <code style={{ fontFamily: 'monospace', fontSize: 13, color: 'hsl(var(--foreground))', wordBreak: 'break-all', flex: 1 }}>{createdWhSecret}</code>
                                    <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(createdWhSecret); toast.success('Secret copiado!'); }}><Copy size={14} /></button>
                                </div>
                            </div>
                            <button className="btn btn-primary w-full" onClick={() => setCreatedWhSecret(null)}>Entendido, fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Webhook Modal */}
            {showCreateWebhook && (
                <div className="modal-overlay" onClick={() => setShowCreateWebhook(false)}>
                    <div className="modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">Novo Webhook</h2>
                                <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Configure um endpoint para receber notificações</p>
                            </div>
                            <button className="btn-icon" onClick={() => setShowCreateWebhook(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="input-group">
                                <label className="input-label">URL do webhook</label>
                                <input className="input" placeholder="https://seu-site.com/webhook" value={whUrl} onChange={e => setWhUrl(e.target.value)} autoFocus />
                                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Endpoint que receberá os eventos via POST</p>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Descrição (opcional)</label>
                                <input className="input" placeholder="Ex: Notificações do meu app" value={whDescription} onChange={e => setWhDescription(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <span className="input-label">Eventos</span>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {Object.entries(availableEvents).map(([key, label]) => {
                                        const active = whEvents.includes(key);
                                        return (
                                            <button key={key} type="button" className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`} onClick={() => toggleWhEvent(key)} style={{ justifyContent: 'flex-start', gap: 8 }}>
                                                {active ? <Check size={14} /> : <Zap size={14} />}
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                    {whEvents.length === 0 ? 'Selecione pelo menos um evento' : `${whEvents.length} evento(s) selecionado(s)`}
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary flex-1" onClick={() => setShowCreateWebhook(false)}>Cancelar</button>
                            <button className="btn btn-primary flex-1" disabled={whCreating} onClick={handleCreateWebhook}>
                                {whCreating ? <div className="spinner-ring" style={{ width: 16, height: 16 }} /> : <><Plus size={16} /> Criar webhook</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
