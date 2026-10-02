'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import api from '@/lib/axios';

type PartnerType = 'distribuidor' | 'instalador';
type LegalType = 'natural' | 'juridica';

const PRODUCT_LINES = [
  'Herramientas manuales',
  'Herramientas eléctricas',
  'Herramientas de jardín',
  'Plomería y fontanería',
  'Tubería y accesorios PVC/CPVC',
  'Eléctrico e iluminación',
  'Pintura y acabados',
  'Materiales de construcción',
  'Bombas y sistemas de presión',
  'Cerrajería',
  'Seguridad industrial',
  'Tornillería y sujetadores',
  'Láminas y techos',
  'Grifería y accesorios de baño',
  'Jardinería y riego',
  'Automotriz',
  'Audio, video y redes',
  'Electrodomésticos',
  'Madera y tableros',
  'Piscinas y filtros',
] as const;

const SERVICE_AREAS: { value: string; label: string }[] = [
  { value: 'zona_occidental', label: 'Zona Occidental' },
  { value: 'zona_central', label: 'Zona Central' },
  { value: 'zona_paracentral', label: 'Zona Paracentral' },
  { value: 'zona_oriental', label: 'Zona Oriental' },
];

interface FormState {
  applicant_name: string;
  contact_name: string;
  legal_type: LegalType;
  email: string;
  phone: string;
  tax_registration: string;
  location: string;
  product_lines: string[];
  service_offered: string;
  service_area: string[];
}

const INITIAL_STATE: FormState = {
  applicant_name: '',
  contact_name: '',
  legal_type: 'natural',
  email: '',
  phone: '',
  tax_registration: '',
  location: '',
  product_lines: [],
  service_offered: '',
  service_area: [],
};

