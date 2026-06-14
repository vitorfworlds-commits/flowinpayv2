import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle, Code2, BarChart3, Bell,
    Wallet, Server, Shield, Menu, X, Zap, Clock, Globe,
    CreditCard, Lock, ChevronRight, Activity, TrendingUp,
    Layers
} from 'lucide-react';

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.06 } }
};
const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar() {
    const nav = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    const scrollTo = (id: string) => {
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
            transition: 'all 0.3s ease',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', height: 72, alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 900, fontSize: 15,
                            boxShadow: '0 4px 16px rgba(22,163,74,0.25)',
                        }}>F</div>
                        <span style={{ color: '#1a1a2e', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>FlowinPay</span>
                    </button>

                    <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {[
                            { label: 'Funcionalidades', id: 'features' },
                            { label: 'Preços', id: 'pricing' },
                            { label: 'Docs', id: '/docs' },
                        ].map(item => (
                            <button key={item.id} onClick={() => item.id.startsWith('/') ? nav(item.id) : scrollTo(item.id)}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, background: 'none', border: 'none',
                                    color: '#4a4a68', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#16a34a'}
                                onMouseLeave={e => e.currentTarget.style.color = '#4a4a68'}
                            >{item.label}</button>
                        ))}
                    </div>

                    <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => nav('/login')}
                            style={{
                                padding: '8px 20px', borderRadius: 8, background: 'none',
                                border: '1px solid #e2e8f0', color: '#1a1a2e', fontSize: 14,
                                fontWeight: 600, cursor: 'pointer',
                            }}
                        >Entrar</button>
                        <button onClick={() => nav('/register')}
                            style={{
                                padding: '8px 20px', borderRadius: 8,
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                border: 'none', color: '#fff', fontSize: 14,
                                fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(22,163,74,0.2)',
                            }}
                        >Criar conta grátis</button>
                    </div>

                    <button onClick={() => setMenuOpen(!menuOpen)} className="landing-mobile-btn"
                        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#1a1a2e', padding: 8 }}>
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {menuOpen && (
                    <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {['features', 'pricing'].map(id => (
                            <button key={id} onClick={() => scrollTo(id)}
                                style={{ padding: '12px 16px', borderRadius: 8, background: 'none', border: 'none', color: '#4a4a68', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer' }}
                            >{id === 'features' ? 'Funcionalidades' : 'Preços'}</button>
                        ))}
                        <button onClick={() => { setMenuOpen(false); nav('/docs'); }}
                            style={{ padding: '12px 16px', borderRadius: 8, background: 'none', border: 'none', color: '#4a4a68', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer' }}
                        >Documentação</button>
                        <button onClick={() => { setMenuOpen(false); nav('/login'); }}
                            style={{ padding: '12px 16px', borderRadius: 8, background: 'none', border: '1px solid #e2e8f0', color: '#1a1a2e', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
                        >Entrar</button>
                        <button onClick={() => { setMenuOpen(false); nav('/register'); }}
                            style={{ padding: '12px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #059669)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                        >Criar conta grátis</button>
                    </div>
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
            padding: '140px 24px 80px', minHeight: '90vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 40%, #ffffff 100%)',
        }}>
            {/* Decorative gradient orbs */}
            <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="landing-hero-grid">
                    <motion.div variants={stagger} initial="hidden" animate="visible">
                        <motion.div variants={fadeUp} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '6px 16px', borderRadius: 999, marginBottom: 28,
                            background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)',
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'dotPulse 2s ease-in-out infinite' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Gateway de pagamentos PIX</span>
                        </motion.div>

                        <motion.h1 className="landing-h1" variants={fadeUp} style={{
                            fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em',
                            color: '#1a1a2e', marginBottom: 24,
                        }}>
                            A plataforma completa para{' '}
                            <span style={{ background: 'linear-gradient(135deg, #16a34a, #059669)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                receber PIX
                            </span>
                        </motion.h1>

                        <motion.p className="landing-hero-sub" variants={fadeUp} style={{
                            fontSize: 17, lineHeight: 1.7, color: '#6b7280', maxWidth: 500, marginBottom: 36,
                        }}>
                            Crie cobranças PIX instantâneas, integre via API REST e receba pagamentos em segundos. Tudo em uma plataforma segura e escalável.
                        </motion.p>

                        <motion.div variants={fadeUp} className="landing-cta-wrap" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
                            <button onClick={() => nav('/register')} style={{
                                padding: '14px 32px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
                                border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 8px 24px rgba(22,163,74,0.25)',
                                display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                Começar grátis <ArrowRight size={18} />
                            </button>
                            <button onClick={() => nav('/docs')} style={{
                                padding: '14px 28px', borderRadius: 10, background: '#fff',
                                border: '1px solid #e2e8f0', color: '#1a1a2e', fontSize: 15, fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                                <Code2 size={16} /> Ver documentação
                            </button>
                        </motion.div>

                        <motion.div variants={fadeUp} style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            {[
                                { icon: Lock, label: 'SSL / TLS' },
                                { icon: Shield, label: 'LGPD' },
                                { icon: Clock, label: '99.9% uptime' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>
                                    <Icon size={14} style={{ color: '#16a34a' }} />
                                    {label}
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Hero visual — balance card mockup */}
                    <motion.div variants={scaleIn} initial="hidden" animate="visible" className="landing-hero-visual" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%', maxWidth: 420, borderRadius: 20, padding: 32,
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            {/* Subtle grid pattern */}
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 12 }}>F</div>
                                        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>FlowinPay</span>
                                    </div>
                                    <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(22,163,74,0.15)', fontSize: 11, fontWeight: 700, color: '#4ade80' }}>ATIVO</div>
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>Saldo disponível</div>
                                    <div style={{ fontSize: 36, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.02em' }}>R$ 12.450,00</div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Recebido hoje</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>R$ 2.340,00</div>
                                    </div>
                                    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Cobranças</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>47 ativas</div>
                                    </div>
                                </div>

                                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Activity size={16} style={{ color: '#4ade80' }} />
                                        <div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Taxa de conversão</div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4f8' }}>87.3%</div>
                                        </div>
                                    </div>
                                    <TrendingUp size={16} style={{ color: '#4ade80' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/* ============================================================
   STATS
   ============================================================ */
function Stats() {
    return (
        <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            style={{ padding: '0 24px 80px', marginTop: -20, position: 'relative', zIndex: 10 }}>
            <div className="landing-stats-grid" style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                maxWidth: 1000, margin: '0 auto',
            }}>
                {[
                    { value: '+R$ 50M', label: 'processados por ano', icon: TrendingUp, color: '#16a34a' },
                    { value: '+100K', label: 'transações por mês', icon: Activity, color: '#3b82f6' },
                    { value: '+2.5K', label: 'empresas ativas', icon: Layers, color: '#8b5cf6' },
                    { value: '99.9%', label: 'uptime garantido', icon: Shield, color: '#16a34a' },
                ].map(s => (
                    <motion.div key={s.label} variants={fadeUp} style={{
                        background: '#fff', borderRadius: 14, padding: '24px 20px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        textAlign: 'center',
                    }}>
                        <s.icon size={24} style={{ color: s.color, marginBottom: 10 }} />
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', marginBottom: 4 }}>{s.value}</div>
                        <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

/* ============================================================
   FEATURE SHOWCASE (alternating)
   ============================================================ */
function FeatureShowcase() {
    const nav = useNavigate();

    return (
        <section id="features" style={{ padding: '80px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
                    <span style={{
                        display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                        fontSize: 12, fontWeight: 700, marginBottom: 16,
                        background: 'rgba(22,163,74,0.06)', color: '#16a34a',
                        border: '1px solid rgba(22,163,74,0.12)', letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>Funcionalidades</span>
                    <h2 className="landing-h2" style={{ fontSize: 40, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
                        Tudo que você precisa para <span style={{ color: '#16a34a' }}>escalar</span>
                    </h2>
                    <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
                        Da cobrança ao saque, cada etapa foi pensada para simplicidade, velocidade e segurança.
                    </p>
                </motion.div>

                {/* Feature 1: Left text, right visual */}
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginBottom: 80 }}
                    className="landing-feature-row">
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: 'rgba(22,163,74,0.06)', marginBottom: 16 }}>
                            <CreditCard size={14} style={{ color: '#16a34a' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>Cobranças PIX</span>
                        </div>
                        <h3 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            Cobranças PIX instantâneas com QR Code
                        </h3>
                        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>
                            Gere cobranças com valor, expiração e QR Code em segundos. Compartilhe via WhatsApp, email ou integre diretamente na sua plataforma.
                        </p>
                        <button onClick={() => nav('/register')} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #16a34a, #059669)', border: 'none',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Começar agora <ArrowRight size={16} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {/* PIX charge card mockup */}
                        <div style={{
                            width: 320, borderRadius: 16, padding: 24,
                            background: '#fff', border: '1px solid #f1f5f9',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Cobrança PIX</span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(22,163,74,0.08)', color: '#16a34a' }}>ATIVA</span>
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>R$ 49,90</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>Vencimento: 30min</div>
                            {/* QR Code placeholder */}
                            <div style={{
                                width: 140, height: 140, margin: '0 auto 16px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                                border: '2px dashed #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{ width: 100, height: 100, background: 'repeating-conic-gradient(#1a1a2e 0% 25%, #f1f5f9 0% 50%) 50% / 10px 10px', borderRadius: 4 }} />
                            </div>
                            <div style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                00020101021226580014br.gov.bcb.pix...
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Feature 2: Right text, left visual */}
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginBottom: 80 }}
                    className="landing-feature-row">
                    <div style={{ display: 'flex', justifyContent: 'center', order: -1 }}>
                        {/* Dashboard mockup */}
                        <div style={{
                            width: 320, borderRadius: 16, padding: 24,
                            background: '#fff', border: '1px solid #f1f5f9',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>Dashboard</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.04)', border: '1px solid rgba(22,163,74,0.08)' }}>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Hoje</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>R$ 2.340</div>
                                </div>
                                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.08)' }}>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Semana</div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>R$ 14.2k</div>
                                </div>
                            </div>
                            {/* Mini chart placeholder */}
                            <div style={{ height: 60, borderRadius: 8, background: 'linear-gradient(180deg, rgba(22,163,74,0.06) 0%, rgba(22,163,74,0) 100%)', position: 'relative', overflow: 'hidden' }}>
                                <svg viewBox="0 0 280 60" style={{ width: '100%', height: '100%' }}>
                                    <path d="M0,45 C40,40 60,20 100,25 C140,30 160,10 200,15 C240,20 260,5 280,10" fill="none" stroke="#16a34a" strokeWidth="2" />
                                    <path d="M0,45 C40,40 60,20 100,25 C140,30 160,10 200,15 C240,20 260,5 280,10 L280,60 L0,60 Z" fill="url(#greenGrad)" opacity="0.3" />
                                    <defs><linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" /><stop offset="100%" stopColor="#16a34a" stopOpacity="0" /></linearGradient></defs>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', marginBottom: 16 }}>
                            <BarChart3 size={14} style={{ color: '#3b82f6' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>Dashboard</span>
                        </div>
                        <h3 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                            Visão completa em tempo real
                        </h3>
                        <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>
                            Acompanhe receita, taxa de conversão, cobranças e saques em um dashboard intuitivo. Exporte relatórios em CSV.
                        </p>
                        <button onClick={() => nav('/register')} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8,
                            background: '#fff', border: '1px solid #e2e8f0',
                            color: '#1a1a2e', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Ver demonstração <ChevronRight size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ============================================================
   FEATURES GRID
   ============================================================ */
function FeaturesGrid() {
    const FEATURES = [
        { icon: BarChart3, title: 'Visão total em tempo real', desc: 'Dashboard completo com gráficos de receita, taxa de conversão e extrato detalhado.', color: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
        { icon: Code2, title: 'API REST completa', desc: 'Documentação com exemplos em curl, PHP e Node.js. SDKs prontos para integração.', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
        { icon: Wallet, title: 'Saques instantâneos', desc: 'Transfira saldo para qualquer chave PIX em segundos. Saques 24/7 sem tarifa.', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
        { icon: Shield, title: 'Segurança de ponta a ponta', desc: 'Criptografia, proteção contra fraudes e conformidade com LGPD e BACEN.', color: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
        { icon: Server, title: 'Multi-adquirente', desc: 'Conecte múltiplos PSPs com failover automático para maior taxa de aprovação.', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
        { icon: Bell, title: 'Webhooks em tempo real', desc: 'Notificações instantâneas com assinatura HMAC. Reentrega automática em falha.', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    ];

    return (
        <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ padding: '80px 24px', background: '#f8fafc' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <h2 className="landing-h2" style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em', marginBottom: 12 }}>
                        Infraestrutura completa
                    </h2>
                    <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
                        Cada funcionalidade foi construída para performance, segurança e facilidade de uso.
                    </p>
                </motion.div>

                <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {FEATURES.map(f => (
                        <motion.div key={f.title} variants={fadeUp} style={{
                            background: '#fff', borderRadius: 14, padding: '28px 24px',
                            border: '1px solid #f1f5f9',
                            transition: 'all 0.3s ease', cursor: 'default',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${f.bg}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                        >
                            <div style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: f.bg, color: f.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                            }}>
                                <f.icon size={20} />
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{f.title}</h3>
                            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}

/* ============================================================
   API / INTEGRATION
   ============================================================ */
function ApiSection() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '80px 24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="landing-feature-row">
                <div>
                    <span style={{
                        display: 'inline-block', padding: '4px 14px', borderRadius: 999,
                        fontSize: 12, fontWeight: 700, marginBottom: 16,
                        background: 'rgba(59,130,246,0.06)', color: '#3b82f6',
                        border: '1px solid rgba(59,130,246,0.12)', letterSpacing: '0.05em', textTransform: 'uppercase',
                    }}>Para desenvolvedores</span>
                    <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', marginBottom: 16, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                        Integre do seu jeito
                    </h2>
                    <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 24, maxWidth: 460 }}>
                        API REST completa, documentação legível por IA e exemplos em curl, PHP e Node.js. Leva minutos para testar, segundos para entender.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => nav('/docs')} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #16a34a, #059669)', border: 'none',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Ver documentação <ArrowRight size={16} />
                        </button>
                        <button onClick={() => window.open('/docs-ai/index.md', '_blank')} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 8,
                            background: '#fff', border: '1px solid #e2e8f0',
                            color: '#1a1a2e', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            <Code2 size={14} /> Docs para IA
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    {/* Code block mockup */}
                    <div style={{
                        width: 420, borderRadius: 14, overflow: 'hidden',
                        background: '#0f172a', boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                    }}>
                        <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                        </div>
                        <pre style={{ padding: '20px', margin: 0, fontSize: 12, lineHeight: 1.8, color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", overflowX: 'auto' }}>
                            <span style={{ color: '#94a3b8' }}>{'# Criar cobrança PIX'}</span>{'\n'}
                            <span style={{ color: '#f472b6' }}>curl</span> <span style={{ color: '#a78bfa' }}>-X POST</span> \{'\n'}
                            {'  '}<span style={{ color: '#67e8f9' }}>'https://api.flowinpay.com.br{'\n'}{'  '}/v1/charges'</span> \{'\n'}
                            {'  '}<span style={{ color: '#a78bfa' }}>-H</span> <span style={{ color: '#67e8f9' }}>'X-Api-Key: fp_sua_chave'</span> \{'\n'}
                            {'  '}<span style={{ color: '#a78bfa' }}>-H</span> <span style={{ color: '#67e8f9' }}>'Content-Type: application/json'</span> \{'\n'}
                            {'  '}<span style={{ color: '#a78bfa' }}>-d</span> <span style={{ color: '#67e8f9' }}>{'{'}</span>{'\n'}
                            {'    '}<span style={{ color: '#fbbf24' }}>"value"</span>: <span style={{ color: '#4ade80' }}>49.90</span>,{'\n'}
                            {'    '}<span style={{ color: '#fbbf24' }}>"acquirer_id"</span>: <span style={{ color: '#4ade80' }}>1</span>{'\n'}
                            {'  '}<span style={{ color: '#67e8f9' }}>{'}'}</span>
                        </pre>
                    </div>
                </div>
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
        <section id="pricing" style={{ padding: '80px 24px', background: '#f8fafc' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h2 className="landing-h2" style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.03em', marginBottom: 12 }}>
                        Preços simples e transparentes
                    </h2>
                    <p style={{ fontSize: 16, color: '#6b7280' }}>Sem mensalidade. Pague apenas por transação processada.</p>
                </motion.div>

                <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <div style={{
                        background: '#fff', borderRadius: 20, padding: '40px 36px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(22,163,74,0.08)',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #16a34a, #059669)' }} />

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <span style={{
                                    display: 'inline-block', padding: '4px 12px', borderRadius: 6,
                                    fontSize: 12, fontWeight: 700, marginBottom: 12,
                                    background: 'rgba(22,163,74,0.08)', color: '#16a34a',
                                }}>Plataforma</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 48, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em' }}>2.5%</span>
                                    <span style={{ fontSize: 16, fontWeight: 500, color: '#6b7280' }}>por transação</span>
                                </div>
                            </div>
                            <button onClick={() => nav('/register')} style={{
                                padding: '12px 28px', borderRadius: 10,
                                background: 'linear-gradient(135deg, #16a34a, #059669)',
                                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(22,163,74,0.2)',
                            }}>
                                Começar agora <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 6 }} />
                            </button>
                        </div>

                        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 28 }} />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                            {[
                                '2.5% por transação',
                                'R$ 0 taxa de saque',
                                'API completa e documentada',
                                'Webhooks em tempo real',
                                'Dashboard com gráficos',
                                'Suporte prioritário',
                            ].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                                    <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{f}</span>
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
   CTA
   ============================================================ */
function CTA() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '80px 24px' }}>
            <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
                style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{
                    borderRadius: 20, padding: '56px 40px', textAlign: 'center',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative' }}>
                        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#f0f4f8', marginBottom: 16, letterSpacing: '-0.03em' }}>
                            Comece a receber PIX <span style={{ color: '#4ade80' }}>hoje</span>
                        </h2>
                        <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>
                            Crie sua conta gratuita e comece a receber pagamentos em menos de 5 minutos. Sem burocracia.
                        </p>
                        <button onClick={() => nav('/register')} style={{
                            padding: '14px 36px', borderRadius: 10,
                            background: 'linear-gradient(135deg, #16a34a, #059669)',
                            border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
                        }}>
                            Criar conta grátis <ArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} />
                        </button>
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
        <footer style={{ padding: '64px 24px 32px', background: '#0f172a' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 56 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 12 }}>F</div>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>FlowinPay</span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 220, color: '#64748b' }}>
                            Gateway de pagamentos PIX para empresários e desenvolvedores brasileiros.
                        </p>
                    </div>
                    {[
                        { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Documentação'] },
                        { title: 'Empresa', links: ['Sobre', 'Blog', 'Contato'] },
                        { title: 'Legal', links: ['Termos de uso', 'Privacidade', 'LGPD'] },
                    ].map(col => (
                        <div key={col.title}>
                            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, color: '#94a3b8' }}>{col.title}</h4>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                                {col.links.map(l => (
                                    <li key={l}>
                                        <button onClick={() => {
                                            if (l === 'Funcionalidades') document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                            else if (l === 'Preços') document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                                            else if (l === 'Documentação') nav('/docs');
                                        }}
                                            style={{ fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                        >{l}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ fontSize: 12, color: '#475569' }}>© 2026 FlowinPay. Todos os direitos reservados.</p>
                    <span style={{ fontSize: 12, color: '#475569' }}>Brasil</span>
                </div>
            </div>
        </footer>
    );
}

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1a1a2e' }}>
            <Navbar />
            <Hero />
            <Stats />
            <FeatureShowcase />
            <FeaturesGrid />
            <ApiSection />
            <Pricing />
            <CTA />
            <Footer />
        </div>
    );
}
