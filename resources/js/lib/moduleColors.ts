export type ModuleColor = 'brand' | 'blue' | 'green' | 'amber' | 'red' | 'slate';

export const MODULE_COLOR_OPTIONS: { value: ModuleColor; label: string }[] = [
    { value: 'brand', label: 'Brand' },
    { value: 'blue', label: 'Biru' },
    { value: 'green', label: 'Hijau' },
    { value: 'amber', label: 'Amber' },
    { value: 'red', label: 'Merah' },
    { value: 'slate', label: 'Slate' },
];

export type BadgeTone = 'slate' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo';

const toneMap: Record<string, BadgeTone> = {
    brand: 'indigo',
    blue: 'blue',
    green: 'green',
    amber: 'yellow',
    red: 'red',
    slate: 'slate',
};

const labelMap: Record<string, string> = Object.fromEntries(
    MODULE_COLOR_OPTIONS.map((option) => [option.value, option.label])
);

const gradientMap: Record<string, string> = {
    brand: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    blue: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    amber: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    slate: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
};

export function moduleTone(color: string): BadgeTone {
    return toneMap[color] ?? 'slate';
}

export function moduleColorLabel(color: string): string {
    return labelMap[color] ?? color;
}

export function moduleGradient(color: string): string {
    return gradientMap[color] ?? gradientMap.brand;
}
