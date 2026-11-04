import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

export function CountdownTimer({
    initialSeconds,
    onExpire,
}: {
    initialSeconds: number;
    onExpire: () => void;
}) {
    const deadline = useRef(Date.now() + initialSeconds * 1000);
    const expired = useRef(false);
    const onExpireRef = useRef(onExpire);
    const [remaining, setRemaining] = useState(initialSeconds);

    onExpireRef.current = onExpire;

    useEffect(() => {
        deadline.current = Date.now() + initialSeconds * 1000;
        expired.current = false;
        setRemaining(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        const tick = () => {
            const value = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
            setRemaining(value);

            if (value <= 0 && !expired.current) {
                expired.current = true;
                onExpireRef.current();
            }
        };

        tick();
        const interval = window.setInterval(tick, 1000);

        return () => window.clearInterval(interval);
    }, []);

    const urgent = remaining <= 300;

    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-lg font-semibold tabular-nums',
                urgent
                    ? 'animate-pulse border-rose-500/50 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                    : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            )}
        >
            <Clock size={18} />
            {formatDuration(remaining)}
        </div>
    );
}
