import { usePage } from '@inertiajs/react';
import { AlertTriangle, ChevronLeft, ChevronRight, Expand, Flag, ShieldCheck, Keyboard, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MathText } from '../../components/MathText';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ConnectionBadge, type ConnectionStatus } from '../../components/cbt/ConnectionBadge';
import { CountdownTimer } from '../../components/cbt/CountdownTimer';
import { QuestionNavigator } from '../../components/cbt/QuestionNavigator';
import { Alert, Badge, Button, Modal, Tooltip } from '../../components/ui';
import { useAntiCheat, type ViolationType } from '../../hooks/useAntiCheat';
import { enterFullscreen, exitFullscreen, fullscreenSupported, unlockKeyboard } from '../../lib/fullscreen';
import { csrfToken } from '../../lib/utils';
import { useSyncedCountdown } from '../../hooks/useSyncedCountdown';
import type { SharedProps } from '../../types/shared';

interface Option {
    id: number;
    label: string;
    text: string | null;
    image_url: string | null;
}

interface Question {
    id: number;
    number: number;
    question_number: number;
    passage?: string | null;
    text: string;
    image_url: string | null;
    score_weight: number;
    options: Option[];
    answer: {
        selected_option_id: number | null;
        is_doubtful: boolean;
    };
}

interface WorkspaceProps {
    session: { id: number; remaining_seconds: number; violations_count: number };
    violationSettings: { enabled: boolean; limit: number };
    exam: { id: number; title: string; subject_name: string; duration_minutes: number; passing_grade: number };
    participant: { id: number; exam_number: string; full_name: string; class_name: string | null };
    questions: Question[];
}

interface ViolationState {
    open: boolean;
    forced: boolean;
    count: number;
    message: string;
}

