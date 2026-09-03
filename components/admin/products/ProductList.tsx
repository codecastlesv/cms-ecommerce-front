'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import {
    Edit2, Trash2, Plus, Search, Loader2, Image as ImageIcon, Download, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { usePermission } from '@/hooks/usePermission';
import { Product, PaginatedResponse } from '@/types';
import { handleError } from '@/lib/errorHandler';
import ExcelImportButton from '@/components/ExcelImportButton';
import ZipImagesImportButton from '@/components/ZipImagesImportButton';
import MassStockSyncButton from '@/components/admin/products/MassStockSyncButton';
import { AdminProductName } from '@/components/admin/AdminProductName';
import { useCatalog } from '@/components/providers/CatalogContext';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const TABLE_COLS = 10;

function formatMoney(value: number): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductList() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedSubSubcategory, setSelectedSubSubcategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);

    const confirm = useConfirm();
    const { can } = usePermission();
    const { categories: allCategories, brands } = useCatalog();

    const sortedBrands = useMemo(
        () => [...brands].sort((a, b) => a.name.localeCompare(b.name)),
        [brands],
    );

    const brandOptions = useMemo(
        () => sortedBrands.map((b) => ({ id: b.id, label: b.name })),
        [sortedBrands],
    );

    const hasActiveFilters = Boolean(
        search || selectedCategory || selectedSubcategory || selectedSubSubcategory || selectedBrand,
    );

    const rootCategories = useMemo(
        () => allCategories.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name)),
        [allCategories],
    );

    const childCategories = useMemo(
        () => {
            if (!selectedCategory) return [];
            const parentId = Number(selectedCategory);
            return allCategories
                .filter((c) => c.parent_id === parentId)
                .sort((a, b) => a.name.localeCompare(b.name));
        },
        [allCategories, selectedCategory],
    );

    const grandChildCategories = useMemo(
        () => {
            if (!selectedSubcategory) return [];
            const parentId = Number(selectedSubcategory);
            return allCategories
                .filter((c) => c.parent_id === parentId)
                .sort((a, b) => a.name.localeCompare(b.name));
        },
        [allCategories, selectedSubcategory],
    );

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        setSelectedSubcategory('');
        setSelectedSubSubcategory('');
        setPage(1);
    };

    const handleSubcategoryChange = (value: string) => {
        setSelectedSubcategory(value);
        setSelectedSubSubcategory('');
        setPage(1);
    };

    const handleSubSubcategoryChange = (value: string) => {
        setSelectedSubSubcategory(value);
        setPage(1);
    };

    const handleBrandChange = (value: string) => {
        setSelectedBrand(value);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedSubcategory('');
        setSelectedSubSubcategory('');
        setSelectedBrand('');
        setPage(1);
    };

    const { data, isLoading, refetch, isError } = useQuery<PaginatedResponse<Product>>({
        queryKey: ['products', page, search, selectedCategory, selectedSubcategory, selectedSubSubcategory, selectedBrand],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString() });
            if (search) params.append('search', search);
            if (selectedCategory) params.append('category_id', selectedCategory);
            if (selectedSubcategory) params.append('subcategory_id', selectedSubcategory);
            if (selectedSubSubcategory) params.append('sub_subcategory_id', selectedSubSubcategory);
            if (selectedBrand) params.append('brand_id', selectedBrand);

            const res = await api.get('/admin/products', { params });
            return res.data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 60000,
    });

    const productRows = useMemo(() => {
        if (!data?.data) return [];

        return data.data.map((product) => ({
            key: String(product.id),
            product,
        }));
    }, [data?.data]);

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const res = await api.get('/admin/products/export-excel', {
                responseType: 'blob',
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'catalogo_productos_castella_sin_stock.xlsx';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Catálogo exportado correctamente');
        } catch (error) {
            toast.error(handleError(error, 'Exportar catálogo'));
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = (id: number) => {
        if (!can('delete_products')) return;
        confirm({
            title: '¿Eliminar producto?',
            message: 'Esta acción eliminará el producto. Es irreversible.',
            variant: 'danger',
            confirmText: 'Sí, eliminar',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/products/${id}`);
                    toast.success('Producto eliminado');
                    refetch();
                } catch (error) {
                    toast.error(handleError(error, 'Eliminar Producto'));
                }
            },
        });
    };

    const getStatusBadge = (status: Product['status']) => {
        const styles = {
            published: 'bg-green-100 text-green-700 border-green-200',
            draft: 'bg-slate-100 text-slate-700 border-slate-200',
            archived: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        const labels = { published: 'Publicado', draft: 'Borrador', archived: 'Archivado' };

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto p-1 sm:p-1 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
                    <p className="text-sm text-slate-500">Listado de productos almacenados</p>
                </div>
                {(can('create_products') || can('edit_products') || can('view_products')) && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* 
                        {can('create_products') && (
                            <ExcelImportButton onSuccess={() => refetch()} />
                        )}
                        {can('edit_products') && (
                            <ZipImagesImportButton onSuccess={() => refetch()} />
                        )}
                        {can('view_products') && (
                            <button
                                type="button"
                                onClick={handleExportExcel}
                                disabled={exporting}
                                className="bg-white border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-"
                            >
                                {exporting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />
                                ) : (
                                    <Download className="w-4 h-4 mr-2 shrink-0" />
                                )}
                                {exporting ? 'Exportando...' : 'Exportar Catálogo Excel'}
                            </button>
                        )}
                        {can('edit_products') && (
                            <MassStockSyncButton onCompleted={() => refetch()} />
                        )}
                        */}
                        {can('create_products') && (
                            <Link
                                href="/products/create"
                                className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Crear Producto
                            </Link>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-3 w-full">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, estilo o UPC..."
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow bg-white"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="flex flex-col lg:flex-row gap-3 w-full lg:items-center">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full flex-1 min-w-0">
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow bg-white text-slate-700"
                                aria-label="Filtrar por categoría"
                            >
                                <option value="">Todas las categorías</option>
                                {rootCategories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedSubcategory}
                                onChange={(e) => handleSubcategoryChange(e.target.value)}
                                disabled={!selectedCategory}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow bg-white text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                aria-label="Filtrar por género o subcategoría"
                            >
                                <option value="">
                                    {selectedCategory ? 'Todos los géneros' : 'Género / Subcategoría'}
                                </option>
                                {childCategories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedSubSubcategory}
                                onChange={(e) => handleSubSubcategoryChange(e.target.value)}
                                disabled={!selectedSubcategory}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-slate-900 transition-shadow bg-white text-slate-700 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                                aria-label="Filtrar por sub-subcategoría"
                            >
                                <option value="">
                                    {selectedSubcategory ? 'Todas las sub-subcategorías' : 'Sub-subcategoría'}
                                </option>
                                {grandChildCategories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            <SearchableSelect
                                options={brandOptions}
                                value={selectedBrand}
                                onChange={handleBrandChange}
                                placeholder="Todas las marcas"
                                emptyLabel="Todas las marcas"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleClearFilters}
                            disabled={!hasActiveFilters}
                            className="inline-flex items-center justify-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 border border-transparent hover:border-slate-200 hover:bg-slate-50 hover:text-red-600 transition-colors disabled:opacity-40 disabled:pointer-events-none lg:self-stretch"
                            aria-label="Limpiar todos los filtros"
                        >
                            <X className="w-3.5 h-3.5" />
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-4 min-w-[180px]">Producto</th>
                                <th className="px-4 py-4 w-20">Foto</th>
                                <th className="px-4 py-4 min-w-[120px]">Código / SKU</th>
                                <th className="px-4 py-4">Categoría</th>
                                <th className="px-4 py-4">Subcategoría</th>
                                <th className="px-4 py-4">Presentación</th>
                                <th className="px-4 py-4">Marca</th>
                                <th className="px-4 py-4">Precio / Stock</th>
                                <th className="px-4 py-4 text-center">Estado</th>
                                <th className="px-4 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={TABLE_COLS} className="p-12 text-center">
                                        <Loader2 className="animate-spin w-8 h-8 text-slate-300 mx-auto" />
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={TABLE_COLS} className="p-8 text-center text-red-500">
                                        Error al cargar productos.
                                    </td>
                                </tr>
                            ) : productRows.length === 0 ? (
                                <tr>
                                    <td colSpan={TABLE_COLS} className="p-12 text-center text-slate-500">
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            ) : (
                                productRows.map((row) => {
                                    const { product } = row;
                                    const imageUrl = product.main_image_url || product.external_image_url;
                                    const stock = Number(product.stock_quantity ?? 0);

                                    return (
                                        <tr
                                            key={row.key}
                                            className="group align-middle hover:bg-slate-50/70 transition-colors border-b border-slate-100"
                                        >
                                            <td className="px-4 py-4 align-middle">
                                                <div className="flex items-start gap-2">
                                                    <AdminProductName
                                                        name={product.name}
                                                        className="text-slate-900 font-bold text-base leading-snug line-clamp-3"
                                                    />
                                                    {product.is_featured ? (
                                                        <span
                                                            className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 mt-1.5"
                                                            title="Destacado"
                                                        />
                                                    ) : null}
                                                </div>
                                                {product.erp_product_id ? (
                                                    <p className="mt-1 text-[10px] font-mono text-slate-400">
                                                        ERP #{product.erp_product_id}
                                                    </p>
                                                ) : null}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-slate-300" aria-hidden />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-mono text-sm font-bold text-slate-800">
                                                    {product.codigo || '—'}
                                                </div>
                                                <p className="font-mono text-[11px] text-slate-500">{product.sku}</p>
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {product.categoria_padre || <span className="text-slate-300 italic">—</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {product.subcategoria || product.subcategoria_genero || <span className="text-slate-300 italic">—</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {product.presentacion || <span className="text-slate-300 italic">—</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {product.brand?.name || <span className="text-slate-300 italic">—</span>}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-bold text-slate-800 tabular-nums whitespace-nowrap">
                                                <div>${formatMoney(Number(product.price_regular) || 0)}</div>
                                                <div className="text-[11px] font-medium text-slate-500">
                                                    Stock {Number.isFinite(stock) ? stock : 0}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(product.status)}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1 sm:group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/products/${product.id}`}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar producto"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Link>
                                                    {can('delete_products') ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar producto"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {data && data.last_page > 1 && (
                    <div className="p-4 border-t border-slate-200 flex justify-center gap-2">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-3 py-1 text-sm text-slate-500">
                            Página {data.current_page} de {data.last_page}
                        </span>
                        <button
                            type="button"
                            disabled={page === data.last_page}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
