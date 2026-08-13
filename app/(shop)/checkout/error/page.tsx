import Link from 'next/link';

export default function CheckoutErrorPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 font-sans text-center">
      <h1 className="text-2xl font-bold tracking-tight mb-3">No se pudo completar el pago</h1>
      <p className="text-gray-600 text-sm mb-8">
        La transacción no fue aprobada o hubo un error al confirmarla. Puedes intentar de nuevo con otro método o
        contactar a tu banco.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/checkout"
          className="inline-block bg-black text-white px-8 py-3 rounded-sm font-medium hover:bg-zinc-800 transition text-sm"
        >
          Reintentar pago
        </Link>
        <Link href="/cart" className="inline-block border border-gray-300 px-8 py-3 rounded-sm font-medium text-sm hover:bg-gray-50">
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}
