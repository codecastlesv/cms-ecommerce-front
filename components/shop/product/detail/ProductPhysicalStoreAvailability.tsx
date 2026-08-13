'use client';

interface PhysicalStoreAvailability {
  name: string;
  alias?: string | null;
  display_name?: string;
  available?: number;
}

interface ProductPhysicalStoreAvailabilityProps {
  stores: PhysicalStoreAvailability[];
}

function storeLabel(store: PhysicalStoreAvailability): string {
  return (store.display_name || store.alias || store.name || '').trim();
}

export default function ProductPhysicalStoreAvailability({
  stores,
}: ProductPhysicalStoreAvailabilityProps) {
  const availableStores = stores.filter((store) => storeLabel(store));

  return (
    <section className="pt-4" aria-label="Disponibilidad en tiendas físicas">
      <p className="text-sm font-medium text-slate-900">Disponibilidad en tiendas</p>
      {availableStores.length > 0 ? (
        <ul className="mt-2 list-none space-y-0">
          {availableStores.map((store) => {
            const label = storeLabel(store);
            return (
              <li key={label} className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                  aria-hidden
                />
                <span className="text-sm text-gray-700">{label}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          No disponible en tiendas físicas en este momento.
        </p>
      )}
    </section>
  );
}
