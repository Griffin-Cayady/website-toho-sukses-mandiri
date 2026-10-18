import { Suspense } from 'react';
import CategoryView, { CategoryViewFromUrl } from '@/views/CategoryView';

// One page for every category in tbl_product_category that has no designed page: /kategori/?id=<id>.
// It is built once; the category is looked up in the browser, so a new row in the table works without a rebuild.
export const metadata = {
  title: 'Kategori Produk | Toho Sukses Mandiri',
  description: 'Katalog produk per kategori dari CV Toho Sukses Mandiri.',
};

export default function CategoryPage() {
  return (
    <Suspense fallback={<CategoryView />}>
      <CategoryViewFromUrl />
    </Suspense>
  );
}
