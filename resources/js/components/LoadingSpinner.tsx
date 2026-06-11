interface LoadingSpinnerProps {
    fullPage?: boolean;
}

export default function LoadingSpinner({ fullPage }: LoadingSpinnerProps) {
    return (
        <div className={fullPage ? 'spinner' : 'spinner-inline'}>
            <div className="spinner-ring" />
        </div>
    );
}
