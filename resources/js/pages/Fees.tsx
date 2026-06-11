import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, DollarSign, TrendingUp, ArrowUpDown, Plus, Pencil, X, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL } from '@/lib/format';

interface FeeConfig {
    id: number;
    name: string;
    percentual: number;
    fixo_por_tx: number;
    saque_fee: number;
    minimo: number;
    maximo: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const emptyForm = { name: '', percentual: '', fixo_por_tx: '', saque_fee: '', minimo: '', maximo: '' };

function FeeModal({ fee, onClose, onSaved }: { fee?: FeeConfig | null; onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const isEditing = !!fee;

    useEffect(() => {
        if (fee) {
            setForm({
                name: fee.name,
                percentual: String(fee.percentual),
                fixo_por_tx: String(fee.fixo_por_tx),
                saque_fee: String(fee.saque_fee),
                minimo: String(fee.minimo),
                maximo: String(fee.maximo),
            });
        }
    }, [fee]);

    const handleChange = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Informe um nome.'); return; }
        setSubmitting(true); setError('');
        try {
            const body = {
                name: form.name.trim(),
                percentual: parseFloat(form.percentual) || 0,
                fixo_por_tx: parseFloat(form.fixo_por_tx) || 0,
                saque_fee: parseFloat(form.saque_fee) || 0,
                minimo: parseFloat(form.minimo) || 0,
                maximo: parseFloat(form.maximo) || 0,
            };
            if (isEditing) {
                await api.put(`/fees/${fee!.id}`, body);
                toast.success('Configuração atualizada!');
            } else {
                await api.post('/fees', body);
                toast.success('Configuração criada!');
            }
            onSaved(); onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao salvar configuração.');
        } finally { setSubmitting(false); }
    };

    return (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="modal-panel max-w-lg" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{isEditing ? 'Editar configuração' : 'Nova configuração'}</span>
                    <button className="btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {error && (
                            <div style={{ padding: 12, borderRadius: 12, background: 'hsl(0 84% 60% / 0.08)', border: '1px solid hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 55%)', fontSize: 13, fontWeight: 500 }}>{error}</div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Nome</label>
                            <input className="input" placeholder="Ex: Padrão, Premium..." value={form.name} onChange={e => handleChange('name', e.target.value)} autoFocus />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="input-group">
                                <label className="input-label">Percentual %</label>
                                <input className="input" type="number" step="0.01" min="0" max="100" placeholder="0.00" value={form.percentual} onChange={e => handleChange('percentual', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Fixo R$/tx</label>
                                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.fixo_por_tx} onChange={e => handleChange('fixo_por_tx', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Saque R$</label>
                                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.saque_fee} onChange={e => handleChange('saque_fee', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Mínimo R$</label>
                                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.minimo} onChange={e => handleChange('minimo', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Máximo R$</label>
                                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.maximo} onChange={e => handleChange('maximo', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div style={{ padding: '0 24px 24px', display: 'flex', gap: 12 }}>
                        <button type="button" className="btn btn-secondary flex-1" onClick={onClose} disabled={submitting}>Cancelar</button>
                        <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                            {submitting ? <div className="spinner-ring" style={{ width: 16, height: 16 }} /> : <><Pencil size={16} /> {isEditing ? 'Salvar' : 'Criar'}</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

function FeeCard({ fee, onClick }: { fee: FeeConfig; onClick: () => void }) {
    return (
        <button className={`card card-glow ${fee.is_active ? 'glow-border' : ''}`} style={{ padding: 20, textAlign: 'left', width: '100%', cursor: 'pointer', background: fee.is_active ? 'linear-gradient(135deg, hsl(142 76% 36% / 0.06) 0%, transparent 60%)' : undefined }} onClick={onClick}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fee.name}</h3>
                <span className={`badge ${fee.is_active ? 'badge-green' : 'badge-muted'}`}>
                    <span className="badge-dot" style={{ background: fee.is_active ? 'hsl(142 76% 36%)' : 'hsl(var(--muted-foreground))' }} />
                    {fee.is_active ? 'Ativa' : 'Inativa'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                    { icon: Percent, label: 'Percentual', value: `${fee.percentual}%`, color: 'hsl(142 76% 36%)' },
                    { icon: DollarSign, label: 'Fixo/tx', value: formatBRL(fee.fixo_por_tx), color: 'hsl(217 91% 60%)' },
                    { icon: ArrowUpDown, label: 'Saque', value: formatBRL(fee.saque_fee), color: 'hsl(262 83% 58%)' },
                    { icon: TrendingUp, label: 'Faixa', value: `${formatBRL(fee.minimo)} - ${formatBRL(fee.maximo)}`, color: 'hsl(38 92% 50%)' },
                ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'hsl(var(--background))', borderRadius: 10, border: '1px solid hsl(var(--border))' }}>
                        <item.icon size={14} style={{ color: item.color, flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', lineHeight: 1 }}>{item.label}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </button>
    );
}

export default function Fees() {
    const [fees, setFees] = useState<FeeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);

    const fetchFees = useCallback(async () => {
        try {
            const { data } = await api.get('/fees');
            const raw = data.fees || data.data || data;
            setFees(Array.isArray(raw) ? raw : []);
        } catch { toast.error('Erro ao carregar configurações de taxa.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchFees(); }, [fetchFees]);

    const openCreate = () => { setEditingFee(null); setShowModal(true); };
    const openEdit = (fee: FeeConfig) => { setEditingFee(fee); setShowModal(true); };
    const handleClose = () => { setShowModal(false); setEditingFee(null); };

    if (loading) {
        return <div className="p-4 sm:p-6 lg:p-8 max-w-[960px]"><div className="spinner"><div className="spinner-ring" /></div></div>;
    }

    return (
        <motion.div className="p-4 sm:p-6 lg:p-8 max-w-[960px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="page-title">Taxas</h1>
                    <p className="page-subtitle">Configure as taxas por transação e saque</p>
                </div>
                <div className="flex items-center gap-4">
                    <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{fees.length} configuração{fees.length !== 1 && 'es'}</span>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nova Configuração</button>
                </div>
            </div>

            {/* Empty State */}
            {fees.length === 0 && (
                <div className="card">
                    <div className="empty-container">
                        <div className="empty-icon"><Settings size={32} style={{ color: 'hsl(var(--muted-foreground))' }} /></div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhuma configuração de taxa</h3>
                        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginBottom: 24, textAlign: 'center', maxWidth: 320 }}>
                            Crie uma configuração para definir percentual, valor fixo e taxas de saque
                        </p>
                        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Criar primeira configuração</button>
                    </div>
                </div>
            )}

            {/* Fee Grid */}
            {fees.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {fees.map((fee, i) => (
                        <motion.div key={fee.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <FeeCard fee={fee} onClick={() => openEdit(fee)} />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && <FeeModal fee={editingFee} onClose={handleClose} onSaved={() => fetchFees()} />}
            </AnimatePresence>
        </motion.div>
    );
}
