import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, FileCheck, XCircle, Clock, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const DOC_TYPES = [
    { value: 'cpf', label: 'RG ou CPF', description: 'Documento de identidade com foto' },
    { value: 'cnpj', label: 'CNPJ', description: 'Cartão CNPJ ou certificado' },
    { value: 'selfie', label: 'Selfie', description: 'Selfie segurando o documento' },
    { value: 'comprovante_residencia', label: 'Comprovante', description: 'Comprovante de residência' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    pending: { label: 'Em análise', color: 'hsl(38 92% 50%)', icon: Clock },
    approved: { label: 'Aprovado', color: 'hsl(142 76% 36%)', icon: CheckCircle },
    rejected: { label: 'Rejeitado', color: 'hsl(0 63% 50%)', icon: XCircle },
};

interface KycDoc {
    id: number;
    document_type: string;
    original_name: string;
    status: string;
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
}

export default function Kyc() {
    const [documents, setDocuments] = useState<KycDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('');
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
        const file = fileRef.current?.files?.[0];
        if (!file) { toast.error('Selecione um arquivo'); return; }
        if (!selectedType) { toast.error('Selecione o tipo de documento'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo máximo: 5MB'); return; }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', selectedType);

        setUploading(true);
        try {
            await api.post('/kyc', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Documento enviado com sucesso');
            setSelectedType('');
            if (fileRef.current) fileRef.current.value = '';
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

    const hasPendingType = (type: string) => documents.some(d => d.document_type === type && d.status === 'pending');

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>
                        Verificação de Identidade
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, marginTop: 4 }}>
                        Envie seus documentos para verificar sua conta e aumentar limites.
                    </p>
                </div>
            </div>

            {/* Upload section */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Upload size={18} /> Enviar documento
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                    {DOC_TYPES.map(dt => (
                        <button
                            key={dt.value}
                            onClick={() => setSelectedType(dt.value)}
                            disabled={hasPendingType(dt.value)}
                            style={{
                                padding: '12px 14px',
                                borderRadius: 10,
                                border: selectedType === dt.value ? '2px solid hsl(142 76% 36%)' : '1px solid hsl(var(--border))',
                                background: selectedType === dt.value ? 'hsl(142 76% 36% / 0.08)' : 'hsl(var(--card))',
                                color: 'hsl(var(--foreground))',
                                cursor: hasPendingType(dt.value) ? 'not-allowed' : 'pointer',
                                opacity: hasPendingType(dt.value) ? 0.4 : 1,
                                textAlign: 'left',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            <div>{dt.label}</div>
                            <div style={{ fontSize: 11, fontWeight: 400, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                                {hasPendingType(dt.value) ? 'Já enviado' : dt.description}
                            </div>
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}
                    />
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedType}
                        className="btn btn-primary"
                        style={{ fontSize: 13, height: 38 }}
                    >
                        {uploading ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </div>

            {/* Documents list */}
            <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={18} /> Documentos enviados
                </h3>

                {loading ? (
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13 }}>Carregando...</p>
                ) : documents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'hsl(var(--muted-foreground))' }}>
                        <Shield size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p style={{ fontSize: 13 }}>Nenhum documento enviado ainda.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {documents.map(doc => {
                            const st = STATUS_MAP[doc.status];
                            return (
                                <div
                                    key={doc.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 16px',
                                        borderRadius: 10,
                                        border: '1px solid hsl(var(--border))',
                                        background: 'hsl(var(--background))',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            background: `${st.color} / 0.12`,
                                            color: st.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <st.icon size={18} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>
                                                {DOC_TYPES.find(d => d.value === doc.document_type)?.label || doc.document_type}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                                                {doc.original_name} · {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            background: `${st.color} / 0.1`,
                                            color: st.color,
                                        }}>
                                            {st.label}
                                        </span>
                                        {doc.status === 'pending' && (
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', padding: 4 }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
