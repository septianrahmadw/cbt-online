import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../lib/theme';

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggle } = useTheme();
    const dark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={dark ? 'Mode terang' : 'Mode gelap'}
            className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                className
            )}
        >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
    );
}
