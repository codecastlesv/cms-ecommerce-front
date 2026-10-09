import api from '@/lib/axios';
import { validateEmail } from '@/lib/validation';

/** Mensaje de error de validación local; `null` si el correo es aceptable antes de enviar al servidor. */
export const validateNewsletterEmail = validateEmail;

export type NewsletterSubscribePayload = {
  email: string;
  name?: string | null;
};

export async function subscribeNewsletter(payload: NewsletterSubscribePayload): Promise<{ message?: string }> {
  const email = payload.email.trim().toLowerCase();
  const name = payload.name?.trim() ? payload.name.trim() : null;
  const { data } = await api.post<{ message?: string }>('/shop/newsletter/subscribe', {
    email,
    name,
  });
  return data ?? {};
}

export async function unsubscribeNewsletter(email: string): Promise<{ message?: string }> {
  const { data } = await api.post<{ message?: string }>('/shop/newsletter/unsubscribe', {
    email: email.trim().toLowerCase(),
  });
  return data ?? {};
}

function laravelValidationFirstMessage(errors: Record<string, string[] | undefined> | undefined): string | null {
  if (!errors) {
    return null;
  }
  for (const key of Object.keys(errors)) {
    const arr = errors[key];
    if (Array.isArray(arr) && arr[0]) {
      return String(arr[0]);
    }
  }
  return null;
}

export function getNewsletterSubscribeErrorMessage(error: unknown): string {
  const err = error as {
    response?: {
      status?: number;
      data?: { message?: string; errors?: Record<string, string[]> };
    };
  };
  const status = err.response?.status;
  const data = err.response?.data;

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  const first = laravelValidationFirstMessage(data?.errors);
  if (first) {
    return first;
  }

  if (status === 409) {
    return 'Este correo ya está suscrito al newsletter.';
  }

  return 'No pudimos completar la suscripción. Intenta de nuevo en unos minutos.';
}

export function getNewsletterUnsubscribeErrorMessage(error: unknown): string {
  const err = error as {
    response?: {
      status?: number;
      data?: { message?: string };
    };
  };
  const msg = err.response?.data?.message;
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  if (err.response?.status === 404) {
    return 'Este correo no está suscrito al newsletter.';
  }
  return 'No pudimos procesar la solicitud. Intenta de nuevo.';
}
