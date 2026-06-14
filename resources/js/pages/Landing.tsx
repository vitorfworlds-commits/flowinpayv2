import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle, Code2, BarChart3, Bell, CreditCard,
    Wallet, Activity, Server, Lock, Shield, Clock, Menu, X,
    Zap, ChevronRight, Globe, Fingerprint
} from 'lucide-react';

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.06 } }
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};
const slideRight = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

/* ============================================================
   DATA
   ============================================================ */
const FEATURES = [
    { icon: CreditCard, title: 'Cobrancas PIX', desc: 'Gere cobrancas com valor, expiracao e QR Code instantaneo. Integracao direta com PSPs brasileiros.', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: Bell, title: 'Webhooks', desc: 'Notificacoes em tempo real com assinatura HMAC para seguranca total. Reentrega automatica em falha.', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { icon: Wallet, title: 'Saques instantaneos', desc: 'Transfira saldo para qualquer chave PIX em segundos. Saques 24/7 sem tarifa adicional.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { icon: Server, title: 'Multi-adquirente', desc: 'Conecte Woovi, NexusPag, SyncPay com failover automatico. Maior taxa de aprovacao.', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { icon: BarChart3, title: 'Dashboard completo', desc: 'Graficos de receita, taxa de conversao e extrato em tempo real. Exportacao CSV/PDF.', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: Code2, title: 'API REST', desc: 'Documentacao completa com exemplos em curl, PHP e Node.js. Sandbox para testes.', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
];

const STATS = [
    { value: 'R$ 0', label: 'taxa de saque', icon: Zap },
    { value: '<2s', label: 'confirmacao', icon: Clock },
    { value: '99.9%', label: 'uptime', icon: Globe },
    { value: 'REST', label: 'API completa', icon: Code2 },
];

const STEPS = [
    { num: '01', icon: Fingerprint, title: 'Crie sua conta', desc: 'Registre-se gratuitamente em menos de 2 minutos. Sem burocracia, sem taxa de adesao.' },
    { num: '02', icon: Code2, title: 'Integre via API', desc: 'Use nossa API REST para criar cobrancas PIX. SDKs prontos para PHP, Node.js e Python.' },
    { num: '03', icon: Activity, title: 'Receba pagamentos', desc: 'Pagamentos confirmados em menos de 2 segundos. Webhooks em tempo real.' },
];

const PRICING = [
    '2.5% por transacao', 'R$ 0 taxa de saque', 'API completa e documentada',
    'Webhooks em tempo real', 'Dashboard com graficos', 'Suporte prioritario',
];

/* ============================================================
   STYLES — reusable inline style objects
   ============================================================ */
const s = {
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
    sectionPad: { padding: '120px 24px' },
    badge: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 18px', borderRadius: 999,
        fontSize: 13, fontWeight: 600, letterSpacing: 0.01,
    },
    h2: {
        fontSize: 44, fontWeight: 800, letterSpacing: '-0.035em',
        lineHeight: 1.12, color: '#f0f4f8',
    },
    subtitle: {
        fontSize: 17, lineHeight: 1.7, maxWidth: 560,
        color: 'rgba(224,232,242,0.5)', margin: '0 auto',
    },
    glass: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
    },
    glowGreen: '0 0 60px rgba(22,163,74,0.12), 0 0 120px rgba(22,163,74,0.06)',
    glowBlue: '0 0 60px rgba(59,130,246,0.1), 0 0 100px rgba(59,130,246,0.05)',
};

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar() {
    const nav = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    const scrollTo = (id: string) => {
        setOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: scrolled ? 'rgba(10,10,15,0.82)' : 'transparent',
            backdropFilter: scrolled ? 'blur(24px) saturate(1.8)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.8)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
                <div style={{ display: 'flex', height: 72, alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 12,
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 4px 20px rgba(22,163,74,0.35)',
                        }}>F</div>
                        <span style={{
                            color: '#f0f4f8', fontWeight: 800, fontSize: 19,
                            fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                        }}>FlowinPay</span>
                    </button>

                    {/* Desktop nav links */}
                    <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[
                            { label: 'Features', id: 'features' },
                            { label: 'Precos', id: 'pricing' },
                        ].map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)} style={{
                                padding: '9px 18px', borderRadius: 10, background: 'none', border: 'none',
                                color: 'rgba(224,232,242,0.55)', fontSize: 14, fontWeight: 500,
                                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                transition: 'all 0.2s ease',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#f0f4f8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(224,232,242,0.55)'; e.currentTarget.style.background = 'none'; }}
                            >{item.label}</button>
                        ))}
                        <button onClick={() => nav('/docs')} style={{
                            padding: '9px 18px', borderRadius: 10, background: 'none', border: 'none',
                            color: 'rgba(224,232,242,0.55)', fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#f0f4f8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(224,232,242,0.55)'; e.currentTarget.style.background = 'none'; }}
                        >Docs</button>
                    </div>

                    {/* Desktop CTA */}
                    <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => nav('/login')} className="btn btn-ghost" style={{
                            fontSize: 14, color: 'rgba(224,232,242,0.6)', padding: '9px 20px', borderRadius: 10,
                            fontFamily: "'DM Sans', sans-serif",
                        }}>Login</button>
                        <button onClick={() => nav('/register')} style={{
                            fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 4px 20px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                        >Comecar <ArrowRight size={15} /></button>
                    </div>

                    {/* Mobile hamburger */}
                    <button onClick={() => setOpen(!open)} className="landing-mobile-btn"
                        style={{ display: 'none', background: 'none', border: 'none', color: '#f0f4f8', cursor: 'pointer', padding: 8 }}>
                        {open ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {open && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ paddingBottom: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {['features', 'pricing'].map(item => (
                            <button key={item} onClick={() => scrollTo(item)} style={{
                                padding: '14px 18px', borderRadius: 10, background: 'none', border: 'none',
                                color: 'rgba(224,232,242,0.6)', fontSize: 15, fontWeight: 500,
                                textAlign: 'left', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}>{item === 'features' ? 'Features' : 'Precos'}</button>
                        ))}
                        <button onClick={() => { setOpen(false); nav('/docs'); }} style={{
                            padding: '14px 18px', borderRadius: 10, background: 'none', border: 'none',
                            color: 'rgba(224,232,242,0.6)', fontSize: 15, fontWeight: 500,
                            textAlign: 'left', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Docs</button>
                        <div style={{ height: 8 }} />
                        <button onClick={() => { setOpen(false); nav('/login'); }} style={{
                            padding: '12px 18px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(224,232,242,0.7)', fontSize: 15, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Login</button>
                        <button onClick={() => { setOpen(false); nav('/register'); }} style={{
                            padding: '13px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontSize: 15, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 4px 20px rgba(22,163,74,0.3)',
                        }}>Comecar agora <ArrowRight size={16} /></button>
                    </motion.div>
                )}
            </div>
        </nav>
    );
}

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
    const nav = useNavigate();
    return (
        <section style={{
            position: 'relative', overflow: 'hidden',
            padding: '160px 24px 100px', textAlign: 'center',
            minHeight: '100vh', display: 'flex', alignItems: 'center',
        }}>
            {/* Background orbs */}
            <div style={{
                position: 'absolute', top: '-15%', left: '10%', width: 700, height: 700,
                borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(22,163,74,0.14) 0%, transparent 60%)',
                filter: 'blur(120px)',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '5%', width: 600, height: 600,
                borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)',
                filter: 'blur(100px)',
            }} />
            <div style={{
                position: 'absolute', top: '30%', right: '25%', width: 400, height: 400,
                borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)',
                filter: 'blur(80px)',
            }} />

            {/* Grid overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '64px 64px',
            }} />

            <div style={{ position: 'relative', maxWidth: 820, margin: '0 auto', width: '100%' }}>
                <motion.div variants={stagger} initial="hidden" animate="visible">
                    {/* Badge */}
                    <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
                        <div style={{
                            ...s.badge,
                            background: 'rgba(22,163,74,0.08)',
                            border: '1px solid rgba(22,163,74,0.18)',
                            color: '#4ade80',
                        }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#22c55e',
                                boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                                animation: 'dotPulse 2s ease-in-out infinite',
                            }} />
                            Gateway de pagamentos PIX
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={fadeUp} className="landing-h1" style={{
                        fontSize: 58, fontWeight: 900, lineHeight: 1.06,
                        letterSpacing: '-0.045em', marginBottom: 28,
                        color: '#f0f4f8', fontFamily: "'Outfit', sans-serif",
                    }}>
                        Receba pagamentos PIX{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #4ade80 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundSize: '200% 200%',
                        }}>
                            de forma simples
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p variants={fadeUp} className="landing-hero-sub" style={{
                        fontSize: 18, lineHeight: 1.7, maxWidth: 620,
                        margin: '0 auto 48px', color: 'rgba(224,232,242,0.48)',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>
                        Plataforma completa para empresarios e desenvolvedores. PIX instantaneo,
                        API REST, webhooks e saques automaticos. Integre em minutos, receba em segundos.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div variants={fadeUp} className="landing-cta-wrap" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 16, marginBottom: 56, flexWrap: 'wrap',
                    }}>
                        <button onClick={() => nav('/register')} style={{
                            fontSize: 16, padding: '15px 36px', height: 54, borderRadius: 14,
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 4px 24px rgba(22,163,74,0.35), 0 0 60px rgba(22,163,74,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
                            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(22,163,74,0.5), 0 0 80px rgba(22,163,74,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.35), 0 0 60px rgba(22,163,74,0.1), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                        >Comecar gratis <ArrowRight size={18} /></button>

                        <button onClick={() => nav('/docs')} style={{
                            fontSize: 16, padding: '15px 36px', height: 54, borderRadius: 14,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(224,232,242,0.75)', fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#f0f4f8'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(224,232,242,0.75)'; }}
                        ><Code2 size={16} /> Ver documentacao</button>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div variants={stagger} style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                        justifyContent: 'center', gap: '16px 32px',
                    }}>
                        {[
                            { icon: Lock, label: 'SSL / TLS' },
                            { icon: Shield, label: 'LGPD' },
                            { icon: Clock, label: '99.9% uptime' },
                        ].map(({ icon: Icon, label }) => (
                            <motion.div key={label} variants={fadeUp} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 13, fontWeight: 500,
                                color: 'rgba(224,232,242,0.35)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>
                                <Icon size={14} style={{ color: 'rgba(22,163,74,0.6)' }} />
                                {label}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   STATS BAR
   ============================================================ */
function StatsBar() {
    return (
        <motion.section variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            style={{ maxWidth: 1000, margin: '-40px auto 0', padding: '0 24px', position: 'relative', zIndex: 10 }}>
            <div className="landing-stats-grid" style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                borderRadius: 20, overflow: 'hidden',
                ...s.glass,
                boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 0 80px rgba(22,163,74,0.05)',
            }}>
                {STATS.map((st, i) => (
                    <motion.div key={st.label} variants={scaleIn} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '32px 20px',
                        borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        position: 'relative',
                    }}>
                        <st.icon size={18} style={{ color: 'rgba(22,163,74,0.5)', marginBottom: 12 }} />
                        <div style={{
                            fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em',
                            marginBottom: 6, fontFamily: "'Outfit', sans-serif",
                            background: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>{st.value}</div>
                        <div style={{
                            fontSize: 13, fontWeight: 500,
                            color: 'rgba(224,232,242,0.4)',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>{st.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

/* ============================================================
   FEATURES
   ============================================================ */
function Features() {
    return (
        <section id="features" style={{ padding: '120px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 72 }}>
                    <div style={{
                        ...s.badge,
                        background: 'rgba(22,163,74,0.06)',
                        border: '1px solid rgba(22,163,74,0.14)',
                        color: '#4ade80',
                        marginBottom: 24,
                    }}>Funcionalidades</div>
                    <h2 className="landing-h2" style={s.h2}>
                        Tudo que voce precisa para{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #4ade80 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>receber PIX</span>
                    </h2>
                    <p style={{ ...s.subtitle, marginTop: 16 }}>
                        Infraestrutura completa de pagamentos com foco em simplicidade, velocidade e seguranca.
                    </p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    className="landing-features-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {FEATURES.map(f => (
                        <motion.div key={f.title} variants={fadeUp} className="card card-glow" style={{
                            padding: 32, display: 'flex', flexDirection: 'column', gap: 18,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = `${f.color}30`;
                                e.currentTarget.style.boxShadow = `0 0 40px ${f.color}15, 0 12px 40px rgba(0,0,0,0.2)`;
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: f.bg,
                                border: `1px solid ${f.color}20`,
                                color: f.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <f.icon size={24} />
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: 17, fontWeight: 700, marginBottom: 8,
                                    color: '#f0f4f8', fontFamily: "'Outfit', sans-serif",
                                    letterSpacing: '-0.01em',
                                }}>{f.title}</h3>
                                <p style={{
                                    fontSize: 14, lineHeight: 1.7,
                                    color: 'rgba(224,232,242,0.45)',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}>{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */
function HowItWorks() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '120px 24px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 72 }}>
                    <div style={{
                        ...s.badge,
                        background: 'rgba(59,130,246,0.06)',
                        border: '1px solid rgba(59,130,246,0.14)',
                        color: '#60a5fa',
                        marginBottom: 24,
                    }}>Como funciona</div>
                    <h2 className="landing-h2" style={s.h2}>
                        Tres passos para{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>comecar</span>
                    </h2>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    className="landing-steps-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                    {STEPS.map((step, idx) => (
                        <motion.div key={step.num} variants={scaleIn} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            textAlign: 'center', position: 'relative',
                        }}>
                            {/* Large numbered circle */}
                            <div style={{
                                width: 108, height: 108, borderRadius: 24,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 28, position: 'relative',
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)',
                                border: '1px solid rgba(59,130,246,0.12)',
                            }}>
                                <step.icon size={32} style={{ color: '#60a5fa' }} />
                                {/* Number badge */}
                                <div style={{
                                    position: 'absolute', top: -10, right: -10,
                                    width: 36, height: 36, borderRadius: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 900, color: '#fff',
                                    fontFamily: "'Outfit', sans-serif",
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                    boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                                }}>{step.num}</div>
                            </div>

                            {/* Connector line (between steps) */}
                            {idx < 2 && (
                                <div style={{
                                    position: 'absolute', top: 54, left: 'calc(50% + 60px)',
                                    width: 'calc(100% - 120px)', height: 1,
                                    background: 'linear-gradient(90deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                                }} />
                            )}

                            <h3 style={{
                                fontSize: 18, fontWeight: 700, marginBottom: 10,
                                color: '#f0f4f8', fontFamily: "'Outfit', sans-serif",
                                letterSpacing: '-0.01em',
                            }}>{step.title}</h3>
                            <p style={{
                                fontSize: 14, lineHeight: 1.7, maxWidth: 300,
                                color: 'rgba(224,232,242,0.45)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>{step.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ display: 'flex', justifyContent: 'center', marginTop: 56 }}>
                    <button onClick={() => nav('/register')} style={{
                        fontSize: 15, padding: '13px 32px', height: 50, borderRadius: 14,
                        background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                        color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: '0 4px 24px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
                        transition: 'all 0.25s ease',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >Comecar agora <ArrowRight size={17} /></button>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   PRICING
   ============================================================ */
function Pricing() {
    const nav = useNavigate();
    return (
        <section id="pricing" style={{ padding: '120px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 72 }}>
                    <div style={{
                        ...s.badge,
                        background: 'rgba(139,92,246,0.06)',
                        border: '1px solid rgba(139,92,246,0.14)',
                        color: '#a78bfa',
                        marginBottom: 24,
                    }}>Precos</div>
                    <h2 className="landing-h2" style={s.h2}>
                        Simples e{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>transparente</span>
                    </h2>
                    <p style={{ ...s.subtitle, marginTop: 16 }}>
                        Sem mensalidade. Pague apenas por transacao processada.
                    </p>
                </motion.div>

                <motion.div variants={scaleIn} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ position: 'relative' }}>
                    {/* Outer glow */}
                    <div style={{
                        position: 'absolute', inset: -16, borderRadius: 28, opacity: 0.5,
                        pointerEvents: 'none',
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(22,163,74,0.15), transparent 70%)',
                        filter: 'blur(50px)',
                    }} />

                    <div style={{
                        position: 'relative', borderRadius: 20, padding: 44,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(22,163,74,0.2)',
                        boxShadow: '0 0 60px rgba(22,163,74,0.08), 0 12px 48px rgba(0,0,0,0.2)',
                    }}>
                        {/* Header row */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                            gap: 20, marginBottom: 36, flexWrap: 'wrap',
                        }}>
                            <div>
                                <div style={{
                                    display: 'inline-flex', padding: '6px 16px', borderRadius: 999,
                                    fontSize: 12, fontWeight: 700, marginBottom: 16,
                                    background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                    color: '#fff', letterSpacing: 0.02,
                                    fontFamily: "'DM Sans', sans-serif",
                                    textTransform: 'uppercase',
                                }}>Plataforma</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                                    <span style={{
                                        fontSize: 56, fontWeight: 900, letterSpacing: '-0.03em',
                                        color: '#f0f4f8', fontFamily: "'Outfit', sans-serif",
                                    }}>2.5%</span>
                                    <span style={{
                                        fontSize: 17, fontWeight: 500,
                                        color: 'rgba(224,232,242,0.4)',
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}>por transacao</span>
                                </div>
                            </div>
                            <button onClick={() => nav('/register')} style={{
                                fontSize: 15, padding: '13px 32px', height: 50, borderRadius: 14,
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10,
                                fontFamily: "'DM Sans', sans-serif",
                                boxShadow: '0 4px 24px rgba(22,163,74,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
                                transition: 'all 0.25s ease',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                            >Comecar agora <ArrowRight size={17} /></button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, marginBottom: 36, background: 'rgba(255,255,255,0.06)' }} />

                        {/* Features grid */}
                        <div className="landing-pricing-features" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
                        }}>
                            {PRICING.map(f => (
                                <div key={f} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 0',
                                }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: 7,
                                        background: 'rgba(22,163,74,0.12)',
                                        border: '1px solid rgba(22,163,74,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <CheckCircle size={13} style={{ color: '#4ade80' }} />
                                    </div>
                                    <span style={{
                                        fontSize: 14, fontWeight: 500,
                                        color: 'rgba(224,232,242,0.7)',
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   CTA SECTION
   ============================================================ */
function CTA() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '120px 24px' }}>
            <motion.div variants={scaleIn} initial="hidden" whileInView="visible"
                viewport={{ once: true }} style={{ position: 'relative', maxWidth: 860, margin: '0 auto' }}>
                {/* Outer glow */}
                <div style={{
                    position: 'absolute', inset: -30, borderRadius: 28, pointerEvents: 'none',
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(22,163,74,0.12), transparent 70%)',
                    filter: 'blur(70px)',
                }} />

                <div style={{
                    position: 'relative', borderRadius: 20, padding: '72px 48px',
                    textAlign: 'center', overflow: 'hidden',
                    background: 'linear-gradient(135deg, rgba(10,10,15,0.9) 0%, rgba(15,20,25,0.95) 100%)',
                    border: '1px solid rgba(22,163,74,0.15)',
                }}>
                    {/* Grid overlay */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }} />

                    <div style={{ position: 'relative' }}>
                        <h2 className="landing-h2" style={{
                            ...s.h2, fontSize: 44, marginBottom: 18,
                        }}>
                            Pronto para{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #4ade80 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>receber PIX</span>?
                        </h2>
                        <p style={{
                            fontSize: 17, maxWidth: 500, margin: '0 auto 40px',
                            lineHeight: 1.7, color: 'rgba(224,232,242,0.45)',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            Crie sua conta gratuita e comece a receber pagamentos em menos de 5 minutos.
                        </p>
                        <button onClick={() => nav('/register')} style={{
                            fontSize: 17, padding: '16px 44px', height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 4px 28px rgba(22,163,74,0.4), 0 0 80px rgba(22,163,74,0.1), inset 0 1px 0 rgba(255,255,255,0.15)',
                            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(22,163,74,0.55), 0 0 100px rgba(22,163,74,0.15), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 28px rgba(22,163,74,0.4), 0 0 80px rgba(22,163,74,0.1), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                        >Comecar agora <ArrowRight size={19} /></button>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
    const nav = useNavigate();
    return (
        <footer style={{
            padding: '80px 24px 36px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, transparent 0%, rgba(22,163,74,0.02) 100%)',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div className="landing-footer-grid" style={{
                    display: 'grid', gridTemplateColumns: '1.5fr repeat(3, 1fr)', gap: 48,
                    marginBottom: 64,
                }}>
                    {/* Brand column */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 10,
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 900, fontSize: 14,
                                fontFamily: "'Outfit', sans-serif",
                                boxShadow: '0 4px 16px rgba(22,163,74,0.25)',
                            }}>F</div>
                            <span style={{
                                fontSize: 17, fontWeight: 800, color: '#f0f4f8',
                                fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                            }}>FlowinPay</span>
                        </div>
                        <p style={{
                            fontSize: 13, lineHeight: 1.7, maxWidth: 260,
                            color: 'rgba(224,232,242,0.35)',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            Gateway de pagamentos PIX para empresarios e desenvolvedores brasileiros.
                        </p>
                    </div>

                    {/* Link columns */}
                    {[
                        { title: 'Produto', links: ['Features', 'Precos', 'Documentacao'] },
                        { title: 'Empresa', links: ['Sobre', 'Blog', 'Contato'] },
                        { title: 'Legal', links: ['Termos de uso', 'Privacidade', 'LGPD'] },
                    ].map(col => (
                        <div key={col.title}>
                            <h4 style={{
                                fontSize: 12, fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                marginBottom: 20, color: 'rgba(224,232,242,0.6)',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>{col.title}</h4>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, listStyle: 'none', padding: 0, margin: 0 }}>
                                {col.links.map(l => (
                                    <li key={l}>
                                        <button onClick={() => {
                                            if (l === 'Features') document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                            else if (l === 'Precos') document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                                            else if (l === 'Documentacao') nav('/docs');
                                        }} style={{
                                            fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
                                            cursor: 'pointer', color: 'rgba(224,232,242,0.35)', padding: 0,
                                            fontFamily: "'DM Sans', sans-serif",
                                            transition: 'color 0.2s ease',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(224,232,242,0.8)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(224,232,242,0.35)'}
                                        >{l}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)',
                    flexWrap: 'wrap', gap: 12,
                }}>
                    <p style={{
                        fontSize: 12, color: 'rgba(224,232,242,0.25)',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>&copy; 2026 FlowinPay. Todos os direitos reservados.</p>
                    <span style={{
                        fontSize: 12, color: 'rgba(224,232,242,0.25)',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>Brasil</span>
                </div>
            </div>
        </footer>
    );
}

/* ============================================================
   EXPORT
   ============================================================ */
export default function Landing() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            color: '#f0f4f8',
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <Navbar />
            <Hero />
            <StatsBar />
            <Features />
            <HowItWorks />
            <Pricing />
            <CTA />
            <Footer />
        </div>
    );
}
