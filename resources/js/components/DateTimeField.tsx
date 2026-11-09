import { CalendarClock } from 'lucide-react';
import type { ReactNode } from 'react';
import { combineDateTime, formatDateTimeId, splitDateTime } from '../lib/datetime';
import { Input, Label } from './ui';

export function DateTimeField({
    id,
    label,
    value,
    onChange,
    error,
    required = false,
    footer,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    footer?: ReactNode;
}) {
    const { date, time } = splitDateTime(value);

    return (
        <div>
            <Label htmlFor={`${id}-date`}>
                {label} {required && <span className="text-rose-500">*</span>}
            </Label>
            <div className="grid grid-cols-[1fr_8.5rem] gap-2">
                <Input
                    id={`${id}-date`}
                    type="date"
                    value={date}
                    onChange={(event) => onChange(combineDateTime(event.target.value, time || '00:00'))}
                    required={required}
                />
                <Input
                    id={`${id}-time`}
                    type="time"
                    value={time}
                    onChange={(event) => onChange(combineDateTime(date, event.target.value))}
                    step={60}
                    required={required}
                />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CalendarClock size={13} className="shrink-0" /> {formatDateTimeId(value)}
            </p>
            {footer && <div className="mt-2 flex flex-wrap gap-1.5">{footer}</div>}
            {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}
