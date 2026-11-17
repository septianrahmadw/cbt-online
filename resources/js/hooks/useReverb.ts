import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { getEcho, disconnectEcho } from '../lib/echo';

type ChannelType = 'private' | 'presence' | 'public';

// Use any for Echo types to avoid complex generic issues
type EchoInstance = any;
type EchoChannel = any;

interface ReverbEvent<T = unknown> {
    session_id: number;
    exam_id: number;
    remaining_seconds: number;
    violations_count: number;
    answered_count?: number;
    last_violation_type?: string | null;
    status: string;
    is_completed?: boolean;
    forced_submit?: boolean;
    violation?: { type: string; duration_seconds: number; metadata: unknown; occurred_at: string };
    timestamp: string;
    [key: string]: unknown;
}

interface UseReverbOptions<T> {
    channel: string;
    event: string;
    type?: ChannelType;
    onMessage?: (data: T) => void;
    deps?: unknown[];
}

export function useReverb<T = ReverbEvent>({
    channel,
    event,
    type = 'private',
    onMessage,
    deps = [],
}: UseReverbOptions<T>) {
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<T | null>(null);
    const channelRef = useRef<EchoChannel | null>(null);
    const onMessageRef = useRef(onMessage);

    onMessageRef.current = onMessage;

    useEffect(() => {
        const echo: EchoInstance = getEcho();

        const joinChannel = () => {
            let ch: EchoChannel;

            switch (type) {
                case 'presence':
                    ch = echo.join(channel);
                    break;
                case 'public':
                    ch = echo.channel(channel);
                    break;
                default:
                    ch = echo.private(channel);
            }

            ch.listen(event, (data: T) => {
                setLastMessage(data);
                setConnected(true);
                onMessageRef.current?.(data);
            });

            if (type === 'presence') {
                ch.here(() => {
                    setConnected(true);
                }).leaving(() => {
                    // Handle member leaving
                });
            } else {
                ch.subscribed(() => {
                    setConnected(true);
                });
            }

            channelRef.current = ch;
        };

        joinChannel();

        return () => {
            if (channelRef.current) {
                echo.leave(channel);
                channelRef.current = null;
            }
            setConnected(false);
        };
    }, [channel, event, type, ...deps]);

    const send = useCallback(
        (eventName: string, data: unknown) => {
            if (channelRef.current && 'whisper' in channelRef.current) {
                (channelRef.current as { whisper: (event: string, data: unknown) => void }).whisper(eventName, data);
            }
        },
        []
    );

    return { connected, lastMessage, send };
}

export function useReverbHeartbeat(sessionId: number, examId: number) {
    const [data, setData] = useState<{
        remaining_seconds: number;
        violations_count: number;
        status: string;
        timestamp: string;
    } | null>(null);

    const { connected, lastMessage } = useReverb<ReverbEvent>({
        channel: `exam-session.${sessionId}`,
        event: '.exam.session.heartbeat',
        onMessage: (msg) => setData({
            remaining_seconds: msg.remaining_seconds,
            violations_count: msg.violations_count,
            status: msg.status,
            timestamp: msg.timestamp,
        }),
    });

    useEffect(() => {
        if (lastMessage) {
            setData({
                remaining_seconds: lastMessage.remaining_seconds,
                violations_count: lastMessage.violations_count,
                status: lastMessage.status,
                timestamp: lastMessage.timestamp,
            });
        }
    }, [lastMessage]);

    return { connected, data };
}

export interface ExamSessionHeartbeatEvent {
    session_id: number;
    exam_id: number;
    remaining_seconds: number;
    violations_count: number;
    answered_count?: number;
    total_questions?: number;
    last_violation_type?: string | null;
    status: string;
    is_completed?: boolean;
    timestamp: string;
}

export interface ExamSessionLifecycleEvent {
    session_id: number;
    exam_id: number;
    status?: string;
}

export interface ExamSessionViolationEvent {
    session_id: number;
    exam_id: number;
    violations_count?: number;
    forced_submit?: boolean;
    status?: string;
    violation?: { type: string };
}

interface ExamSessionsChannelHandlers {
    onStarted?: (event: ExamSessionLifecycleEvent) => void;
    onSubmitted?: (event: ExamSessionLifecycleEvent) => void;
}

