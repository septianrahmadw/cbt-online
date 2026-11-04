import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cbt-theme';
const CHANGE_EVENT = 'cbt-theme-change';

export function getStoredTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'light';
    }

    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: Theme): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent<Theme>(CHANGE_EVENT, { detail: theme }));
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof document === 'undefined') {
            return 'light';
        }

        return document.documentElement.classList.contains('dark') ? 'dark' : getStoredTheme();
    });

    useEffect(() => {
        const sync = (event: Event) => {
            const next =
                event instanceof CustomEvent && (event.detail === 'dark' || event.detail === 'light')
                    ? event.detail
                    : getStoredTheme();
            setThemeState(next);
            applyTheme(next);
        };

        window.addEventListener(CHANGE_EVENT, sync);
        window.addEventListener('storage', sync);

        return () => {
            window.removeEventListener(CHANGE_EVENT, sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setThemeState(next);
    };

    return { theme, toggle };
}
