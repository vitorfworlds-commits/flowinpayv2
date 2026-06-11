import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-container">
            {Icon && (
                <div className="empty-icon">
                    <Icon size={32} style={{ color: 'hsl(var(--muted-foreground))' }} />
                </div>
            )}
            <h3 className="empty-title">{title}</h3>
            {description && <p className="empty-description">{description}</p>}
            {action && <div className="empty-action">{action}</div>}
        </div>
    );
}
