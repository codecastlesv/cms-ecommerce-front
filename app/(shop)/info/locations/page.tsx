import Link from 'next/link';
import { FaMapMarkerAlt, FaRegClock, FaPhoneAlt, FaRegEnvelope, FaWhatsapp } from 'react-icons/fa';
import api from '@/lib/axios';

const FALLBACK_IMAGE =
  'https://media.timeout.com/images/105476943/750/562/image.jpg';

type StoreHourLine = { days: string; time: string };

type PublicStore = {
  id: number;
  name: string;
  alias?: string | null;
  display_name?: string;
  address: string;
  city?: string;
  phone?: string | null;
  email?: string | null;
  whatsapp_link?: string | null;
  image_url?: string | null;
  hours_lines?: StoreHourLine[];
  is_pickup_enabled?: boolean;
  pickup_time_frame?: string | null;
};

function storeTitle(store: PublicStore): string {
  return (store.display_name || store.alias || store.name || 'Tienda').trim();
}

function whatsappHref(link: string | null | undefined): string | null {
  if (!link?.trim()) return null;
  const raw = link.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

async function getPublicStores(): Promise<PublicStore[]> {
  try {
    const response = await api.get<{ data?: PublicStore[] }>('/shop/stores');
    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (err) {
    console.error('Error fetching public stores:', err);
    return [];
  }
}

export default async function StoresPage() {
  const stores = await getPublicStores();

  return (
    <section className="bg-[#fcfcfc] py-16 mx-47">
      <div className="max-w-7xl">
        <header className="mb-12  border-black ">
          <h1 className="font-bebas font-normal text-[80px] leading-[88px] tracking-[4px] uppercase text-black mb-2">
            Nuestras Tiendas
          </h1>
          <p className=" font-inter text-[18px] leading-[28px] tracking-[0.18px]">
            Encuentra tu tienda más cercana.
          </p>
        </header>

        {stores.length === 0 ? (
          <p className="font-inter text-gray-500 text-lg">
            No hay tiendas disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stores.map((store) => {
              const title = storeTitle(store);
              const imageSrc = store.image_url?.trim() || FALLBACK_IMAGE;
              const hours = store.hours_lines ?? [];
              const wa = whatsappHref(store.whatsapp_link);

              return (
                <div
                  key={store.id}
                  className=" bg-white border border-gray-400 rounded-sm flex flex-col transition-all duration-300 ease-in-out
                         hover:scale-[1.01] hover:shadow-[0_20px_80px_rgba(0,0,0,0.08)] hover:border-gray-600"
                >
                  <div className="h-64 w-full bg-[#f0f0f0] overflow-hidden relative">
                    <img
                      src={imageSrc}
                      alt={title}
                      className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="font-bebas text-[28px] leading-[33px] tracking-[1.5px] uppercase mb-4  text-black hover:text-green-600 transition-colors">
                      {title}
                    </h2>

                    <div className="space-y-3 font-inter text-[16px] leading-[26px] tracking-[0.18px] text-gray-500 mb-8 flex-grow">
                      <div className="flex gap-3 items-start">
                        <FaMapMarkerAlt className="shrink-0 mt-0.5" />
                        <p>
                          {store.address}
                          {store.city ? `, ${store.city}` : ''}
                        </p>
                      </div>

                      {hours.length > 0 ? (
                        <div className="flex gap-3 items-start border-y border-gray-50 py-3 text-gray-500">
                          <FaRegClock className="shrink-0 mt-0.5 " />
                          <div>
                            {hours.map((h, i) => (
                              <p key={`${store.id}-h-${i}`}>
                                <span className=" text-gray-500">{h.days}:</span> {h.time}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {store.is_pickup_enabled && store.pickup_time_frame ? (
                        <p className="text-sm text-gray-600 pl-7">{store.pickup_time_frame}</p>
                      ) : null}

                      {store.phone ? (
                        <div className="flex items-center gap-3">
                          <FaPhoneAlt className="shrink-0" />
                          <p className=" text-gray-700">{store.phone}</p>
                        </div>
                      ) : null}

                      {store.email ? (
                        <div className="flex items-center gap-3">
                          <FaRegEnvelope className="shrink-0" />
                          <p className="truncate">{store.email}</p>
                        </div>
                      ) : null}
                    </div>

                    {wa ? (
                      <Link
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#20B149] font-inter font-semibold text-[16px] tracking-[0.18px] text-white flex items-center justify-center gap-2 py-3 rounded-md font-bold uppercase transition-all duration-300 hover:bg-[#1da850] active:scale-95"
                      >
                        <FaWhatsapp size={18} />
                        Escríbenos por WhatsApp
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
