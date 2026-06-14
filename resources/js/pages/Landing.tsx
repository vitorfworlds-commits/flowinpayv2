import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Zap, Shield, Globe, ArrowRight, CheckCircle, Code2,
    BarChart3, Bell, CreditCard, Wallet, Activity, Server,
    Lock, FileCheck, Clock, Menu, X
} from 'lucide-react';

// ------------------------------------------------------------------ //
// ANIMATION VARIANTS                                                  //
// ------------------------------------------------------------------ //
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ------------------------------------------------------------------ //
// FEATURE DATA                                                        //
// ------------------------------------------------------------------ //
const FEATURES = [
    {
        icon: CreditCard,
        title: 'Cobrancas PIX',
        description: 'Gere cobrancas PIX com valor, expiracao e descricao personalizados. QR Code e copia-e-cola instantaneos.',
        color: '142 76% 36%',
    },
    {
        icon: Bell,
        title: 'Webhooks',
        description: 'Receba notificacoes em tempo real sobre pagamentos, saques e disputas. Assinatura HMAC para seguranca.',
        color: '217 91% 60%',
    },
    {
        icon: Wallet,
        title: 'Saques instantaneos',
        description: 'Transfira seu saldo para qualquer chave PIX em segundos. Saques programados ou manuais.',
        color: '262 83% 58%',
    },
    {
        icon: Server,
        title: 'Multi-adquirente',
        description: 'Conecte multiplos provedores de pagamento (Woovi, NexusPag, SyncPay) com failover automatico.',
        color: '38 92% 50%',
    },
    {
        icon: BarChart3,
        title: 'Dashboard completo',
        description: 'Graficos de receita, taxa de conversao, ranking de bots e extrato detalhado em tempo real.',
        color: '142 76% 36%',
    },
    {
        icon: Code2,
        title: 'API REST',
        description: 'API documentada com exemplos em curl, PHP e Node.js. Autenticacao por API key no header.',
        color: '217 91% 60%',
    },
];

// ------------------------------------------------------------------ //
// STEPS DATA                                                          //
// ------------------------------------------------------------------ //
const STEPS = [
    {
        number: '01',
        title: 'Crie sua conta',
        description: 'Registre-se gratuitamente e configure sua conta empresarial em menos de 2 minutos.',
        icon: FileCheck,
    },
    {
        number: '02',
        title: 'Integre via API',
        description: 'Use nossa API REST para criar cobrancas PIX. SDKs disponiveis para PHP, Node.js e Python.',
        icon: Code2,
    },
    {
        number: '03',
        title: 'Receba pagamentos',
        description: 'Pagamentos confirmados em menos de 2 segundos. Webhooks notificam seu sistema automaticamente.',
        icon: Activity,
    },
];

// ------------------------------------------------------------------ //
// STATS DATA                                                          //
// ------------------------------------------------------------------ //
const STATS = [
    { value: 'R$ 0', label: 'taxa de saque' },
    { value: '<2s', label: 'confirmacao' },
    { value: '99.9%', label: 'uptime' },
    { value: 'API REST', label: 'completa' },
];

// ------------------------------------------------------------------ //
// PRICING FEATURES                                                    //
// ------------------------------------------------------------------ //
const PRICING_FEATURES = [
    '2.5% por transacao',
    'R$ 0 taxa de saque',
    'API completa e documentada',
    'Webhooks em tempo real',
    'Dashboard com graficos',
    'Suporte prioritario',
];

