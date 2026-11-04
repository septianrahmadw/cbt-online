import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ConnectionStatus = 'saved' | 'saving' | 'offline';

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
    const config = {
        saved: { label: 'Tersimpan', icon: Cloud, tone: 'text-emerald-600 dark:text-emerald-300' },
        saving: { label: 'Menyinkronkan...', icon: Loader2, tone: 'text-sky-600 dark:text-sky-300' },
        offline: { label: 'Terputus - jawaban disimpan lokal', icon: CloudOff, tone: 'text-amber-600 dark:text-amber-300' },
    } as const;

    const { label, icon: Icon, tone } = config[status];

    return (
        <div className={cn('flex items-center gap-1.5 text-xs', tone)}>
            <Icon size={14} className={status === 'saving' ? 'animate-spin' : undefined} />
            <span className="hidden sm:inline">{label}</span>
        </div>
    );
}
