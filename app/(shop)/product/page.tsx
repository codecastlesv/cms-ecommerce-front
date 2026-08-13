'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import ProductCard from '@/components/shop/product/ProductCard';
import FilterSidebar from '@/components/shop/product/filter/FilterSidebar';
import { Settings2, ChevronDown } from 'lucide-react';

function ProductListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filtersData, setFiltersData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filtros activos actuales
  const currentFilters = Object.fromEntries(searchParams.entries());

  //Carga opciones de filtros al inicio
  useEffect(() => {
    api.get('/shop/store/filters').then(res => setFiltersData(res.data));
  }, []);

  //Carga productos cada vez que la URL cambie
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/shop/store/products', { params: currentFilters });
        setProducts(data.data || []);
        setTotalProducts(data.meta?.total || 0); 
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]); // Reacciona a cambios en la URL

  // Actualiza la URL y dispara el useEffect de arriba
  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Si filtramos se vuelve a la página 1
    params.delete('page'); 
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-[1400px] mx-40 px-6 py-10 ">
      <div className="flex flex-col md:flex-row gap-10">
        
        <FilterSidebar 
          total={totalProducts} 
          availableFilters={filtersData} 
          activeFilters={currentFilters}
          onFilterChange={handleFilterChange}
        />

        <main className="flex-grow">
          {/* HEADER DE ORDENAMIENTO (Lado derecho) */}
          <div className="flex justify-end mb-8 gap-8 items-center pb-4">
             <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight">
                Ordenar por filtros <Settings2 size={14} />
             </button>
             
             <div className="relative group flex items-center gap-1 cursor-pointer">
               <span className="text-[11px] font-bold uppercase tracking-tight">Ordena por</span>
               <select 
                 className="text-[11px] font-bold uppercase bg-transparent outline-none cursor-pointer"
                 value={currentFilters.sort || 'newest'}
                 onChange={(e) => handleFilterChange('sort', e.target.value)}
               >
                 <option value="newest">Lo nuevo</option>
                 <option value="price_asc">Precio: Bajo a Alto</option>
                 <option value="price_desc">Precio: Alto a Bajo</option>
                 <option value="name_asc">Nombre: A-Z</option>
               </select>
             </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-[450px] bg-gray-100 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ProductListPage() {
  return <Suspense fallback={null}><ProductListContent /></Suspense>;
}