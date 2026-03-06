'use client';
/**
 * MathText — Renders text that may contain LaTeX inline ($...$) or display ($$...$$) expressions.
 * Falls back gracefully to plain text if KaTeX fails.
 */

import React, { useMemo } from 'react';

// Dynamically import katex only on the client
let katex: any = null;
if (typeof window !== 'undefined') {
    try {
        katex = require('katex');
        // Inject KaTeX CSS if not already present
        if (!document.getElementById('katex-css')) {
            const link = document.createElement('link');
            link.id = 'katex-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);
        }
    } catch { /* katex not available */ }
}

function renderMathToHTML(raw: string): string {
    if (!katex) return escapeHtml(raw);
    let result = raw;
    try {
        // Display math $$...$$ (non-greedy, no dot-all needed since we split)
        result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
            try {
                return katex.renderToString(math, { displayMode: true, throwOnError: false });
            } catch {
                return escapeHtml(math);
            }
        });
        // Inline math $...$
        result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
            try {
                return katex.renderToString(math, { displayMode: false, throwOnError: false });
            } catch {
                return escapeHtml(math);
            }
        });
        // Render **bold** markers
        result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Render \n as <br>
        result = result.replace(/\\n/g, '<br />');
    } catch {
        return escapeHtml(raw);
    }
    return result;
}

function escapeHtml(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

interface MathTextProps {
    text: string;
    className?: string;
    as?: 'span' | 'p' | 'div';
}

export default function MathText({ text, className = '', as: Tag = 'span' }: MathTextProps) {
    const html = useMemo(() => renderMathToHTML(text || ''), [text]);
    return (
        <Tag
            className={className}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
