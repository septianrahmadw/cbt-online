import { useEffect, useRef } from 'react';

export type ViolationType = 'blur' | 'fullscreen_exit' | 'tab_switch' | 'shortcut';

type ViolationHandler = (type: ViolationType, durationSeconds: number) => void;

export function useAntiCheat(enabled: boolean, onViolation: ViolationHandler): void {
    const handlerRef = useRef(onViolation);
    const lastTrigger = useRef(0);

    handlerRef.current = onViolation;

    useEffect(() => {
        if (!enabled) {
            return;
        }

        let hiddenAt: number | null = null;

        const trigger = (type: ViolationType, durationSeconds = 0) => {
            const now = Date.now();

            if (now - lastTrigger.current < 2500) {
                return;
            }

            lastTrigger.current = now;
            handlerRef.current(type, durationSeconds);
        };

        const handleVisibility = () => {
            if (document.hidden) {
                hiddenAt = Date.now();
                trigger('tab_switch', 0);
            } else if (hiddenAt) {
                hiddenAt = null;
            }
        };

        const handleBlur = () => trigger('blur', 0);

        const handleFullscreen = () => {
            if (!document.fullscreenElement) {
                trigger('fullscreen_exit', 0);
            }
        };

        const handleContextMenu = (event: MouseEvent) => {
            event.preventDefault();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const blockedCombo =
                (event.ctrlKey && ['c', 'v', 'u', 'p', 's'].includes(key)) ||
                (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
                key === 'f12' ||
                key === 'printscreen';

            if (blockedCombo) {
                event.preventDefault();
                trigger('shortcut', 0);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreen);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreen);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled]);
}
