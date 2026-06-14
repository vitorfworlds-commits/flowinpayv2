import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

const REQUIRED_DOCS = [
    { type: 'rg_frente', label: 'RG — Frente', desc: 'Foto da frente do documento de identidade', icon: '📄' },
    { type: 'rg_verso', label: 'RG — Verso', desc: 'Foto do verso do documento de identidade', icon: '📄' },
    { type: 'selfie', label: 'Selfie com RG', desc: 'Selfie segurando o RG próximo ao rosto', icon: '🤳' },
];

interface Props {
    status: string;
    onStatusChange: (s: string) => void;
}

export default function KycGateScreen({ status, onStatusChange }: Props) {
    const { user, logout } = useAuthStore();
    const [files, setFiles] = useState<Record<string, File | null>>({});
    const [previews, setPreviews] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState(false);
    const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const handleFileSelect = (type: string, file: File | null) => {
        if (file && file.size > 5 * 1024 * 1024) {
            toast.error(`${REQUIRED_DOCS.find(d => d.type === type)?.label}: máx 5MB`);
            return;
        }
        setFiles(prev => ({ ...prev, [type]: file }));
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviews(prev => ({ ...prev, [type]: url }));
        } else {
            setPreviews(prev => { const p = { ...prev }; delete p[type]; return p; });
        }
    };

    const allUploaded = REQUIRED_DOCS.every(d => files[d.type]);

    const handleUpload = async () => {
        if (!allUploaded) {
            toast.error('Envie todos os 3 documentos');
            return;
        }
        for (const doc of REQUIRED_DOCS) {
            const file = files[doc.type];
            if (file && file.size > 5 * 1024 * 1024) {
                toast.error(`${doc.label}: máx 5MB`);
                return;
            }
        }
        setUploading(true);
        try {
            const form = new FormData();
            for (const doc of REQUIRED_DOCS) {
                const file = files[doc.type];
                if (file) form.append(doc.type, file);
            }
            await api.post('/kyc', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Documentos enviados! Aguarde a análise.');
            onStatusChange('pending');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao enviar documentos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'hsl(var(--background))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: 560 }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                        background: status === 'pending' ? 'hsl(38 92% 50% / 0.1)' : status === 'rejected' ? 'hsl(0 84% 60% / 0.1)' : 'hsl(217 91% 60% / 0.1)',
                        color: status === 'pending' ? 'hsl(38 92% 50%)' : status === 'rejected' ? 'hsl(0 84% 60%)' : 'hsl(217 91% 60%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {status === 'pending' ? <Clock size={28} /> : status === 'rejected' ? <AlertTriangle size={28} /> : <Shield size={28} />}
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                        {status === 'pending' ? 'Documentos em análise' : status === 'rejected' ? 'Documentos rejeitados' : 'Verificação de identidade'}
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
                        {status === 'pending'
                            ? 'Seus documentos estão sendo analisados. Você será notificado quando aprovado.'
                            : status === 'rejected'
                            ? 'Seus documentos foram rejeitados. Envie novamente.'
                            : 'Para acessar a plataforma, envie os 3 documentos abaixo.'}
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                    borderRadius: 16, padding: 28,
                }}>
                    {status === 'pending' ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                            <p style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginBottom: 20 }}>
                                Aguarde, nossos analistas estão verificando seus documentos.
                            </p>
                            <button onClick={logout} style={{
                                padding: '10px 20px', borderRadius: 8, background: 'none',
                                border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))',
                                fontSize: 13, cursor: 'pointer',
                            }}>Sair da conta</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {REQUIRED_DOCS.map(doc => {
                                const file = files[doc.type];
                                const preview = previews[doc.type];
                                return (
                                    <div key={doc.type} style={{
                                        padding: '16px', borderRadius: 12,
                                        border: file ? '1px solid hsl(142 76% 36% / 0.3)' : '1px solid hsl(var(--border))',
                                        background: file ? 'hsl(142 76% 36% / 0.03)' : 'transparent',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 20 }}>{doc.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: 700 }}>{doc.label}</div>
                                                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{doc.desc}</div>
                                                </div>
                                            </div>
                                            {file && <CheckCircle size={18} style={{ color: 'hsl(142 76% 36%)' }} />}
                                        </div>

                                        <input
                                            ref={el => { fileRefs.current[doc.type] = el; }}
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            onChange={e => handleFileSelect(doc.type, e.target.files?.[0] || null)}
                                            style={{ display: 'none' }}
                                        />

                                        <button
                                            onClick={() => fileRefs.current[doc.type]?.click()}
                                            style={{
                                                width: '100%', padding: '14px', borderRadius: 8, cursor: 'pointer',
                                                border: '1px dashed hsl(var(--border))', background: 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            }}
                                        >
                                            <Upload size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                            <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                                                {file ? file.name : 'Selecionar arquivo (JPG, PNG — máx 5MB)'}
                                            </span>
                                        </button>

                                        {preview && file && file.type.startsWith('image/') && (
                                            <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden', maxHeight: 120 }}>
                                                <img src={preview} alt={doc.label} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <button
                                onClick={handleUpload}
                                disabled={uploading || !allUploaded}
                                style={{
                                    padding: '14px', borderRadius: 10, border: 'none',
                                    background: uploading || !allUploaded ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                                    color: '#fff', fontSize: 14, fontWeight: 700,
                                    cursor: uploading || !allUploaded ? 'not-allowed' : 'pointer',
                                    opacity: uploading || !allUploaded ? 0.6 : 1,
                                }}
                            >
                                {uploading ? 'Enviando...' : `Enviar ${REQUIRED_DOCS.filter(d => files[d.type]).length}/3 documentos`}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={logout} style={{
                        background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))',
                        fontSize: 12, cursor: 'pointer',
                    }}>Sair da conta</button>
                </div>
            </motion.div>
        </div>
    );
}
