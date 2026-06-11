import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, Zap, TrendingUp, Globe } from 'lucide-react';
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

export default function Register() {
    const navigate = useNavigate();
    const { register, isLoading, user, token } = useAuthStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (token && user) {
        return <Navigate to="/dashboard" replace />;
    }

    const passwordStrength = (pw: string) => {
        if (pw.length === 0) return { level: 0, label: '', color: '' };
        if (pw.length < 6) return { level: 1, label: 'Fraca', color: 'hsl(0 84% 60%)' };
        if (pw.length < 8) return { level: 2, label: 'Média', color: 'hsl(38 92% 50%)' };
        if (/[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw))
            return { level: 4, label: 'Forte', color: 'hsl(142 76% 36%)' };
        return { level: 3, label: 'Boa', color: 'hsl(217 91% 60%)' };
    };

    const strength = passwordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) {
            toast.error('Preencha todos os campos');
            return;
        }
        if (password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres');
            return;
        }
        if (password !== passwordConfirmation) {
            toast.error('As senhas não coincidem');
            return;
        }
        try {
            await register({
                name: name.trim(),
                email: email.trim(),
                password,
                password_confirmation: passwordConfirmation,
            });
            toast.success('Conta criada com sucesso!');
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao criar conta');
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
                        Comece a receber<br />
                        pagamentos em{' '}
                        <span className="gradient-text">minutos</span>
                    </motion.h2>

                    <motion.p variants={item} className="auth-subtitle">
                        Crie sua conta gratuitamente e comece a gerar cobranças PIX ilimitadas para seu negócio.
                    </motion.p>

                    <motion.div variants={item} className="auth-features">
                        {[
                            { icon: Zap, label: 'Setup em minutos', desc: 'Integração rápida via API ou painel' },
                            { icon: TrendingUp, label: 'Sem mensalidade', desc: 'Pague apenas por transação aprovada' },
                            { icon: Globe, label: 'Alcance nacional', desc: 'Aceite PIX de qualquer banco do Brasil' },
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
                        <h2 className="auth-form-title">Criar sua conta</h2>
                        <p className="auth-form-subtitle">Comece a receber pagamentos em minutos</p>
                    </div>

                    <div className="auth-form-card">
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div className="input-group">
                                <label className="input-label">Nome completo</label>
                                <div className="auth-input-wrapper">
                                    <User size={16} className="auth-input-icon" />
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ paddingLeft: 40 }}
                                        placeholder="Seu nome"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="name"
                                        autoFocus
                                    />
                                </div>
                            </div>

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
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Senha</label>
                                <div className="auth-input-wrapper">
                                    <Lock size={16} className="auth-input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input"
                                        style={{ paddingLeft: 40, paddingRight: 40 }}
                                        placeholder="Mínimo 8 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
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
                                {/* Password strength indicator */}
                                {password.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'hsl(var(--muted))', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: 2,
                                                width: `${(strength.level / 4) * 100}%`,
                                                background: strength.color,
                                                transition: 'all 0.3s ease',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 500, color: strength.color }}>
                                            {strength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirmar senha</label>
                                <div className="auth-input-wrapper">
                                    <Lock size={16} className="auth-input-icon" />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        className="input"
                                        style={{ paddingLeft: 40, paddingRight: 40 }}
                                        placeholder="Repita a senha"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-input-toggle"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
                                        Criar conta
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="auth-link" style={{ textAlign: 'center', marginTop: 24 }}>
                        Já tem uma conta?{' '}
                        <Link to="/login">Entrar</Link>
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
