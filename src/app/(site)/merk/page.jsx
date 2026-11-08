import { Suspense } from 'react';
import MerkView, { MerkViewFromUrl } from '@/views/MerkView';

// One page for every merk in tbl_master_merk: /merk/?id=<id>.
// It is built once; the merk is looked up in the browser, so a new row in the table works without a rebuild.
export const metadata = {
  title: 'Brand Produk | Toho Sukses Mandiri',
  description: 'Katalog produk per brand dari CV Toho Sukses Mandiri.',
};

export default function MerkPage() {
  return (
    <Suspense fallback={<MerkView />}>
      <MerkViewFromUrl />
    </Suspense>
  );
}
