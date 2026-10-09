import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  TimerOff,
} from 'lucide-react';

/** Catálogo canónico (sincronizado con App\Enums\OrderStatus en Laravel). */
export const ORDER_STATUS_VALUES = [
  'pending',
  'approved',
  'cancelled',
  'expired',
  'shipped',
  'delivered',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export type OrderStatusDisplay = {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  textColor: string;
  dotColor: string;
};

const pill = (tw: string) =>
  `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${tw}`;

/** Matriz oficial: valor BD → label comercial + Tailwind */
const ORDER_STATUS_MAP: Record<OrderStatusValue, OrderStatusDisplay> = {
  pending: {
    label: 'Pendiente de pago',
    icon: Clock,
    badgeClass: pill('bg-amber-100 text-amber-800'),
    textColor: 'text-amber-800',
    dotColor: 'bg-amber-500',
  },
  approved: {
    label: 'Pagado / Por Facturar',
    icon: CheckCircle,
    badgeClass: pill('bg-green-100 text-green-800'),
    textColor: 'text-green-800',
    dotColor: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelado',
    icon: XCircle,
    badgeClass: pill('bg-red-100 text-red-800'),
    textColor: 'text-red-800',
    dotColor: 'bg-red-500',
  },
  expired: {
    label: 'Expirado',
    icon: TimerOff,
    badgeClass: pill('bg-gray-200 text-gray-700'),
    textColor: 'text-gray-700',
    dotColor: 'bg-gray-500',
  },
  shipped: {
    label: 'Enviado',
    icon: Truck,
    badgeClass: pill('bg-blue-100 text-blue-800'),
    textColor: 'text-blue-800',
    dotColor: 'bg-blue-500',
  },
  delivered: {
    label: 'Entregado',
    icon: CheckCircle,
    badgeClass: pill('bg-emerald-200 text-emerald-900'),
    textColor: 'text-emerald-900',
    dotColor: 'bg-emerald-600',
  },
};

/** Valores legacy → clave canónica (misma etiqueta en UI) */
const ORDER_STATUS_LEGACY: Record<string, OrderStatusValue> = {
  completed: 'approved',
  captured: 'approved',
  paid: 'approved',
  processing: 'approved',
  authorized_pending_capture: 'approved',
  failed: 'pending',
  declined: 'pending',
  rejected_payment: 'pending',
  rejected_stock: 'cancelled',
  rejected_damage: 'cancelled',
};

const FALLBACK_STATUS: OrderStatusDisplay = {
  label: 'Estado desconocido',
  icon: Package,
  badgeClass: pill('bg-slate-100 text-slate-700'),
  textColor: 'text-slate-600',
  dotColor: 'bg-slate-400',
};

export function toCanonicalStatus(status: string): OrderStatusValue | string {
  const key = (status || '').trim().toLowerCase();
  if (key in ORDER_STATUS_LEGACY) {
    return ORDER_STATUS_LEGACY[key];
  }
  if ((ORDER_STATUS_VALUES as readonly string[]).includes(key)) {
    return key as OrderStatusValue;
  }
  return key;
}

export function getStatusConfig(status: string): OrderStatusDisplay {
  const canonical = toCanonicalStatus(status);
  if (typeof canonical === 'string' && canonical in ORDER_STATUS_MAP) {
    return ORDER_STATUS_MAP[canonical as OrderStatusValue];
  }
  return {
    ...FALLBACK_STATUS,
    label: status ? status.replace(/_/g, ' ') : FALLBACK_STATUS.label,
  };
}

/** Todas las claves canónicas (lookup, bloqueos) */
export const ORDER_STATUS_KEYS = ORDER_STATUS_VALUES;

/** Opciones únicas para desplegables y filtros */
export const ORDER_STATUS_SELECT_KEYS = ORDER_STATUS_VALUES;

const ORDER_STATUS_TERMINAL = new Set<string>([
  'cancelled',
  'delivered',
  'expired',
]);

/** @deprecated Usar isOrderStatusLocked */
export const ORDER_STATUS_LOCKED = ORDER_STATUS_TERMINAL;

export function isOrderStatusLocked(status: string): boolean {
  const canonical = toCanonicalStatus(status);
  return ORDER_STATUS_TERMINAL.has(canonical);
}
