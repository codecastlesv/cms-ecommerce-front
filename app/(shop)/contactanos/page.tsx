'use client';

import { FormEvent, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { sanitizePhoneInput, validateEmail, validatePhone } from '@/lib/validation';

const SUBJECTS = [
  'Consulta general',
  'Estado de un pedido',
  'Garantías',
  'Devoluciones',
  'Ventas corporativas / mayoreo',
  'Otro',
] as const;

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: (typeof SUBJECTS)[number];
  message: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  subject: 'Consulta general',
  message: '',
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(form.email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const phoneError = validatePhone(form.phone, { required: false });
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/shop/contact-messages', form);
      setSubmitted(true);
    } catch {
      setError('No pudimos enviar tu mensaje. Verifica los datos e intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_STATE);
    setSubmitted(false);
  };

  return (
    <section className="bg-[#fcfcfc]">
      <div className="bg-[#08204E] px-4 py-10 sm:py-12 text-white text-center">
        <p className="font-helvetica text-xs font-bold uppercase tracking-[0.14em] text-[#9DB2E0] mb-2.5">
          Estamos para ayudarte
        </p>
        <h1 className="font-helvetica text-[28px] sm:text-[34px] font-bold leading-tight text-balance mb-3">
          Contáctanos
        </h1>
        <p className="mx-auto max-w-[520px] font-helvetica text-[15px] leading-relaxed text-[#C7D3EC]">
          ¿Tienes una duda, un pedido pendiente o una sugerencia? Escríbenos y te responderemos lo antes posible.
        </p>
      </div>

      <div className="px-4 pb-16 -mt-7">
        {submitted ? (
          <div className="mx-auto max-w-[600px] rounded-2xl border border-slate-200 bg-white p-9 text-center shadow-[0_20px_60px_-30px_rgba(8,32,78,0.35)]">
            <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-[#ECFDF3] text-[#15803D]">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <h2 className="font-helvetica text-xl font-bold text-[#0F172A] mb-2">Mensaje enviado</h2>
            <p className="font-helvetica text-[13.5px] leading-relaxed text-slate-500 mb-5">
              Gracias por escribirnos. Nuestro equipo revisará tu mensaje y se pondrá en contacto contigo lo antes
              posible.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-200 bg-white px-5 py-2.5 font-helvetica text-sm font-semibold text-[#0F172A] transition hover:bg-slate-50"
            >
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[600px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(8,32,78,0.35)]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Nombre completo">
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Tu nombre"
                  className={inputClass}
                />
              </Field>
              <Field label="Teléfono" hint="(opcional)">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={8}
                  value={form.phone}
                  onChange={(e) => update('phone', sanitizePhoneInput(e.target.value))}
                  placeholder="70001234"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-3.5">
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
            </div>

            <div className="mt-3.5">
              <Field label="Motivo">
                <select
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value as FormState['subject'])}
                  className={inputClass}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-3.5">
              <Field label="Mensaje">
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="Cuéntanos en qué podemos ayudarte…"
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>

            {error ? <p className="mt-4 font-helvetica text-sm text-[#E30613]">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#E30613] py-3.5 font-helvetica text-sm font-bold uppercase tracking-[0.02em] text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Enviar mensaje
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 font-helvetica text-[1em] text-[#0F172A] outline-none transition focus:border-[#304C94] focus:ring-2 focus:ring-[#304C94]/15';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-helvetica text-[1em] font-semibold text-[#0F172A]">
        {label} {hint ? <span className="font-normal text-slate-500">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}
