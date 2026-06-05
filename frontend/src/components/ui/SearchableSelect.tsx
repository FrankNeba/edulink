'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableSelectOption {
    value: string | number;
    label: string;
    sublabel?: string;
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string | number | null | undefined;
    onChange: (value: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(() => {
        return options.find((opt) => String(opt.value) === String(value));
    }, [options, value]);

    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const s = search.toLowerCase();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(s) ||
                (opt.sublabel && opt.sublabel.toLowerCase().includes(s))
        );
    }, [options, search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-left text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                    isOpen && "border-violet-500 ring-2 ring-violet-500/20"
                )}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : <span className="text-slate-400 font-medium">{placeholder}</span>}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isOpen && "transform rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-full min-w-[200px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative flex items-center mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 h-8 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs font-medium outline-none border-none text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all",
                                            isSelected ? "text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20" : "text-slate-700 dark:text-slate-300"
                                        )}
                                    >
                                        <div className="truncate pr-4">
                                            <div>{opt.label}</div>
                                            {opt.sublabel && (
                                                <div className="text-[10px] text-slate-400 font-medium truncate">
                                                    {opt.sublabel}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-4 text-center text-xs font-medium text-slate-400">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
