'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import CouponForm from '@/components/admin/coupons/CouponForm';

export default function EditCouponPage() {
  const { id } = useParams();
  const [coupon, setCoupon] = useState<any>(null);

  useEffect(() => {
    api.get(`/admin/coupons/${id}`).then(res => {
      setCoupon(res.data);
    });
  }, [id]);

  if (!coupon) return <p>Cargando cupón...</p>;

  return (
    <CouponForm
      mode="edit"
      initialData={{
        id: coupon.id,
        code: coupon.code,
        percentage: coupon.percentage,
        starts_at: coupon.starts_at,
        ends_at: coupon.ends_at,
        is_active: Boolean(coupon.is_active),
      }}
    />
  );
}