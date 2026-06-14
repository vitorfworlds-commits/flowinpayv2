import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle, Code2, BarChart3, Bell,
    Wallet, Server, Shield, Menu, X, Zap, Clock, Globe,
    Fingerprint, BookOpen, Users, ShoppingBag, GraduationCap, Layers,
    CreditCard, Lock, Activity, ChevronRight
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

/* ============================================================
   DATA
   ============================================================ */
const FEATURES = [
    { icon: BarChart3, title: 'Visao total em tempo real', desc: 'Dashboard completo com graficos de receita, taxa de conversao e extrato detalhado. Exportacao CSV e PDF.', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: Code2, title: 'API PIX com Split automatico', desc: 'API REST documentada com exemplos em curl, PHP e Node.js. Split de valores entre contas em tempo real.', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { icon: Wallet, title: 'Vendeu, sacou', desc: 'Transfira saldo para qualquer chave PIX em segundos. Saques 24/7 sem tarifa adicional e sem burocracia.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { icon: Shield, title: 'Blindagem de ponta a ponta', desc: 'Criptografia de ponta a ponta, protecao contra fraudes e conformidade total com a LGPD e BACEN.', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
    { icon: Server, title: 'Conecte com qualquer stack', desc: 'SDKs prontos para PHP, Node.js, Python e qualquer linguagem que suporte HTTP REST. Integre em minutos.', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { icon: Bell, title: 'Webhooks em tempo real', desc: 'Notificacoes instantaneas com assinatura HMAC para seguranca total. Reentrega automatica em caso de falha.', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
];

const STATS = [
    { value: '+R$ 50M', label: 'processados/ano', icon: Zap },
    { value: '+100K', label: 'transacoes/mes', icon: Activity },
    { value: '+2.5K', label: 'empresas ativas', icon: Users },
    { value: '99.9%', label: 'uptime garantido', icon: Globe },
];

const AUDIENCES = [
    { icon: GraduationCap, title: 'Curso Online', desc: 'Receba matriculas e vendas de cursos com PIX instantaneo. Checkout personalizado para cada turma.' },
    { icon: Users, title: 'Mentorias', desc: 'Cobranca recorrente para mentorias e consultorias. Links de pagamento com vencimento automatico.' },
    { icon: BookOpen, title: 'E-books', desc: 'Venda produtos digitais com entrega automatica. Pagamento confirmado em menos de 2 segundos.' },
    { icon: Layers, title: 'Comunidades', desc: 'Gerencie assinaturas de comunidades com PIX. Split automatico entre administradores.' },
    { icon: ShoppingBag, title: 'SaaS', desc: 'Integracao via API para plataformas SaaS. Webhooks para automacao de acesso e renovacao.' },
];

/* ============================================================
   STYLES
   ============================================================ */
const s = {
    container: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
    h2: {
        fontSize: 44, fontWeight: 800, letterSpacing: '-0.035em',
        lineHeight: 1.12, color: '#1a1a2e', fontFamily: "'Outfit', sans-serif",
    },
    subtitle: {
        fontSize: 17, lineHeight: 1.7, maxWidth: 560,
        color: '#6b7280', margin: '0 auto',
        fontFamily: "'DM Sans', sans-serif",
    },
    badge: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 18px', borderRadius: 999,
        fontSize: 13, fontWeight: 600, letterSpacing: 0.01,
    },
    card: {
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
    },
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
            background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            borderBottom: scrolled ? '1px solid #e5e7eb' : '1px solid transparent',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
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
                            boxShadow: '0 2px 12px rgba(22,163,74,0.25)',
                        }}>F</div>
                        <span style={{
                            color: '#1a1a2e', fontWeight: 800, fontSize: 19,
                            fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                        }}>FlowinPay</span>
                    </button>

                    {/* Desktop nav links */}
                    <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[
                            { label: 'Funcionalidades', id: 'features' },
                            { label: 'Precos', id: 'pricing' },
                        ].map(item => (
                            <button key={item.id} onClick={() => scrollTo(item.id)} style={{
                                padding: '9px 18px', borderRadius: 10, background: 'none', border: 'none',
                                color: '#6b7280', fontSize: 14, fontWeight: 500,
                                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                transition: 'all 0.2s ease',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#1a1a2e'; e.currentTarget.style.background = '#f3f4f6'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'none'; }}
                            >{item.label}</button>
                        ))}
                        <button onClick={() => nav('/docs')} style={{
                            padding: '9px 18px', borderRadius: 10, background: 'none', border: 'none',
                            color: '#6b7280', fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#1a1a2e'; e.currentTarget.style.background = '#f3f4f6'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'none'; }}
                        >Docs</button>
                        <button onClick={() => window.open('https://wa.me/5500000000000', '_blank')} style={{
                            padding: '9px 18px', borderRadius: 10, background: 'none', border: 'none',
                            color: '#6b7280', fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#1a1a2e'; e.currentTarget.style.background = '#f3f4f6'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'none'; }}
                        >Suporte</button>
                    </div>

                    {/* Desktop CTA */}
                    <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => nav('/login')} style={{
                            fontSize: 14, color: '#4a4a68', padding: '9px 22px', borderRadius: 10,
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                            background: 'none', border: '1px solid #d1d5db', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'none'; }}
                        >Entrar</button>
                        <button onClick={() => nav('/register')} style={{
                            fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 2px 12px rgba(22,163,74,0.2)',
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.35)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(22,163,74,0.2)'; }}
                        >Criar conta <ArrowRight size={15} /></button>
                    </div>

                    {/* Mobile hamburger */}
                    <button onClick={() => setOpen(!open)} className="landing-mobile-btn"
                        style={{ display: 'none', background: 'none', border: 'none', color: '#1a1a2e', cursor: 'pointer', padding: 8 }}>
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
                                color: '#4a4a68', fontSize: 15, fontWeight: 500,
                                textAlign: 'left', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}>{item === 'features' ? 'Funcionalidades' : 'Precos'}</button>
                        ))}
                        <button onClick={() => { setOpen(false); nav('/docs'); }} style={{
                            padding: '14px 18px', borderRadius: 10, background: 'none', border: 'none',
                            color: '#4a4a68', fontSize: 15, fontWeight: 500,
                            textAlign: 'left', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Docs</button>
                        <button onClick={() => { setOpen(false); window.open('https://wa.me/5500000000000', '_blank'); }} style={{
                            padding: '14px 18px', borderRadius: 10, background: 'none', border: 'none',
                            color: '#4a4a68', fontSize: 15, fontWeight: 500,
                            textAlign: 'left', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Suporte</button>
                        <div style={{ height: 8 }} />
                        <button onClick={() => { setOpen(false); nav('/login'); }} style={{
                            padding: '12px 18px', borderRadius: 10,
                            background: '#f9fafb', border: '1px solid #e5e7eb',
                            color: '#4a4a68', fontSize: 15, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}>Entrar</button>
                        <button onClick={() => { setOpen(false); nav('/register'); }} style={{
                            padding: '13px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontSize: 15, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 2px 12px rgba(22,163,74,0.2)',
                        }}>Criar conta <ArrowRight size={16} /></button>
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
            padding: '160px 24px 100px',
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 50%, #ffffff 100%)',
        }}>
            {/* Subtle top green glow */}
            <div style={{
                position: 'absolute', top: '-20%', left: '20%', width: 800, height: 500,
                borderRadius: '50%', pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 60%)',
                filter: 'blur(80px)',
            }} />

            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 60, flexWrap: 'wrap' }}>
                {/* Left: Text */}
                <div style={{ flex: '1 1 520px', minWidth: 300 }}>
                    <motion.div variants={stagger} initial="hidden" animate="visible">
                        {/* Badge */}
                        <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
                            <div style={{
                                ...s.badge,
                                background: 'rgba(22,163,74,0.08)',
                                border: '1px solid rgba(22,163,74,0.18)',
                                color: '#16a34a',
                            }}>
                                <div style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: '#22c55e',
                                    boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                                }} />
                                Gateway de pagamentos PIX
                            </div>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1 variants={fadeUp} className="landing-h1" style={{
                            fontSize: 56, fontWeight: 800, lineHeight: 1.08,
                            letterSpacing: '-0.04em', marginBottom: 24,
                            color: '#1a1a2e', fontFamily: "'Outfit', sans-serif",
                        }}>
                            A melhor plataforma<br />
                            <span style={{
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #4ade80 100%)',
                                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                para quem recebe online
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p variants={fadeUp} className="landing-hero-sub" style={{
                            fontSize: 18, lineHeight: 1.75, maxWidth: 540,
                            marginBottom: 40, color: '#6b7280',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            Simplifique cobrancas PIX, integre via API e receba pagamentos instantaneos.
                            Tudo em uma plataforma completa para empresarios e desenvolvedores.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div variants={fadeUp} className="landing-cta-wrap" style={{
                            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                        }}>
                            <button onClick={() => nav('/register')} style={{
                                fontSize: 16, padding: '15px 36px', height: 54, borderRadius: 12,
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10,
                                fontFamily: "'DM Sans', sans-serif",
                                boxShadow: '0 4px 20px rgba(22,163,74,0.25)',
                                transition: 'all 0.25s ease',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(22,163,74,0.4)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(22,163,74,0.25)'; }}
                            >Crie sua conta gratis <ArrowRight size={18} /></button>

                            <button onClick={() => nav('/docs')} style={{
                                fontSize: 16, padding: '15px 36px', height: 54, borderRadius: 12,
                                background: '#ffffff',
                                border: '1px solid #d1d5db',
                                color: '#4a4a68', fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10,
                                fontFamily: "'DM Sans', sans-serif",
                                transition: 'all 0.25s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                            ><Code2 size={16} /> Ver documentacao</button>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Right: Balance card mockup */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible"
                    style={{ flex: '1 1 380px', minWidth: 300, display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '100%', maxWidth: 420, borderRadius: 20, padding: 32,
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: "'Outfit', sans-serif",
                                }}>F</div>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', fontFamily: "'Outfit', sans-serif" }}>
                                    Saldo FlowinPay
                                </span>
                            </div>
                            <div style={{
                                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                            }}>Ativo</div>
                        </div>

                        {/* Balance */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
                                Saldo disponivel
                            </div>
                            <div style={{
                                fontSize: 38, fontWeight: 800, color: '#1a1a2e',
                                fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em',
                            }}>
                                R$ 12.450,00
                            </div>
                        </div>

                        {/* Mini stats row */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24,
                        }}>
                            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f0fdf4' }}>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Hoje</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', fontFamily: "'Outfit', sans-serif" }}>R$ 2.340</div>
                            </div>
                            <div style={{ padding: '14px 16px', borderRadius: 12, background: '#eff6ff' }}>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Transacoes</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', fontFamily: "'Outfit', sans-serif" }}>47</div>
                            </div>
                        </div>

                        {/* Saque button */}
                        <button style={{
                            width: '100%', padding: '13px 0', borderRadius: 12,
                            background: '#f9fafb', border: '1px solid #e5e7eb',
                            color: '#4a4a68', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; }}
                        >
                            <Wallet size={16} /> Sacar agora
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   TRUST BAR / LOGOS
   ============================================================ */
function TrustBar() {
    return (
        <motion.section variants={stagger} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            style={{ padding: '60px 24px', background: '#ffffff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
                <motion.p variants={fadeUp} style={{
                    fontSize: 13, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.08em',
                    textTransform: 'uppercase', marginBottom: 32,
                    fontFamily: "'DM Sans', sans-serif",
                }}>
                    A escolha de quem escala com tecnologia
                </motion.p>
                <motion.div variants={fadeUp} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 32, flexWrap: 'wrap',
                }}>
                    {['Woovi', 'NexusPag', 'SyncPay'].map(name => (
                        <div key={name} style={{
                            padding: '14px 32px', borderRadius: 12,
                            background: '#f9fafb', border: '1px solid #f3f4f6',
                            fontSize: 16, fontWeight: 700, color: '#d1d5db',
                            fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
                            userSelect: 'none',
                        }}>
                            {name}
                        </div>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}

/* ============================================================
   FEATURE SHOWCASE (alternating left/right)
   ============================================================ */
function FeatureShowcase() {
    const nav = useNavigate();
    return (
        <section id="features" style={{ padding: '100px 24px 60px', background: '#ffffff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                {/* Feature 1: left text, right visual */}
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 64,
                        marginBottom: 100, flexWrap: 'wrap',
                    }}>
                    {/* Text */}
                    <div style={{ flex: '1 1 440px', minWidth: 300 }}>
                        <div style={{
                            ...s.badge,
                            background: 'rgba(22,163,74,0.06)',
                            border: '1px solid rgba(22,163,74,0.14)',
                            color: '#16a34a',
                            marginBottom: 20,
                        }}>Pagamentos</div>
                        <h2 style={{
                            fontSize: 36, fontWeight: 800, lineHeight: 1.15,
                            letterSpacing: '-0.03em', color: '#1a1a2e',
                            fontFamily: "'Outfit', sans-serif", marginBottom: 18,
                        }}>
                            Link de pagamento<br />para seu negocio
                        </h2>
                        <p style={{
                            fontSize: 16, lineHeight: 1.75, color: '#6b7280',
                            fontFamily: "'DM Sans', sans-serif", marginBottom: 28, maxWidth: 460,
                        }}>
                            Crie cobrancas com segundos via PIX. Customize valores, vencimentos e envie por WhatsApp.
                            Pagamento confirmado em menos de 2 segundos.
                        </p>
                        <button onClick={() => nav('/register')} style={{
                            fontSize: 15, padding: '12px 28px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 2px 12px rgba(22,163,74,0.2)',
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >Crie seu link agora <ArrowRight size={16} /></button>
                    </div>

                    {/* Visual: PIX charge card */}
                    <motion.div variants={scaleIn} style={{ flex: '1 1 380px', minWidth: 300, display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%', maxWidth: 380, borderRadius: 20, padding: 28,
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', fontFamily: "'Outfit', sans-serif" }}>
                                    Cobranca PIX
                                </span>
                                <div style={{
                                    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                    background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                                }}>Ativa</div>
                            </div>
                            {/* QR Code placeholder */}
                            <div style={{
                                width: 160, height: 160, borderRadius: 12, margin: '0 auto 20px',
                                background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid #e5e7eb',
                            }}>
                                <div style={{
                                    width: 120, height: 120, borderRadius: 8,
                                    background: `repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%) 50% / 16px 16px`,
                                    opacity: 0.4,
                                }} />
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Valor</div>
                                <div style={{
                                    fontSize: 32, fontWeight: 800, color: '#1a1a2e',
                                    fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                                }}>R$ 49,90</div>
                            </div>
                            <div style={{
                                padding: '12px 16px', borderRadius: 10, background: '#f9fafb',
                                border: '1px solid #f3f4f6', fontSize: 12, color: '#9ca3af',
                                fontFamily: "'DM Sans', sans-serif",
                                textAlign: 'center',
                            }}>
                                Expira em 30 minutos
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Feature 2: right text, left visual */}
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 64,
                        flexWrap: 'wrap', flexDirection: 'row-reverse',
                    }}>
                    {/* Text */}
                    <div style={{ flex: '1 1 440px', minWidth: 300 }}>
                        <div style={{
                            ...s.badge,
                            background: 'rgba(59,130,246,0.06)',
                            border: '1px solid rgba(59,130,246,0.14)',
                            color: '#3b82f6',
                            marginBottom: 20,
                        }}>Checkout</div>
                        <h2 style={{
                            fontSize: 36, fontWeight: 800, lineHeight: 1.15,
                            letterSpacing: '-0.03em', color: '#1a1a2e',
                            fontFamily: "'Outfit', sans-serif", marginBottom: 18,
                        }}>
                            Checkout transparente<br />e personalizavel
                        </h2>
                        <p style={{
                            fontSize: 16, lineHeight: 1.75, color: '#6b7280',
                            fontFamily: "'DM Sans', sans-serif", marginBottom: 28, maxWidth: 460,
                        }}>
                            Pagina de pagamento otimizada para conversao. QR Code + PIX copia e cola integrados.
                            Design responsivo que funciona em qualquer dispositivo.
                        </p>
                        <button style={{
                            fontSize: 15, padding: '12px 28px', borderRadius: 10,
                            background: '#ffffff',
                            border: '1px solid #d1d5db',
                            color: '#4a4a68', fontWeight: 700, cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                        >Ver personalizacao <ChevronRight size={16} /></button>
                    </div>

                    {/* Visual: Payment page preview */}
                    <motion.div variants={scaleIn} style={{ flex: '1 1 380px', minWidth: 300, display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%', maxWidth: 380, borderRadius: 20, overflow: 'hidden',
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        }}>
                            {/* Browser bar */}
                            <div style={{
                                padding: '12px 16px', background: '#f9fafb',
                                borderBottom: '1px solid #f3f4f6',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fca5a5' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fde68a' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }} />
                                <div style={{
                                    flex: 1, marginLeft: 12, padding: '5px 12px', borderRadius: 6,
                                    background: '#ffffff', border: '1px solid #e5e7eb',
                                    fontSize: 11, color: '#9ca3af', fontFamily: "'DM Sans', sans-serif",
                                }}>pay.flowinpay.com.br/abc123</div>
                            </div>
                            {/* Payment content */}
                            <div style={{ padding: 28, textAlign: 'center' }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 700, color: '#1a1a2e',
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 8,
                                }}>FlowinPay</div>
                                <div style={{
                                    fontSize: 28, fontWeight: 800, color: '#1a1a2e',
                                    fontFamily: "'Outfit', sans-serif", marginBottom: 4,
                                }}>R$ 97,00</div>
                                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                                    Curso de Marketing Digital
                                </div>
                                {/* PIX Copy */}
                                <div style={{
                                    padding: '12px 16px', borderRadius: 10,
                                    background: '#f0fdf4', border: '1px solid #dcfce7',
                                    fontSize: 11, color: '#16a34a', fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif",
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    marginBottom: 16,
                                }}>
                                    <CheckCircle size={14} /> PIX copia e cola
                                </div>
                                {/* Pay button */}
                                <div style={{
                                    padding: '13px 0', borderRadius: 10,
                                    background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                    color: '#fff', fontSize: 14, fontWeight: 700,
                                    fontFamily: "'DM Sans', sans-serif",
                                    boxShadow: '0 2px 12px rgba(22,163,74,0.2)',
                                }}>
                                    Pagar com PIX
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   STATS SECTION
   ============================================================ */
function StatsSection() {
    return (
        <section style={{ padding: '100px 24px', background: '#f8fafc' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <h2 className="landing-h2" style={s.h2}>
                        Confianca que{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>escala</span> com voce
                    </h2>
                    <p style={{ ...s.subtitle, marginTop: 16 }}>
                        Numeros que comprovam a solidez da nossa plataforma.
                    </p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    className="landing-stats-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                    {STATS.map(st => (
                        <motion.div key={st.label} variants={scaleIn} style={{
                            background: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: 16,
                            padding: '36px 24px',
                            textAlign: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: 14, margin: '0 auto 16px',
                                background: 'rgba(22,163,74,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <st.icon size={22} style={{ color: '#16a34a' }} />
                            </div>
                            <div style={{
                                fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em',
                                color: '#1a1a2e', fontFamily: "'Outfit', sans-serif", marginBottom: 6,
                            }}>{st.value}</div>
                            <div style={{
                                fontSize: 14, fontWeight: 500, color: '#6b7280',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>{st.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   FEATURES GRID
   ============================================================ */
function FeaturesGrid() {
    return (
        <section style={{ padding: '100px 24px', background: '#ffffff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <div style={{
                        ...s.badge,
                        background: 'rgba(22,163,74,0.06)',
                        border: '1px solid rgba(22,163,74,0.14)',
                        color: '#16a34a',
                        marginBottom: 24,
                    }}>Funcionalidades</div>
                    <h2 className="landing-h2" style={s.h2}>
                        Tudo que sua operacao precisa{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>para escalar</span>
                    </h2>
                    <p style={{ ...s.subtitle, marginTop: 16 }}>
                        Ferramentas completas para gerenciar, receber e crescer com tecnologia.
                    </p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    className="landing-features-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {FEATURES.map(f => (
                        <motion.div key={f.title} variants={fadeUp} style={{
                            ...s.card,
                            padding: 32,
                            display: 'flex', flexDirection: 'column', gap: 18,
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px ${f.color}15`;
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: f.bg, color: f.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <f.icon size={24} />
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: 17, fontWeight: 700, marginBottom: 8,
                                    color: '#1a1a2e', fontFamily: "'Outfit', sans-serif",
                                    letterSpacing: '-0.01em',
                                }}>{f.title}</h3>
                                <p style={{
                                    fontSize: 14, lineHeight: 1.7, color: '#6b7280',
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
   INTEGRATION / CODE SECTION
   ============================================================ */
function IntegrationSection() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '100px 24px', background: '#f8fafc' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 64,
                        flexWrap: 'wrap',
                    }}>
                    {/* Text */}
                    <div style={{ flex: '1 1 440px', minWidth: 300 }}>
                        <div style={{
                            ...s.badge,
                            background: 'rgba(59,130,246,0.06)',
                            border: '1px solid rgba(59,130,246,0.14)',
                            color: '#3b82f6',
                            marginBottom: 20,
                        }}>Desenvolvedores</div>
                        <h2 style={{
                            fontSize: 36, fontWeight: 800, lineHeight: 1.15,
                            letterSpacing: '-0.03em', color: '#1a1a2e',
                            fontFamily: "'Outfit', sans-serif", marginBottom: 18,
                        }}>
                            Integre do seu jeito
                        </h2>
                        <p style={{
                            fontSize: 16, lineHeight: 1.75, color: '#6b7280',
                            fontFamily: "'DM Sans', sans-serif", marginBottom: 12, maxWidth: 480,
                        }}>
                            API REST completa, SDKs prontos e documentacao feita para quem constrói.
                        </p>
                        <p style={{
                            fontSize: 15, lineHeight: 1.75, color: '#9ca3af',
                            fontFamily: "'DM Sans', sans-serif", marginBottom: 32, maxWidth: 480,
                        }}>
                            Leva minutos pra testar, segundos pra entender.
                        </p>
                        <button onClick={() => nav('/docs')} style={{
                            fontSize: 15, padding: '12px 28px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 2px 12px rgba(22,163,74,0.2)',
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                        >Ver documentacao <ArrowRight size={16} /></button>
                    </div>

                    {/* Code block mockup */}
                    <motion.div variants={scaleIn} style={{ flex: '1 1 440px', minWidth: 300 }}>
                        <div style={{
                            borderRadius: 16, overflow: 'hidden',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                        }}>
                            {/* Tab bar */}
                            <div style={{
                                padding: '12px 16px', background: '#0f172a',
                                borderBottom: '1px solid #334155',
                                display: 'flex', alignItems: 'center', gap: 16,
                            }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                                </div>
                                <span style={{ fontSize: 12, color: '#64748b', fontFamily: "'DM Sans', sans-serif" }}>terminal</span>
                            </div>
                            {/* Code content */}
                            <div style={{ padding: '20px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.8 }}>
                                <div style={{ color: '#64748b' }}>$ <span style={{ color: '#22d3ee' }}>curl</span> <span style={{ color: '#fbbf24' }}>-X POST</span> \</div>
                                <div style={{ color: '#64748b', paddingLeft: 16 }}>https://api.flowinpay.com.br/charges \</div>
                                <div style={{ color: '#64748b', paddingLeft: 16 }}><span style={{ color: '#fbbf24' }}>-H</span> <span style={{ color: '#a5f3fc' }}>"X-Api-Key: sk_live_..."</span> \</div>
                                <div style={{ color: '#64748b', paddingLeft: 16 }}><span style={{ color: '#fbbf24' }}>-H</span> <span style={{ color: '#a5f3fc' }}>"Content-Type: application/json"</span> \</div>
                                <div style={{ color: '#64748b', paddingLeft: 16 }}><span style={{ color: '#fbbf24' }}>-d</span> <span style={{ color: '#a5f3fc' }}>{'{'}</span></div>
                                <div style={{ color: '#64748b', paddingLeft: 32 }}><span style={{ color: '#c4b5fd' }}>"value"</span>: <span style={{ color: '#86efac' }}>49.90</span>,</div>
                                <div style={{ color: '#64748b', paddingLeft: 32 }}><span style={{ color: '#c4b5fd' }}>"acquirer_id"</span>: <span style={{ color: '#86efac' }}>1</span></div>
                                <div style={{ color: '#64748b', paddingLeft: 16 }}><span style={{ color: '#a5f3fc' }}>{'}'}</span></div>
                                <div style={{ marginTop: 12 }}><span style={{ color: '#22c55e' }}>{'// 201 Created'}</span></div>
                                <div><span style={{ color: '#22c55e' }}>{'// QR Code + PIX copia e cola retornados'}</span></div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   AUDIENCE SECTION
   ============================================================ */
function AudienceSection() {
    return (
        <section style={{ padding: '100px 24px', background: '#ffffff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible"
                    viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <h2 className="landing-h2" style={s.h2}>
                        Pra quem e a{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>FlowinPay</span>?
                    </h2>
                    <p style={{ ...s.subtitle, marginTop: 16 }}>
                        Qualquer negocio que vende online se beneficia da nossa plataforma.
                    </p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible"
                    viewport={{ once: true }}
                    className="landing-features-grid"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
                    {AUDIENCES.map(a => (
                        <motion.div key={a.title} variants={fadeUp} style={{
                            ...s.card,
                            padding: '32px 24px',
                            textAlign: 'center',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <div style={{
                                width: 56, height: 56, borderRadius: 16,
                                background: 'rgba(22,163,74,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#16a34a',
                            }}>
                                <a.icon size={26} />
                            </div>
                            <h3 style={{
                                fontSize: 17, fontWeight: 700, color: '#1a1a2e',
                                fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.01em',
                            }}>{a.title}</h3>
                            <p style={{
                                fontSize: 14, lineHeight: 1.7, color: '#6b7280',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>{a.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   CTA SECTION
   ============================================================ */
function CTASection() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '100px 24px' }}>
            <motion.div variants={scaleIn} initial="hidden" whileInView="visible"
                viewport={{ once: true }} style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    borderRadius: 24, padding: '80px 48px',
                    textAlign: 'center', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #047857 100%)',
                    position: 'relative',
                    boxShadow: '0 8px 40px rgba(22,163,74,0.25)',
                }}>
                    {/* Subtle pattern */}
                    <div style={{
                        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
                        backgroundSize: '32px 32px',
                    }} />

                    <div style={{ position: 'relative' }}>
                        <h2 className="landing-h2" style={{
                            fontSize: 42, fontWeight: 800, marginBottom: 18,
                            color: '#ffffff', fontFamily: "'Outfit', sans-serif",
                            letterSpacing: '-0.03em', lineHeight: 1.15,
                        }}>
                            Comece hoje a escalar<br />suas vendas
                        </h2>
                        <p style={{
                            fontSize: 17, maxWidth: 480, margin: '0 auto 40px',
                            lineHeight: 1.7, color: 'rgba(255,255,255,0.8)',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            Junte-se a milhares de empresas. Crie sua conta gratis e receba em segundos.
                        </p>
                        <button onClick={() => nav('/register')} style={{
                            fontSize: 17, padding: '16px 44px', height: 56, borderRadius: 12,
                            background: '#ffffff',
                            color: '#16a34a', fontWeight: 700, border: 'none', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            fontFamily: "'DM Sans', sans-serif",
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            transition: 'all 0.25s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; }}
                        >Criar conta gratis <ArrowRight size={19} /></button>
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
            background: '#0f172a',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div className="landing-footer-grid" style={{
                    display: 'grid', gridTemplateColumns: '1.5fr repeat(4, 1fr)', gap: 40,
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
                            }}>F</div>
                            <span style={{
                                fontSize: 17, fontWeight: 800, color: '#f8fafc',
                                fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                            }}>FlowinPay</span>
                        </div>
                        <p style={{
                            fontSize: 13, lineHeight: 1.7, maxWidth: 260,
                            color: '#64748b',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            Gateway de pagamentos PIX para empresarios e desenvolvedores brasileiros.
                        </p>
                    </div>

                    {/* Link columns */}
                    {[
                        { title: 'Produto', links: [{ label: 'Funcionalidades', id: 'features' }, { label: 'Precos', id: 'pricing' }, { label: 'Documentacao', route: '/docs' }] },
                        { title: 'Empresa', links: [{ label: 'Sobre', id: null }, { label: 'Blog', id: null }, { label: 'Contato', id: null }] },
                        { title: 'Legal', links: [{ label: 'Termos de uso', id: null }, { label: 'Privacidade', id: null }, { label: 'LGPD', id: null }] },
                        { title: 'Suporte', links: [{ label: 'suporte@flowinpay.com.br', id: null }, { label: 'Central de ajuda', id: null }, { label: 'Status', id: null }] },
                    ].map(col => (
                        <div key={col.title}>
                            <h4 style={{
                                fontSize: 12, fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                marginBottom: 20, color: '#94a3b8',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>{col.title}</h4>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, listStyle: 'none', padding: 0, margin: 0 }}>
                                {col.links.map(l => (
                                    <li key={l.label}>
                                        <button onClick={() => {
                                            if (l.id) document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' });
                                            else if (l.route) nav(l.route);
                                        }} style={{
                                            fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
                                            cursor: 'pointer', color: '#64748b', padding: 0,
                                            fontFamily: "'DM Sans', sans-serif",
                                            transition: 'color 0.2s ease',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                        >{l.label}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 28, borderTop: '1px solid #1e293b',
                    flexWrap: 'wrap', gap: 12,
                }}>
                    <p style={{
                        fontSize: 12, color: '#475569',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>&copy; 2026 FlowinPay. Todos os direitos reservados.</p>
                    <span style={{
                        fontSize: 12, color: '#475569',
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
            background: '#ffffff',
            color: '#1a1a2e',
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <Navbar />
            <Hero />
            <TrustBar />
            <FeatureShowcase />
            <StatsSection />
            <FeaturesGrid />
            <IntegrationSection />
            <AudienceSection />
            <CTASection />
            <Footer />
        </div>
    );
}
