import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, CheckCircle, Clock, CreditCard, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBRL, formatDateTime } from '@/lib/format';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import ThemeProvider from '@/components/ThemeProvider';
import { Toaster } from 'react-hot-toast';

interface PayCharge {
  id: number;
  correlation_id: string;
  value: string;
  status: string;
  description: string | null;
  br_code: string | null;
  qr_code_image: string | null;
  payment_link_url: string | null;
  customer_name: string | null;
  expires_at: string | null;
  paid_at: string | null;
  acquirer: { name: string; color: string; logo_url: string | null } | null;
}

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
      <Clock size={16} style={{ color: isUrgent ? 'hsl(0 84% 55%)' : 'hsl(var(--muted-foreground))' }} />
      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Expira em:</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: isUrgent ? 'hsl(0 84% 55%)' : 'hsl(var(--foreground))', fontFamily: 'monospace' }}>{remaining}</span>
    </div>
  );
}

export default function Pay() {
  const { correlationId } = useParams<{ correlationId: string }>();
  const [charge, setCharge] = useState<PayCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!correlationId) return;
    (async () => {
      try {
        const res = await fetch(`/api/public/charge/${correlationId}`);
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        setCharge(data.charge);
      } catch {
        setError('Cobrança não encontrada ou expirada.');
      } finally { setLoading(false); }
    })();
  }, [correlationId]);

  // Poll for status changes
  useEffect(() => {
    if (!charge || !['pending', 'active'].includes(charge.status)) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/charge/${correlationId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.charge.status === 'paid') {
            setCharge(data.charge);
            toast.success('Pagamento confirmado!');
            clearInterval(interval);
          }
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [charge, correlationId]);

  const copyPix = async () => {
    if (!charge?.br_code) return;
    try {
      await navigator.clipboard.writeText(charge.br_code);
      setCopied(true);
      toast.success('PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Erro ao copiar'); }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))' }}>
          <div className="spinner"><div className="spinner-ring" /></div>
        </div>
      </ThemeProvider>
    );
  }

  if (error || !charge) {
    return (
      <ThemeProvider>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))', padding: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Cobrança não encontrada</h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>{error || 'Este link é inválido ou a cobrança já expirou.'}</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  const isPaid = charge.status === 'paid';
  const isExpired = charge.status === 'expired' || (charge.expires_at && new Date(charge.expires_at).getTime() < Date.now());
  const isCancelled = charge.status === 'cancelled';
  const isActive = ['pending', 'active'].includes(charge.status) && !isExpired;

  return (
    <ThemeProvider>
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '13px' } }} />
      <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>FlowinPay</span>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 440, background: 'hsl(var(--card))', borderRadius: 20, border: '1px solid hsl(var(--border))', overflow: 'hidden', boxShadow: '0 8px 32px rgb(0 0 0 / 0.08)' }}>

          {/* Status bar */}
          {isPaid && (
            <div style={{ background: 'hsl(142 76% 36%)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={20} color="#fff" />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Pagamento confirmado!</span>
            </div>
          )}
          {isExpired && !isPaid && (
            <div style={{ background: 'hsl(var(--muted))', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: 'hsl(var(--muted-foreground))' }}>Cobrança expirada</span>
            </div>
          )}
          {isCancelled && (
            <div style={{ background: 'hsl(var(--muted))', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: 'hsl(var(--muted-foreground))' }}>Cobrança cancelada</span>
            </div>
          )}

          {/* Value */}
          <div style={{ padding: '32px 24px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>Valor a pagar</p>
            <p style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>{formatBRL(Number(charge.value))}</p>
            {charge.description && (
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 10 }}>{charge.description}</p>
            )}
          </div>

          {/* Timer */}
          {isActive && charge.expires_at && (
            <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'center' }}>
              <CountdownTimer expiresAt={charge.expires_at} />
            </div>
          )}

          {/* PIX section */}
          {isActive && charge.br_code && (
            <div style={{ padding: '0 24px 28px' }}>
              <div style={{ height: 1, background: 'hsl(var(--border))', marginBottom: 24 }} />

              {/* QR Code */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ display: 'inline-block', padding: 16, background: '#ffffff', borderRadius: 16, boxShadow: '0 4px 20px rgb(0 0 0 / 0.06)', border: '1px solid hsl(var(--border))' }}>
                  <QRCode value={charge.br_code} size={200} bgColor="#ffffff" fgColor="#1a1a2e" level="M" includeMargin={false} />
                </div>
                <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', marginTop: 10 }}>Escaneie com o app do banco</p>
              </div>

              {/* Separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'hsl(var(--muted-foreground))' }}>ou copie o código</span>
                <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              </div>

              {/* Copy button */}
              <button
                onClick={copyPix}
                style={{
                  width: '100%', padding: '14px 20px', borderRadius: 14,
                  background: copied ? 'hsl(142 76% 36%)' : 'hsl(var(--foreground))',
                  color: copied ? '#fff' : 'hsl(var(--background))',
                  border: 'none', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                }}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copied ? 'Copiado!' : 'Copiar código PIX'}
              </button>
            </div>
          )}

          {/* Paid details */}
          {isPaid && (
            <div style={{ padding: '0 24px 28px' }}>
              <div style={{ padding: 16, borderRadius: 14, background: 'hsl(142 76% 36% / 0.08)', border: '1px solid hsl(142 76% 36% / 0.15)', textAlign: 'center' }}>
                <CheckCircle size={32} style={{ color: 'hsl(142 76% 36%)', marginBottom: 8 }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: 'hsl(142 76% 36%)' }}>Pagamento recebido com sucesso!</p>
                {charge.paid_at && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>{formatDateTime(charge.paid_at)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--muted-foreground))' }}>
          <Shield size={14} />
          <span style={{ fontSize: 11 }}>Pagamento seguro via {charge.acquirer?.name || 'PIX'}</span>
        </div>
      </div>
    </ThemeProvider>
  );
}
