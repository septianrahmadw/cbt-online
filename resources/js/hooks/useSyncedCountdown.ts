import { useEffect, useRef, useState, useCallback } from 'react';
import { useReverbHeartbeat } from './useReverb';

const SYNC_TOLERANCE_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 10000;

interface UseSyncedCountdownOptions {
    initialSeconds: number;
    sessionId: number;
    examId: number;
    onExpire?: () => void;
    enabled?: boolean;
}

export function useSyncedCountdown({
    initialSeconds,
    sessionId,
    examId,
    onExpire,
    enabled = true,
}: UseSyncedCountdownOptions) {
    const deadline = useRef(Date.now() + initialSeconds * 1000);
    const expired = useRef(false);
    const onExpireRef = useRef(onExpire);
    const [remaining, setRemaining] = useState(initialSeconds);
    const [synced, setSynced] = useState(false);
    const [serverRemaining, setServerRemaining] = useState<number | null>(null);

    onExpireRef.current = onExpire;

    const { connected, data: heartbeatData } = useReverbHeartbeat(sessionId, examId);

    useEffect(() => {
        if (heartbeatData && enabled) {
            const serverRemainingValue = heartbeatData.remaining_seconds;
            setServerRemaining(serverRemainingValue);

            const nextDeadline = Date.now() + serverRemainingValue * 1000;

            if (Math.abs(nextDeadline - deadline.current) > SYNC_TOLERANCE_MS) {
                deadline.current = nextDeadline;
                expired.current = false;
                setRemaining(serverRemainingValue);
                setSynced(true);
            }
        }
    }, [heartbeatData, enabled]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const tick = () => {
            const value = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
            setRemaining(value);

            if (value <= 0 && !expired.current) {
                expired.current = true;
                onExpireRef.current?.();
            }
        };

        tick();
        const interval = window.setInterval(tick, 1000);

        return () => window.clearInterval(interval);
    }, [enabled]);

    const forceSync = useCallback(async () => {
        try {
            const response = await fetch('/exam/heartbeat', {
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                const data = (await response.json().catch(() => null)) as { remaining_seconds?: number } | null;
                if (data && typeof data.remaining_seconds === 'number') {
                    const nextDeadline = Date.now() + data.remaining_seconds * 1000;
                    deadline.current = nextDeadline;
                    expired.current = false;
                    setRemaining(data.remaining_seconds);
                    setSynced(true);
                }
            }
        } catch {
            // Ignore sync errors
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const interval = window.setInterval(() => {
            if (navigator.onLine) {
                void forceSync();
            }
        }, HEARTBEAT_INTERVAL_MS);

        return () => window.clearInterval(interval);
    }, [enabled, forceSync]);

    return {
        remaining,
        synced,
        serverRemaining,
        connected,
        forceSync,
    };
}