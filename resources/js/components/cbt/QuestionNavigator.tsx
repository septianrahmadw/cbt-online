import { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';

export interface NavigatorQuestion {
    id: number;
    number: number;
    answer: {
        selected_option_id: number | null;
        is_doubtful: boolean;
    };
}

type Filter = 'all' | 'answered' | 'unanswered' | 'doubtful';

export function QuestionNavigator({
    questions,
    currentIndex,
    onSelect,
}: {
    questions: NavigatorQuestion[];
    currentIndex: number;
    onSelect: (index: number) => void;
}) {
    const [filter, setFilter] = useState<Filter>('all');

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

    const filters: { key: Filter; label: string; count: number }[] = [
        { key: 'all', label: 'Semua', count: questions.length },
        { key: 'answered', label: 'Dijawab', count: counts.answered },
        { key: 'unanswered', label: 'Belum', count: counts.unanswered },
        { key: 'doubtful', label: 'Ragu', count: counts.doubtful },
    ];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
                {filters.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setFilter(item.key)}
                        className={cn(
                            'rounded-md px-2 py-1 text-xs transition',
                            filter === item.key
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        )}
                    >
                        {item.label} ({item.count})
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
                {visible.map(({ question, index }) => {
                    const answered = question.answer.selected_option_id !== null;
                    const doubtful = question.answer.is_doubtful;
                    const active = index === currentIndex;

                    return (
                        <button
                            key={question.id}
                            type="button"
                            onClick={() => onSelect(index)}
                            className={cn(
                                'flex h-9 items-center justify-center rounded-md border text-sm font-medium transition',
                                active
                                    ? 'border-brand-500 bg-brand-600 text-white'
                                    : doubtful
                                      ? 'border-amber-400 bg-amber-100 text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-200'
                                      : answered
                                        ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200'
                                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                            )}
                        >
                            {question.number}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Dijawab
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Aktif
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Ragu-ragu
                </span>
                <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-400 dark:bg-slate-600" /> Belum
                </span>
            </div>
        </div>
    );
}
