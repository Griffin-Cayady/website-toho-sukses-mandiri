'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductsView from '@/views/ProductsView';
import CategoryNotFound from '@/components/CategoryNotFound';
import { useCatalog } from '@/contexts/CatalogContext.jsx';

const ALL = 'All';

// Body of /merk/?id=<id>, the one page for every merk: the catalogue locked to that merk's products in every category.
// `id` is undefined while the URL has not been read yet (prerendered HTML), and null when ?id= is missing.
const MerkView = ({ id, category = ALL }) => {
  const { merks, loading } = useCatalog();
  const merk = id ? merks.find((m) => String(m.id) === id) : null;

  useEffect(() => {
    if (merk) document.title = `${merk.name} | Toho Sukses Mandiri`;
  }, [merk]);

  if (id === null || (id && !loading && !merk)) {
    return <CategoryNotFound title="Brand tidak ditemukan" text="Brand ini tidak tersedia atau sudah dihapus. Lihat semua produk kami di katalog." />;
  }

  return <ProductsView merkId={id ?? ''} category={category} />;
};

export default MerkView;

// Reads ?id= and ?kategori= from the URL. Rendered inside <Suspense> so the page can still be prerendered.
export const MerkViewFromUrl = () => {
  const searchParams = useSearchParams();
  return <MerkView id={searchParams.get('id')} category={searchParams.get('kategori') || ALL} />;
};
