'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Edit2, Trash2, Plus, Folder, FolderOpen, FileText, Loader2, Search, ChevronRight, ChevronDown, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { usePermission } from '@/hooks/usePermission';
import { Category, LaravelResource } from '@/types';
import { handleError } from '@/lib/errorHandler';
import { useCatalog } from '@/components/providers/CatalogContext';

export default function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const confirm = useConfirm();
    const { can } = usePermission();
    const { refreshCatalog } = useCatalog();

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data } = await api.get<LaravelResource<Category[]>>('/admin/categories');

            const sortedData = data.data.sort((a, b) => {
                const codeA = a.code ?? 0;
                const codeB = b.code ?? 0;
                return codeA - codeB;
            });

            setCategories(sortedData);
        } catch (error) {
            const msg = handleError(error, 'CategoryList Fetch');
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const handleDelete = (id: number) => {
        if (!can('delete_categories')) return;
        confirm({
            title: '¿Eliminar categoría?',
            message: 'Esta acción borrará la categoría. Si tiene hijos o productos, el sistema impedirá el borrado.',
            variant: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/categories/${id}`);
                    await refreshCatalog();
                    toast.success('Categoría eliminada');
                    fetchCategories();
                } catch (error) {
                    const msg = handleError(error, 'CategoryList Delete');
                    toast.error(msg);
                }
            }
        });
    };

    const buildTree = (cats: Category[], parentId: number | null = null): Category[] => {
        return cats
            .filter(cat => cat.parent_id === parentId)
            .sort((a, b) => {
                const codeA = a.code ?? 0;
                const codeB = b.code ?? 0;
                return codeA - codeB;
            })
            .map(cat => ({
                ...cat,
                children: buildTree(cats, cat.id)
            }));
    };

    const renderRow = (category: Category, level: number = 0): React.ReactNode => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.has(category.id);

        const isSearchMode = searchTerm.length > 0;
        const codeString = category.code ? category.code.toString() : '';

        const matchesSearch = isSearchMode && (
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            codeString.includes(searchTerm)
        );

        if (isSearchMode && !matchesSearch) return null;

        return (
            <React.Fragment key={category.id}>
                <tr className="group border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                    <td className="py-2 px-4">
                        <div className="flex items-center" style={{ paddingLeft: isSearchMode ? 0 : `${level * 24}px` }}>

                            {!isSearchMode && (
                                <div className="w-6 h-6 flex items-center justify-center mr-1">
                                    {hasChildren ? (
                                        <button
                                            onClick={() => toggleExpand(category.id)}
                                            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                        >
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                    ) : (
                                        <div className="w-4 h-4" />
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <span className={`p-1.5 rounded-lg shrink-0 transition-colors ${isExpanded || isSearchMode ? 'bg-blue-50 text-blue-600' : 'bg-white border text-slate-400'
                                    }`}>
                                    {hasChildren ? (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />) : <FileText className="w-4 h-4" />}
                                </span>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm text-slate-800 ${level === 0 ? 'font-bold' : 'font-medium'}`}>
                                            {category.name}
                                        </p>
                                        {isSearchMode && category.parent_name && (
                                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded border border-slate-200">
                                                ← {category.parent_name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-none mt-0.5 font-mono">
                                        /{category.slug}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </td>

                    <td className="py-2 px-4">
                        {category.code ? (
                            <span className="inline-block font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                {category.code}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-300">-</span>
                        )}
                    </td>

                    <td className="py-2 px-4 text-center">
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${category.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {category.is_active ? 'Visible' : 'Oculto'}
                        </div>
                    </td>

                    <td className="py-2 px-4 text-center">
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md min-w-[30px] inline-block">
                            {category.products_count || 0}
                        </span>
                    </td>

                    <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {can('edit_categories') && (
                                <Link href={`/categories/${category.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </Link>
                            )}
                            {can('delete_categories') && (
                                <button onClick={() => handleDelete(category.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </td>
                </tr>

                {(isExpanded || isSearchMode) && category.children?.map(child => renderRow(child, level + 1))}
            </React.Fragment>
        );
    };

    const treeData = buildTree(categories);
    const displayData = searchTerm ? categories : treeData;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Categorías</h1>
                    <p className="text-sm text-slate-500">
                        {categories.length} categorías registradas.
                    </p>
                </div>

                <div className="flex gap-3">
                    {can('create_categories') && (
                        <Link
                            href="/categories/bulk"
                            className="bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm active:scale-95"
                        >
                            <Layers className="w-4 h-4 mr-2 text-slate-500" />
                            Carga Masiva
                        </Link>
                    )}

                    {can('create_categories') && (
                        <Link
                            href="/categories/create"
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva
                        </Link>
                    )}
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase w-[45%]">Jerarquía</th>
                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase w-32">Código</th>
                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-24">Estado</th>
                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-center w-20">Prod.</th>
                                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin inline text-slate-400 w-8 h-8" /></td></tr>
                            ) : displayData.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No se encontraron categorías.</td></tr>
                            ) : (
                                displayData.map(cat => renderRow(cat, 0))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}