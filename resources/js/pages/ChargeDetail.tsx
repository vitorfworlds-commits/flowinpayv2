import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, ExternalLink, Clock, CreditCard, Hash, Building2, FileText, Calendar, DollarSign, User, Timer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatBRL, formatDateTime } from '@/lib/format';
import { QRCodeSVG as QRCode } from 'qrcode.react';

interface Charge {
  id: number;
  correlation_id: string;
  value: number | string;
  fee_value: number | string;
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

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Pendente', badge: 'badge-amber', dot: 'bg-amber-500' },
  active: { label: 'Pendente', badge: 'badge-amber', dot: 'bg-amber-500' },
  paid: { label: 'Paga', badge: 'badge-green', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelada', badge: 'badge-red', dot: 'bg-red-500' },
  expired: { label: 'Expirada', badge: 'badge-muted', dot: 'bg-gray-400' },
};

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expirada'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const diff = new Date(expiresAt).getTime() - Date.now();
  const isUrgent = diff > 0 && diff < 600000;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: isUrgent ? 'hsl(0 84% 60% / 0.08)' : 'hsl(var(--muted))', border: `1px solid ${isUrgent ? 'hsl(0 84% 60% / 0.2)' : 'hsl(var(--border))'}` }}>
      <Timer size={16} style={{ color: isUrgent ? 'hsl(0 84% 55%)' : 'hsl(var(--muted-foreground))' }} />
      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Expira em:</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: isUrgent ? 'hsl(0 84% 55%)' : 'hsl(var(--foreground))', fontFamily: 'monospace' }}>{remaining}</span>
    </div>
  );
}

export default function ChargeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/charges/${id}`);
        setCharge(data.charge || data);
      } catch {
        toast.error('Cobrança não encontrada');
        navigate('/charges');
      } finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!charge) return;
    setCancelling(true);
    try {
      await api.post(`/charges/${charge.id}/cancel`);
      toast.success('Cobrança cancelada');
      setCharge({ ...charge, status: 'cancelled' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar');
    } finally { setCancelling(false); }
  };

  const copyPix = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copiado!'); }
    catch { toast.error('Erro ao copiar'); }
  };

  const renderStatus = (status: string) => {
    const s = STATUS_MAP[status] || STATUS_MAP.pending;
    return (
      <span className={`badge ${s.badge}`} style={{ fontSize: 13, padding: '6px 14px' }}>
        <span className={`badge-dot ${s.dot}`} style={{ width: 8, height: 8 }} />
        {s.label}
      </span>
    );
  };

  if (loading) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="spinner"><div className="spinner-ring" /></div></motion.div>;
  }

  if (!charge) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="max-w-[720px] mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back button */}
      <button className="btn btn-ghost" onClick={() => navigate('/charges')}>
        <ArrowLeft size={16} /> Voltar para cobranças
      </button>

      {/* Header */}
      <div>
        <h1 className="page-title">Detalhe da cobrança</h1>
        <p className="page-subtitle font-mono">{charge.correlation_id}</p>
      </div>

      {/* Hero card */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {renderStatus(charge.status)}
              {['pending', 'active'].includes(charge.status) && (
                <button className="btn btn-destructive btn-sm" disabled={cancelling} onClick={handleCancel}>
                  {cancelling ? 'Cancelando...' : 'Cancelar'}
                </button>
              )}
            </div>
            {charge.expires_at && !['paid', 'cancelled', 'expired'].includes(charge.status) && (
              <CountdownTimer expiresAt={charge.expires_at} />
            )}
          </div>
        </div>

        <div style={{ padding: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>Valor da cobrança</p>
          <p style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>{formatBRL(Number(charge.value))}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 28px 28px' }}>
          <div style={{ padding: 18, borderRadius: 14, background: 'hsl(var(--muted))', textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Taxa</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{formatBRL(Number(charge.fee_value))}</p>
          </div>
          <div style={{ padding: 18, borderRadius: 14, background: 'hsl(142 76% 36% / 0.08)', border: '1px solid hsl(142 76% 36% / 0.12)', textAlign: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>Líquido</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: 'hsl(142 76% 40%)' }}>{formatBRL(Number(charge.value) - Number(charge.fee_value))}</p>
          </div>
        </div>
      </motion.div>

      {/* QR Code + PIX Code card */}
      {charge.br_code && (
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ padding: 28 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
            <CreditCard size={16} style={{ color: 'hsl(142 76% 36%)' }} />
            <h3 className="section-title">Pagamento PIX</h3>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'inline-block', padding: 20, background: '#ffffff', borderRadius: 16, boxShadow: '0 4px 24px rgb(0 0 0 / 0.08)', border: '1px solid hsl(var(--border))' }}>
              <QRCode value={charge.br_code} size={220} bgColor="#ffffff" fgColor="#1a1a2e" level="M" includeMargin={false} />
            </div>
            <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 10 }}>Escaneie com o app do banco</p>
          </div>

          <div style={{ height: 1, background: 'hsl(var(--border))', margin: '20px 0' }} />

          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))', marginBottom: 10 }}>PIX Copia e Cola</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
            <pre style={{ flex: 1, fontSize: 11, fontFamily: 'monospace', padding: 14, borderRadius: 12, background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid hsl(var(--border))', maxHeight: 120, overflowY: 'auto' }}>
              {charge.br_code}
            </pre>
            <button className="btn btn-secondary shrink-0" onClick={() => copyPix(charge.br_code)}>
              <Copy size={14} /> Copiar
            </button>
          </div>

          <a href={`/pay/${charge.correlation_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
            <ExternalLink size={16} /> Abrir link de pagamento
          </a>
        </motion.div>
      )}

      {/* Info card */}
      <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: 28 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
          <FileText size={16} style={{ color: 'hsl(142 76% 36%)' }} />
          <h3 className="section-title">Informações</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { icon: <Hash size={15} />, label: 'ID', value: `#${charge.id}`, mono: true },
            { icon: <Hash size={15} />, label: 'Correlation ID', value: charge.correlation_id, mono: true },
            { icon: <Building2 size={15} />, label: 'Adquirente', value: charge.acquirer?.name || '---' },
            { icon: <DollarSign size={15} />, label: 'Valor', value: formatBRL(Number(charge.value)) },
            { icon: <DollarSign size={15} />, label: 'Taxa', value: formatBRL(Number(charge.fee_value)) },
            charge.description ? { icon: <FileText size={15} />, label: 'Descrição', value: charge.description } : null,
            charge.customer_name ? { icon: <User size={15} />, label: 'Cliente', value: charge.customer_name } : null,
            { icon: <Calendar size={15} />, label: 'Criado em', value: formatDateTime(charge.created_at) },
            charge.paid_at ? { icon: <Calendar size={15} />, label: 'Pago em', value: formatDateTime(charge.paid_at), highlight: true } : null,
            charge.expires_at ? { icon: <Clock size={15} />, label: 'Expira em', value: formatDateTime(charge.expires_at) } : null,
          ].filter(Boolean).map((row: any, i) => (
            <div key={i} className="detail-row flex items-center gap-3 py-3" style={{ borderBottom: '1px solid hsl(var(--border))', background: i % 2 === 0 ? 'hsl(var(--muted) / 0.15)' : 'transparent', borderRadius: 4, padding: '12px 8px' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>{row.icon}</span>
              <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', width: 120, flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: row.highlight ? 600 : 500, color: row.highlight ? 'hsl(142 76% 40%)' : 'hsl(var(--foreground))', fontFamily: row.mono ? 'monospace' : 'inherit', marginLeft: 'auto', textAlign: 'right', wordBreak: 'break-all', minWidth: 0 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
