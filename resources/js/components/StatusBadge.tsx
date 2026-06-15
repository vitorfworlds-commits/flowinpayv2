interface StatusBadgeProps {
    status: string;
}

const STATUS_MAP: Record<string, { label: string; badgeClass: string }> = {
    paid: { label: 'Pago', badgeClass: 'badge-green' },
    pending: { label: 'Pendente', badgeClass: 'badge-amber' },
    approved: { label: 'Aprovado', badgeClass: 'badge-green' },
    rejected: { label: 'Rejeitado', badgeClass: 'badge-red' },
    failed: { label: 'Falhou', badgeClass: 'badge-red' },
    cancelled: { label: 'Cancelado', badgeClass: 'badge-muted' },
    active: { label: 'Ativo', badgeClass: 'badge-green' },
    inactive: { label: 'Inativo', badgeClass: 'badge-muted' },
    completed: { label: 'Concluído', badgeClass: 'badge-green' },
    processing: { label: 'Processando', badgeClass: 'badge-blue' },
    waiting: { label: 'Aguardando', badgeClass: 'badge-amber' },
    expired: { label: 'Expirado', badgeClass: 'badge-muted' },
    draft: { label: 'Rascunho', badgeClass: 'badge-muted' },
    partial: { label: 'Parcial', badgeClass: 'badge-purple' },
    blocked: { label: 'Bloqueado', badgeClass: 'badge-red' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_MAP[status] ?? { label: status, badgeClass: 'badge-muted' };

    return (
        <span className={`badge ${config.badgeClass}`}>
            <span className="badge-dot" />
            {config.label}
        </span>
    );
}
