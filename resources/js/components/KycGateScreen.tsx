import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, Clock, CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

const DOC_TYPES = [
    { value: 'cpf', label: 'RG ou CPF', desc: 'Documento de identidade com foto' },
    { value: 'cnpj', label: 'CNPJ', desc: 'Cartão CNPJ ou certificado' },
    { value: 'selfie', label: 'Selfie', desc: 'Selfie segurando o documento' },
    { value: 'comprovante_residencia', label: 'Comprovante', desc: 'Comprovante de residência' },
];

interface Props {
    status: string;
    onStatusChange: (s: string) => void;
}

export default function KycGateScreen({ status, onStatusChange }: Props) {
    const { user, logout } = useAuthStore();
    const [selectedType, setSelectedType] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async () => {
        if (!selectedType || !selectedFile) {
            toast.error('Selecione o tipo e o arquivo');
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            toast.error('Arquivo máximo: 5MB');
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('document_type', selectedType);
            form.append('file', selectedFile);
            await api.post('/kyc', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Documento enviado! Aguarde a análise.');
            onStatusChange('pending');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao enviar');
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
                style={{ width: '100%', maxWidth: 520 }}
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
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
                        {status === 'pending'
                            ? 'Seus documentos estão sendo analisados. Você receberá uma notificação assim que for aprovado.'
                            : status === 'rejected'
                            ? 'Seus documentos foram rejeitados. Por favor, envie novamente com documentos válidos.'
                            : 'Para acessar a plataforma, é necessário verificar sua identidade. Envie seus documentos abaixo.'
                        }
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
                            }}>
                                Sair da conta
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Doc type selector */}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Tipo de documento
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {DOC_TYPES.map(dt => (
                                        <button
                                            key={dt.value}
                                            onClick={() => setSelectedType(dt.value)}
                                            style={{
                                                padding: '10px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                                border: selectedType === dt.value ? '2px solid hsl(142 76% 36%)' : '1px solid hsl(var(--border))',
                                                background: selectedType === dt.value ? 'hsl(142 76% 36% / 0.05)' : 'transparent',
                                                fontSize: 13, fontWeight: 600,
                                            }}
                                        >
                                            <div>{dt.label}</div>
                                            <div style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{dt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* File picker */}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Arquivo</label>
                                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                <button onClick={() => fileRef.current?.click()} style={{
                                    width: '100%', padding: 20, borderRadius: 10, cursor: 'pointer',
                                    border: '1px dashed hsl(var(--border))', background: 'transparent',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                }}>
                                    <Upload size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                                        {selectedFile ? selectedFile.name : 'Clique para selecionar (JPG, PNG, PDF — máx 5MB)'}
                                    </span>
                                </button>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedType || !selectedFile}
                                style={{
                                    padding: '12px', borderRadius: 10, border: 'none',
                                    background: uploading ? 'hsl(var(--muted))' : 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
                                    opacity: uploading ? 0.6 : 1,
                                }}
                            >
                                {uploading ? 'Enviando...' : 'Enviar documento'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={logout} style={{
                        background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))',
                        fontSize: 12, cursor: 'pointer',
                    }}>
                        Sair da conta
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