// ------------------------------------------------------------------ //
// NAVBAR COMPONENT                                                    //
// ------------------------------------------------------------------ //
function Navbar() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id: string) => {
        setMobileOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={{
                background: scrolled
                    ? 'hsl(224 45% 5% / 0.88)'
                    : 'transparent',
                backdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'none',
                borderBottom: scrolled ? '1px solid hsl(220 25% 14% / 0.6)' : '1px solid transparent',
            }}
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
                    >
                        <div
                            className="flex items-center justify-center rounded-xl font-extrabold text-white text-sm"
                            style={{
                                width: 34, height: 34,
                                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))',
                                boxShadow: '0 4px 16px hsl(142 76% 36% / 0.3)',
                            }}
                        >
                            F
                        </div>
                        <span
                            className="text-base font-bold tracking-tight"
                            style={{ color: 'hsl(210 40% 96%)' }}
                        >
                            FlowinPay
                        </span>
                    </button>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {['features', 'pricing', 'docs'].map((item) => (
                            <button
                                key={item}
                                onClick={() => item === 'docs' ? navigate('/docs') : scrollTo(item)}
                                className="px-3.5 py-2 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors"
                                style={{
                                    color: 'hsl(215 18% 55%)',
                                    background: 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'hsl(210 40% 96%)';
                                    e.currentTarget.style.background = 'hsl(220 30% 13%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'hsl(215 18% 55%)';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {item === 'features' ? 'Features' : item === 'pricing' ? 'Precos' : 'Docs'}
                            </button>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-2.5">
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-ghost text-[13px]"
                            style={{ color: 'hsl(215 18% 55%)' }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="btn btn-primary text-[13px]"
                        >
                            Comecar
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border-none cursor-pointer"
                        style={{ background: 'transparent', color: 'hsl(210 40% 96%)' }}
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="md:hidden pb-4 flex flex-col gap-1"
                    >
                        {['features', 'pricing'].map((item) => (
                            <button
                                key={item}
                                onClick={() => scrollTo(item)}
                                className="px-4 py-3 rounded-lg text-sm font-medium text-left border-none cursor-pointer transition-colors"
                                style={{
                                    color: 'hsl(215 18% 55%)',
                                    background: 'transparent',
                                }}
                            >
                                {item === 'features' ? 'Features' : 'Precos'}
                            </button>
                        ))}
                        <button
                            onClick={() => { setMobileOpen(false); navigate('/docs'); }}
                            className="px-4 py-3 rounded-lg text-sm font-medium text-left border-none cursor-pointer"
                            style={{ color: 'hsl(215 18% 55%)', background: 'transparent' }}
                        >
                            Docs
                        </button>
                        <div className="h-px my-2" style={{ background: 'hsl(220 25% 14%)' }} />
                        <button
                            onClick={() => { setMobileOpen(false); navigate('/login'); }}
                            className="btn btn-secondary w-full text-sm"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setMobileOpen(false); navigate('/register'); }}
                            className="btn btn-primary w-full text-sm"
                        >
                            Comecar agora
                            <ArrowRight size={14} />
                        </button>
                    </motion.div>
                )}
            </div>
        </nav>
    );
}

