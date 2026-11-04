import { cn } from '../lib/utils';
import { X } from 'lucide-react';
import type {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    LabelHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
    primary:
        'bg-brand-600 text-white shadow-md shadow-brand-200 hover:bg-brand-700 focus-visible:ring-brand-500 dark:shadow-none',
    secondary:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400',
    outline:
        'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
};

const buttonSizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
                buttonVariants[variant],
                buttonSizes[size],
                className
            )}
            {...props}
        />
    );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn('input h-10 py-2', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cn('input', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={cn('input h-10 py-2', className)} {...props}>
            {children}
        </select>
    );
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
    return <label className={cn('label', className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn('card p-5', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h3 className={cn('text-base font-semibold text-heading', className)}>{children}</h3>;
}

export function Badge({
    children,
    tone = 'slate',
    className,
}: {
    children: ReactNode;
    tone?: 'slate' | 'green' | 'red' | 'yellow' | 'blue' | 'indigo';
    className?: string;
}) {
    const tones = {
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        red: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
        yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
        blue: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
        indigo: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    } as const;

    return (
        <span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
            {children}
        </span>
    );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'success' | 'error'; children: ReactNode }) {
    const tones = {
        info: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200',
        success:
            'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
        error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200',
    } as const;

    return <div className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone])}>{children}</div>;
}

export function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    closable = true,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    closable?: boolean;
}) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            onClick={() => closable && onClose()}
        >
            <div
                className="card w-full max-w-lg p-5 shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    {title ? <h3 className="text-lg font-semibold text-heading">{title}</h3> : <span />}
                    {closable && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            aria-label="Tutup"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div>
                {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
            </div>
        </div>
    );
}

export function EmptyState({ children }: { children: ReactNode }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {children}
        </div>
    );
}
