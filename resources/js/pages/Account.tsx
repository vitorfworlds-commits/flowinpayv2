import { useState } from 'react';
import {
    User, Phone, CreditCard, Key, Save, Shield, Calendar,
    Lock, Mail, CheckCircle, Settings, Mail as MailIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { formatBRL, formatDateTime } from '@/lib/format';

export default function Account() {
    const { user, fetchUser } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [taxId, setTaxId] = useState(user?.tax_id || '');
    const [pixKey, setPixKey] = useState(user?.pix_key || '');
    const [saving, setSaving] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    // Password fields
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [changingPw, setChangingPw] = useState(false);

    const initials = name
        ? name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : '??';

    const roleBadge = () => {
        switch (user?.role) {
            case 'admin': return <span className="badge badge-amber"><Shield size={10} /> Admin</span>;
            case 'affiliate': return <span className="badge badge-purple">Afiliado</span>;
            default: return <span className="badge badge-blue">Padrão</span>;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { toast.error('O nome é obrigatório.'); return; }
        setSaving(true);
        try {
            await api.put('/me', {
                name: name.trim(),
                phone: phone.trim() || null,
                tax_id: taxId.trim() || null,
                pix_key: pixKey.trim() || null,
            });
            await fetchUser();
            toast.success('Perfil atualizado!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao salvar.');
        } finally { setSaving(false); }
    };

    const handleChangePassword = async () => {
        if (!currentPw) { toast.error('Informe a senha atual.'); return; }
        if (newPw.length < 8) { toast.error('A nova senha deve ter pelo menos 8 caracteres.'); return; }
        if (newPw !== confirmPw) { toast.error('As senhas não coincidem.'); return; }
        setChangingPw(true);
        try {
            await api.put('/me', {
                current_password: currentPw,
                password: newPw,
                password_confirmation: confirmPw,
            });
            toast.success('Senha alterada com sucesso!');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            setShowPasswordSection(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao alterar senha.');
        } finally { setChangingPw(false); }
    };

    const balance = Math.max(0, parseFloat(user?.balance || '0') - parseFloat(user?.balance_blocked || '0'));
    const balanceBlocked = parseFloat(user?.balance_blocked || '0');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* HEADER */}
            <div className="dashboard-header">
                <div className="dashboard-header-top">
                    <div>
                        <h1 className="dashboard-header-title">Minha Conta</h1>
                        <p className="dashboard-header-subtitle">
                            Gerencie suas informações pessoais, dados de pagamento e segurança.
                        </p>
                    </div>
                </div>
            </div>

            {/* PROFILE HERO */}
            <div className="card glow-green-strong" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                <div style={{ padding: '28px', background: 'linear-gradient(135deg, hsl(142 76% 36% / 0.08) 0%, hsl(142 76% 36% / 0.02) 100%)' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div style={{ position: 'relative' }}>
                            <div className="avatar avatar-xl">
                                <span>{initials}</span>
                            </div>
                            <span style={{
                                position: 'absolute', bottom: 4, right: 4,
                                width: 16, height: 16, borderRadius: 8,
                                background: 'hsl(142 76% 36%)',
                                border: '3px solid hsl(var(--card))',
                            }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</h2>
                            <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <MailIcon size={13} /> {user?.email}
                            </p>
                            <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                                {roleBadge()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Saldo</p>
                            <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {formatBRL(balance)}
                            </p>
                            {balanceBlocked > 0 && (
                                <p style={{ fontSize: 11, color: 'hsl(38 92% 50%)', marginTop: 4 }}>{formatBRL(balanceBlocked)} bloqueado</p>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
                    background: 'radial-gradient(circle at right, hsl(142 76% 36% / 0.06), transparent 70%)',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* KPI STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Membro desde', value: user?.created_at ? formatDateTime(user.created_at).split(' ')[0] : '---', icon: Calendar, color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)' },
                    { label: 'Tipo de conta', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Padrão', icon: Shield, color: 'hsl(217 91% 60%)', bg: 'hsl(217 91% 60% / 0.1)' },
                    { label: 'E-mail verificado', value: user?.email_verified_at ? 'Sim' : 'Pendente', icon: CheckCircle, color: user?.email_verified_at ? 'hsl(142 76% 36%)' : 'hsl(38 92% 50%)', bg: user?.email_verified_at ? 'hsl(142 76% 36% / 0.1)' : 'hsl(38 92% 50% / 0.1)' },
                    { label: 'Configurações', value: 'Perfil', icon: Settings, color: 'hsl(262 83% 58%)', bg: 'hsl(262 83% 58% / 0.1)' },
                ].map((stat, i) => (
                    <div key={i} className="card card-glow stat-card">
                        <div className="stat-card-top">
                            <div className="stat-card-label">{stat.label}</div>
                            <div className="stat-icon-ring" style={{ background: stat.bg, color: stat.color }}>
                                <stat.icon size={18} />
                            </div>
                        </div>
                        <div className="stat-value" style={{ fontSize: 18 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* PROFILE FORM */}
            <div className="card" style={{ padding: 28 }}>
                <div style={{ marginBottom: 24 }}>
                    <h3 className="section-title" style={{ fontSize: 16 }}>Informações pessoais</h3>
                    <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                        Atualize seus dados pessoais e de contato
                    </p>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <User size={12} /> Nome completo
                            </label>
                            <input className="input" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Mail size={12} /> E-mail
                            </label>
                            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                            <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>O e-mail não pode ser alterado</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Phone size={12} /> Telefone
                            </label>
                            <input className="input" type="tel" placeholder="(11) 99999-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        <div className="input-group">
                            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CreditCard size={12} /> CPF / CNPJ
                            </label>
                            <input className="input" placeholder="000.000.000-00" value={taxId} onChange={e => setTaxId(e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Key size={12} /> Chave PIX
                        </label>
                        <input className="input" placeholder="CPF, e-mail, telefone ou chave aleatória" value={pixKey} onChange={e => setPixKey(e.target.value)} />
                        <p style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Usada para receber saques</p>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                        {saving ? <div className="spinner-ring" style={{ width: 16, height: 16 }} /> : <><Save size={16} /> Salvar alterações</>}
                    </button>
                </form>
            </div>

            {/* CHANGE PASSWORD */}
            <div className="card" style={{ padding: 28 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: showPasswordSection ? 24 : 0 }}>
                    <div>
                        <h3 className="section-title" style={{ fontSize: 16 }}>Alterar senha</h3>
                        <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 4 }}>
                            Mantenha sua conta segura com uma senha forte
                        </p>
                    </div>
                    <button className={`btn btn-sm ${showPasswordSection ? 'btn-ghost' : 'btn-secondary'}`} onClick={() => setShowPasswordSection(!showPasswordSection)}>
                        <Lock size={14} /> {showPasswordSection ? 'Ocultar' : 'Alterar senha'}
                    </button>
                </div>

                {showPasswordSection && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="input-group">
                                <label className="input-label">Senha atual</label>
                                <input className="input" type="password" placeholder="Sua senha atual" value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoComplete="current-password" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Nova senha</label>
                                <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
                            </div>
                        </div>
                        <div className="input-group" style={{ maxWidth: '50%' }}>
                            <label className="input-label">Confirmar nova senha</label>
                            <input className="input" type="password" placeholder="Repita a nova senha" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
                        </div>
                        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={changingPw} onClick={handleChangePassword}>
                            {changingPw ? <div className="spinner-ring" style={{ width: 16, height: 16 }} /> : <><Lock size={16} /> Alterar senha</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
