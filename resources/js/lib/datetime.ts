export function splitDateTime(value: string | null | undefined): { date: string; time: string } {
    if (!value) {
        return { date: '', time: '' };
    }

    const [date = '', time = ''] = value.split('T');

    return { date, time: time.slice(0, 5) };
}

export function combineDateTime(date: string, time: string): string {
    if (!date) {
        return '';
    }

    return `${date}T${time || '00:00'}`;
}

export function toLocalInput(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
        date.getMinutes()
    )}`;
}

export function addMinutes(value: string, minutes: number): string {
    const { date, time } = splitDateTime(value);

    if (!date) {
        return '';
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = (time || '00:00').split(':').map(Number);
    const result = new Date(year, month - 1, day, hour, minute);
    result.setMinutes(result.getMinutes() + minutes);

    return toLocalInput(result);
}

export function formatDateTimeId(value: string | null | undefined): string {
    const { date, time } = splitDateTime(value);

    if (!date) {
        return 'Belum diatur';
    }

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = (time || '00:00').split(':').map(Number);
    const parsed = new Date(year, month - 1, day, hour, minute);
    const dayLabel = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(parsed);

    return `${dayLabel} • ${time || '00:00'} WIB`;
}

export function nowLocalInput(): string {
    return toLocalInput(new Date());
}

export function todayAt(hour: number, minute = 0, dayOffset = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, minute, 0, 0);

    return toLocalInput(date);
}
