import ShippingRateList from '@/components/admin/shipping/ShippingRateList';
import PermissionGate from '@/components/auth/PermissionGate';

export default function ShippingRatesPage() {
  return (
    <PermissionGate permission="view_shipping_rates">
      <ShippingRateList />
    </PermissionGate>
  );
}
