/** Validaciones compartidas de teléfono (El Salvador) y correo electrónico, reutilizadas en todos los formularios. */

export const SV_PHONE_REGEX = /^[267]\d{7}$/;

/** Deja solo dígitos y corta a 8 caracteres — para usar en el onChange de cualquier input de teléfono. */
export function sanitizePhoneInput(value: string): string {
    return value.replace(/\D/g, '').slice(0, 8);
}

export function isValidSalvadoranPhone(value: string): boolean {
    return SV_PHONE_REGEX.test(value.replace(/\D/g, ''));
}

/** `null` si el teléfono es válido (8 dígitos, inicia en 2/6/7); si no, el mensaje de error. */
export function validatePhone(value: string, options: { required?: boolean } = {}): string | null {
    const { required = true } = options;
    const digits = value.replace(/\D/g, '');

    if (!digits) {
        return required ? 'Ingresa un número de teléfono.' : null;
    }
    if (digits.length !== 8) {
        return 'El teléfono debe tener 8 dígitos.';
    }
    if (!SV_PHONE_REGEX.test(digits)) {
        return 'El teléfono debe empezar con 2, 6 o 7.';
    }
    return null;
}

const EMAIL_REGEX =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

/** `null` si el correo es aceptable antes de enviarlo al servidor; si no, el mensaje de error específico. */
export function validateEmail(email: string): string | null {
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
    if (!EMAIL_REGEX.test(trimmed)) {
        return 'Introduce un correo electrónico válido (usuario@dominio.ext).';
    }
    return null;
}

export function isValidEmail(value: string): boolean {
    return validateEmail(value) === null;
}
