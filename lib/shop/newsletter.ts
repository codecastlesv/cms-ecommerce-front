import api from '@/lib/axios';

/** Mensaje de error de validación local; `null` si el correo es aceptable antes de enviar al servidor. */
export function validateNewsletterEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return 'Introduce tu correo electrónico.';
  }
  if (!trimmed.includes('@')) {
    return 'El correo debe incluir el símbolo @.';
  }
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return 'Solo puede haber un @ en el correo.';
  }
  const [local, domain] = parts;
  if (!local || local.length === 0) {
    return 'La parte antes de @ no puede estar vacía.';
  }
  if (local.startsWith('.') || local.endsWith('.')) {
    return 'El correo antes de @ no es válido.';
  }
  if (!domain || domain.length === 0) {
    return 'Indica el dominio después de @ (ej. gmail.com).';
  }
  if (!domain.includes('.')) {
    return 'El dominio debe tener una extensión (ej. .com, .es).';
  }
  const segments = domain.split('.').filter(Boolean);
  const tld = segments[segments.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]{2,}$/i.test(tld)) {
    return 'La extensión del dominio no es válida.';
  }
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(domain)) {
    return 'El dominio del correo no es válido.';
  }

  const emailRegex =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Introduce un correo electrónico válido (usuario@dominio.ext).';
  }

  return null;
}

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
