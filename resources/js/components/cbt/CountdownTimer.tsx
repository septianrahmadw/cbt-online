import { Clock, WifiOff, Wifi } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

interface CountdownTimerProps {
    remaining: number;
    synced: boolean;
    connected: boolean;
    serverRemaining: number | null;
    urgent?: boolean;
    enabled?: boolean;
}

export function CountdownTimer({
    remaining,
    synced,
    connected,
    serverRemaining,
    urgent = false,
    enabled = true,
}: CountdownTimerProps) {
    const showSyncIndicator = enabled && (synced || connected);
    const isUrgent = urgent || remaining <= 300;

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-lg font-semibold tabular-nums',
                    isUrgent
                        ? 'animate-pulse border-rose-500/50 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                        : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                )}
            >
                <Clock size={18} />
                {formatDuration(remaining)}
            </div>

            {showSyncIndicator && (
                <div className="flex items-center gap-1" title={connected ? 'Terhubung ke server (real-time)' : 'Sinkronisasi manual'}>
                    {connected ? (
                        <Wifi size={14} className="text-emerald-500" aria-label="Real-time sync active" />
                    ) : (
                        <WifiOff size={14} className="text-amber-500" aria-label="Fallback polling" />
                    )}
                    {synced && serverRemaining !== null && serverRemaining !== remaining && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">~{formatDuration(serverRemaining)}</span>
                    )}
                </div>
            )}
        </div>
    );
}
