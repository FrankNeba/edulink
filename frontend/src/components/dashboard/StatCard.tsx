'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    href?: string;
    color?: string;
    change?: string;
}

export function StatCard({ title, value, icon: Icon, href, color = '#6d28d9', change }: StatCardProps) {
    const inner = (
        <div
            style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '1.5rem',
                height: '100%',
                cursor: 'pointer',
                borderRadius: '0.875rem',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = 'var(--shadow-hover)';
                el.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = 'var(--shadow-card)';
                el.style.transform = 'translateY(0)';
            }}
        >
            {/* top accent stripe */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '0.875rem 0.875rem 0 0' }} />

            {/* decorative blurred circle */}
            <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '100px', height: '100px',
                borderRadius: '50%',
                background: color,
                opacity: 0.07,
                filter: 'blur(24px)',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                {/* Icon */}
                <div style={{
                    width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${color}18`,
                }}>
                    <Icon size={18} style={{ color }} />
                </div>

                {/* Change badge */}
                {change && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(16,185,129,0.12)',
                        color: '#10b981',
                        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em',
                    }}>
                        <TrendingUp size={10} />
                        {change}
                    </div>
                )}
            </div>

            {/* Value */}
            <div style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.1, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {value}
            </div>

            {/* Title */}
            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                {title}
            </div>
        </div>
    );

    return href ? <Link href={href} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>{inner}</Link> : inner;
}