export function useExamSessionsChannel(
    examIds: number[],
    handlers: ExamSessionsChannelHandlers = {},
) {
    const [sessions, setSessions] = useState<Map<number, ExamSessionHeartbeatEvent>>(new Map());
    const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
    const [connected, setConnected] = useState(false);
    const handlersRef = useRef(handlers);

    handlersRef.current = handlers;

    const examIdsKey = examIds.join(',');

    useEffect(() => {
        const ids = examIdsKey === '' ? [] : examIdsKey.split(',').map(Number);

        if (ids.length === 0) {
            setConnected(false);

            return;
        }

        const echo: EchoInstance = getEcho();
        const connection: any = echo.connector?.pusher?.connection;
        const requiredSubscriptions = ids.length * 2;

        let connectionState: string = connection?.state ?? 'connecting';
        let subscribedCount = 0;

        const syncConnection = () => {
            setConnected(connectionState === 'connected' && subscribedCount >= requiredSubscriptions);
        };

        const handleStateChange = (states: { current: string }) => {
            connectionState = states.current;
            syncConnection();
        };

        connection?.bind('state_change', handleStateChange);
        syncConnection();

        const markCompleted = (sessionId: number) => {
            setCompletedIds((prev) => {
                if (prev.has(sessionId)) {
                    return prev;
                }

                const next = new Set(prev);
                next.add(sessionId);

                return next;
            });
        };

        const handleSubscribed = () => {
            subscribedCount += 1;
            syncConnection();
        };

        ids.forEach((examId) => {
            // Event kustom broadcastAs() harus diawali titik agar tidak diberi namespace "App.Events" oleh Echo.
            const sessionsChannel = echo.private(`exam.${examId}.sessions`);

            sessionsChannel.listen('.exam.session.heartbeat', (msg: ExamSessionHeartbeatEvent) => {
                setSessions((prev) => {
                    const next = new Map(prev);
                    next.set(msg.session_id, msg);

                    return next;
                });

                if (msg.is_completed || (msg.status && msg.status !== 'active')) {
                    markCompleted(msg.session_id);
                }
            });

            sessionsChannel.listen('.exam.session.started', (msg: ExamSessionLifecycleEvent) => {
                handlersRef.current.onStarted?.(msg);
            });

            sessionsChannel.listen('.exam.session.submitted', (msg: ExamSessionLifecycleEvent) => {
                setSessions((prev) => {
                    if (!prev.has(msg.session_id)) {
                        return prev;
                    }

                    const next = new Map(prev);
                    next.delete(msg.session_id);

                    return next;
                });

                markCompleted(msg.session_id);
                handlersRef.current.onSubmitted?.(msg);
            });

            sessionsChannel.subscribed(handleSubscribed);

            // Channel pelanggaran: update jumlah pelanggaran secara real-time.
            const violationsChannel = echo.private(`exam.${examId}.violations`);

            violationsChannel.listen('.exam.session.violation', (msg: ExamSessionViolationEvent) => {
                setSessions((prev) => {
                    const existing = prev.get(msg.session_id);

                    if (!existing) {
                        return prev;
                    }

                    const next = new Map(prev);
                    next.set(msg.session_id, {
                        ...existing,
                        violations_count: msg.violations_count ?? existing.violations_count,
                        last_violation_type: msg.violation?.type ?? existing.last_violation_type,
                        status: msg.status ?? existing.status,
                        is_completed: msg.forced_submit ? true : existing.is_completed,
                    });

                    return next;
                });

                if (msg.forced_submit) {
                    markCompleted(msg.session_id);
                }
            });

            violationsChannel.subscribed(handleSubscribed);
        });

        return () => {
            connection?.unbind('state_change', handleStateChange);

            ids.forEach((examId) => {
                void echo.leave(`exam.${examId}.sessions`);
                void echo.leave(`exam.${examId}.violations`);
            });

            setConnected(false);
        };
    }, [examIdsKey]);

    const sessionList = useMemo(() => Array.from(sessions.values()), [sessions]);

    return { connected, sessions: sessionList, completedIds };
}