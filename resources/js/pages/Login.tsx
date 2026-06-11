import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Zap, Code2, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export default function Login() {
    const navigate = useNavigate();
    const { login, isLoading, user, token } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    if (token && user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Preencha todos os campos');
            return;
        }
        try {
            await login(email.trim(), password);
            toast.success('Bem-vindo de volta!');
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'E-mail ou senha inválidos');
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Background effects */}
            <div className="auth-bg">
                <div className="auth-glow-1" />
                <div className="auth-glow-2" />
                <div className="auth-grid" />
            </div>

            {/* Left panel — desktop only */}
            <div className="login-left">
                <div className="auth-left-overlay" />
                <div className="auth-left-grid" />

                <motion.div
                    className="auth-left-content"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div variants={item} className="auth-logo">
                        <span>F</span>
                    </motion.div>
                    <motion.div variants={item}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'hsl(210 40% 96%)' }}>
                            FlowinPay
                        </h1>
                        <p style={{ fontSize: 12, color: 'hsl(215 20% 55%)', marginTop: 2 }}>
                            Gateway de Pagamentos
                        </p>
                    </motion.div>

                    <motion.h2 variants={item} className="auth-headline">
                        Receba pagamentos<br />
                        instantâneos via{' '}
                        <span className="gradient-text">PIX</span>
                    </motion.h2>

                    <motion.p variants={item} className="auth-subtitle">
                        Cobranças, saques, webhooks e integração completa para seu negócio crescer sem fronteiras.
                    </motion.p>

                    <motion.div variants={item} className="auth-features">
                        {[
                            { icon: Zap, label: 'PIX Instantâneo', desc: 'Pagamentos confirmados em segundos' },
                            { icon: Shield, label: 'Segurança Total', desc: 'Criptografia ponta a ponta e conformidade LGPD' },
                            { icon: Code2, label: 'API Completa', desc: 'Webhooks, SDKs e documentação detalhada' },
                        ].map((f, i) => (
                            <div key={i} className="auth-feature">
                                <div className="auth-feature-icon">
                                    <f.icon size={18} />
                                </div>
                                <div>
                                    <div className="auth-feature-label">{f.label}</div>
                                    <div className="auth-feature-desc">{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div variants={item} className="auth-stats">
                        <div className="auth-stat">
                            <div className="auth-stat-value">2.5%</div>
                            <div className="auth-stat-label">Taxa por transação</div>
                        </div>
                        <div className="auth-stat">
                            <div className="auth-stat-value">&lt;2s</div>
                            <div className="auth-stat-label">Tempo de confirmação</div>
                        </div>
                        <div className="auth-stat">
                            <div className="auth-stat-value">99.9%</div>
                            <div className="auth-stat-label">Uptime</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Right panel — form */}
            <div className="login-right">
                <motion.div
                    style={{ width: '100%', maxWidth: 420 }}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Mobile logo */}
                    <div className="hide-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                        <div className="auth-logo auth-logo-sm">
                            <span>F</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>FlowinPay</div>
                            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Gateway de Pagamentos</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 32 }}>
                        <h2 className="auth-form-title">Entrar</h2>
                        <p className="auth-form-subtitle">Acesse seu painel de pagamentos</p>
                    </div>

                    <div className="auth-form-card">
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="input-group">
                                <label className="input-label">E-mail</label>
                                <div className="auth-input-wrapper">
                                    <Mail size={16} className="auth-input-icon" />
                                    <input
                                        type="email"
                                        className="input"
                                        style={{ paddingLeft: 40 }}
                                        placeholder="voce@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="input-label">Senha</label>
                                    <a href="#" style={{ fontSize: 12, color: 'hsl(142 76% 40%)', textDecoration: 'none', fontWeight: 500 }}>
                                        Esqueceu a senha?
                                    </a>
                                </div>
                                <div className="auth-input-wrapper">
                                    <Lock size={16} className="auth-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input"
                                        style={{ paddingLeft: 40, paddingRight: 40 }}
                                        placeholder="Sua senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-input-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={isLoading}
                                style={{ marginTop: 4 }}
                            >
                                {isLoading ? (
                                    <div className="spinner-ring" style={{ width: 20, height: 20 }} />
                                ) : (
                                    <>
                                        Entrar
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="auth-link" style={{ textAlign: 'center', marginTop: 24 }}>
                        Ainda não tem conta?{' '}
                        <Link to="/register">Criar conta grátis</Link>
                    </p>

                    <div className="auth-trust" style={{ marginTop: 28 }}>
                        {['SSL Seguro', 'LGPD', 'Woovi'].map((t) => (
                            <div key={t} className="auth-trust-badge">
                                <CheckCircle size={14} />
                                {t}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
