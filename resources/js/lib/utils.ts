import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds: number): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remaining = seconds % 60;

    const pad = (value: number) => String(value).padStart(2, '0');

    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(remaining)}` : `${pad(minutes)}:${pad(remaining)}`;
}

export function formatExamDateTime(value: string | null): string {
    if (!value) {
        return 'Jadwal belum ditentukan';
    }

    const date = new Date(value);
    const day = new Intl.DateTimeFormat('id-ID', { day: '2-digit' }).format(date);
    const monthYear = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
    const time = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date);

    return `${day}, ${monthYear} ${time}`;
}

export function formatExamSchedule(start: string | null, end: string | null): string {
    if (!start || !end) {
        return 'Jadwal belum ditentukan';
    }

    return `${formatExamDateTime(start)} s/d ${formatExamDateTime(end)}`;
}

export function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}
