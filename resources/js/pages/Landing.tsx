import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle, Code2, BarChart3, Bell, CreditCard,
    Wallet, Activity, Server, Lock, Shield, Clock, Menu, X
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const FEATURES = [
    { icon: CreditCard, title: 'Cobran\u00e7as PIX', desc: 'Gere cobran\u00e7as com valor, expira\u00e7\u00e3o e QR Code instant\u00e2neo.', color: '142 76% 36%' },
    { icon: Bell, title: 'Webhooks', desc: 'Notifica\u00e7\u00f5es em tempo real com assinatura HMAC para seguran\u00e7a.', color: '217 91% 60%' },
    { icon: Wallet, title: 'Saques instant\u00e2neos', desc: 'Transfira saldo para qualquer chave PIX em segundos.', color: '262 83% 58%' },
    { icon: Server, title: 'Multi-adquirente', desc: 'Conecte Woovi, NexusPag, SyncPay com failover autom\u00e1tico.', color: '38 92% 50%' },
    { icon: BarChart3, title: 'Dashboard completo', desc: 'Gr\u00e1ficos de receita, taxa de convers\u00e3o e extrato em tempo real.', color: '142 76% 36%' },
    { icon: Code2, title: 'API REST', desc: 'Documenta\u00e7\u00e3o completa com exemplos em curl, PHP e Node.js.', color: '217 91% 60%' },
];

const STATS = [
    { value: 'R$ 0', label: 'taxa de saque' },
    { value: '<2s', label: 'confirma\u00e7\u00e3o' },
    { value: '99.9%', label: 'uptime' },
    { value: 'API REST', label: 'completa' },
];

const STEPS = [
    { num: '01', icon: CreditCard, title: 'Crie sua conta', desc: 'Registre-se gratuitamente em menos de 2 minutos.' },
    { num: '02', icon: Code2, title: 'Integre via API', desc: 'Use nossa API REST para criar cobran\u00e7as PIX.' },
    { num: '03', icon: Activity, title: 'Receba pagamentos', desc: 'Pagamentos confirmados em menos de 2 segundos.' },
];

const PRICING = [
    '2.5% por transa\u00e7\u00e3o', 'R$ 0 taxa de saque', 'API completa e documentada',
    'Webhooks em tempo real', 'Dashboard com gr\u00e1ficos', 'Suporte priorit\u00e1rio',
];

