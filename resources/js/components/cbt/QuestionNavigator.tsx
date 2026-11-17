import { useMemo, useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui';

export interface NavigatorQuestion {
    id: number;
    number: number;
    answer: {
        selected_option_id: number | null;
        is_doubtful: boolean;
    };
}

type Filter = 'all' | 'answered' | 'unanswered' | 'doubtful';

interface QuestionNavigatorProps {
    questions: NavigatorQuestion[];
    currentIndex: number;
    onSelect: (index: number) => void;
    disabled?: boolean;
}

export function QuestionNavigator({
    questions,
    currentIndex,
    onSelect,
    disabled = false,
}: QuestionNavigatorProps) {
    const [filter, setFilter] = useState<Filter>('all');
    const gridRef = useRef<HTMLDivElement>(null);

    const counts = useMemo(() => {
        const answered = questions.filter((q) => q.answer.selected_option_id !== null).length;
        const doubtful = questions.filter((q) => q.answer.is_doubtful).length;

        return {
            answered,
            doubtful,
            unanswered: questions.length - answered,
        };
    }, [questions]);

    const visible = questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => {
            if (filter === 'answered') return question.answer.selected_option_id !== null;
            if (filter === 'unanswered') return question.answer.selected_option_id === null;
            if (filter === 'doubtful') return question.answer.is_doubtful;
            return true;
        });

    const filters: { key: Filter; label: string; count: number; color: string; bgColor: string; textColor: string }[] = [
        { key: 'all', label: 'Semua', count: questions.length, color: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700', bgColor: 'bg-slate-100', textColor: 'text-slate-600' },
        { key: 'answered', label: 'Dijawab', count: counts.answered, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
        { key: 'unanswered', label: 'Belum', count: counts.unanswered, color: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700', bgColor: 'bg-slate-100', textColor: 'text-slate-600' },
        { key: 'doubtful', label: 'Ragu-ragu', count: counts.doubtful, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    ];

    // Scroll current question into view when filter changes or currentIndex changes
    useEffect(() => {
        if (gridRef.current) {
            const activeButton = gridRef.current.querySelector('[data-active="true"]');
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentIndex, filter]);

    // Handle keyboard navigation within grid
    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
        if (disabled) return;

        let newIndex: number | null = null;

        switch (event.key) {
            case 'ArrowRight':
                event.preventDefault();
                newIndex = index < questions.length - 1 ? index + 1 : null;
                break;
            case 'ArrowLeft':
                event.preventDefault();
                newIndex = index > 0 ? index - 1 : null;
                break;
            case 'ArrowDown':
                event.preventDefault();
                newIndex = index + 5 < questions.length ? index + 5 : null;
                break;
            case 'ArrowUp':
                event.preventDefault();
                newIndex = index - 5 >= 0 ? index - 5 : null;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                onSelect(index);
                return;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = questions.length - 1;
                break;
        }

        if (newIndex !== null) {
            onSelect(newIndex);
        }
    };

    const getButtonClass = (answered: boolean, doubtful: boolean, active: boolean) => {
        const base = 'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        if (active) {
            return `${base} border-brand-500 bg-brand-600 text-white shadow-md ring-2 ring-brand-500/30`;
        }
        if (doubtful) {
            return `${base} border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20`;
        }
        if (answered) {
            return `${base} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20`;
        }
        return `${base} border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-600`;
    };

    return (
        <div className="space-y-2.5 min-w-0">
            {/* Progress Summary */}
            <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden dark:bg-slate-700">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${questions.length > 0 ? (counts.answered / questions.length) * 100 : 0}%` }}
                        />
                    </div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 shrink-0 whitespace-nowrap">
                    {counts.answered}/{questions.length}
                </span>
            </div>

            {/* Filter Tabs - with text labels and colors matching legend */}
            <div className="flex flex-wrap gap-1 min-w-0" role="group" aria-label="Filter soal">
                {filters.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setFilter(item.key)}
                        disabled={disabled}
                        className={cn(
                            'flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap shrink-0',
                            filter === item.key
                                ? 'shadow-sm ring-2 ring-offset-2'
                                    + (item.key === 'answered' ? ' bg-emerald-600 text-white ring-emerald-500' : '')
                                    + (item.key === 'doubtful' ? ' bg-amber-600 text-white ring-amber-500' : '')
                                    + (item.key === 'unanswered' ? ' bg-slate-600 text-white ring-slate-500' : '')
                                    + (item.key === 'all' ? ' bg-brand-600 text-white ring-brand-500' : '')
                                : item.color
                        )}
                        aria-pressed={filter === item.key}
                        aria-label={`${item.label} (${item.count})`}
                    >
                        <span>{item.label}</span>
                        <span className="font-mono inline-block min-w-[1.25rem] text-center text-[10px] opacity-80">{item.count}</span>
                    </button>
                ))}
            </div>

            {/* Question Grid - optimized for 280px sidebar (6 cols max = 6*32 + 5*4 = 212px) */}
            <div
                ref={gridRef}
                className="grid grid-cols-6 gap-1 min-w-0"
                role="listbox"
                aria-label="Navigasi soal"
                aria-activedescendant={`question-${currentIndex}`}
            >
                {visible.map(({ question, index }) => {
                    const answered = question.answer.selected_option_id !== null;
                    const doubtful = question.answer.is_doubtful;
                    const active = index === currentIndex;

                    return (
                        <button
                            key={question.id}
                            id={`question-${index}`}
                            type="button"
                            onClick={() => !disabled && onSelect(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            disabled={disabled}
                            className={getButtonClass(answered, doubtful, active)}
                            data-active={active}
                            data-answered={answered}
                            data-doubtful={doubtful}
                            role="option"
                            aria-selected={active}
                            aria-label={`Soal ${question.number}${answered ? ', dijawab' : ''}${doubtful ? ', ragu-ragu' : ''}${active ? ', aktif' : ''}`}
                            title={`Soal ${question.number}${answered ? ' ✓ Dijawab' : ''}${doubtful ? ' ⚠ Ragu-ragu' : ''}${active ? ' (sedang dikerjakan)' : ''}`}
                        >
                            {question.number}
                        </button>
                    );
                })}
            </div>

            {/* Legend - restored with text labels, using flex-wrap and truncate */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 min-w-0">
                <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Dijawab</span>
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span className="h-2.5 w-2.5 rounded bg-brand-500 ring-1 ring-brand-500/30 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Aktif</span>
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span className="h-2.5 w-2.5 rounded bg-amber-500 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Ragu-ragu</span>
                </span>
                <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span className="h-2.5 w-2.5 rounded bg-slate-300 dark:bg-slate-600 flex-shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Belum</span>
                </span>
            </div>

            {counts.doubtful > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 min-w-0">
                    <span className="flex-shrink-0">⚠</span>
                    <span className="truncate">{counts.doubtful} soal ragu-ragu</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 font-mono text-xs flex-shrink-0">D</kbd>
                </div>
            )}
        </div>
    );
}