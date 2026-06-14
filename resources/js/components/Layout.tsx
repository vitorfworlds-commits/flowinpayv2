import { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Upload, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Layout() {
    const { user, token } = useAuthStore();
    const [collapsed, setCollapsed] = useState(() => {
        return localStorage.getItem('fp_sidebar_collapsed') === 'true';
    });
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('fp_sidebar_collapsed', String(next));
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile sidebar on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [mobileOpen]);

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Check KYC status
    const [kycStatus, setKycStatus] = useState<string | null>(null);
    const [kycLoading, setKycLoading] = useState(true);

    useEffect(() => {
        api.get('/kyc').then(res => {
            const docs = res.data.documents || [];
            const approved = docs.some((d: any) => d.status === 'approved');
            if (approved) {
                setKycStatus('approved');
            } else {
                const pending = docs.some((d: any) => d.status === 'pending');
                const rejected = docs.some((d: any) => d.status === 'rejected');
                setKycStatus(pending ? 'pending' : rejected ? 'rejected' : 'not_submitted');
            }
        }).catch(() => setKycStatus('not_submitted')).finally(() => setKycLoading(false));
    }, []);

    if (!kycLoading && kycStatus && kycStatus !== 'approved') {
        return <KycGateScreen status={kycStatus} onStatusChange={setKycStatus} />;
    }

    return (
        <div className="app-layout">
            {/* Mobile backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="sidebar-backdrop visible"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Barra fixa no topo — mobile */}
            <header className="app-mobile-topbar">
                <div className="app-mobile-brand">
                    <div className="gradient-green app-mobile-brand-icon"><span>F</span></div>
                    <span>FlowinPay</span>
                </div>
                <button
                    className="btn-icon"
                    onClick={() => setMobileOpen((p) => !p)}
                    aria-label="Menu"
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            <Sidebar
                collapsed={collapsed}
                onToggle={toggle}
                mobileOpen={mobileOpen}
                onMobileToggle={() => setMobileOpen((p) => !p)}
            />

            <main className={`app-main ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    );
}

function KycGateScreen({ status, onStatusChange }: { status: string; onStatusChange: (s: string) => void }) {
    const { logout } = useAuthStore();
    const [selectedType, setSelectedType] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const nav = useNavigate();

    const DOC_TYPES = [
        { value: 'cpf', label: 'RG ou CPF', desc: 'Documento de identidade' },
        { value: 'cnpj', label: 'CNPJ', desc: 'Cartão CNPJ ou certificado' },
        { value: 'selfie', label: 'Selfie', desc: 'Selfie segurando documento' },
        { value: 'comprovante_residencia', label: 'Comprovante', desc: 'Comprovante de residência' },
    ];

    const handleUpload = async () => {
        if (!selectedType || !selectedFile) { toast.error('Selecione tipo e arquivo'); return; }
        if (selectedFile.size > 5 * 1024 * 1024) { toast.error('Máx 5MB'); return; }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('document_type', selectedType);
            form.append('file', selectedFile);
            await api.post('/kyc', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Documento enviado! Aguarde análise.');
            onStatusChange('pending');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao enviar');
        } finally { setUploading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 480 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: status === 'pending' ? 'hsl(38 92% 50% / 0.1)' : 'hsl(0 84% 60% / 0.1)', color: status === 'pending' ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {status === 'pending' ? <Clock size={28} /> : <AlertTriangle size={28} />}
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                        {status === 'pending' ? 'Documentos em análise' : status === 'rejected' ? 'Documentos rejeitados' : 'Verificação necessária'}
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.6 }}>
                        {status === 'pending'
                            ? 'Seus documentos estão sendo analisados. Você será notificado quando aprovado.'
                            : status === 'rejected'
                            ? 'Seus documentos foram rejeitados. Envie novamente.'
                            : 'Para usar a plataforma, envie seus documentos de identificação.'}
                    </p>
                </div>

                {status === 'pending' ? (
                    <div style={{ textAlign: 'center' }}>
                        <button onClick={() => { logout(); nav('/login'); }} style={{ padding: '10px 24px', borderRadius: 8, background: 'none', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontSize: 13, cursor: 'pointer' }}>Sair da conta</button>
                    </div>
                ) : (
                    <div style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, padding: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                            {DOC_TYPES.map(dt => (
                                <button key={dt.value} onClick={() => setSelectedType(dt.value)} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', border: selectedType === dt.value ? '2px solid hsl(142 76% 36%)' : '1px solid hsl(var(--border))', background: selectedType === dt.value ? 'hsl(142 76% 36% / 0.05)' : 'transparent', fontSize: 13, fontWeight: 600 }}>
                                    <div>{dt.label}</div>
                                    <div style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>{dt.desc}</div>
                                </button>
                            ))}
                        </div>
                        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                        <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: 16, borderRadius: 10, cursor: 'pointer', border: '1px dashed hsl(var(--border))', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                            <Upload size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
                            <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>{selectedFile ? selectedFile.name : 'Selecionar arquivo (JPG, PNG, PDF — máx 5MB)'}</span>
                        </button>
                        <button onClick={handleUpload} disabled={uploading || !selectedType || !selectedFile} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: uploading ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))', color: '#fff', fontSize: 14, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                            {uploading ? 'Enviando...' : 'Enviar documento'}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
