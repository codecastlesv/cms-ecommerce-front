'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Order } from '@/types/order';
import { toast } from 'sonner';
import {
    Package,
    CheckCircle,
    Clock,
    XCircle,
    CircleDollarSign,
    Receipt,
    CreditCard,
} from 'lucide-react';

import { formatDateDMY } from '@/utils/date';
import { AdminProductName } from '@/components/admin/AdminProductName';
import BillingInfoCard from '@/components/order/BillingInfoCard';
import ShippingInfoCard from '@/components/order/ShippingInfoCard';
import { formatTime } from '@/utils/time';
import {
    getStatusConfig,
    isOrderStatusLocked,
    ORDER_STATUS_SELECT_KEYS,
    toCanonicalStatus,
} from '@/utils/statusOrder';

function resolveBriloErpId(order: Order): string | null {
    const doc = order.brilo_mfa_num_doc ?? (order as { briloMfaNumDoc?: string }).briloMfaNumDoc;
    if (typeof doc === 'string') {
        const trimmed = doc.trim();
        if (trimmed !== '' && trimmed !== '0') {
            return trimmed;
        }
    }

    const mfaId = order.brilo_mfa_id;
    if (mfaId != null && String(mfaId).trim() !== '') {
        return String(mfaId);
    }

    return null;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const value of values) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed !== '') {
                return trimmed;
            }
        }
    }
    return null;
}

/** Lee atributos snake_case (BD) y posibles alias camelCase del payload. */
function pickOrderString(order: Order, ...keys: string[]): string | null {
    const record = order as unknown as Record<string, unknown>;
    for (const key of keys) {
        const value = record[key];
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed !== '') {
                return trimmed;
            }
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
    }
    return null;
}

function unwrapOrderPayload(body: unknown): Order | null {
    if (!body || typeof body !== 'object') {
        return null;
    }

    const root = body as Record<string, unknown>;
    const nested = root.data;

    // { data: Order }
    if (
        nested &&
        typeof nested === 'object' &&
        !Array.isArray(nested) &&
        ('id' in nested || 'number' in nested || 'uuid' in nested)
    ) {
        return nested as Order;
    }

    // Order plano
    if ('id' in root || 'number' in root || 'uuid' in root) {
        return root as unknown as Order;
    }

    return null;
}

function resolveCustomerInfo(order: Order) {
    const shipping = order.shipping_address_json;
    const billing = order.billing_address_json;

    const fullName = firstNonEmpty(
        order.user?.name,
        shipping?.recipient_name,
        billing?.recipient_name,
    ) ?? 'Invitado';

    const phone = firstNonEmpty(
        order.user?.profile?.phone,
        order.user?.phone,
        shipping?.phone,
        billing?.phone,
    );

    const email = firstNonEmpty(
        order.user?.email,
        shipping?.email,
        billing?.email,
    );

    const documentNumber = firstNonEmpty(
        order.document_number,
        shipping?.document_number,
        billing?.document_number,
    );

    const documentType = firstNonEmpty(
        order.document_type,
        shipping?.document_type,
        billing?.document_type,
        'DUI',
    );

    return { fullName, phone, email, documentNumber, documentType };
}

