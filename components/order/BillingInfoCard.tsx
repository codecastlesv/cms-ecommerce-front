'use client';

import { LucideIcon, Receipt } from 'lucide-react';
import type { Order, ShippingAddress } from '@/types/order';

type Props = {
  order: Order;
  icon?: LucideIcon;
  title?: string;
};

function display(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed !== '' ? trimmed : null;
}

export default function BillingInfoCard({
  order,
  icon: Icon = Receipt,
  title = 'Información de Facturación',
}: Props) {
  const billing = order.billing_address_json as ShippingAddress | undefined;

  const razon = display(order.ccf_razon_social);
  const nit = display(order.ccf_nit);
  const nrc = display(order.ccf_nrc);
  const giro = display(order.ccf_giro);
  const fiscalAddress = display(order.ccf_fiscal_address);
  const hasFiscalProfile = Boolean(razon || nit || nrc || giro || fiscalAddress);
  const isCcf = Boolean(order.is_ccf ?? order.needs_ccf) || hasFiscalProfile;
  const fromBrilo = order.billing_source === 'brilo';

  if (isCcf || hasFiscalProfile) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-600" />
          {title}
        </h2>
        <div className="text-sm text-slate-600 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {(order.is_ccf ?? order.needs_ccf) ? (
              <p className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                Crédito Fiscal (CCF)
              </p>
            ) : null}
            {fromBrilo ? (
              <p className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-medium">
                Cliente en Brilo ERP
                {order.brilo_client_code ? ` · ${order.brilo_client_code}` : ''}
              </p>
            ) : null}
          </div>
          <p className="font-medium text-slate-800">
            Razón Social:{' '}
            {razon || display(order.customer_name) || display(order.user?.name) || 'Contribuyente'}
          </p>
          {nit ? <p>NIT: {nit}</p> : null}
          {nrc ? <p>NRC: {nrc}</p> : null}
          {giro ? <p>Giro: {giro}</p> : null}
          {fiscalAddress ? <p>Dirección fiscal: {fiscalAddress}</p> : null}
          {!hasFiscalProfile ? (
            <p className="text-slate-400 italic text-xs pt-1">
              Sin ficha fiscal disponible (checkout local ni Brilo).
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (!billing) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-slate-600" />
        {title}
      </h2>
      <div className="text-sm text-slate-600 space-y-1">
        {billing.recipient_name ? (
          <p className="font-medium">Destinatario: {billing.recipient_name}</p>
        ) : null}
        {billing.phone ? <p className="font-medium">Teléfono: {billing.phone}</p> : null}
        {billing.address_line1 ? <p>{billing.address_line1}</p> : null}
        {billing.address_line2 ? <p>{billing.address_line2}</p> : null}
        {(billing.city || billing.state) && (
          <p>
            {[billing.city, billing.state].filter(Boolean).join(', ')}
          </p>
        )}
        {billing.country ? <p>{billing.country}</p> : null}
      </div>
    </div>
  );
}
