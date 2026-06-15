import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setSupported(isSupported);

        if (isSupported) {
            navigator.serviceWorker.register('/sw.js').then(() => {
                navigator.serviceWorker.ready.then(reg => {
                    reg.pushManager.getSubscription().then(sub => {
                        if (sub) {
                            setSubscribed(true);
                            // Sync with backend
                            api.get('/notifications/status').then(res => {
                                if (!res.data.subscribed) {
                                    // Resubscribe on backend
                                    const subJson = sub.toJSON();
                                    api.post('/notifications/subscribe', {
                                        endpoint: sub.endpoint,
                                        keys: subJson.keys,
                                    }).catch(() => {});
                                }
                            }).catch(() => {});
                        }
                    });
                });
            }).catch(() => {});
        }
    }, []);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!supported) return false;
        setLoading(true);
        try {
            // Get VAPID public key
            const { data } = await api.get('/notifications/vapid-key');
            const vapidKey = data.public_key;

            if (!vapidKey) {
                toast.error('Notificações não configuradas no servidor');
                return false;
            }

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error('Permissão de notificação negada. Verifique as configurações do navegador.');
                return false;
            }

            // Subscribe on browser
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });

            // Subscribe on backend
            const subJson = sub.toJSON();
            await api.post('/notifications/subscribe', {
                endpoint: sub.endpoint,
                keys: subJson.keys,
            });

            setSubscribed(true);
            return true;
        } catch (err) {
            console.error('Push subscribe error:', err);
            toast.error('Erro ao ativar notificações');
            return false;
        } finally {
            setLoading(false);
        }
    }, [supported]);

    const unsubscribe = useCallback(async () => {
        if (!supported) return;
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await api.post('/notifications/unsubscribe', { endpoint: sub.endpoint });
                await sub.unsubscribe();
            }
            setSubscribed(false);
        } catch (err) {
            console.error('Push unsubscribe error:', err);
        } finally {
            setLoading(false);
        }
    }, [supported]);

    return { supported, subscribed, loading, subscribe, unsubscribe };
}
