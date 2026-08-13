'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  validateNewsletterEmail,
  subscribeNewsletter,
  getNewsletterSubscribeErrorMessage,
} from '@/lib/shop/newsletter';

type NewsletterSignupFormProps = {
  variant: 'mobile' | 'desktop';
};

/** Botón  */
function SubmitNewsletterButton({
  submitting,
  variant,
}: {
  submitting: boolean;
  variant: 'mobile' | 'desktop';
}) {
  const base =
    'relative inline-flex h-12 shrink-0 items-center justify-center font-semibold text-black transition-opacity disabled:opacity-70';

  const sizing =
    variant === 'mobile'
      ? 'w-[148px] min-w-[148px] rounded-md text-sm'
      : 'w-[168px] min-w-[168px] rounded-sm font-inter text-sm font-bold uppercase';

  return (
    <button
      type="submit"
      disabled={submitting}
      aria-busy={submitting}
      aria-label={submitting ? 'Enviando suscripción' : 'Suscribirme al newsletter'}
      className={`${base} ${sizing} bg-white hover:bg-zinc-200`}
    >
      <span className={submitting ? 'invisible' : ''}>Suscribirme</span>
      {submitting ? (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <Loader2 className="h-5 w-5 animate-spin text-black" />
        </span>
      ) : null}
    </button>
  );
}

export default function NewsletterSignupForm({ variant }: NewsletterSignupFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validationError = touched || email.length > 0 ? validateNewsletterEmail(email) : null;
  const showFieldError = touched && validationError;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);

    const localErr = validateNewsletterEmail(email);
    if (localErr) {
      return;
    }

    setSubmitting(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      const payloadName = trimmedName || trimmedEmail.split('@')[0] || null;

      await subscribeNewsletter({
        email: trimmedEmail,
        name: payloadName,
      });
      toast.success('Suscripción exitosa');
      setEmail('');
      setName('');
      setTouched(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        toast.warning('Este correo ya está suscrito');
      } else {
        toast.error(getNewsletterSubscribeErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (variant === 'mobile') {
    return (
      <form className="mx-auto w-full max-w-md space-y-3" onSubmit={handleSubmit} noValidate>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="newsletter-email-mobile" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="newsletter-email-mobile"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={Boolean(showFieldError)}
              aria-describedby={showFieldError ? 'newsletter-error-mobile' : undefined}
              className={`h-12 w-full rounded-md border bg-transparent px-4 text-sm text-white outline-none transition-colors placeholder:text-white/50 focus:border-white ${
                showFieldError ? 'border-amber-400' : 'border-white'
              }`}
            />
          </div>
          <SubmitNewsletterButton submitting={submitting} variant="mobile" />
        </div>

  

        {showFieldError ? (
          <p id="newsletter-error-mobile" className="text-left text-xs text-amber-300" role="alert">
            {validationError}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-3 md:w-auto md:min-w-[400px]"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="newsletter-email-desktop" className="sr-only">
            Correo electrónico
          </label>
          <input
            id="newsletter-email-desktop"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(showFieldError)}
            aria-describedby={showFieldError ? 'newsletter-error-desktop' : undefined}
            className={`h-12 w-full rounded-sm border bg-transparent px-4 font-inter text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-white ${
              showFieldError ? 'border-amber-400' : 'border-zinc-700'
            }`}
          />
  
        </div>
        <SubmitNewsletterButton submitting={submitting} variant="desktop" />
      </div>
      {showFieldError ? (
        <p id="newsletter-error-desktop" className="text-xs text-amber-400" role="alert">
          {validationError}
        </p>
      ) : null}
    </form>
  );
}
