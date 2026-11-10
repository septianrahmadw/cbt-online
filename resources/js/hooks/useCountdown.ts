import { useEffect, useRef, useState } from 'react';

const SYNC_TOLERANCE_MS = 3000;

export function useCountdown(initialSeconds: number, onExpire?: () => void): number {
    const deadline = useRef(Date.now() + initialSeconds * 1000);
    const expired = useRef(false);
    const onExpireRef = useRef(onExpire);
    const [remaining, setRemaining] = useState(initialSeconds);

    onExpireRef.current = onExpire;

    useEffect(() => {
        const nextDeadline = Date.now() + initialSeconds * 1000;

        if (Math.abs(nextDeadline - deadline.current) > SYNC_TOLERANCE_MS) {
            deadline.current = nextDeadline;
            expired.current = false;
            setRemaining(initialSeconds);
        }
    }, [initialSeconds]);

    useEffect(() => {
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
    }, []);

    return remaining;
}