function Navbar() {
    const nav = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    const scrollTo = (id: string) => { setOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
            background: scrolled ? 'hsl(224 45% 5% / 0.88)' : 'transparent',
            backdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'none',
            borderBottom: scrolled ? '1px solid hsl(220 25% 14% / 0.6)' : '1px solid transparent',
            transition: 'all 0.3s',
        }}>
            <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
                <div style={{ display: 'flex', height: 64, alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 12, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 16px hsl(142 76% 36% / 0.3)' }}>F</div>
                        <span style={{ color: 'hsl(210 40% 96%)', fontWeight: 700, fontSize: 16 }}>FlowinPay</span>
                    </button>

                    {/* Desktop nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {['features', 'pricing'].map(item => (
                            <button key={item} onClick={() => scrollTo(item)}
                                style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: 'none', color: 'hsl(215 18% 55%)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'hsl(210 40% 96%)'; e.currentTarget.style.background = 'hsl(220 30% 13%)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'hsl(215 18% 55%)'; e.currentTarget.style.background = 'none'; }}
                            >
                                {item === 'features' ? 'Features' : 'Pre\u00e7os'}
                            </button>
                        ))}
                        <button onClick={() => nav('/docs')} style={{ padding: '8px 14px', borderRadius: 8, background: 'none', border: 'none', color: 'hsl(215 18% 55%)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'hsl(210 40% 96%)'; e.currentTarget.style.background = 'hsl(220 30% 13%)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'hsl(215 18% 55%)'; e.currentTarget.style.background = 'none'; }}
                        >Docs</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => nav('/login')} className="btn btn-ghost" style={{ fontSize: 13, color: 'hsl(215 18% 55%)' }}>Login</button>
                        <button onClick={() => nav('/register')} className="btn btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>Come\u00e7ar <ArrowRight size={14} /></button>
                    </div>

                    {/* Mobile hamburger */}
                    <button onClick={() => setOpen(!open)} style={{ display: 'none', background: 'none', border: 'none', color: 'hsl(210 40% 96%)', cursor: 'pointer', padding: 8 }}
                        className="landing-mobile-btn"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {open && (
                    <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {['features', 'pricing'].map(item => (
                            <button key={item} onClick={() => scrollTo(item)}
                                style={{ padding: '12px 16px', borderRadius: 8, background: 'none', border: 'none', color: 'hsl(215 18% 55%)', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer' }}
                            >{item === 'features' ? 'Features' : 'Pre\u00e7os'}</button>
                        ))}
                        <button onClick={() => { setOpen(false); nav('/docs'); }} style={{ padding: '12px 16px', borderRadius: 8, background: 'none', border: 'none', color: 'hsl(215 18% 55%)', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer' }}>Docs</button>
                        <button onClick={() => { setOpen(false); nav('/login'); }} className="btn btn-secondary" style={{ fontSize: 14 }}>Login</button>
                        <button onClick={() => { setOpen(false); nav('/register'); }} className="btn btn-primary" style={{ fontSize: 14 }}>Come\u00e7ar agora <ArrowRight size={14} /></button>
                    </div>
                )}
            </div>
        </nav>
    );
}

function Hero() {
    const nav = useNavigate();
    return (
        <section style={{ position: 'relative', overflow: 'hidden', padding: '120px 24px 80px', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: '-10%', left: '15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, hsl(142 76% 36% / 0.12) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, hsl(217 91% 60% / 0.08) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', maxWidth: 768, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 32, background: 'hsl(142 76% 36% / 0.1)', border: '1px solid hsl(142 76% 36% / 0.2)', color: 'hsl(142 76% 45%)' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(142 76% 36%)', animation: 'dotPulse 2s ease-in-out infinite' }} />
                        Gateway de pagamentos PIX
                    </div>

                    <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 24, color: 'hsl(210 40% 96%)' }}>
                        Receba pagamentos PIX{' '}
                        <span style={{ background: 'linear-gradient(135deg, hsl(142 76% 40%), hsl(160 84% 42%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            de forma simples
                        </span>
                    </h1>

                    <p style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 40px', color: 'hsl(215 18% 50%)' }}>
                        Plataforma completa para empres\u00e1rios e desenvolvedores. PIX instant\u00e2neo, API REST, webhooks e saques autom\u00e1ticos. Integre em minutos, receba em segundos.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 48, flexWrap: 'wrap' }}>
                        <button onClick={() => nav('/register')} className="btn btn-primary" style={{ fontSize: 16, padding: '12px 32px', height: 48 }}>Come\u00e7ar gr\u00e1tis <ArrowRight size={18} /></button>
                        <button onClick={() => nav('/docs')} className="btn btn-secondary" style={{ fontSize: 16, padding: '12px 32px', height: 48, background: 'hsl(220 30% 11%)', borderColor: 'hsl(220 25% 18%)', color: 'hsl(210 40% 80%)' }}>
                            <Code2 size={16} /> Ver documenta\u00e7\u00e3o
                        </button>
                    </div>

                    <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px 24px' }}>
                        {[
                            { icon: Lock, label: 'SSL / TLS' },
                            { icon: Shield, label: 'LGPD' },
                            { icon: Clock, label: '99.9% uptime' },
                        ].map(({ icon: Icon, label }) => (
                            <motion.div key={label} variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'hsl(215 18% 45%)' }}>
                                <Icon size={13} style={{ color: 'hsl(142 76% 40%)' }} />
                                {label}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

function StatsBar() {
    return (
        <motion.section variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            style={{ maxWidth: 960, margin: '0 auto 80px', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderRadius: 16, overflow: 'hidden', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                {STATS.map((s, i) => (
                    <motion.div key={s.label} variants={fadeUp}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', borderRight: i < 3 ? '1px solid hsl(var(--border))' : 'none' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'hsl(215 18% 50%)' }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

function Features() {
    return (
        <section id="features" style={{ padding: '80px 24px' }}>
            <div style={{ maxWidth: 1152, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 20, background: 'hsl(142 76% 36% / 0.08)', border: '1px solid hsl(142 76% 36% / 0.15)', color: 'hsl(142 76% 45%)' }}>
                        Funcionalidades
                    </div>
                    <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'hsl(210 40% 96%)' }}>
                        Tudo que voc\u00ea precisa para{' '}
                        <span style={{ background: 'linear-gradient(135deg, hsl(142 76% 40%), hsl(160 84% 42%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>receber PIX</span>
                    </h2>
                    <p style={{ fontSize: 16, maxWidth: 540, margin: '0 auto', lineHeight: 1.6, color: 'hsl(215 18% 50%)' }}>
                        Infraestrutura completa de pagamentos com foco em simplicidade, velocidade e seguran\u00e7a.
                    </p>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    {FEATURES.map(f => (
                        <motion.div key={f.title} variants={fadeUp} className="card card-glow" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, background: 'hsl(var(--card))' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `hsl(${f.color} / 0.12)`, color: `hsl(${f.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <f.icon size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'hsl(210 40% 96%)' }}>{f.title}</h3>
                                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'hsl(215 18% 50%)' }}>{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function HowItWorks() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '80px 24px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 20, background: 'hsl(217 91% 60% / 0.08)', border: '1px solid hsl(217 91% 60% / 0.15)', color: 'hsl(217 91% 60%)' }}>
                        Como funciona
                    </div>
                    <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', color: 'hsl(210 40% 96%)' }}>
                        Tr\u00eas passos para{' '}
                        <span style={{ background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(262 83% 58%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>come\u00e7ar</span>
                    </h2>
                </motion.div>

                <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32 }}>
                    {STEPS.map(s => (
                        <motion.div key={s.num} variants={scaleIn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: 96, height: 96, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative', background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.1), hsl(142 71% 45% / 0.05))', border: '1px solid hsl(142 76% 36% / 0.15)' }}>
                                <s.icon size={28} style={{ color: 'hsl(142 76% 40%)' }} />
                                <div style={{ position: 'absolute', top: -8, right: -8, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))', boxShadow: '0 4px 12px hsl(142 76% 36% / 0.3)' }}>
                                    {s.num}
                                </div>
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'hsl(210 40% 96%)' }}>{s.title}</h3>
                            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, color: 'hsl(215 18% 50%)' }}>{s.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
                    <button onClick={() => nav('/register')} className="btn btn-primary" style={{ fontSize: 14, padding: '10px 28px', height: 44 }}>Come\u00e7ar agora <ArrowRight size={16} /></button>
                </motion.div>
            </div>
        </section>
    );
}

function Pricing() {
    const nav = useNavigate();
    return (
        <section id="pricing" style={{ padding: '80px 24px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, marginBottom: 20, background: 'hsl(262 83% 58% / 0.08)', border: '1px solid hsl(262 83% 58% / 0.15)', color: 'hsl(262 83% 58%)' }}>
                        Pre\u00e7os
                    </div>
                    <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'hsl(210 40% 96%)' }}>
                        Simples e{' '}
                        <span style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(217 91% 60%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>transparente</span>
                    </h2>
                    <p style={{ fontSize: 16, maxWidth: 480, margin: '0 auto', lineHeight: 1.6, color: 'hsl(215 18% 50%)' }}>
                        Sem mensalidade. Pague apenas por transa\u00e7\u00e3o processada.
                    </p>
                </motion.div>

                <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: -12, borderRadius: 24, opacity: 0.4, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, hsl(142 76% 36% / 0.15), transparent 70%)', filter: 'blur(40px)' }} />
                    <div style={{ position: 'relative', borderRadius: 16, padding: 40, background: 'hsl(var(--card))', border: '1px solid hsl(142 76% 36% / 0.2)', boxShadow: '0 0 40px hsl(142 76% 36% / 0.06), 0 8px 40px rgb(0 0 0 / 0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ display: 'inline-flex', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 12, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))', color: '#fff' }}>
                                    Plataforma
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em', color: 'hsl(210 40% 96%)' }}>2.5%</span>
                                    <span style={{ fontSize: 16, fontWeight: 500, color: 'hsl(215 18% 50%)' }}>por transa\u00e7\u00e3o</span>
                                </div>
                            </div>
                            <button onClick={() => nav('/register')} className="btn btn-primary" style={{ fontSize: 14, padding: '10px 28px', height: 44 }}>Come\u00e7ar agora <ArrowRight size={16} /></button>
                        </div>
                        <div style={{ height: 1, marginBottom: 32, background: 'hsl(var(--border))' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {PRICING.map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <CheckCircle size={16} style={{ color: 'hsl(142 76% 40%)', flexShrink: 0 }} />
                                    <span style={{ fontSize: 14, fontWeight: 500, color: 'hsl(210 40% 80%)' }}>{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function CTA() {
    const nav = useNavigate();
    return (
        <section style={{ padding: '80px 24px' }}>
            <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
                <div style={{ position: 'absolute', inset: -24, borderRadius: 24, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 50%, hsl(142 76% 36% / 0.12), transparent 70%)', filter: 'blur(60px)' }} />
                <div style={{ position: 'relative', borderRadius: 16, padding: '56px 40px', textAlign: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, hsl(224 45% 6%), hsl(224 40% 8%))', border: '1px solid hsl(142 76% 36% / 0.15)' }}>
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, backgroundImage: 'linear-gradient(hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.06) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
                    <div style={{ position: 'relative' }}>
                        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, color: 'hsl(210 40% 96%)' }}>
                            Pronto para{' '}
                            <span style={{ background: 'linear-gradient(135deg, hsl(142 76% 40%), hsl(160 84% 42%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>receber PIX</span>?
                        </h2>
                        <p style={{ fontSize: 16, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6, color: 'hsl(215 18% 50%)' }}>
                            Crie sua conta gratuita e comece a receber pagamentos em menos de 5 minutos.
                        </p>
                        <button onClick={() => nav('/register')} className="btn btn-primary" style={{ fontSize: 16, padding: '12px 40px', height: 48 }}>Come\u00e7ar agora <ArrowRight size={18} /></button>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

function Footer() {
    const nav = useNavigate();
    return (
        <footer style={{ padding: '64px 24px 32px', borderTop: '1px solid hsl(var(--border))' }}>
            <div style={{ maxWidth: 1152, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 40, marginBottom: 56 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>F</div>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(210 40% 90%)' }}>FlowinPay</span>
                        </div>
                        <p style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 200, color: 'hsl(215 18% 45%)' }}>
                            Gateway de pagamentos PIX para empres\u00e1rios e desenvolvedores brasileiros.
                        </p>
                    </div>
                    {[
                        { title: 'Produto', links: ['Features', 'Pre\u00e7os', 'Documenta\u00e7\u00e3o'] },
                        { title: 'Empresa', links: ['Sobre', 'Blog', 'Contato'] },
                        { title: 'Legal', links: ['Termos de uso', 'Privacidade', 'LGPD'] },
                    ].map(col => (
                        <div key={col.title}>
                            <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, color: 'hsl(210 40% 80%)' }}>{col.title}</h4>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                                {col.links.map(l => (
                                    <li key={l}>
                                        <button onClick={() => { if (l === 'Features') document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); else if (l === 'Pre\u00e7os') document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); else if (l === 'Documenta\u00e7\u00e3o') nav('/docs'); }}
                                            style={{ fontSize: 12, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(215 18% 45%)', padding: 0 }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'hsl(210 40% 80%)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'hsl(215 18% 45%)'}
                                        >{l}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid hsl(var(--border))', flexWrap: 'wrap', gap: 12 }}>
                    <p style={{ fontSize: 12, color: 'hsl(215 18% 40%)' }}>\u00a9 2026 FlowinPay. Todos os direitos reservados.</p>
                    <span style={{ fontSize: 12, color: 'hsl(215 18% 40%)' }}>Brasil</span>
                </div>
            </div>
        </footer>
    );
}

export default function Landing() {
    return (
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
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
