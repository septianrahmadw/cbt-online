type KeyboardLockApi = {
    lock?: (keys?: string[]) => Promise<void>;
    unlock?: () => void;
};

function keyboardApi(): KeyboardLockApi | undefined {
    return (navigator as Navigator & { keyboard?: KeyboardLockApi }).keyboard;
}

export function fullscreenSupported(): boolean {
    return typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function';
}

export async function lockEscapeKey(): Promise<void> {
    try {
        await keyboardApi()?.lock?.(['Escape']);
    } catch {
        // Keyboard Lock tidak didukung browser ini.
    }
}

export function unlockKeyboard(): void {
    try {
        keyboardApi()?.unlock?.();
    } catch {
        // abaikan
    }
}

export async function enterFullscreen(): Promise<boolean> {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen?.();
        }

        await lockEscapeKey();

        return Boolean(document.fullscreenElement);
    } catch {
        return false;
    }
}

export async function exitFullscreen(): Promise<void> {
    unlockKeyboard();

    try {
        if (document.fullscreenElement) {
            await document.exitFullscreen?.();
        }
    } catch {
        // abaikan
    }
}
