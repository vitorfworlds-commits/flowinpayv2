import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, Upload, FileCheck, FileX, Clock, Trash2,
    Camera, FileText, Home, AlertTriangle, CheckCircle, X, Plus
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface KycDoc {
    id: number;
    document_type: string;
    original_name: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
}

const DOC_TYPES: Record<string, { label: string; icon: typeof FileText; desc: string }> = {
    cpf: { label: 'CPF', icon: FileText, desc: 'Foto ou scan do documento de CPF' },
    cnpj: { label: 'CNPJ', icon: FileText, desc: 'Cartão CNPJ ou certificado' },
    selfie: { label: 'Selfie', icon: Camera, desc: 'Selfie segurando o documento' },
    comprovante_residencia: { label: 'Comprovante de Residência', icon: Home, desc: 'Conta de luz, água ou extrato bancário' },
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
    pending: { label: 'Em análise', color: 'hsl(38 92% 50%)', bg: 'hsl(38 92% 50% / 0.1)', icon: Clock },
    approved: { label: 'Aprovado', color: 'hsl(142 76% 36%)', bg: 'hsl(142 76% 36% / 0.1)', icon: CheckCircle },
    rejected: { label: 'Rejeitado', color: 'hsl(0 84% 60%)', bg: 'hsl(0 84% 60% / 0.1)', icon: FileX },
};

export default function Kyc() {
    const [documents, setDocuments] = useState<KycDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/kyc');
            setDocuments(res.data.documents);
        } catch {
            toast.error('Erro ao carregar documentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const handleUpload = async () => {
        if (!selectedType || !selectedFile) {
            toast.error('Selecione o tipo e o arquivo');
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('document_type', selectedType);
            form.append('file', selectedFile);
            await api.post('/kyc', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Documento enviado com sucesso');
            setShowUpload(false);
            setSelectedType('');
            setSelectedFile(null);
            fetchDocuments();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao enviar documento');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remover este documento?')) return;
        try {
            await api.delete(`/kyc/${id}`);
            toast.success('Documento removido');
            fetchDocuments();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao remover');
        }
    };

    if (loading) return <LoadingSpinner fullPage />;

    const pendingCount = documents.filter(d => d.status === 'pending').length;
    const approvedCount = documents.filter(d => d.status === 'approved').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Verificação de Identidade</h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>
                        Envie seus documentos para verificação. Isso aumenta a segurança da sua conta.
                    </p>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <Plus size={16} /> Enviar documento
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{pendingCount}</div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Em análise</div>
                    </div>
                </div>
                <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'hsl(142 76% 36% / 0.1)', color: 'hsl(142 76% 36%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{approvedCount}</div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Aprovados</div>
                    </div>
                </div>
                <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'hsl(217 91% 60% / 0.1)', color: 'hsl(217 91% 60%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{documents.length}</div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Total</div>
                    </div>
                </div>
            </div>

            {/* Documents list */}
            {documents.length === 0 ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                    <Shield size={48} style={{ color: 'hsl(var(--muted-foreground))', margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhum documento enviado</h3>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>
                        Envie seus documentos para verificar sua identidade.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documents.map(doc => {
                        const docType = DOC_TYPES[doc.document_type];
                        const status = STATUS_MAP[doc.status];
                        const StatusIcon = status.icon;
                        return (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card"
                                style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10,
                                    background: status.bg, color: status.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <StatusIcon size={20} />
                                </div>
                                <div style={{ flex: 1, minWidth: 150 }}>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                                        {docType?.label || doc.document_type}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                                        {doc.original_name}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                    background: status.bg, color: status.color,
                                }}>
                                    {status.label}
                                </span>
                                <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                {doc.status === 'rejected' && doc.rejection_reason && (
                                    <div style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'hsl(0 84% 60% / 0.05)', fontSize: 13, color: 'hsl(0 84% 60%)' }}>
                                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
                                        {doc.rejection_reason}
                                    </div>
                                )}
                                {doc.status === 'pending' && (
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', padding: 4 }}
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 50,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                        }}
                        onClick={() => setShowUpload(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="card"
                            style={{ width: '100%', maxWidth: 480, padding: 24 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Enviar documento</h3>
                                <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Doc type selector */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Tipo de documento</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {Object.entries(DOC_TYPES).map(([key, val]) => {
                                            const Icon = val.icon;
                                            const selected = selectedType === key;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setSelectedType(key)}
                                                    style={{
                                                        padding: 12, borderRadius: 10, cursor: 'pointer',
                                                        border: `1px solid ${selected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                                                        background: selected ? 'hsl(var(--primary) / 0.05)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                                                    }}
                                                >
                                                    <Icon size={18} style={{ color: selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }} />
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{val.label}</div>
                                                        <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{val.desc}</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* File picker */}
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>Arquivo</label>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={() => fileRef.current?.click()}
                                        style={{
                                            width: '100%', padding: 20, borderRadius: 10, cursor: 'pointer',
                                            border: '1px dashed hsl(var(--border))',
                                            background: 'transparent',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                        }}
                                    >
                                        <Upload size={24} style={{ color: 'hsl(var(--muted-foreground))' }} />
                                        <span style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                                            {selectedFile ? selectedFile.name : 'Clique para selecionar (JPG, PNG, PDF — máx 5MB)'}
                                        </span>
                                    </button>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || !selectedType || !selectedFile}
                                    className="btn btn-primary"
                                    style={{ height: 44, fontWeight: 600 }}
                                >
                                    {uploading ? 'Enviando...' : 'Enviar documento'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
