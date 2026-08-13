'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import axios from 'axios';
import { MapPin, Store, Truck, ChevronDown, X, Loader2, Check } from 'lucide-react';
import api from '@/lib/axios';
import { clearCart } from '@/lib/cart';
import { isValidSuccessPayload, isUuidString } from '@/lib/payment-confirm';
import {
  saveCheckoutSuccessSnapshot,
  type CheckoutSuccessOrderSnapshot,
} from '@/lib/checkout-success-cache';
import EconomicActivityCombobox, {
  type EconomicActivityOption,
} from '@/components/shop/checkout/EconomicActivityCombobox';
import ElSalvadorGeoSelects from '@/components/shop/checkout/ElSalvadorGeoSelects';
import {
  EL_SALVADOR_COUNTRY_ISO,
  matchDepartmentName,
  resolveMunicipalityAndDistrict,
} from '@/lib/constants/el-salvador-geo';
import {
  handleShopProductImageError,
  resolveShopProductImageSrc,
} from '@/lib/shopProductImage';
import type { CustomerAddress } from '@/types/customer';

type DeliveryMethod = 'shipping' | 'pickup';
type CheckoutStep = 1 | 2 | 3;

type CartLine = {
  cart_key?: string;
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
  sku?: string;
  variant_id?: number;
  variant_sku?: string;
  variant_label?: string;
  color?: string;
};

type PickupStore = {
  id: number;
  name: string;
  alias?: string | null;
  display_name?: string;
  code?: string;
  address: string;
  city: string;
  country?: string;
  phone?: string | null;
  pickup_time_frame?: string | null;
  distance_km?: number | null;
};

type StoredVariantLabel = string | { value?: string; color_hex?: string; swatch_image_url?: string } | null | undefined;

const resolveVariantLabel = (label: StoredVariantLabel, fallback = 'Estándar'): string => {
  if (typeof label === 'string' && label.trim()) {
    return label;
  }

  if (label && typeof label === 'object') {
    return label.value || label.color_hex || fallback;
  }

  return fallback;
};

const normalizeCartLine = (item: CartLine): CartLine => ({
  ...item,
  variant_label: resolveVariantLabel(item.variant_label ?? item.color),
  color: resolveVariantLabel(item.color ?? item.variant_label),
});

const SHIPPING_FALLBACK = 3.5;
/** Valor estático para backend/PowerTranz (UI de código postal oculta). */
const DEFAULT_POSTAL_CODE = 'CP 1101';

type DocumentType = 'DUI' | 'Pasaporte';

const PHONE_REGIONS = [
  { code: '+503', label: '🇸🇻 El Salvador (+503)', country: 'SV' },
  { code: '+502', label: '🇬🇹 Guatemala (+502)', country: 'GT' },
  { code: '+504', label: '🇭🇳 Honduras (+504)', country: 'HN' },
  { code: '+505', label: '🇳🇮 Nicaragua (+505)', country: 'NI' },
  { code: '+506', label: '🇨🇷 Costa Rica (+506)', country: 'CR' },
] as const;

const validateDUI = (dui: string): boolean => {
  const regex = /^\d{8}-\d$/;
  if (!regex.test(dui)) return false;
  const digits = dui.replace('-', '').split('').map(Number);
  const checkDigit = digits.pop();
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (9 - i);
  }
  const remainder = sum % 10;
  const calculatedCheck = remainder === 0 ? 0 : (10 - remainder) % 10;
  return calculatedCheck === checkDigit;
};

const formatDuiMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 8)}-${digits.slice(8)}`;
};

const validatePassport = (value: string): boolean => /^[A-Za-z0-9]{5,15}$/.test(value.trim());

function readCartFromStorage(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(raw) ? raw.map((item) => normalizeCartLine(item as CartLine)) : [];
  } catch {
    return [];
  }
}

function formatExpiryDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Solo dígitos → MM/AA para enviar al backend (el servidor convierte a YYMM para PowerTranz). */
function normalizeExpiryMmYy(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length !== 4) return '';
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function digitsOnlyPan(value: string): string {
  return value.replace(/\D/g, '').slice(0, 19);
}

function isRedirectUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/** Máscara visual: alias comercial si existe; si no, nombre de sistema (Brilo). */
function storeDisplayName(store: Pick<PickupStore, 'alias' | 'name' | 'display_name'>): string {
  return (store.display_name || store.alias || store.name || 'Tienda').trim();
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts.slice(0, Math.ceil(parts.length / 2)).join(' '),
    lastName: parts.slice(Math.ceil(parts.length / 2)).join(' '),
  };
}

function parseStoredPhone(raw: string | null | undefined): { region: string; local: string } {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return { region: '+503', local: '' };

  const sorted = [...PHONE_REGIONS].sort((a, b) => b.code.length - a.code.length);
  for (const region of sorted) {
    const codeDigits = region.code.replace(/\D/g, '');
    if (digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
      return {
        region: region.code,
        local: digits.slice(codeDigits.length).slice(0, 8),
      };
    }
  }

  return { region: '+503', local: digits.slice(-8) };
}

function CheckoutInner() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    typeof window !== 'undefined' ? Boolean(localStorage.getItem('shop_token')) : false
  );
  const [briloCcfClientCode, setBriloCcfClientCode] = useState<string | null>(null);
  const [ccfRazonSocial, setCcfRazonSocial] = useState<string | null>(null);
  const [ccfNitFromBrilo, setCcfNitFromBrilo] = useState<string | null>(null);
  /** Permite reabrir el formulario CCF aunque ya exista ficha en Brilo. */
  const [ccfEditUnlocked, setCcfEditUnlocked] = useState(false);
  const [profileHydrated, setProfileHydrated] = useState(false);

  const [cartItems, setCartItems] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [step, setStep] = useState<CheckoutStep>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping');

  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneRegion, setPhoneRegion] = useState('+503');
  const [shippingPhone, setShippingPhone] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('DUI');
  const [documentNumber, setDocumentNumber] = useState('');
  /** Documento ya vinculado a la cuenta: no editable en checkout. */
  const [documentLocked, setDocumentLocked] = useState(false);
  /** Unicidad DUI vs otra cuenta (solo Persona Natural; no aplica a NIT/NRC CCF). */
  const [duiUniqueStatus, setDuiUniqueStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken'
  >('idle');

  const [needsCcf, setNeedsCcf] = useState(false);
  const [ccfNrc, setCcfNrc] = useState('');
  const [ccfNit, setCcfNit] = useState('');
  const [ccfLegalName, setCcfLegalName] = useState('');
  const [ccfDepartment, setCcfDepartment] = useState('');
  const [ccfMunicipality, setCcfMunicipality] = useState('');
  const [ccfDistrict, setCcfDistrict] = useState('');
  const [ccfFiscalAddress, setCcfFiscalAddress] = useState('');
  const [ccfGiro, setCcfGiro] = useState<EconomicActivityOption | null>(null);

  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingLine2, setShippingLine2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('');

  const [billingSame, setBillingSame] = useState(true);
  const [billRecipient, setBillRecipient] = useState('');
  const [billPhone, setBillPhone] = useState('');
  const [billLine1, setBillLine1] = useState('');
  const [billCity, setBillCity] = useState('');
  const [billState, setBillState] = useState('');
  const [billDistrict, setBillDistrict] = useState('');

  const [cardholderName, setCardholderName] = useState('');
  const [cardPan, setCardPan] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardExpiration, setCardExpiration] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [threeDsOpen, setThreeDsOpen] = useState(false);
  const [redirectPayload, setRedirectPayload] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState(SHIPPING_FALLBACK);

  const [pickupStores, setPickupStores] = useState<PickupStore[]>([]);
  const [selectedPickupStoreId, setSelectedPickupStoreId] = useState<number | null>(null);
  const [loadingPickupStores, setLoadingPickupStores] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const billingPrefillDoneRef = useRef(false);

  useEffect(() => {
    if (!threeDsOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [threeDsOpen]);

  useEffect(() => {
    setCartItems(readCartFromStorage());
    setCartReady(true);
    const onCart = () => setCartItems(readCartFromStorage());
    window.addEventListener('cartUpdated', onCart);
    return () => window.removeEventListener('cartUpdated', onCart);
  }, []);

  const displayLines = useMemo(
    () => cartItems.map(normalizeCartLine),
    [cartItems]
  );

  useEffect(() => {
    const tok = typeof window !== 'undefined' ? localStorage.getItem('shop_token') : null;
    setIsAuthenticated(Boolean(tok));
    if (!tok) {
      setBriloCcfClientCode(null);
      setCcfRazonSocial(null);
      setCcfNitFromBrilo(null);
      setCcfEditUnlocked(false);
      setDocumentLocked(false);
      setProfileHydrated(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{
          name?: string;
          email?: string;
          phone?: string;
          document_type?: string | null;
          document_number?: string | null;
          brilo_ccf_client_code?: string | null;
          ccf_razon_social?: string | null;
          ccf_nit?: string | null;
          data?: Record<string, unknown>;
        }>('/shop/me');
        const payload = (res.data?.data ?? res.data) as {
          name?: string;
          email?: string;
          phone?: string;
          document_type?: string | null;
          document_number?: string | null;
          brilo_ccf_client_code?: string | null;
          ccf_razon_social?: string | null;
          ccf_nit?: string | null;
        };
        if (cancelled || !payload) return;

        setBriloCcfClientCode((payload.brilo_ccf_client_code || '').trim() || null);
        setCcfRazonSocial((payload.ccf_razon_social || '').trim() || null);
        setCcfNitFromBrilo((payload.ccf_nit || '').trim() || null);
        setCcfEditUnlocked(false);

        if (payload.email?.trim()) {
          setEmail(payload.email.trim());
        }

        if (payload.name?.trim()) {
          const { firstName: fn, lastName: ln } = splitFullName(payload.name);
          if (fn) setFirstName(fn);
          if (ln) setLastName(ln);
        }

        if (payload.phone) {
          const parsed = parseStoredPhone(payload.phone);
          setPhoneRegion(parsed.region);
          if (parsed.local) setShippingPhone(parsed.local);
        }

        const docTypeRaw = (payload.document_type || 'DUI').trim();
        const docType: DocumentType = docTypeRaw.toLowerCase() === 'pasaporte' ? 'Pasaporte' : 'DUI';
        setDocumentType(docType);

        if (payload.document_number?.trim()) {
          const doc = payload.document_number.trim();
          setDocumentNumber(docType === 'DUI' ? formatDuiMask(doc) : doc.toUpperCase());
          setDocumentLocked(true);
          setDuiUniqueStatus('available');
        } else {
          setDocumentLocked(false);
        }
      } catch {
        if (!cancelled) {
          setBriloCcfClientCode(null);
          setCcfRazonSocial(null);
          setCcfNitFromBrilo(null);
        }
      } finally {
        if (!cancelled) setProfileHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /** Crédito Fiscal: omite formulario si ya existe ficha CCF en Brilo (salvo edición). */
  const hasBriloCcfClient = Boolean(briloCcfClientCode);
  const showCcfSummary = needsCcf && hasBriloCcfClient && !ccfEditUnlocked;
  const showCcfForm = needsCcf && (!hasBriloCcfClient || ccfEditUnlocked);

  useEffect(() => {
    if (isAuthenticated) {
      setEmailExists(null);
      setForgotPasswordSent(false);
      return;
    }
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailExists(null);
      setForgotPasswordSent(false);
      return;
    }

    const t = window.setTimeout(async () => {
      setCheckingEmail(true);
      setForgotPasswordSent(false);
      try {
        const res = await api.get<{ data?: { exists?: boolean } }>('/shop/check-email', {
          params: { email: trimmed },
        });
        setEmailExists(Boolean(res.data?.data?.exists));
      } catch {
        setEmailExists(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => window.clearTimeout(t);
  }, [email, isAuthenticated]);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Indica tu correo electrónico.');
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await api.post('/shop/forgot-password', { email: email.trim() });
      setForgotPasswordSent(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string })?.message ||
          'No se pudo enviar el correo de recuperación.';
        toast.error(msg);
      } else {
        toast.error('No se pudo enviar el correo de recuperación.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleInlineLogin = async (): Promise<boolean> => {
    if (!email.trim() || !loginPassword) {
      toast.error('Ingresa tu correo y contraseña.');
      return false;
    }
    setLoggingIn(true);
    try {
      const res = await api.post<{ token?: string }>('/shop/login', {
        email: email.trim(),
        password: loginPassword,
      });
      if (!res.data?.token) {
        toast.error('No se pudo iniciar sesión.');
        return false;
      }
      localStorage.setItem('shop_token', res.data.token);
      window.dispatchEvent(new Event('shop-auth-changed'));
      setIsAuthenticated(true);
      setLoginPassword('');
      setEmailExists(null);
      toast.success('Sesión iniciada');
      // El efecto de /shop/me precarga datos al pasar isAuthenticated a true.
      return true;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message || 'Credenciales incorrectas.';
        toast.error(msg);
      } else {
        toast.error('No se pudo iniciar sesión.');
      }
      return false;
    } finally {
      setLoggingIn(false);
    }
  };

  const subtotal = useMemo(
    () => displayLines.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0),
    [displayLines]
  );

  const buildItemsPayload = () =>
    displayLines.map((item) => {
      const idNum = Number(item.id);
      const hasNumericId = Number.isFinite(idNum) && idNum > 0;
      const variantSku = item.variant_sku ?? item.sku;
      const color = item.color ?? item.variant_label;

      return {
        name: item.name,
        quantity: item.quantity || 1,
        unit_price: Number(item.price),
        sku: variantSku ?? undefined,
        variant_sku: variantSku ?? undefined,
        image: item.image ?? undefined,
        product_id: hasNumericId ? idNum : undefined,
        variant_id: item.variant_id ?? undefined,
        size: item.size ?? undefined,
        color: typeof color === 'string' && color.trim() ? color.trim() : undefined,
        variant_label: typeof color === 'string' && color.trim() ? color.trim() : undefined,
      };
    });

  const fetchPickupStores = useCallback(
    async (latitude: number | null, longitude: number | null) => {
      setLoadingPickupStores(true);
      try {
        const items = displayLines.map((item) => ({
          sku: item.sku,
          variant_sku: item.variant_sku ?? item.sku,
          quantity: item.quantity || 1,
        }));

        const body: Record<string, unknown> = { items };
        if (latitude != null && longitude != null) {
          body.latitude = latitude;
          body.longitude = longitude;
        }

        const res = await api.post<{ data?: PickupStore[] }>('/shop/checkout/pickup-stores', body);
        const stores = res.data?.data ?? [];
        setPickupStores(stores);
        setSelectedPickupStoreId((prev) => {
          if (prev && stores.some((s) => s.id === prev)) return prev;
          return stores[0]?.id ?? null;
        });

        if (stores.length === 0) {
          toast.message('No hay sucursales disponibles para retiro en tienda.');
        }
      } catch {
        setPickupStores([]);
        setSelectedPickupStoreId(null);
        toast.error('No se pudieron cargar las tiendas de retiro.');
      } finally {
        setLoadingPickupStores(false);
      }
    },
    [displayLines]
  );

  const requestPickupStoresWithGeo = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchPickupStores(latitude, longitude);
        },
        (error) => {
          console.warn('Ubicación denegada o no disponible:', error);
          fetchPickupStores(null, null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      fetchPickupStores(null, null);
    }
  }, [fetchPickupStores]);

  useEffect(() => {
    if (deliveryMethod !== 'shipping') {
      setShippingCost(0);
      return;
    }

    const items = displayLines
      .map((item) => {
        const idNum = Number(item.id);
        const hasNumericId = Number.isFinite(idNum) && idNum > 0;
        return {
          product_id: hasNumericId ? idNum : undefined,
          quantity: item.quantity || 1,
        };
      })
      .filter((item) => item.product_id);

    if (items.length === 0) {
      setShippingCost(deliveryMethod === 'shipping' ? 0 : 0);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await api.post<{ data?: { shipping_cost?: number } }>('/shop/shipping/quote', { items });
        const cost = Number(res.data?.data?.shipping_cost);
        if (!cancelled) {
          setShippingCost(Number.isFinite(cost) ? cost : SHIPPING_FALLBACK);
        }
      } catch {
        if (!cancelled) setShippingCost(SHIPPING_FALLBACK);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [displayLines, deliveryMethod]);

  useEffect(() => {
    if (deliveryMethod === 'pickup' && step >= 2) {
      requestPickupStoresWithGeo();
    }
  }, [deliveryMethod, step, requestPickupStoresWithGeo]);

  const orderTotal = useMemo(
    () => Math.round((subtotal + shippingCost) * 100) / 100,
    [subtotal, shippingCost]
  );

  const selectedPickupStore = useMemo(
    () => pickupStores.find((s) => s.id === selectedPickupStoreId) ?? null,
    [pickupStores, selectedPickupStoreId]
  );

  const fullRecipientName = useMemo(
    () => `${firstName.trim()} ${lastName.trim()}`.trim(),
    [firstName, lastName]
  );

  const documentIsValid = useMemo(() => {
    if (documentType === 'DUI') {
      return validateDUI(documentNumber);
    }
    return validatePassport(documentNumber);
  }, [documentType, documentNumber]);

  const duiBlockedByOtherAccount = documentType === 'DUI' && duiUniqueStatus === 'taken';

  useEffect(() => {
    if (documentLocked) {
      setDuiUniqueStatus('available');
      return;
    }
    if (documentType !== 'DUI') {
      setDuiUniqueStatus('idle');
      return;
    }
    if (!documentIsValid || !email.trim() || !email.includes('@')) {
      setDuiUniqueStatus('idle');
      return;
    }

    const t = window.setTimeout(async () => {
      setDuiUniqueStatus('checking');
      try {
        const res = await api.post<{
          data?: { available?: boolean; taken_by_other?: boolean };
        }>('/validate-dui', {
          dui: documentNumber.trim(),
          email: email.trim(),
        });
        const taken = Boolean(res.data?.data?.taken_by_other);
        const available = res.data?.data?.available !== false && !taken;
        setDuiUniqueStatus(available ? 'available' : 'taken');
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 422) {
          const taken = Boolean(
            (err.response.data as { data?: { taken_by_other?: boolean } })?.data?.taken_by_other
          );
          setDuiUniqueStatus(taken ? 'taken' : 'idle');
          return;
        }
        setDuiUniqueStatus('idle');
      }
    }, 450);

    return () => window.clearTimeout(t);
  }, [documentType, documentNumber, documentIsValid, email, documentLocked]);

  /** CF + pickup: facturación propia (nunca la dirección de la sucursal). */
  const requireSeparateBilling = !needsCcf && deliveryMethod === 'pickup';
  const effectiveBillingSame = needsCcf ? true : requireSeparateBilling ? false : billingSame;

  useEffect(() => {
    if (!requireSeparateBilling) {
      billingPrefillDoneRef.current = false;
      return;
    }

    setBillingSame(false);

    if (billingPrefillDoneRef.current) return;
    billingPrefillDoneRef.current = true;

    setBillRecipient((prev) => prev.trim() || fullRecipientName);
    setBillPhone((prev) => prev.trim() || shippingPhone.replace(/\D/g, ''));

    if (!isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ data?: CustomerAddress[] }>('/shop/addresses');
        if (cancelled) return;
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const preferred =
          list.find((a) => a.type === 'billing' && a.is_default) ||
          list.find((a) => a.is_default) ||
          list.find((a) => a.type === 'billing') ||
          list.find((a) => a.type === 'shipping') ||
          list[0];
        if (!preferred?.details) return;

        setBillRecipient((prev) => prev.trim() || preferred.recipient_name || preferred.name || '');
        if (preferred.phone) {
          setBillPhone((prev) => prev.trim() || preferred.phone!.replace(/\D/g, '').slice(-8));
        }
        setBillLine1((prev) => prev.trim() || preferred.details.line1 || '');
        const matchedDept = matchDepartmentName(preferred.details.state);
        const resolved = resolveMunicipalityAndDistrict(
          matchedDept,
          preferred.details.city,
          null
        );
        setBillState((prev) => prev.trim() || matchedDept);
        setBillCity((prev) => prev.trim() || resolved.municipality);
        setBillDistrict((prev) => prev.trim() || resolved.district);
      } catch {
        // Sin direcciones guardadas: el usuario completa el formulario.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requireSeparateBilling, isAuthenticated, fullRecipientName, shippingPhone]);

  const phoneIsValid = shippingPhone.replace(/\D/g, '').length === 8;

  const ccfComplete =
    !needsCcf ||
    (hasBriloCcfClient && !ccfEditUnlocked) ||
    Boolean(
      ccfNrc.trim() &&
        ccfNit.trim() &&
        ccfLegalName.trim() &&
        ccfDepartment.trim() &&
        ccfMunicipality.trim() &&
        ccfDistrict.trim() &&
        ccfFiscalAddress.trim() &&
        ccfGiro
    );

  const billingAddressComplete = Boolean(
    billRecipient.trim() &&
      billPhone.trim() &&
      billLine1.trim() &&
      billState.trim() &&
      billCity.trim() &&
      billDistrict.trim()
  );

  const step1Complete = Boolean(
    email.trim() &&
      firstName.trim() &&
      lastName.trim() &&
      phoneIsValid &&
      documentIsValid &&
      !duiBlockedByOtherAccount &&
      (documentType !== 'DUI' || duiUniqueStatus === 'available') &&
      ccfComplete &&
      (isAuthenticated || emailExists !== true) &&
      (isAuthenticated || (registerPassword.length >= 8 && acceptsTerms))
  );
  const step2Complete =
    deliveryMethod === 'pickup'
      ? Boolean(selectedPickupStoreId) && (!requireSeparateBilling || billingAddressComplete)
      : Boolean(
          shippingLine1.trim() &&
            shippingState.trim() &&
            shippingCity.trim() &&
            shippingDistrict.trim()
        );
  const paymentUnlocked = step1Complete && step2Complete;

  const confirmPayment = useCallback(
    async (spiToken: string) => {
      const res = await api.post<{ data?: unknown }>('/shop/payments/confirm', {
        spi_token: spiToken,
      });
      const payload = res.data?.data;
      if (!isValidSuccessPayload(payload)) {
        router.push('/checkout/error');
        return;
      }
      const oid = String(payload.order_id);
      if (!isUuidString(oid)) {
        router.push('/checkout/error');
        return;
      }
      clearCart();
      if (payload.order && typeof payload.order === 'object') {
        saveCheckoutSuccessSnapshot(oid, payload.order as CheckoutSuccessOrderSnapshot);
      }
      router.push(`/checkout/success?order_id=${encodeURIComponent(oid)}`);
    },
    [router]
  );

  const validateContact = (): boolean => {
    if (!email.trim()) {
      toast.error('Indica un correo electrónico.');
      return false;
    }
    if (!isAuthenticated && emailExists === true) {
      toast.error('Este correo ya tiene cuenta. Inicia sesión para continuar.');
      return false;
    }
    if (!isAuthenticated) {
      if (registerPassword.length < 8) {
        toast.error('Crea una contraseña de al menos 8 caracteres.');
        return false;
      }
      if (!acceptsTerms) {
        toast.error('Debes aceptar Términos, Condiciones y Políticas de Privacidad.');
        return false;
      }
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Completa nombres y apellidos.');
      return false;
    }
    if (!phoneIsValid) {
      toast.error('El teléfono debe tener 8 dígitos.');
      return false;
    }
    if (!documentIsValid) {
      toast.error(
        documentType === 'DUI'
          ? 'Ingresa un número de DUI válido.'
          : 'Ingresa un pasaporte válido (5 a 15 caracteres alfanuméricos).'
      );
      return false;
    }
    if (duiBlockedByOtherAccount) {
      toast.error(
        'Este DUI ya pertenece a una cuenta existente. Si es tu cuenta, por favor inicia sesión.'
      );
      return false;
    }
    if (documentType === 'DUI' && duiUniqueStatus !== 'available') {
      toast.error('Espera a que se verifique el DUI antes de continuar.');
      return false;
    }
    if (needsCcf && (!hasBriloCcfClient || ccfEditUnlocked)) {
      if (!ccfNrc.trim() || !ccfNit.trim() || !ccfLegalName.trim()) {
        toast.error('Completa NRC, NIT y Razón Social para Crédito Fiscal.');
        return false;
      }
      if (!ccfDepartment.trim() || !ccfMunicipality.trim() || !ccfDistrict.trim() || !ccfFiscalAddress.trim()) {
        toast.error('Completa dirección fiscal (depto, municipio, distrito y dirección).');
        return false;
      }
      if (!ccfGiro) {
        toast.error('Selecciona el giro / actividad económica.');
        return false;
      }
    }
    return true;
  };

  const validateDelivery = (): boolean => {
    if (deliveryMethod === 'pickup') {
      if (!selectedPickupStoreId) {
        toast.error('Selecciona una tienda para el retiro.');
        return false;
      }
      if (requireSeparateBilling) {
        if (!billRecipient.trim() || !billPhone.trim() || !billLine1.trim()) {
          toast.error('Completa nombre, teléfono y dirección de facturación.');
          return false;
        }
        if (!billState.trim() || !billCity.trim() || !billDistrict.trim()) {
          toast.error('Completa departamento, municipio y distrito de facturación.');
          return false;
        }
      }
      return true;
    }

    if (!shippingLine1.trim()) {
      toast.error('Completa la dirección de envío.');
      return false;
    }
    if (!shippingState.trim() || !shippingCity.trim() || !shippingDistrict.trim()) {
      toast.error('Completa departamento, municipio y distrito.');
      return false;
    }
    if (!billingSame && !needsCcf) {
      if (!billRecipient.trim() || !billPhone.trim() || !billLine1.trim()) {
        toast.error('Completa nombre, teléfono y dirección de facturación.');
        return false;
      }
      if (!billState.trim() || !billCity.trim() || !billDistrict.trim()) {
        toast.error('Completa departamento, municipio y distrito de facturación.');
        return false;
      }
    }
    return true;
  };

  const handleContinueStep1 = () => {
    if (!validateContact()) return;
    setStep(2);
  };

  const handleContinueStep2 = () => {
    if (!validateDelivery()) return;
    setStep(3);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (displayLines.length === 0) {
      toast.error('Tu carrito está vacío.');
      router.push('/cart');
      return;
    }

    if (!validateContact() || !validateDelivery()) {
      setStep(!step1Complete ? 1 : 2);
      return;
    }

    const pan = digitsOnlyPan(cardPan);
    const exp = normalizeExpiryMmYy(cardExpiration);
    if (pan.length < 12) {
      toast.error('Revisa el número de tarjeta.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(exp)) {
      toast.error('La expiración debe ser MM/AA (4 dígitos, ej. 12/25).');
      return;
    }
    const expMonth = parseInt(exp.slice(0, 2), 10);
    if (expMonth < 1 || expMonth > 12) {
      toast.error('El mes debe estar entre 01 y 12.');
      return;
    }

    const fullPhone = `${phoneRegion}${shippingPhone.replace(/\D/g, '')}`;

    const shipping =
      deliveryMethod === 'pickup' && selectedPickupStore
        ? {
            recipient_name: fullRecipientName,
            phone: fullPhone,
            address_line1: selectedPickupStore.address,
            city: selectedPickupStore.city,
            postal_code: DEFAULT_POSTAL_CODE,
            country: (selectedPickupStore.country || 'SV').toUpperCase().slice(0, 2),
          }
        : {
            recipient_name: fullRecipientName,
            phone: fullPhone,
            address_line1: shippingLine1.trim(),
            address_line2: shippingLine2.trim() || undefined,
            city: shippingDistrict.trim() || shippingCity.trim(),
            state: shippingState.trim() || undefined,
            municipality: shippingCity.trim() || undefined,
            district: shippingDistrict.trim() || undefined,
            postal_code: DEFAULT_POSTAL_CODE,
            country: EL_SALVADOR_COUNTRY_ISO,
          };

    const body: Record<string, unknown> = {
      type: 'member',
      email: email.trim(),
      document_type: documentType,
      document_number: documentNumber.trim(),
      delivery_method: deliveryMethod,
      shipping,
      billing_same: effectiveBillingSame,
      items: buildItemsPayload(),
      cardholder_name: cardholderName.trim(),
      card_pan: pan,
      card_cvv: cardCvv.trim(),
      card_expiration: exp,
      needs_ccf: needsCcf,
    };

    if (!isAuthenticated) {
      body.password = registerPassword;
      body.accepts_terms = acceptsTerms;
    }

    if (needsCcf && (!hasBriloCcfClient || ccfEditUnlocked) && ccfGiro) {
      body.ccf = {
        nrc: ccfNrc.trim(),
        nit: ccfNit.trim(),
        legal_name: ccfLegalName.trim(),
        department: ccfDepartment.trim(),
        municipality: ccfMunicipality.trim(),
        district: ccfDistrict.trim(),
        fiscal_address: ccfFiscalAddress.trim(),
        giro_code: ccfGiro.code,
        giro_description: ccfGiro.description,
      };
    }

    if (deliveryMethod === 'pickup' && selectedPickupStoreId) {
      body.pickup_store_id = selectedPickupStoreId;
      body.warehouse_id = selectedPickupStoreId;
    }

    if (!needsCcf && !effectiveBillingSame) {
      body.billing = {
        recipient_name: billRecipient.trim(),
        phone: billPhone.trim(),
        address_line1: billLine1.trim(),
        city: billDistrict.trim() || billCity.trim(),
        state: billState.trim() || undefined,
        municipality: billCity.trim() || undefined,
        district: billDistrict.trim() || undefined,
        postal_code: DEFAULT_POSTAL_CODE,
        country: EL_SALVADOR_COUNTRY_ISO,
      };
    }

    setSubmitting(true);
    setThreeDsOpen(false);
    setRedirectPayload(null);

    try {
      const res = await api.post<{
        data?: {
          spi_token?: string;
          redirect_data?: string | null;
          RedirectData?: string | null;
          order_uuid?: string;
          shop_token?: string | null;
        };
      }>('/checkout/process', body);

      const payload = res.data?.data;
      if (payload?.shop_token) {
        localStorage.setItem('shop_token', payload.shop_token);
        window.dispatchEvent(new Event('shop-auth-changed'));
        setIsAuthenticated(true);
      }

      const spiToken = payload?.spi_token;
      const htmlOrUrl = payload?.redirect_data ?? payload?.RedirectData ?? null;

      if (!spiToken) {
        toast.error('Respuesta inválida del servidor de pago.');
        return;
      }

      if (htmlOrUrl != null && String(htmlOrUrl).trim() !== '') {
        setRedirectPayload(String(htmlOrUrl).trim());
        setThreeDsOpen(true);
        return;
      }

      await confirmPayment(spiToken);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message || err.message;
        toast.error(msg);
      } else {
        toast.error('No se pudo iniciar el pago.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-400';

  const iframeSrc = redirectPayload && isRedirectUrl(redirectPayload) ? redirectPayload.trim() : null;
  const iframeSrcDoc = redirectPayload && !isRedirectUrl(redirectPayload) ? redirectPayload : null;

  const threeDsModal =
    threeDsOpen && (iframeSrc || iframeSrcDoc) ? (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-three-ds-title"
      >
        <div className="absolute inset-0 bg-black/60" aria-hidden />
        <div className="relative z-10 flex h-[min(85vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/10">
          <div className="shrink-0 border-b border-gray-200 bg-[#f5f5f5] px-4 py-3 sm:px-5">
            <h2 id="checkout-three-ds-title" className="text-sm font-bold tracking-tight">
              Autenticación 3D Secure
            </h2>
            <p className="mt-1 text-xs text-gray-600">
              Completa el desafío del banco en el recuadro. Al finalizar, continuarás automáticamente hacia la
              confirmación del pago.
            </p>
          </div>
          <div className="min-h-0 flex-1 bg-white">
            {iframeSrc ? (
              <iframe
                title="3D Secure"
                className="h-full min-h-[min(72vh,620px)] w-full border-0"
                src={iframeSrc}
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
              />
            ) : (
              <iframe
                title="3D Secure"
                className="h-full min-h-[min(72vh,620px)] w-full border-0"
                srcDoc={iframeSrcDoc ?? undefined}
                sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
              />
            )}
          </div>
        </div>
      </div>
    ) : null;

  const pickupModal =
    pickupModalOpen ? (
      <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
        <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setPickupModalOpen(false)} />
        <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-hidden rounded-t-2xl sm:rounded-xl bg-white shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-bold uppercase tracking-wide">Opciones de retiro</h3>
            <button type="button" onClick={() => setPickupModalOpen(false)} className="p-1.5 text-gray-500 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto p-3 space-y-2">
            {pickupStores.map((store) => {
              const selected = store.id === selectedPickupStoreId;
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    setSelectedPickupStoreId(store.id);
                    setPickupModalOpen(false);
                  }}
                  className={`relative w-full text-left rounded-lg px-4 py-3 pr-28 transition-all ${
                    selected
                      ? 'border-2 border-black bg-neutral-50/50 shadow-sm'
                      : 'border border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  {selected ? (
                    <span className="absolute top-4 right-4 bg-black text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      Seleccionada
                    </span>
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold">{storeDisplayName(store)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{store.address}</p>
                    <p className="text-xs text-gray-500">{store.city}</p>
                    {store.pickup_time_frame ? (
                      <p className="text-xs text-gray-500 mt-1">{store.pickup_time_frame}</p>
                    ) : null}
                    {store.distance_km != null ? (
                      <p className="text-xs font-medium text-slate-700 mt-1">{store.distance_km.toFixed(1)} km</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    ) : null;

  const stepHeader = (n: CheckoutStep, title: string) => {
    const active = step === n;
    const done = step > n;
    return (
      <button
        type="button"
        onClick={() => {
          if (n === 1 || (n === 2 && step1Complete) || (n === 3 && paymentUnlocked)) {
            setStep(n);
          }
        }}
        className={`w-full flex items-center justify-between gap-3 text-left border-b pb-2 ${
          active ? 'border-black' : 'border-gray-200'
        }`}
      >
        <span className="flex items-center gap-2">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
              done || active ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {done ? <Check className="w-3.5 h-3.5" /> : n}
          </span>
          <span className={`text-[15px] font-bold uppercase tracking-wide ${active ? 'text-black' : 'text-gray-500'}`}>
            {title}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${active ? 'rotate-180' : ''}`} />
      </button>
    );
  };

  if (!cartReady) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-20 font-sans text-center text-gray-600">
        Cargando checkout…
      </div>
    );
  }

  if (displayLines.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 font-sans text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-sm text-gray-600 mb-8">
          Agrega productos desde la tienda para continuar con el pago.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/product"
            className="inline-flex w-full sm:w-auto justify-center bg-black text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-zinc-800"
          >
            Explorar Productos
          </Link>
          <Link
            href="/cart"
            className="inline-flex w-full sm:w-auto justify-center border border-gray-300 px-6 py-3 rounded-sm text-sm font-medium text-slate-700 hover:border-black"
          >
            Ir al carrito
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-12 md:py-16 font-sans text-slate-900">
      <div className="mb-6">
        <Link href="/cart" className="text-sm text-gray-600 hover:text-black underline">
          ← Volver al carrito
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Checkout</h1>
      <p className="text-sm text-gray-600 mb-8">
        Completa tus datos, el método de entrega y el pago. Tu cuenta Galaxia se vincula automáticamente a este pedido.
      </p>

      <form onSubmit={handlePay} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        <div className="lg:col-span-7 space-y-6">
          {/* PASO 1 */}
          <section className="space-y-4">
            {stepHeader(1, 'Datos de contacto')}
            {step === 1 ? (
              <div className="space-y-4 pt-2 animate-in fade-in">
                <div>
                  <label className="block text-[13px] font-medium mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    required
                    disabled={isAuthenticated}
                  />
                  {checkingEmail ? (
                    <p className="mt-1 text-xs text-gray-500">Verificando correo…</p>
                  ) : null}
                  {isAuthenticated ? (
                    <p className="mt-1 text-xs text-green-700">
                      {profileHydrated
                        ? 'Sesión activa · este pedido quedará en tu cuenta.'
                        : 'Sesión activa · cargando tus datos…'}
                    </p>
                  ) : null}
                  {!isAuthenticated && emailExists === true ? (
                    <div className="mt-3 space-y-2 rounded-md border border-amber-200 bg-amber-50/80 p-3">
                      <p className="text-xs text-amber-900">
                        Este correo ya tiene una cuenta. Inicia sesión para continuar sin salir.
                      </p>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Contraseña"
                        className={inputCls}
                        autoComplete="current-password"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => void handleForgotPassword()}
                          disabled={forgotPasswordLoading}
                          className="text-xs text-amber-900/80 underline underline-offset-2 hover:text-amber-950 disabled:opacity-50"
                        >
                          {forgotPasswordLoading ? 'Enviando…' : '¿Olvidaste tu contraseña?'}
                        </button>
                      </div>
                      {forgotPasswordSent ? (
                        <p className="text-xs font-medium text-green-700">
                          ✉️ Te enviamos un correo con instrucciones para restablecer tu contraseña.
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleInlineLogin()}
                        disabled={loggingIn}
                        className="w-full bg-black text-white px-4 py-2.5 rounded-sm text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {loggingIn ? 'Iniciando sesión…' : 'Iniciar sesión'}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Nombres *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Juan Antonio"
                      className={inputCls}
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Apellidos *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej. Pérez Quintanilla"
                      className={inputCls}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Tipo de documento</label>
                    <select
                      value={documentType}
                      onChange={(e) => {
                        setDocumentType(e.target.value as DocumentType);
                        setDocumentNumber('');
                        setDuiUniqueStatus('idle');
                      }}
                      className={`${inputCls} ${documentLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`}
                      disabled={documentLocked}
                    >
                      <option value="DUI">DUI</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Número de documento *</label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => {
                        if (documentLocked) return;
                        const raw = e.target.value;
                        if (documentType === 'DUI') {
                          setDocumentNumber(formatDuiMask(raw));
                          setDuiUniqueStatus('idle');
                        } else {
                          setDocumentNumber(raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 15).toUpperCase());
                        }
                      }}
                      placeholder={documentType === 'DUI' ? '00000000-0' : 'ABC12345'}
                      className={`${inputCls} ${documentLocked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`}
                      inputMode={documentType === 'DUI' ? 'numeric' : 'text'}
                      maxLength={documentType === 'DUI' ? 10 : 15}
                      required
                      disabled={documentLocked}
                      readOnly={documentLocked}
                    />
                    {documentLocked ? (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Documento verificado y vinculado a tu cuenta.
                      </p>
                    ) : documentNumber.length > 0 ? (
                      documentType === 'DUI' ? (
                        !documentIsValid ? (
                          <p className="mt-1 text-xs font-medium text-red-600">Número de DUI inválido</p>
                        ) : duiUniqueStatus === 'checking' ? (
                          <p className="mt-1 text-xs font-medium text-gray-500">Verificando DUI…</p>
                        ) : duiUniqueStatus === 'taken' ? (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Este DUI ya pertenece a una cuenta existente. Si es tu cuenta, por favor inicia
                            sesión.
                          </p>
                        ) : duiUniqueStatus === 'available' ? (
                          <p className="mt-1 text-xs font-medium text-green-600">✓ Número de DUI válido</p>
                        ) : null
                      ) : (
                        <p className={`mt-1 text-xs font-medium ${documentIsValid ? 'text-green-600' : 'text-red-600'}`}>
                          {documentIsValid
                            ? 'Número de pasaporte válido'
                            : 'Pasaporte: 5 a 15 caracteres alfanuméricos'}
                        </p>
                      )
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1">Teléfono</label>
                  <div className="flex gap-2 w-full items-center">
                    <select
                      value={phoneRegion}
                      onChange={(e) => setPhoneRegion(e.target.value)}
                      className="w-[200px] shrink-0 border border-gray-300 rounded-sm px-2 py-2 text-sm outline-none focus:border-black bg-white"
                      aria-label="Código de área"
                    >
                      {PHONE_REGIONS.map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="0000-0000"
                      className="flex-1 min-w-0 border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-black"
                      maxLength={8}
                      required
                    />
                  </div>
                  {shippingPhone.length > 0 && !phoneIsValid ? (
                    <p className="mt-1 text-xs font-medium text-red-600">El teléfono debe tener 8 dígitos</p>
                  ) : null}
                </div>

                {!isAuthenticated && emailExists !== true ? (
                  <div className="rounded-md border border-gray-200 p-4 space-y-3">
                    <p className="text-[13px] font-semibold text-gray-900">Crea tu cuenta Galaxia</p>
                    <div>
                      <label className="block text-[13px] font-medium mb-1">Crea una contraseña *</label>
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className={inputCls}
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </div>
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={acceptsTerms}
                        onChange={(e) => setAcceptsTerms(e.target.checked)}
                        className="mt-1"
                      />
                      <span>Acepto Términos, Condiciones y Políticas de Privacidad</span>
                    </label>
                  </div>
                ) : null}

                <div className="rounded-md border border-gray-200 p-4 space-y-3">
                  <label className="flex items-start gap-2 text-sm font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={needsCcf}
                      onChange={(e) => setNeedsCcf(e.target.checked)}
                      className="mt-1"
                    />
                    <span>¿Necesitas Comprobante de Crédito Fiscal (CCF)?</span>
                  </label>

                  {needsCcf ? (
                    showCcfSummary ? (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-sm px-3 py-2.5">
                          {ccfRazonSocial && ccfNitFromBrilo
                            ? `Tu Crédito Fiscal se emitirá a nombre de: ${ccfRazonSocial} (NIT: ${ccfNitFromBrilo})`
                            : 'Tu Crédito Fiscal se emitirá a nombre de tu ficha empresarial registrada.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCcfEditUnlocked(true)}
                          className="text-sm font-medium text-slate-800 underline underline-offset-2 hover:text-black"
                        >
                          Cambiar o editar datos
                        </button>
                      </div>
                    ) : showCcfForm ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[13px] font-medium mb-1">NRC *</label>
                          <input
                            type="text"
                            value={ccfNrc}
                            onChange={(e) => setCcfNrc(e.target.value)}
                            className={inputCls}
                            placeholder="Registro de IVA"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium mb-1">NIT *</label>
                          <input
                            type="text"
                            value={ccfNit}
                            onChange={(e) => setCcfNit(e.target.value)}
                            className={inputCls}
                            placeholder="0614-000000-000-0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Razón Social *</label>
                        <input
                          type="text"
                          value={ccfLegalName}
                          onChange={(e) => setCcfLegalName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="space-y-3">
                        <ElSalvadorGeoSelects
                          idPrefix="ccf"
                          department={ccfDepartment}
                          municipality={ccfMunicipality}
                          district={ccfDistrict}
                          onDepartmentChange={setCcfDepartment}
                          onMunicipalityChange={setCcfMunicipality}
                          onDistrictChange={setCcfDistrict}
                          required
                          showCountry={false}
                          inputClassName={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-medium mb-1">Dirección fiscal *</label>
                        <input
                          type="text"
                          value={ccfFiscalAddress}
                          onChange={(e) => setCcfFiscalAddress(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <EconomicActivityCombobox
                        value={ccfGiro}
                        onChange={setCcfGiro}
                        inputClassName={inputCls}
                      />
                      {ccfEditUnlocked ? (
                        <button
                          type="button"
                          onClick={() => setCcfEditUnlocked(false)}
                          className="text-sm font-medium text-slate-600 underline underline-offset-2"
                        >
                          Cancelar edición
                        </button>
                      ) : null}
                    </div>
                    ) : null
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleContinueStep1}
                  disabled={
                    duiBlockedByOtherAccount ||
                    (documentType === 'DUI' && duiUniqueStatus !== 'available') ||
                    (!isAuthenticated && emailExists !== true && !acceptsTerms)
                  }
                  className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  Continuar
                </button>
              </div>
            ) : step1Complete ? (
              <p className="text-sm text-gray-600 pt-1">
                {fullRecipientName} · {email} · {phoneRegion}{shippingPhone} · {documentType} {documentNumber}
              </p>
            ) : null}
          </section>

          {/* PASO 2 */}
          <section className="space-y-4">
            {stepHeader(2, 'Método de entrega')}
            {step === 2 ? (
              <div className="space-y-5 pt-2 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('shipping');
                      setShippingCost((prev) => (prev === 0 ? SHIPPING_FALLBACK : prev));
                    }}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                      deliveryMethod === 'shipping' ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Truck className="w-5 h-5 shrink-0" />
                    <span>
                      <span className="block text-sm font-bold">Envío a domicilio</span>
                      <span className="block text-xs text-gray-500">Cotización por peso del pedido</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                      deliveryMethod === 'pickup' ? 'border-black bg-slate-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Store className="w-5 h-5 shrink-0" />
                    <span>
                      <span className="block text-sm font-bold">Recoger en tienda</span>
                      <span className="block text-xs text-gray-500">Envío $0.00 · retiro en sucursal</span>
                    </span>
                  </button>
                </div>

                {deliveryMethod === 'shipping' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[13px] font-medium mb-1">Dirección completa de envío</label>
                      <input type="text" value={shippingLine1} onChange={(e) => setShippingLine1(e.target.value)} className={inputCls} required />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium mb-1">Referencia del lugar (opcional)</label>
                      <input type="text" value={shippingLine2} onChange={(e) => setShippingLine2(e.target.value)} className={inputCls} />
                    </div>
                    <ElSalvadorGeoSelects
                      idPrefix="shipping"
                      department={shippingState}
                      municipality={shippingCity}
                      district={shippingDistrict}
                      onDepartmentChange={setShippingState}
                      onMunicipalityChange={setShippingCity}
                      onDistrictChange={setShippingDistrict}
                      required
                      inputClassName={inputCls}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loadingPickupStores ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando sucursales…
                      </div>
                    ) : selectedPickupStore ? (
                      <div className="relative rounded-lg border-2 border-black bg-neutral-50/50 shadow-sm transition-all p-4 pr-28">
                        <span className="absolute top-4 right-4 bg-black text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" strokeWidth={3} />
                          Seleccionada
                        </span>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">{storeDisplayName(selectedPickupStore)}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{selectedPickupStore.address}</p>
                            <p className="text-xs text-gray-500">{selectedPickupStore.city}</p>
                            {selectedPickupStore.pickup_time_frame ? (
                              <p className="text-xs text-gray-600 mt-2">{selectedPickupStore.pickup_time_frame}</p>
                            ) : null}
                            {selectedPickupStore.distance_km != null ? (
                              <p className="text-xs font-medium mt-1">{selectedPickupStore.distance_km.toFixed(1)} km de ti</p>
                            ) : null}
                          </div>
                        </div>
                        {pickupStores.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setPickupModalOpen(true)}
                            className="mt-3 text-sm font-medium underline text-slate-800 hover:text-black"
                          >
                            Ver todas las opciones de retiro ({pickupStores.length})
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                        No hay sucursales disponibles para retiro en tienda.
                      </p>
                    )}
                  </div>
                )}

                {!needsCcf ? (
                  <div className="pt-2 border-t border-gray-100 space-y-3">
                    {requireSeparateBilling ? (
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">
                        Dirección de facturación (requerida).
                      </p>
                    ) : (
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={billingSame}
                          onChange={(e) => setBillingSame(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        La dirección de facturación es la misma que la de envío
                      </label>
                    )}
                    {requireSeparateBilling || !billingSame ? (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-medium mb-1">Nombre facturación</label>
                            <input
                              type="text"
                              value={billRecipient}
                              onChange={(e) => setBillRecipient(e.target.value)}
                              className={inputCls}
                              required={requireSeparateBilling || !billingSame}
                            />
                          </div>
                          <div>
                            <label className="block text-[13px] font-medium mb-1">Teléfono</label>
                            <input
                              type="tel"
                              value={billPhone}
                              onChange={(e) => setBillPhone(e.target.value)}
                              className={inputCls}
                              required={requireSeparateBilling || !billingSame}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[13px] font-medium mb-1">Dirección</label>
                          <input
                            type="text"
                            value={billLine1}
                            onChange={(e) => setBillLine1(e.target.value)}
                            className={inputCls}
                            required={requireSeparateBilling || !billingSame}
                          />
                        </div>
                        <ElSalvadorGeoSelects
                          idPrefix="billing"
                          department={billState}
                          municipality={billCity}
                          district={billDistrict}
                          onDepartmentChange={setBillState}
                          onMunicipalityChange={setBillCity}
                          onDistrictChange={setBillDistrict}
                          required={requireSeparateBilling || !billingSame}
                          inputClassName={inputCls}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleContinueStep2}
                  className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-sm text-sm font-medium hover:bg-zinc-800"
                >
                  Continuar al pago
                </button>
              </div>
            ) : step > 2 && step2Complete ? (
              <p className="text-sm text-gray-600 pt-1">
                {deliveryMethod === 'pickup'
                  ? `Retiro · ${selectedPickupStore ? storeDisplayName(selectedPickupStore) : 'Tienda'}`
                  : `Envío · ${shippingLine1}, ${shippingCity}`}
              </p>
            ) : null}
          </section>

          {/* PASO 3 */}
          <section className={`space-y-4 ${!paymentUnlocked ? 'opacity-50 pointer-events-none' : ''}`}>
            {stepHeader(3, 'Pago con tarjeta')}
            {step === 3 && paymentUnlocked ? (
              <div className="space-y-4 pt-2 animate-in fade-in">
                <p className="text-xs text-gray-500">
                  Los datos de la tarjeta se envían al servidor solo para esta transacción; no se guardan en el
                  navegador.
                </p>
                <div>
                  <label className="block text-[13px] font-medium mb-1">Nombre del titular</label>
                  <input
                    type="text"
                    autoComplete="cc-name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1">Número de tarjeta</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardPan}
                    onChange={(e) => setCardPan(digitsOnlyPan(e.target.value))}
                    className={`${inputCls} tracking-wider`}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1">Expira (MM/AA)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={cardExpiration}
                      onChange={(e) => setCardExpiration(formatExpiryDigits(e.target.value))}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1">CVV</label>
                    <input
                      type="password"
                      autoComplete="cc-csc"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white py-4 rounded-sm font-medium hover:bg-zinc-800 transition disabled:opacity-60"
                >
                  {submitting ? 'Procesando…' : `Pagar $${orderTotal.toFixed(2)}`}
                </button>
              </div>
            ) : !paymentUnlocked ? (
              <p className="text-xs text-gray-500 pt-1">Completa los pasos 1 y 2 para habilitar el pago.</p>
            ) : null}
          </section>
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 bg-[#f5f5f5] border border-gray-200 rounded-md p-5 space-y-4">
            <h2 className="text-lg font-bold">Resumen del pedido</h2>
            <ul className="divide-y divide-gray-200/80">
              {displayLines.map((item) => (
                <li key={item.cart_key ?? `${item.id}-${item.size ?? ''}`} className="flex gap-3 py-3 first:pt-0">
                  <div className="w-16 h-16 bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
                    <img
                      src={resolveShopProductImageSrc(item.image)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={handleShopProductImageError}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{item.name}</p>
                    {item.variant_label ? <p className="text-xs text-gray-500 mt-0.5">{item.variant_label}</p> : null}
                    {item.size ? <p className="text-xs text-gray-500 mt-0.5">Talla {item.size}</p> : null}
                    <p className="text-sm mt-1">
                      ${Number(item.price).toFixed(2)} × {item.quantity || 1}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {deliveryMethod === 'pickup' ? 'Envío (retiro en tienda)' : 'Envío'}
                </span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {typeof window !== 'undefined' && threeDsModal ? createPortal(threeDsModal, document.body) : null}
      {typeof window !== 'undefined' && pickupModal ? createPortal(pickupModal, document.body) : null}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1100px] mx-auto px-4 py-20 font-sans text-center text-gray-600">Cargando checkout…</div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
