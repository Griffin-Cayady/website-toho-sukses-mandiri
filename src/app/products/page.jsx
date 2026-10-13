import { Suspense } from 'react';
import ProductsView, { ProductsViewFromUrl } from '@/views/ProductsView';

export const metadata = {
  title: 'Katalog Produk | Toho Sukses Mandiri',
  description: 'Katalog produk CV Toho Sukses Mandiri. Telusuri per kategori atau cari berdasarkan nama dan jenis produk.',
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsView />}>
      <ProductsViewFromUrl />
    </Suspense>
  );
}