export default function Workspace({
    session,
    violationSettings,
    exam,
    participant,
    questions: initialQuestions,
}: WorkspaceProps) {
    const violationLimit = violationSettings.limit;
    const { institution } = usePage<SharedProps>().props;
    const storageKey = `cbt_answers_${session.id}`;

    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [connection, setConnection] = useState<ConnectionStatus>('saved');
    const [started, setStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitOpen, setSubmitOpen] = useState(false);
    const [fullscreenLost, setFullscreenLost] = useState(false);
    const [violations, setViolations] = useState(session.violations_count);
    const [violation, setViolation] = useState<ViolationState>({
        open: false,
        forced: false,
        count: session.violations_count,
        message: '',
    });
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);

    const questionsRef = useRef(questions);
    const submittingRef = useRef(false);
    const submitExamRef = useRef<() => Promise<void> | undefined>(undefined);

    questionsRef.current = questions;
    submittingRef.current = submitting;

    const leaveExam = async (url: string | null | undefined) => {
        await exitFullscreen();
        window.location.href = url ?? '/exam/result';
    };

    const submitExam = async () => {
        if (submittingRef.current) {
            return;
        }

        setSubmitting(true);
        setSubmitOpen(false);

        try {
            const response = await fetch('/exam/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({}),
            });
            const data = (await response.json().catch(() => null)) as { redirect?: string } | null;
            await leaveExam(data?.redirect ?? '/exam/result');
        } catch {
            setSubmitting(false);
            setSubmitOpen(true);
        }
    };

    submitExamRef.current = submitExam;

    // Synced countdown via Reverb
    const { remaining: remainingSeconds, synced: timeSynced, connected: timeConnected, serverRemaining, forceSync: forceTimeSync } =
        useSyncedCountdown({
            initialSeconds: session.remaining_seconds,
            sessionId: session.id,
            examId: exam.id,
            onExpire: () => submitExamRef.current?.(),
            enabled: started && !submitting,
        });

    useEffect(() => {
        if (!started || submitting) {
            return;
        }

        let cancelled = false;

        const check = async () => {
            try {
                const response = await fetch('/exam/heartbeat', {
                    headers: { Accept: 'application/json' },
                });

                if (response.status === 409) {
                    const data = (await response.json().catch(() => null)) as { redirect?: string } | null;

                    if (!cancelled) {
                        void leaveExam(data?.redirect ?? '/exam/result');
                    }

                    return;
                }

                if (response.ok) {
                    const data = (await response.json().catch(() => null)) as { remaining_seconds?: number } | null;

                    if (!cancelled && typeof data?.remaining_seconds === 'number') {
                        // Fallback sync if Reverb not connected
                        if (!timeConnected) {
                            forceTimeSync();
                        }
                    }
                }
            } catch {
                // Offline: jawaban tetap disimpan lokal.
            }
        };

        const interval = window.setInterval(check, 10_000);
        const handleVisibility = () => {
            if (!document.hidden) {
                void check();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started, submitting, timeConnected, forceTimeSync]);

    useEffect(() => {
        if (!started) {
            return;
        }

        const handleFullscreenChange = () => {
            if (submittingRef.current) {
                return;
            }

            if (document.fullscreenElement) {
                setFullscreenLost(false);
            } else if (fullscreenSupported()) {
                setFullscreenLost(true);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [started]);

    useEffect(() => () => unlockKeyboard(), []);

    const current = questions[currentIndex];
    const toggleDoubtRef = useRef<typeof toggleDoubt>(() => {});
    // toggleDoubtRef will be updated after toggleDoubt is defined

    // Keyboard shortcuts
    useEffect(() => {
        if (!started || submitting) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if typing in input
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Ctrl/Cmd + Enter: Submit exam
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                setSubmitOpen(true);
                return;
            }

            // Arrow keys: Navigate questions
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                setCurrentIndex((index) => Math.max(0, index - 1));
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                setCurrentIndex((index) => Math.min(questions.length - 1, index + 1));
                return;
            }

            // Number keys 1-9: Quick jump to question (1-9)
            if (event.key >= '1' && event.key <= '9') {
                const index = parseInt(event.key, 10) - 1;
                if (index < questions.length) {
                    event.preventDefault();
                    setCurrentIndex(index);
                }
                return;
            }

            // D key: Toggle doubt flag
            if (event.key.toLowerCase() === 'd') {
                event.preventDefault();
                toggleDoubtRef.current(current);
                return;
            }

            // S key: Force sync
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                void syncAll();
                return;
            }

            // F key: Toggle fullscreen
            if (event.key.toLowerCase() === 'f' && !fullscreenLost) {
                event.preventDefault();
                if (document.fullscreenElement) {
                    void exitFullscreen();
                } else {
                    void enterFullscreen();
                }
                return;
            }

            // ? key: Show keyboard shortcuts
            if (event.key === '?' && event.shiftKey) {
                event.preventDefault();
                setKeyboardHelpOpen(true);
                return;
            }

            // Escape: Close modals
            if (event.key === 'Escape') {
                if (violation.open && !violation.forced) {
                    setViolation((prev) => ({ ...prev, open: false }));
                }
                if (submitOpen) {
                    setSubmitOpen(false);
                }
                if (keyboardHelpOpen) {
                    setKeyboardHelpOpen(false);
                }
                if (fullscreenLost) {
                    void reenterFullscreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [started, submitting, questions.length, currentIndex, current, fullscreenLost, violation.open, submitOpen, keyboardHelpOpen]);
    const answeredCount = useMemo(
        () => questions.filter((question) => question.answer.selected_option_id !== null).length,
        [questions]
    );
    const doubtfulCount = useMemo(
        () => questions.filter((question) => question.answer.is_doubtful).length,
        [questions]
    );

    useEffect(() => {
        const raw = window.localStorage.getItem(storageKey);

        if (!raw) {
            return;
        }

        try {
            const saved = JSON.parse(raw) as Record<string, Question['answer']>;
            setQuestions((previous) =>
                previous.map((question) => ({
                    ...question,
                    answer: saved[question.id] ?? question.answer,
                }))
            );
        } catch {
            window.localStorage.removeItem(storageKey);
        }
    }, [storageKey]);

    useEffect(() => {
        const handleOnline = () => {
            void syncAll();
        };
        const handleOffline = () => setConnection('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) {
            setConnection('offline');
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (started && !submittingRef.current) {
                event.preventDefault();
                event.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, [started]);

    const persist = (items: Question[]) => {
        const map: Record<number, Question['answer']> = {};
        items.forEach((question) => {
            map[question.id] = question.answer;
        });
        window.localStorage.setItem(storageKey, JSON.stringify(map));
    };

    const updateAnswer = (questionId: number, answer: Question['answer']) => {
        setQuestions((previous) => {
            const next = previous.map((question) =>
                question.id === questionId ? { ...question, answer } : question
            );
            persist(next);
            return next;
        });
    };

    const postJson = async (url: string, body: unknown) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify(body),
        });

        if (response.status === 409) {
            const data = (await response.json().catch(() => null)) as { redirect?: string } | null;

            await leaveExam(data?.redirect);

            throw new Error('Sesi ujian telah berakhir');
        }

        if (!response.ok) {
            throw new Error(`Request gagal (${response.status})`);
        }

        return response.json();
    };

    const sendAnswer = async (questionId: number, selectedOptionId: number | null, isDoubtful: boolean) => {
        setConnection('saving');

        try {
            const response = await postJson('/exam/answer', {
                question_id: questionId,
                selected_option_id: selectedOptionId,
                is_doubtful: isDoubtful,
            });
            setConnection('saved');
            setLastSavedAt(new Date());
            return response;
        } catch {
            setConnection('offline');
        }
    };

    const syncAll = async () => {
        const pending = questionsRef.current.filter(
            (question) => question.answer.selected_option_id !== null || question.answer.is_doubtful
        );

        if (pending.length === 0) {
            setConnection('saved');
            return;
        }

        setConnection('saving');

        const results = await Promise.allSettled(
            pending.map((question) =>
                postJson('/exam/answer', {
                    question_id: question.id,
                    selected_option_id: question.answer.selected_option_id,
                    is_doubtful: question.answer.is_doubtful,
                })
            )
        );

        const success = results.every((result) => result.status === 'fulfilled');
        setConnection(success ? 'saved' : 'offline');
        if (success) {
            setLastSavedAt(new Date());
        }
    };

    useEffect(() => {
        if (!started || connection !== 'offline') {
            return;
        }

        const interval = window.setInterval(() => {
            if (navigator.onLine) {
                void syncAll();
            }
        }, 15_000);

        return () => window.clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started, connection]);

    const selectOption = (question: Question, optionId: number) => {
        const answer = { ...question.answer, selected_option_id: optionId };
        updateAnswer(question.id, answer);
        void sendAnswer(question.id, optionId, answer.is_doubtful);
    };

    const toggleDoubt = (question: Question) => {
        const answer = { ...question.answer, is_doubtful: !question.answer.is_doubtful };
        updateAnswer(question.id, answer);
        void sendAnswer(question.id, answer.selected_option_id, answer.is_doubtful);
    };
    toggleDoubtRef.current = toggleDoubt;

    const handleViolation = async (type: ViolationType, durationSeconds: number) => {
        if (!started || submittingRef.current) {
            return;
        }

        try {
            const data = (await postJson('/exam/violation', {
                type,
                duration_seconds: durationSeconds,
            })) as { violations: number; forced: boolean; redirect: string | null };

            setViolations(data.violations);

            if (data.forced) {
                setViolation({
                    open: true,
                    forced: true,
                    count: data.violations,
                    message:
                        'Batas pelanggaran terlampaui. Ujian dihentikan otomatis dan jawaban Anda telah dikirim.',
                });
                window.setTimeout(() => {
                    void leaveExam(data.redirect ?? '/exam/result');
                }, 3000);
                return;
            }

            if (type === 'fullscreen_exit') {
                setFullscreenLost(true);
                return;
            }

            setViolation({
                open: true,
                forced: false,
                count: data.violations,
                message:
                    violationSettings.enabled && data.violations >= violationLimit - 1
                        ? 'Peringatan terakhir! Jika Anda meninggalkan halaman ujian sekali lagi, ujian akan dihentikan otomatis.'
                        : 'Sistem mendeteksi Anda meninggalkan halaman ujian. Kembali ke mode layar penuh dan fokus pada ujian.',
            });
        } catch {
            const nextCount = violations + 1;
            setViolations(nextCount);

            if (type === 'fullscreen_exit') {
                setFullscreenLost(true);
                return;
            }

            setViolation({
                open: true,
                forced: false,
                count: nextCount,
                message: 'Koneksi bermasalah. Aktivitas meninggalkan halaman tetap dicatat oleh sistem.',
            });
        }
    };

    useAntiCheat(started && !submitting, handleViolation);

    const startExam = async () => {
        const ok = await enterFullscreen();
        setStarted(true);

        if (!ok && fullscreenSupported()) {
            setFullscreenLost(true);
        }
    };

    const reenterFullscreen = async () => {
        const ok = await enterFullscreen();

        if (ok || !fullscreenSupported()) {
            setFullscreenLost(false);
        }

        setViolation((previous) => ({ ...previous, open: false }));
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{exam.title}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {participant.full_name} • {participant.exam_number} • {institution?.school_name}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <ConnectionBadge status={connection} />
                        {violations > 0 && (
                            <Badge tone="red">
                                <AlertTriangle size={12} className="mr-1" /> {violations} pelanggaran
                            </Badge>
                        )}

                        {/* Last saved indicator */}
                        {lastSavedAt && started && !submitting && (
                            <Tooltip content={`Terakhir disimpan: ${lastSavedAt.toLocaleTimeString('id-ID')}`}>
                                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" aria-live="polite">
                                    <Save size={12} />
                                    <span className="text-xs font-medium">Tersimpan</span>
                                </div>
                            </Tooltip>
                        )}

                        <div className="text-right">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Sisa waktu</p>
                            <CountdownTimer
                                remaining={remainingSeconds}
                                synced={timeSynced}
                                connected={timeConnected}
                                serverRemaining={serverRemaining}
                                urgent={remainingSeconds <= 300}
                                enabled={started && !submitting}
                            />
                        </div>

                        {/* Keyboard shortcuts help button */}
                        <Tooltip content="Bantuan Shortcut (Shift+?)">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setKeyboardHelpOpen(true)}
                                className="h-9 w-9 p-0"
                                aria-label="Keyboard shortcuts"
                            >
                                <Keyboard size={18} />
                            </Button>
                        </Tooltip>

                        <ThemeToggle />
                        <Button variant="danger" onClick={() => setSubmitOpen(true)} disabled={submitting}>
                            {submitting ? 'Mengirim...' : 'Akhiri Ujian'}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-3">
                    <div className="card p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Navigasi Soal</p>
                            <Badge tone="indigo">
                                {answeredCount}/{questions.length}
                            </Badge>
                        </div>
                        <QuestionNavigator questions={questions} currentIndex={currentIndex} onSelect={setCurrentIndex} />
                    </div>

                    <div className="card p-4 text-xs text-slate-500 dark:text-slate-400">
                        <p className="font-medium text-slate-900 dark:text-white">Petunjuk</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>Jawaban tersimpan otomatis.</li>
                            <li>Jangan menutup atau berpindah tab.</li>
                            <li>Ujian berakhir otomatis saat waktu habis.</li>
                        </ul>
                    </div>
                </aside>

                <main className="min-w-0 space-y-4">
                    {current ? (
                        <div className="card p-5 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <Badge tone="indigo">
                                    Soal {current.number} dari {questions.length}
                                </Badge>
                                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={current.answer.is_doubtful}
                                        onChange={() => toggleDoubt(current)}
                                        className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-950"
                                    />
                                    <Flag size={14} /> Ragu-ragu
                                </label>
                            </div>

                            {current.passage && (
                                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Lembar Bacaan</p>
                                    <MathText text={current.passage} />
                                </div>
                            )}

                            <MathText text={current.text} className="text-base text-slate-900 dark:text-slate-100 sm:text-lg" />

                            {current.image_url && (
                                <div className="mt-4">
                                    <img
                                        src={current.image_url}
                                        alt={`Gambar soal ${current.number}`}
                                        className="max-h-80 rounded-lg border border-slate-200 bg-slate-50 object-contain dark:border-slate-800 dark:bg-slate-950"
                                    />
                                </div>
                            )}

                            <div className="mt-5 space-y-2">
                                {current.options.map((option) => {
                                    const selected = current.answer.selected_option_id === option.id;

                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => selectOption(current, option.id)}
                                            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                                                selected
                                                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-500 dark:hover:bg-slate-900'
                                            }`}
                                        >
                                            <span
                                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                                                    selected
                                                        ? 'border-brand-500 bg-brand-600 text-white'
                                                        : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                {option.label}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <MathText text={option.text} className="text-sm text-slate-800 dark:text-slate-200" />
                                                {option.image_url && (
                                                    <img
                                                        src={option.image_url}
                                                        alt={`Opsi ${option.label}`}
                                                        className="mt-2 max-h-40 rounded border border-slate-200 object-contain dark:border-slate-800"
                                                    />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <Alert tone="error">Soal tidak tersedia.</Alert>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft size={16} /> Sebelumnya
                        </Button>

                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {currentIndex + 1} / {questions.length}
                        </p>

                        <Button
                            variant="secondary"
                            onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                            disabled={currentIndex >= questions.length - 1}
                        >
                            Selanjutnya <ChevronRight size={16} />
                        </Button>
                    </div>
                </main>
            </div>

            {!started && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                            <ShieldCheck size={28} />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Siap memulai ujian?</h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Ujian akan berjalan dalam mode layar penuh. Sistem memantau perpindahan tab dan
                            pelanggaran lainnya.{' '}
                            {violationSettings.enabled
                                ? `${violationLimit} pelanggaran menyebabkan ujian dihentikan otomatis.`
                                : 'Pelanggaran tetap dicatat oleh sistem.'}
                        </p>
                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                            <p className="font-medium text-slate-900 dark:text-white">{exam.title}</p>
                            <p>
                                {questions.length} soal • {exam.duration_minutes} menit • KKM {exam.passing_grade}
                            </p>
                        </div>
                        <Button className="mt-5 w-full" size="lg" onClick={startExam}>
                            <Expand size={18} /> Mulai Ujian (Layar Penuh)
                        </Button>
                    </div>
                </div>
            )}

            {started && !submitting && fullscreenLost && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
                    role="alertdialog"
                    aria-modal="true"
                    aria-label="Mode layar penuh wajib aktif"
                >
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                            <Expand size={28} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Mode Layar Penuh Wajib Aktif
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Anda terdeteksi keluar dari mode layar penuh. Kembali ke layar penuh untuk melanjutkan
                            ujian. Aktivitas ini tercatat sebagai pelanggaran.
                        </p>
                        <Button className="mt-5 w-full" size="lg" onClick={reenterFullscreen}>
                            <Expand size={18} /> Kembali ke Layar Penuh
                        </Button>
                    </div>
                </div>
            )}

            <Modal
                open={violation.open}
                onClose={() => !violation.forced && setViolation((previous) => ({ ...previous, open: false }))}
                closable={!violation.forced}
                title={violation.forced ? 'Ujian Dihentikan' : 'Peringatan Integritas Ujian'}
                footer={
                    violation.forced ? (
                        <Badge tone="red">Mengalihkan ke halaman hasil...</Badge>
                    ) : (
                        <Button onClick={reenterFullscreen}>
                            <Expand size={16} /> Kembali ke Layar Penuh
                        </Button>
                    )
                }
            >
                <div className="space-y-2">
                    <p className="flex items-start gap-2">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
                        <span>{violation.message}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pelanggaran tercatat: {violation.count}.{' '}
                        {violationSettings.enabled
                            ? `Toleransi maksimal ${violationLimit} pelanggaran.`
                            : 'Pelanggaran tetap dicatat, ujian tidak dihentikan otomatis.'}
                    </p>
                </div>
            </Modal>

            <Modal
                open={submitOpen}
                onClose={() => setSubmitOpen(false)}
                title="Kirim jawaban sekarang?"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setSubmitOpen(false)} disabled={submitting}>
                            Batal
                        </Button>
                        <Button variant="success" onClick={submitExam} disabled={submitting}>
                            {submitting ? 'Mengirim...' : 'Kirim Sekarang'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <p>Pastikan seluruh jawaban sudah diperiksa. Jawaban tidak dapat diubah setelah dikirim.</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-950">
                            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">{answeredCount}</p>
                            <p className="text-slate-500 dark:text-slate-400">Dijawab</p>
                        </div>
                        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-950">
                            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{questions.length - answeredCount}</p>
                            <p className="text-slate-500 dark:text-slate-400">Kosong</p>
                        </div>
                        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-950">
                            <p className="text-lg font-semibold text-amber-600 dark:text-amber-300">{doubtfulCount}</p>
                            <p className="text-slate-500 dark:text-slate-400">Ragu</p>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Keyboard Shortcuts Help Modal */}
            <Modal
                open={keyboardHelpOpen}
                onClose={() => setKeyboardHelpOpen(false)}
                title="Shortcut Keyboard"
                size="lg"
                footer={
                    <Button variant="secondary" onClick={() => setKeyboardHelpOpen(false)}>
                        Tutup
                    </Button>
                }
            >
                <div className="space-y-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">Ctrl+Enter</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Kirim ujian (buka konfirmasi)</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">← / →</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Soal sebelumnya / selanjutnya</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">1-9</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Lompat ke soal 1-9</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">D</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Toggle ragu-ragu soal aktif</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">Ctrl+S</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Sinkronisasi jawaban manual</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">F</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Toggle mode layar penuh</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">Shift+?</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Tampilkan bantuan ini</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <kbd className="flex h-8 min-w-[60px] items-center justify-center rounded border border-slate-300 bg-white px-2 font-mono text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">Esc</kbd>
                            <span className="text-slate-700 dark:text-slate-300">Tutup modal / kembali layar penuh</span>
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-slate-700 dark:bg-amber-500/10 dark:text-amber-300">
                        <p className="font-medium">Catatan:</p>
                        <ul className="mt-1.5 list-disc list-inside space-y-1">
                            <li>Shortcut hanya aktif saat ujian berjalan (bukan di input teks)</li>
                            <li>Jawaban tersimpan otomatis ke server & localStorage</li>
                            <li>Waktu dihitung di server (tidak bisa dimanipulasi)</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
