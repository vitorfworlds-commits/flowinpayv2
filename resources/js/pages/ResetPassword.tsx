import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const t = searchParams.get('token');
        const e = searchParams.get('email');
        if (t) setToken(t);
        if (e) setEmail(e);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !token.trim()) {
            toast.error('Link inválido. Solicite um novo link de recuperação.');
            return;
        }
        if (password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres');
            return;
        }
        if (password !== passwordConfirmation) {
            toast.error('As senhas não conferem');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset-password', {
                email: email.trim(),
                token: token.trim(),
                password,
                password_confirmation: passwordConfirmation,
            });
            setSuccess(true);
            toast.success('Senha redefinida com sucesso');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erro ao redefinir senha';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'hsl(var(--background))' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card w-full max-w-md text-center"
                    style={{ padding: '48px 32px' }}
                >
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'hsl(142 76% 36% / 0.1)',
                        color: 'hsl(142 76% 36%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px',
                    }}>
                        <CheckCircle size={32} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
                        Senha redefinida
                    </h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 24, lineHeight: 1.6 }}>
                        Sua senha foi alterada com sucesso. Você já pode fazer login com a nova senha.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                        style={{ height: 44, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        Fazer login <ArrowRight size={16} />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'hsl(var(--background))' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card w-full max-w-md"
                style={{ padding: '48px 32px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: 'hsl(262 83% 58% / 0.1)',
                        color: 'hsl(262 83% 58%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <KeyRound size={24} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                        Nova senha
                    </h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>
                        Defina sua nova senha de acesso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="input"
                            readOnly={!!searchParams.get('email')}
                            style={searchParams.get('email') ? { opacity: 0.7 } : {}}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                            Nova senha
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'hsl(var(--muted-foreground))',
                            }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="input"
                                style={{ paddingLeft: 38, paddingRight: 38 }}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'hsl(var(--muted-foreground))',
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                            Confirmar senha
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'hsl(var(--muted-foreground))',
                            }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passwordConfirmation}
                                onChange={e => setPasswordConfirmation(e.target.value)}
                                placeholder="Repita a senha"
                                className="input"
                                style={{ paddingLeft: 38 }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                        style={{ height: 44, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        {loading ? 'Redefinindo...' : (
                            <>Redefinir senha <ArrowRight size={16} /></>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link
                        to="/login"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            color: 'hsl(var(--muted-foreground))', fontSize: 13,
                            textDecoration: 'none',
                        }}
                    >
                        <ArrowLeft size={14} /> Voltar ao login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
