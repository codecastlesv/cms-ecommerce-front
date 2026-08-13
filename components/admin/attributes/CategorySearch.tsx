'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Loader2, ChevronDown, Hash } from 'lucide-react';
import api from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';

interface CategoryOption {
    id: number;
    name: string;
    code: number;
}

interface Props {
    selectedCodes: number[];
    onSelectionChange: (codes: number[]) => void;
    placeholder?: string;
}

export function CategorySearch({ selectedCodes, onSelectionChange, placeholder = "Buscar..." }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CategoryOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const debouncedQuery = useDebounce(query, 300);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchCategories = async (searchTerm: string = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('only_roots', '1');
            params.append('limit', '20');
            if (searchTerm) params.append('search', searchTerm);

            const { data } = await api.get(`/admin/categories?${params.toString()}`);
            setResults(data.data);
        } catch (e) {
            console.error("Error buscando categorías", e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchCategories(debouncedQuery);
        }
    }, [debouncedQuery, isOpen]);

    const handleFocus = () => {
        setIsOpen(true);
        if (results.length === 0 && query === '') {
            fetchCategories('');
        }
    };

    const toggleSelection = (code: number) => {
        if (selectedCodes.includes(code)) {
            onSelectionChange(selectedCodes.filter(c => c !== code));
        } else {
            onSelectionChange([...selectedCodes, code]);
        }
        inputRef.current?.focus();
    };

    const clearSearch = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full group" ref={wrapperRef}>
            <div className="relative">
                <div className={`flex items-center w-full border rounded-lg bg-white transition-all overflow-hidden ${isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-300 hover:border-slate-400"
                    }`}>
                    <div className="pl-3 text-slate-400">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full px-3 py-2.5 text-sm outline-none placeholder:text-slate-400"
                        placeholder={selectedCodes.length > 0 ? `${selectedCodes.length} seleccionadas...` : placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleFocus}
                    />
                    <div className="pr-2 flex items-center gap-1">
                        {query && (
                            <button onClick={clearSearch} type="button" className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {loading ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                        {results.length > 0 ? (
                            <div className="py-1">
                                {results.map((cat) => {
                                    const isSelected = selectedCodes.includes(cat.code);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleSelection(cat.code)}
                                            className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors border-l-2 ${isSelected
                                                ? "bg-blue-50 border-blue-500"
                                                : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                                                    {cat.name}
                                                </span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                                                    <Hash className="w-3 h-3" /> {cat.code}
                                                </div>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-slate-400">
                                {loading ? (
                                    <span className="text-xs">Buscando...</span>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 opacity-20" />
                                        <span className="text-xs">No se encontraron categorías.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {selectedCodes.map(code => (
                        <span key={code} className="inline-flex items-center pl-2.5 pr-1 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 shadow-sm text-slate-700 group/tag hover:border-red-200 hover:bg-red-50 transition-colors cursor-default">
                            <span className="mr-1.5 font-mono text-slate-400">#{code}</span>
                            <button
                                type="button"
                                onClick={() => toggleSelection(code)}
                                className="p-0.5 hover:bg-red-100 rounded text-slate-400 group-hover/tag:text-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={() => onSelectionChange([])}
                        className="text-[10px] text-slate-400 hover:text-red-600 underline decoration-dotted underline-offset-2 transition-colors ml-1"
                    >
                        Limpiar todo
                    </button>
                </div>
            )}
        </div>
    );
}