export default function PartnersPage() {
  const [type, setType] = useState<PartnerType>('distribuidor');
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProductLine = (line: string) => {
    setForm((prev) => ({
      ...prev,
      product_lines: prev.product_lines.includes(line)
        ? prev.product_lines.filter((l) => l !== line)
        : [...prev.product_lines, line],
    }));
  };

  const toggleZone = (zone: string) => {
    setForm((prev) => ({
      ...prev,
      service_area: prev.service_area.includes(zone)
        ? prev.service_area.filter((z) => z !== zone)
        : [...prev.service_area, zone],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (type === 'distribuidor' && form.product_lines.length === 0) {
      setError('Selecciona al menos una línea de productos de interés.');
      return;
    }
    if (type === 'instalador' && form.service_area.length === 0) {
      setError('Selecciona al menos una zona geográfica.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/shop/partner-applications', {
        type,
        applicant_name: form.applicant_name,
        contact_name: type === 'distribuidor' ? form.contact_name : undefined,
        legal_type: form.legal_type,
        email: form.email,
        phone: form.phone,
        tax_registration: form.tax_registration,
        location: type === 'distribuidor' ? form.location : undefined,
        product_lines: type === 'distribuidor' ? form.product_lines : undefined,
        service_offered: type === 'instalador' ? form.service_offered : undefined,
        service_area: type === 'instalador' ? form.service_area : undefined,
      });
      setSubmitted(true);
    } catch {
      setError('No pudimos enviar tu solicitud. Verifica los datos e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_STATE);
    setSubmitted(false);
  };

  const taxLabel =
    type === 'instalador' && form.legal_type === 'natural' ? 'DUI' : 'NIT / Registro de IVA';

  return (
    <section className="bg-[#fcfcfc]">
      <div className="bg-[#08204E] px-4 py-10 sm:py-12 text-white">
        <div className="mx-auto max-w-[640px] text-center">
          <p className="font-helvetica text-xs font-bold uppercase tracking-[0.14em] text-[#9DB2E0] mb-2.5">
            Alianzas comerciales
          </p>
          <h1 className="font-helvetica text-[28px] sm:text-[34px] font-bold leading-tight text-wrap-balance mb-3">
            Sé distribuidor o instalador Castella
          </h1>
          <p className="font-helvetica text-[15px] leading-relaxed text-[#C7D3EC]">
            Cuéntanos sobre tu negocio o servicio. Nuestro equipo revisará tu solicitud y te contactará.
          </p>
        </div>
      </div>

      <div className="px-4 pb-16 -mt-7">
        {submitted ? (
          <div className="mx-auto max-w-[640px] rounded-2xl border border-slate-200 bg-white p-9 text-center shadow-[0_20px_60px_-30px_rgba(8,32,78,0.35)]">
            <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-[#ECFDF3] text-[#15803D]">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <h2 className="font-helvetica text-xl font-bold text-[#0F172A] mb-2">Solicitud enviada</h2>
            <p className="font-helvetica text-[13.5px] leading-relaxed text-slate-500 mb-5">
              Gracias por tu interés. Nuestro equipo revisará tu información y se pondrá en contacto contigo en los
              próximos días hábiles.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 font-helvetica text-sm font-semibold text-[#0F172A] transition hover:bg-slate-50"
            >
              Enviar otra solicitud
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[640px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(8,32,78,0.35)]"
          >
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F1F3F8] p-1.5 mb-6">
              <button
                type="button"
                onClick={() => setType('distribuidor')}
                className={`rounded-lg px-2 py-2.5 font-helvetica text-[13.5px] font-bold transition ${
                  type === 'distribuidor' ? 'bg-[#08204E] text-white shadow' : 'text-[#08204E]'
                }`}
              >
                Quiero ser distribuidor
              </button>
              <button
                type="button"
                onClick={() => setType('instalador')}
                className={`rounded-lg px-2 py-2.5 font-helvetica text-[13.5px] font-bold transition ${
                  type === 'instalador' ? 'bg-[#08204E] text-white shadow' : 'text-[#08204E]'
                }`}
              >
                Quiero ser instalador
              </button>
            </div>

            <div className="space-y-4">
              <Field label={type === 'distribuidor' ? 'Nombre del negocio o Razón Social' : 'Nombre completo o nombre del taller/negocio'}>
                <input
                  type="text"
                  required
                  value={form.applicant_name}
                  onChange={(e) => update('applicant_name', e.target.value)}
                  placeholder={type === 'distribuidor' ? 'Ej. Ferretería El Progreso' : 'Ej. Juan Carlos Martínez'}
                  className={inputClass}
                />
              </Field>

              <div>
                <span className="block font-helvetica text-[12.5px] font-semibold text-[#0F172A] mb-2">
                  Tipo de entidad
                </span>
                <div className="flex gap-2.5">
                  {(['natural', 'juridica'] as LegalType[]).map((option) => (
                    <label
                      key={option}
                      className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 font-helvetica text-[13.5px] cursor-pointer transition ${
                        form.legal_type === option ? 'border-[#304C94] bg-[#F5F7FC]' : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="legal_type"
                        checked={form.legal_type === option}
                        onChange={() => update('legal_type', option)}
                        className="accent-[#08204E]"
                      />
                      {option === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                    </label>
                  ))}
                </div>
              </div>

              <Field label={taxLabel}>
                <input
                  type="text"
                  required
                  value={form.tax_registration}
                  onChange={(e) => update('tax_registration', e.target.value)}
                  placeholder={taxLabel === 'DUI' ? '00000000-0' : '0614-000000-000-0'}
                  className={inputClass}
                />
              </Field>

              {type === 'distribuidor' ? (
                <>
                  <Field label="Ubicación física / Dirección">
                    <input
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder="Municipio, departamento"
                      className={inputClass}
                    />
                  </Field>

                  <ProductLinesPicker selected={form.product_lines} onToggle={toggleProductLine} />
                </>
              ) : (
                <>
                  <Field label="Servicios que presta">
                    <textarea
                      required
                      value={form.service_offered}
                      onChange={(e) => update('service_offered', e.target.value)}
                      placeholder="Ej. Fontanería, piscinas, sistemas hidráulicos"
                      rows={3}
                      className={`${inputClass} resize-y`}
                    />
                  </Field>

                  <div>
                    <span className="block font-helvetica text-[12.5px] font-semibold text-[#0F172A] mb-2">
                      Zona geográfica en la que ofrece sus servicios
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {SERVICE_AREAS.map((zone) => (
                        <label
                          key={zone.value}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 font-helvetica text-[13px] cursor-pointer transition ${
                            form.service_area.includes(zone.value)
                              ? 'border-[#304C94] bg-[#F5F7FC]'
                              : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.service_area.includes(zone.value)}
                            onChange={() => toggleZone(zone.value)}
                            className="accent-[#08204E]"
                          />
                          {zone.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="font-helvetica text-[11px] font-bold uppercase tracking-[0.08em] text-[#304C94] mt-6 mb-3">
              Contacto {type === 'distribuidor' ? 'principal' : ''}
            </p>
            <div className="space-y-3.5">
              {type === 'distribuidor' ? (
                <Field label="Nombre del contacto">
                  <input
                    type="text"
                    required
                    value={form.contact_name}
                    onChange={(e) => update('contact_name', e.target.value)}
                    placeholder="Nombre de la persona a contactar"
                    className={inputClass}
                  />
                </Field>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Correo electrónico">
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="7000-0000"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {error ? <p className="mt-4 font-helvetica text-sm text-[#E30613]">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#E30613] py-3.5 font-helvetica text-sm font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Enviar solicitud
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 font-helvetica text-sm text-[#0F172A] outline-none transition focus:border-[#304C94] focus:ring-2 focus:ring-[#304C94]/15';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-helvetica text-[12.5px] font-semibold text-[#0F172A]">
        {label} {hint ? <span className="font-normal text-slate-500">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

function ProductLinesPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (line: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCT_LINES;
    return PRODUCT_LINES.filter((line) => line.toLowerCase().includes(q));
  }, [query]);

  return (
    <div>
      <span className="block font-helvetica text-[12.5px] font-semibold text-[#0F172A] mb-2">
        Principales líneas de productos de interés{' '}
        <span className="font-normal text-slate-500">({selected.length} seleccionadas)</span>
      </span>

      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="relative border-b border-slate-200 bg-slate-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar línea de producto…"
            className="w-full bg-transparent py-2.5 pl-9 pr-3 font-helvetica text-[13px] text-[#0F172A] outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="max-h-48 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center font-helvetica text-[13px] text-slate-400">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filtered.map((line) => (
                <label
                  key={line}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 font-helvetica text-[13px] text-[#0F172A] cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(line)}
                    onChange={() => onToggle(line)}
                    className="accent-[#08204E]"
                  />
                  {line}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
