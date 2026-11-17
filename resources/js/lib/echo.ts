import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

window.Pusher = Pusher;

interface EchoConfig {
    broadcaster: 'reverb' | 'pusher';
    key: string;
    wsHost?: string;
    wsPort?: number;
    wssPort?: number;
    forceTLS?: boolean;
    enabledTransports?: ('ws' | 'wss')[];
    disableStats?: boolean;
    authEndpoint?: string;
    auth?: {
        headers: Record<string, string>;
    };
}

// Use any to avoid complex generic type issues with laravel-echo
type EchoInstance = any;

let echoInstance: EchoInstance | null = null;

export function getEcho(config?: EchoConfig): EchoInstance {
    if (echoInstance) {
        return echoInstance;
    }

    const defaultConfig: EchoConfig = {
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080,
        forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
            },
        },
    };

    const finalConfig = { ...defaultConfig, ...config };

    echoInstance = new Echo(finalConfig as any);

    echoInstance.connector.pusher.connection.bind('connected', () => {
        console.log('[Reverb] Connected');
    });

    echoInstance.connector.pusher.connection.bind('disconnected', () => {
        console.log('[Reverb] Disconnected');
    });

    echoInstance.connector.pusher.connection.bind('error', (error: unknown) => {
        console.error('[Reverb] Connection error:', error);
    });

    return echoInstance;
}

export function disconnectEcho(): void {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
}

export function reconnectEcho(config?: EchoConfig): EchoInstance {
    disconnectEcho();
    return getEcho(config);
}