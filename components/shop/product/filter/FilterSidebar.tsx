'use client';
import { ChevronDown } from 'lucide-react';

export default function FilterSidebar({ total, availableFilters, activeFilters, onFilterChange }: any) {
  const sections = [
    { id: 'brand', label: 'Marca', data: availableFilters?.brands },
    { id: 'sport', label: 'Deporte', data: availableFilters?.sports },
    { id: 'color', label: 'Color', data: availableFilters?.colors },
  ];

  return (
    <aside className="w-full md:w-60 flex-shrink-0">
      <h1 className="text-[18px] font-black uppercase tracking-tighter mb-8">
        Tienda Productos ({total})
      </h1>

      <div className="space-y-2">
        {/* Categorías ( pero Selección única) */}
        <section className="mb-6">
          <h3 className="font-bold text-[12px] uppercase mb-4 tracking-tight">Categorías</h3>
          <ul className="space-y-2">
            {availableFilters?.categories?.map((cat: any) => (
              <li 
                key={cat.id}
                onClick={() => onFilterChange('category', activeFilters.category === cat.slug ? null : cat.slug)}
                className={`text-[12px] uppercase cursor-pointer hover:text-black transition-all ${
                  activeFilters.category === cat.slug ? 'font-black text-black' : 'text-gray-400'
                }`}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </section>

        {/*  */}
        {sections.map((section) => (
          section.data && (
            <div key={section.id} className="border-t py-3">
              <details className="group" open={!!activeFilters[section.id]}>
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <span className="font-bold text-[11px] uppercase tracking-widest">{section.label}</span>
                  <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {section.data.map((item: any) => {
                    const val = typeof item === 'object' ? item.slug : item;
                    const label = typeof item === 'object' ? item.name : item;
                    return (
                      <label key={val} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox"
                          className="accent-black w-3 h-3"
                          checked={activeFilters[section.id] === val}
                          onChange={() => onFilterChange(section.id, activeFilters[section.id] === val ? null : val)}
                        />
                        <span className={`text-[11px] uppercase ${activeFilters[section.id] === val ? 'font-bold' : 'text-gray-500'}`}>
                          {label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </details>
            </div>
          )
        ))}
      </div>
    </aside>
  );
}