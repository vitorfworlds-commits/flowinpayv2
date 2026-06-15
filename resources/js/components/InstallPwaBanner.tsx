import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

function isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPwaBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(() => localStorage.getItem('fp_pwa_dismissed') === 'true');
    const [standalone] = useState(() => isStandalone());

    useEffect(() => {
        if (standalone) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => setDeferredPrompt(null));

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [standalone]);

    if (standalone || dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        localStorage.setItem('fp_pwa_dismissed', 'true');
    };

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
    };

    // Chrome/Edge/Android: tem beforeinstallprompt
    if (deferredPrompt) {
        return (
            <div style={{
                position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999,
                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                maxWidth: 400, margin: '0 auto',
            }}>
                <Download size={20} color="#fff" />
                <div style={{ flex: 1, color: '#fff' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Instalar FlowinPay</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Acesso rápido pela tela inicial</div>
                </div>
                <button onClick={handleInstall} style={{
                    background: '#fff', color: 'hsl(142 76% 36%)', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                    Instalar
                </button>
                <button onClick={dismiss} style={{
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
                }}>
                    <X size={18} />
                </button>
            </div>
        );
    }

    // Safari/iOS: instruções manuais
    if (isSafari() || isIOS()) {
        return (
            <div style={{
                position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999,
                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(160 84% 39%))',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                maxWidth: 400, margin: '0 auto',
            }}>
                <Download size={20} color="#fff" />
                <div style={{ flex: 1, color: '#fff' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Instalar FlowinPay</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                        Toque em <span style={{ fontWeight: 700 }}>&#8593; Compartilhar</span> e depois <span style={{ fontWeight: 700 }}>"Adicionar à Tela de Início"</span>
                    </div>
                </div>
                <button onClick={dismiss} style={{
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
                }}>
                    <X size={18} />
                </button>
            </div>
        );
    }

    // Firefox, etc: sem prompt nativo — não mostra nada
    return null;
}
