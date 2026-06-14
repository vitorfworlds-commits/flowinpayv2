import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Informe seu email');
            return;
        }
        setLoading(true);
        try {
            await api.post('/forgot-password', { email: email.trim() });
            setSent(true);
            toast.success('Email enviado com sucesso');
        } catch (err: any) {
            if (err.response?.status === 429) {
                toast.error('Muitas tentativas. Tente novamente mais tarde.');
            } else {
                toast.error('Erro ao enviar email. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
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
                        Email enviado
                    </h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 24, lineHeight: 1.6 }}>
                        Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
                    </p>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, marginBottom: 24 }}>
                        Verifique sua caixa de entrada e spam. O link expira em 60 minutos.
                    </p>
                    <Link
                        to="/login"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            color: 'hsl(var(--primary))', fontWeight: 600, fontSize: 14,
                            textDecoration: 'none',
                        }}
                    >
                        <ArrowLeft size={16} /> Voltar ao login
                    </Link>
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
                        background: 'hsl(217 91% 60% / 0.1)',
                        color: 'hsl(217 91% 60%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}>
                        <Mail size={24} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                        Recuperar senha
                    </h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>
                        Informe seu email e enviaremos um link para redefinir sua senha.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'hsl(var(--muted-foreground))',
                            }} />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="input"
                                style={{ paddingLeft: 38 }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full"
                        style={{ height: 44, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        {loading ? 'Enviando...' : (
                            <>Enviar link <ArrowRight size={16} /></>
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