function displayOrFallback(value: string | null | undefined, emptyLabel = 'N/A') {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed !== '' ? trimmed : emptyLabel;
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const res = await api.get(`/admin/orders/${id}`);
                const payload = unwrapOrderPayload(res.data);
                if (!payload) {
                    throw new Error('Payload de orden inválido');
                }
                setOrder(payload);
            } catch {
                toast.error('Error al cargar el pedido');
            } finally {
                setLoading(false);
            }
        };
        loadOrder();
    }, [id]);

    const formatMoney = (value: any) =>
        Number(value ?? 0).toFixed(2);

    const updateStatus = async (newStatus: string) => {
        if (!order) return;

        try {
            await api.patch(`/admin/orders/${order.id}`, {
                status: newStatus
            });

            setOrder({ ...order, status: newStatus });

            toast.success('Estado actualizado');
        } catch {
            toast.error('Error al actualizar estado');
        }
    };


    if (loading)
        return <div className="p-10 text-center">Cargando pedido...</div>;

    if (!order)
        return (
            <div className="p-10 text-center text-slate-500">
                Pedido no encontrado
            </div>
        );

    const statusConfig = getStatusConfig(order.status);
    const { icon: StatusIcon, badgeClass, label } = statusConfig;

    const isLocked = isOrderStatusLocked(order.status);
    const briloErpId = resolveBriloErpId(order);
    const customer = resolveCustomerInfo(order);
    // Columnas exactas de orders: brilo_client_code / powertranz_transaction_id
    const briloClientCode = pickOrderString(order, 'brilo_client_code', 'briloClientCode');
    const powerTranzId = pickOrderString(order, 'powertranz_transaction_id', 'powertranzTransactionId');

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-start border-b pb-4 gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Pedido #{order.number}
                    </h1>

                    <p className="font-medium text-slate-600 text-sm mt-2">
                        <strong>Cliente:</strong> {customer.fullName}
                        {!order.user ? (
                            <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Invitado
                            </span>
                        ) : null}
                    </p>
                    <p className="font-medium text-slate-600 text-sm">
                        <strong>{customer.documentType === 'Pasaporte' ? 'Pasaporte' : 'DUI / Doc'}:</strong>{' '}
                        {displayOrFallback(customer.documentNumber)}
                    </p>
                    <p className="font-medium text-slate-600 text-sm">
                        <strong>Teléfono:</strong> {displayOrFallback(customer.phone)}
                    </p>
                    <p className="font-medium text-slate-600 text-sm">
                        <strong>Correo:</strong> {displayOrFallback(customer.email)}
                    </p>

                    <hr className="my-3 border-slate-200" />

                    <p className="font-medium text-slate-600 text-sm">
                        <strong>Fecha de creación:</strong> {formatDateDMY(order.created_at)} a las {formatTime(order.created_at)}
                    </p>
                    <p className="font-medium text-slate-600 text-sm">
                        <strong>ODF:</strong>{' '}
                        {briloErpId ? (
                            <span className="font-medium text-slate-500 text-sm">
                                {briloErpId}
                            </span>
                        ) : (
                            <span className="text-sm text-slate-400 italic">Pendiente</span>
                        )}
                    </p>
                    <p className="font-medium text-slate-600 text-sm">
                        <strong>Orden ID (UUID):</strong>{' '}
                        <span className="font-medium text-slate-500 text-sm">
                            {displayOrFallback(order.uuid, '—')}
                        </span>
                    </p>
                    <p className="font-medium text-slate-600 text-sm">
                        <strong>Cliente en Brilo:</strong>{' '}
                        {briloClientCode ?? 'N/A'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isLocked ? (
                        <span className={badgeClass}>
                            <StatusIcon className="w-4 h-4 shrink-0" aria-hidden />
                            {label}
                        </span>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <span className={badgeClass}>
                                <StatusIcon className="w-4 h-4 shrink-0" aria-hidden />
                                {label}
                            </span>
                            <select
                                value={toCanonicalStatus(order.status)}
                                onChange={(e) => updateStatus(e.target.value)}
                                className="font-medium text-sm rounded-lg px-3 py-2 border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 text-slate-700"
                            >
                                {ORDER_STATUS_SELECT_KEYS.map((status) => {
                                    const config = getStatusConfig(status);
                                    return (
                                        <option key={status} value={status}>
                                            {config.label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <h2 className="font-bold text-lg mb-4">
                        Productos
                    </h2>

                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 border rounded-xl p-4 border-slate-200 hover:border-slate-300 transition"
                            >
                                <img
                                    src={item.image}
                                    alt={item.image}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />

                                <div className="flex-1 space-y-0.5">
                                    <AdminProductName
                                        as="p"
                                        name={item.name}
                                        className="font-semibold text-slate-900"
                                    />
                                    <div className="mt-1 flex flex-col gap-0.5">
                                        {item.sku?.trim() ? (
                                            <p className="text-xs text-slate-500 font-medium">
                                                SKU: {item.sku.trim()}
                                            </p>
                                        ) : null}
                                        {item.style_code?.trim() ? (
                                            <p className="text-xs text-slate-500 font-medium">
                                                Código de estilo: {item.style_code.trim()}
                                            </p>
                                        ) : null}
                                        {item.brand?.trim() ? (
                                            <p className="text-xs text-slate-500 font-medium">
                                                Marca: {item.brand.trim()}
                                            </p>
                                        ) : null}
                                        {(item.variant_attributes_json?.size || item.variant_attributes_json?.product_color) ? (
                                            <p className="text-xs text-slate-500 font-medium">
                                                Talla {item.variant_attributes_json?.size ?? '—'} - Color{' '}
                                                {item.variant_attributes_json?.product_color ?? '—'}
                                            </p>
                                        ) : null}
                                        <p className="text-xs text-slate-500 font-medium">
                                            Cantidad: {item.quantity}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {Number(item.discount_percentage) > 0 ? (
                                        <>
                                            <p className="text-sm text-slate-500 line-through">
                                                ${formatMoney(item.price_regular)}
                                            </p>

                                            <p className="text-sm text-green-600 font-medium">
                                                -{formatMoney(item.discount_percentage)}%
                                            </p>

                                            <p className="font-bold text-slate-900">
                                                ${formatMoney(item.price_sale)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-bold text-slate-900">
                                            ${formatMoney(item.total)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-700">
                        <h2 className="pt-2 font-bold text-lg mb-4">
                            Resumen
                        </h2>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Subtotal</span>
                                <span>${formatMoney(order.subtotal)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">Costo de envío</span>
                                <span>${formatMoney(order.shipping_cost)}</span>
                            </div>

                            <div className="flex justify-between font-bold text-lg border-t pt-3">
                                <span>Total</span>
                                <span>${formatMoney(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <BillingInfoCard order={order} icon={Receipt} />

                    <ShippingInfoCard order={order} />

                    <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-slate-600" />
                            Información de Pago
                        </h2>

                        <div className="text-sm text-slate-600 space-y-2">
                            <p>
                                <span className="font-medium text-slate-800">Método:</span>{' '}
                                {pickOrderString(order, 'card_brand', 'cardBrand')
                                    ?? 'Tarjeta de Crédito ó Débito'}
                            </p>
                            <p className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-slate-800">Estado del Pago:</span>
                                <span className={badgeClass}>
                                    <StatusIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                                    {label}
                                </span>
                            </p>
                            <p>
                                <span className="font-medium text-slate-800">ID Transacción:</span>{' '}
                                {powerTranzId ? (
                                    <span className="break-all text-slate-700">{powerTranzId}</span>
                                ) : (
                                    <span className="italic text-slate-400">Pendiente</span>
                                )}
                            </p>
                            {pickOrderString(order, 'authorization_code', 'authorizationCode') ? (
                                <p>
                                    <span className="font-medium text-slate-800">Código de Autorización:</span>{' '}
                                    <span className="text-slate-700">
                                        {pickOrderString(order, 'authorization_code', 'authorizationCode')}
                                    </span>
                                </p>
                            ) : null}
                            <p>
                                <span className="font-medium text-slate-800">Total Pagado:</span>{' '}
                                <span className="font-semibold text-slate-900">
                                    ${formatMoney(order.total)}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
