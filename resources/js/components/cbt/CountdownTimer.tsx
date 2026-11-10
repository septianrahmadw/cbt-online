import { Clock } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { cn, formatDuration } from '../../lib/utils';

export function CountdownTimer({
    initialSeconds,
    onExpire,
}: {
    initialSeconds: number;
    onExpire: () => void;
}) {
    const remaining = useCountdown(initialSeconds, onExpire);
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
