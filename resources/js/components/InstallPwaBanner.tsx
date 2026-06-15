import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

function isIOS(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

export default function InstallPwaBanner() {
    const { isInstallable, isInstalled, install } = useInstallPrompt();
    const [dismissed, setDismissed] = useState(() => localStorage.getItem('fp_pwa_dismissed') === 'true');
    const [ios] = useState(() => isIOS());
    const [standalone] = useState(() => isStandalone());

    if (standalone || isInstalled || dismissed) return null;

    // Android/Desktop: beforeinstallprompt fires
    if (isInstallable) {
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
                <button onClick={install} style={{
                    background: '#fff', color: 'hsl(142 76% 36%)', border: 'none',
                    borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                    Instalar
                </button>
                <button onClick={() => { setDismissed(true); localStorage.setItem('fp_pwa_dismissed', 'true'); }} style={{
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
                }}>
                    <X size={18} />
                </button>
            </div>
        );
    }

    // iPhone/iPad: show manual instructions
    if (ios) {
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
                        Toque em <span style={{ fontWeight: 700 }}>&#128228; Compartilhar</span> &rarr; <span style={{ fontWeight: 700 }}>Adicionar à Tela de Início</span>
                    </div>
                </div>
                <button onClick={() => { setDismissed(true); localStorage.setItem('fp_pwa_dismissed', 'true'); }} style={{
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4,
                }}>
                    <X size={18} />
                </button>
            </div>
        );
    }

    return null;
}