// ------------------------------------------------------------------ //
// HERO SECTION                                                        //
// ------------------------------------------------------------------ //
function HeroSection() {
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    const orbY1 = useTransform(scrollY, [0, 600], [0, -120]);
    const orbY2 = useTransform(scrollY, [0, 600], [0, -80]);
    const orbScale = useTransform(scrollY, [0, 600], [1, 0.85]);

    return (
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 px-4 sm:px-6">
            {/* Background orbs */}
            <motion.div
                style={{ y: orbY1, scale: orbScale }}
                className="absolute pointer-events-none"
                aria-hidden
            >
                <div
                    className="absolute rounded-full"
                    style={{
                        top: '-10%', left: '15%',
                        width: 600, height: 600,
                        background: 'radial-gradient(circle, hsl(142 76% 36% / 0.12) 0%, transparent 65%)',
                        filter: 'blur(100px)',
                    }}
                />
            </motion.div>
            <motion.div
                style={{ y: orbY2, scale: orbScale }}
                className="absolute pointer-events-none inset-0"
                aria-hidden
            >
                <div
                    className="absolute rounded-full"
                    style={{
                        bottom: '5%', right: '10%',
                        width: 500, height: 500,
                        background: 'radial-gradient(circle, hsl(217 91% 60% / 0.08) 0%, transparent 65%)',
                        filter: 'blur(80px)',
                    }}
                />
            </motion.div>

            {/* Grid overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    opacity: 0.03,
                    backgroundImage: 'linear-gradient(hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.06) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                }}
                aria-hidden
            />

            <div className="relative mx-auto max-w-4xl text-center">
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
                        style={{
                            background: 'hsl(142 76% 36% / 0.1)',
                            border: '1px solid hsl(142 76% 36% / 0.2)',
                            color: 'hsl(142 76% 45%)',
                        }}
                    >
                        <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: 'hsl(142 76% 36%)',
                                animation: 'dotPulse 2s ease-in-out infinite',
                            }}
                        />
                        Gateway de pagamentos PIX
                    </div>

                    {/* Headline */}
                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-[-0.04em] mb-6"
                        style={{ color: 'hsl(210 40% 96%)' }}
                    >
                        Receba pagamentos PIX{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, hsl(142 76% 40%), hsl(160 84% 42%))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            de forma simples
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p
                        className="text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
                        style={{ color: 'hsl(215 18% 50%)' }}
                    >
                        Plataforma completa para empresarios e desenvolvedores.
                        PIX instantaneo, API REST, webhooks e saques automaticos.
                        Integre em minutos, receba em segundos.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                        <button
                            onClick={() => navigate('/register')}
                            className="btn btn-primary text-base px-8 h-12"
                        >
                            Comecar gratis
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/docs')}
                            className="btn btn-secondary text-base px-8 h-12"
                            style={{
                                background: 'hsl(220 30% 11%)',
                                borderColor: 'hsl(220 25% 18%)',
                                color: 'hsl(210 40% 80%)',
                            }}
                        >
                            <Code2 size={16} />
                            Ver documentacao
                        </button>
                    </div>

                    {/* Trust badges */}
                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
                    >
                        {[
                            { icon: Lock, label: 'SSL / TLS' },
                            { icon: Shield, label: 'LGPD' },
                            { icon: Clock, label: '99.9% uptime' },
                        ].map(({ icon: Icon, label }) => (
                            <motion.div
                                key={label}
                                variants={fadeUp}
                                className="flex items-center gap-1.5 text-xs font-medium"
                                style={{ color: 'hsl(215 18% 45%)' }}
                            >
                                <Icon
                                    size={13}
                                    style={{ color: 'hsl(142 76% 40%)' }}
                                />
                                {label}
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// ------------------------------------------------------------------ //
// STATS BAR                                                           //
// ------------------------------------------------------------------ //
function StatsBar() {
    return (
        <motion.section
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 sm:mb-28"
        >
            <div
                className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden"
                style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                }}
            >
                {STATS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        variants={fadeUp}
                        className="flex flex-col items-center justify-center py-6 sm:py-8 px-4"
                        style={{
                            borderRight: i < STATS.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                        }}
                    >
                        <div
                            className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1"
                            style={{
                                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {stat.value}
                        </div>
                        <div
                            className="text-xs font-medium"
                            style={{ color: 'hsl(215 18% 50%)' }}
                        >
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}

// ------------------------------------------------------------------ //
// FEATURES SECTION                                                    //
// ------------------------------------------------------------------ //
function FeaturesSection() {
    return (
        <section id="features" className="py-20 sm:py-28 px-4 sm:px-6">
            <div className="mx-auto max-w-6xl">
                {/* Section header */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="text-center mb-14 sm:mb-18"
                >
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                        style={{
                            background: 'hsl(142 76% 36% / 0.08)',
                            border: '1px solid hsl(142 76% 36% / 0.15)',
                            color: 'hsl(142 76% 45%)',
                        }}
                    >
                        Funcionalidades
                    </div>
                    <h2
                        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4"
                        style={{ color: 'hsl(210 40% 96%)' }}
                    >
                        Tudo que voce precisa para{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, hsl(142 76% 40%), hsl(160 84% 42%))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            receber PIX
                        </span>
                    </h2>
                    <p
                        className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
                        style={{ color: 'hsl(215 18% 50%)' }}
                    >
                        Infraestrutura completa de pagamentos com foco em simplicidade, velocidade e seguranca.
                    </p>
                </motion.div>

                {/* Feature grid */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                >
                    {FEATURES.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={fadeUp}
                            className="card card-glow p-6 sm:p-7 flex flex-col gap-4"
                            style={{ background: 'hsl(var(--card))' }}
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{
                                    background: `hsl(${feature.color} / 0.12)`,
                                    color: `hsl(${feature.color})`,
                                }}
                            >
                                <feature.icon size={20} />
                            </div>
                            <div>
                                <h3
                                    className="text-base font-bold mb-1.5"
                                    style={{ color: 'hsl(210 40% 96%)' }}
                                >
                                    {feature.title}
                                </h3>
                                <p
                                    className="text-sm leading-relaxed"
                                    style={{ color: 'hsl(215 18% 50%)' }}
                                >
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ------------------------------------------------------------------ //
// HOW IT WORKS                                                        //
// ------------------------------------------------------------------ //
function HowItWorksSection() {
    const navigate = useNavigate();

    return (
        <section className="py-20 sm:py-28 px-4 sm:px-6">
            <div className="mx-auto max-w-5xl">
                {/* Section header */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="text-center mb-14 sm:mb-18"
                >
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                        style={{
                            background: 'hsl(217 91% 60% / 0.08)',
                            border: '1px solid hsl(217 91% 60% / 0.15)',
                            color: 'hsl(217 91% 60%)',
                        }}
                    >
                        Como funciona
                    </div>
                    <h2
                        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4"
                        style={{ color: 'hsl(210 40% 96%)' }}
                    >
                        Tres passos para{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(262 83% 58%))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            comecar
                        </span>
                    </h2>
                </motion.div>

                {/* Steps */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
                >
                    {STEPS.map((step, i) => (
                        <motion.div
                            key={step.number}
                            variants={scaleIn}
                            className="relative flex flex-col items-center text-center"
                        >
                            {/* Connector line (desktop) */}
                            {i < STEPS.length - 1 && (
                                <div
                                    className="hidden md:block absolute top-12 left-[calc(50%+52px)] w-[calc(100%-104px)] h-px"
                                    style={{
                                        background: 'linear-gradient(90deg, hsl(142 76% 36% / 0.3), hsl(142 76% 36% / 0.08))',
                                    }}
                                />
                            )}

                            {/* Number badge */}
                            <div
                                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-5 relative"
                                style={{
                                    background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.1), hsl(142 71% 45% / 0.05))',
                                    border: '1px solid hsl(142 76% 36% / 0.15)',
                                }}
                            >
                                <step.icon
                                    size={28}
                                    style={{ color: 'hsl(142 76% 40%)' }}
                                />
                                <div
                                    className="absolute -top-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold text-white"
                                    style={{
                                        background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))',
                                        boxShadow: '0 4px 12px hsl(142 76% 36% / 0.3)',
                                    }}
                                >
                                    {step.number}
                                </div>
                            </div>

                            <h3
                                className="text-lg font-bold mb-2"
                                style={{ color: 'hsl(210 40% 96%)' }}
                            >
                                {step.title}
                            </h3>
                            <p
                                className="text-sm leading-relaxed max-w-xs"
                                style={{ color: 'hsl(215 18% 50%)' }}
                            >
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA under steps */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    className="flex justify-center mt-12"
                >
                    <button
                        onClick={() => navigate('/register')}
                        className="btn btn-primary text-sm px-7 h-11"
                    >
                        Comecar agora
                        <ArrowRight size={16} />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

// ------------------------------------------------------------------ //
// PRICING SECTION                                                     //
// ------------------------------------------------------------------ //
function PricingSection() {
    const navigate = useNavigate();

    return (
        <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
                {/* Section header */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="text-center mb-14"
                >
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                        style={{
                            background: 'hsl(262 83% 58% / 0.08)',
                            border: '1px solid hsl(262 83% 58% / 0.15)',
                            color: 'hsl(262 83% 58%)',
                        }}
                    >
                        Precos
                    </div>
                    <h2
                        className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4"
                        style={{ color: 'hsl(210 40% 96%)' }}
                    >
                        Simples e{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(217 91% 60%))',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            transparente
                        </span>
                    </h2>
                    <p
                        className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed"
                        style={{ color: 'hsl(215 18% 50%)' }}
                    >
                        Sem mensalidade. Pague apenas por transacao processada.
                    </p>
                </motion.div>

                {/* Pricing card */}
                <motion.div
                    variants={scaleIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="relative"
                >
                    {/* Glow behind card */}
                    <div
                        className="absolute inset-0 -m-3 rounded-3xl opacity-40 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse at 50% 0%, hsl(142 76% 36% / 0.15), transparent 70%)',
                            filter: 'blur(40px)',
                        }}
                    />

                    <div
                        className="relative rounded-2xl p-8 sm:p-10"
                        style={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(142 76% 36% / 0.2)',
                            boxShadow: '0 0 40px hsl(142 76% 36% / 0.06), 0 8px 40px rgb(0 0 0 / 0.12)',
                        }}
                    >
                        {/* Plan header */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                            <div>
                                <div
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3"
                                    style={{
                                        background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))',
                                        color: '#fff',
                                    }}
                                >
                                    Plataforma
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span
                                        className="text-4xl sm:text-5xl font-extrabold tracking-tight"
                                        style={{ color: 'hsl(210 40% 96%)' }}
                                    >
                                        2.5%
                                    </span>
                                    <span
                                        className="text-base font-medium"
                                        style={{ color: 'hsl(215 18% 50%)' }}
                                    >
                                        por transacao
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/register')}
                                className="btn btn-primary text-sm px-7 h-11 self-start sm:self-auto"
                            >
                                Comecar agora
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div
                            className="h-px mb-8"
                            style={{ background: 'hsl(var(--border))' }}
                        />

                        {/* Features list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PRICING_FEATURES.map((feat) => (
                                <div
                                    key={feat}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircle
                                        size={16}
                                        style={{ color: 'hsl(142 76% 40%)', flexShrink: 0 }}
                                    />
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: 'hsl(210 40% 80%)' }}
                                    >
                                        {feat}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ------------------------------------------------------------------ //
// CTA SECTION                                                         //
// ------------------------------------------------------------------ //
function CtaSection() {
    const navigate = useNavigate();

    return (
        <section className="py-20 sm:py-28 px-4 sm:px-6">
            <motion.div
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="relative mx-auto max-w-4xl"
            >
                {/* Glow */}
                <div
                    className="absolute inset-0 -m-6 rounded-3xl pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse at 50% 50%, hsl(142 76% 36% / 0.12), transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />

                <div
                    className="relative rounded-2xl p-10 sm:p-14 text-center overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, hsl(224 45% 6%), hsl(224 40% 8%))',
                        border: '1px solid hsl(142 76% 36% / 0.15)',
                    }}
                >
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            opacity: 0.04,
                            backgroundImage: 'linear-gradient(hsl(0 0% 100% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.06) 1px, transparent 1px)',
                            backgroundSize: '48px 48px',
                        }}
                        aria-hidden
                    />

                    <div className="relative">
                        <h2
                            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4"
                            style={{ color: 'hsl(210 40% 96%)' }}
                        >
                            Pronto para{' '}
                            <span
                                style={{
                                    background: 'linear-gradient(135deg, hsl(142 76% 40%), hsl(160 84% 42%))',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                receber PIX
                            </span>
                            ?
                        </h2>
                        <p
                            className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-8"
                            style={{ color: 'hsl(215 18% 50%)' }}
                        >
                            Crie sua conta gratuita e comece a receber pagamentos em menos de 5 minutos.
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="btn btn-primary text-base px-10 h-12"
                        >
                            Comecar agora
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

// ------------------------------------------------------------------ //
// FOOTER                                                              //
// ------------------------------------------------------------------ //
function Footer() {
    const navigate = useNavigate();

    const footerLinks = {
        Produto: [
            { label: 'Features', action: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Precos', action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }) },
            { label: 'Documentacao', action: () => navigate('/docs') },
            { label: 'Status', action: () => {} },
        ],
        Empresa: [
            { label: 'Sobre', action: () => {} },
            { label: 'Blog', action: () => {} },
            { label: 'Contato', action: () => {} },
            { label: 'Carreiras', action: () => {} },
        ],
        Legal: [
            { label: 'Termos de uso', action: () => {} },
            { label: 'Politica de privacidade', action: () => {} },
            { label: 'LGPD', action: () => {} },
        ],
    };

    return (
        <footer
            className="px-4 sm:px-6 pt-16 pb-8"
            style={{
                borderTop: '1px solid hsl(var(--border))',
            }}
        >
            <div className="mx-auto max-w-6xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-14">
                    {/* Brand column */}
                    <div className="col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div
                                className="flex items-center justify-center rounded-xl font-extrabold text-white text-sm"
                                style={{
                                    width: 30, height: 30,
                                    background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 71% 45%))',
                                }}
                            >
                                F
                            </div>
                            <span
                                className="text-sm font-bold tracking-tight"
                                style={{ color: 'hsl(210 40% 90%)' }}
                            >
                                FlowinPay
                            </span>
                        </div>
                        <p
                            className="text-xs leading-relaxed max-w-[200px]"
                            style={{ color: 'hsl(215 18% 45%)' }}
                        >
                            Gateway de pagamentos PIX para empresarios e desenvolvedores brasileiros.
                        </p>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4
                                className="text-xs font-bold uppercase tracking-wider mb-4"
                                style={{ color: 'hsl(210 40% 80%)' }}
                            >
                                {title}
                            </h4>
                            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <button
                                            onClick={link.action}
                                            className="text-xs font-medium border-none cursor-pointer p-0 bg-transparent transition-colors"
                                            style={{ color: 'hsl(215 18% 45%)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(210 40% 80%)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(215 18% 45%)'; }}
                                        >
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
                    style={{ borderTop: '1px solid hsl(var(--border))' }}
                >
                    <p
                        className="text-xs"
                        style={{ color: 'hsl(215 18% 40%)' }}
                    >
                        2026 FlowinPay. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-4">
                        <Globe size={14} style={{ color: 'hsl(215 18% 40%)' }} />
                        <span
                            className="text-xs"
                            style={{ color: 'hsl(215 18% 40%)' }}
                        >
                            Brasil
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ------------------------------------------------------------------ //
// MAIN LANDING COMPONENT                                              //
// ------------------------------------------------------------------ //
export default function Landing() {
    return (
        <div
            className="min-h-screen"
            style={{
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
            }}
        >
            <Navbar />
            <HeroSection />
            <StatsBar />
            <FeaturesSection />
            <HowItWorksSection />
            <PricingSection />
            <CtaSection />
            <Footer />
        </div>
    );
}
