import { LucideIcon } from 'lucide-react';

interface Address {
  recipient_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  instructions?: string;
}

interface Props {
  title?: string;
  address: Address;
  icon?: LucideIcon;
}

export default function AddressCard({ title, address, icon:Icon }: Props) {
  if (!address) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm">
      {title && (
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-slate-600" />}
          {title}
        </h2>
      )}

      <div className="text-sm text-slate-600 space-y-1">
        {address.recipient_name && (
          <p className="font-medium">
            Destinatario: {address.recipient_name}
          </p>
        )}

        {address.phone && (
          <p className="font-medium">Teléfono: {address.phone}</p>
        )}

        {address.address_line1 && <p>{address.address_line1}</p>}
        {address.address_line2 && <p>{address.address_line2}</p>}

        {(address.city || address.state) && (
          <p>
            {address.city}, {address.state}
          </p>
        )}

        {address.postal_code && (
          <p>CP {address.postal_code}</p>
        )}

        {address.country && <p>{address.country}</p>}

        {address.instructions && (
          <p className="italic text-xs text-slate-500 pt-2">
            {address.instructions}
          </p>
        )}
      </div>
    </div>
  );
}
