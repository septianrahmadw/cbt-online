import DOMPurify from 'dompurify';
import katex from 'katex';
import { useMemo } from 'react';
import { cn } from '../lib/utils';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderMath(raw: string): string {
    const escaped = escapeHtml(raw);

    return escaped
        .replace(/\$\$([\s\S]+?)\$\$/g, (_match, expression: string) =>
            katex.renderToString(expression, { displayMode: true, throwOnError: false, strict: false })
        )
        .replace(/\$([^$]+?)\$/g, (_match, expression: string) =>
            katex.renderToString(expression, { displayMode: false, throwOnError: false, strict: false })
        )
        .replace(/\n/g, '<br />');
}

export function MathText({ text, className }: { text: string | null | undefined; className?: string }) {
    const html = useMemo(() => {
        if (!text) {
            return '';
        }

        return DOMPurify.sanitize(renderMath(text), {
            ADD_ATTR: ['target', 'style', 'class'],
            ADD_TAGS: ['math', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace', 'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'munder', 'mover', 'munderover', 'annotation', 'semantics'],
        });
    }, [text]);

    return <div className={cn('leading-relaxed', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
