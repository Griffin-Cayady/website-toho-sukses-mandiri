'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductsView from '@/views/ProductsView';
import CategoryNotFound from '@/components/CategoryNotFound';
import OilHighlights from '@/components/OilHighlights';
import { useSupabase } from '@/contexts/SupabaseContext.jsx';
import { OIL_CATEGORY_ID } from '@/lib/divisions';

const ALL = 'All';

// Body of /kategori/?id=<id>, the one page for every category: the catalogue locked to that category.
// `id` is undefined while the URL has not been read yet (prerendered HTML), and null when ?id= is missing.
const CategoryView = ({ id, category = ALL }) => {
  const { divisions, loading } = useSupabase();
  const division = id ? divisions.find((d) => String(d.categoryId) === id) : null;

  useEffect(() => {
    if (division) document.title = `${division.name} | Toho Sukses Mandiri`;
  }, [division]);

  if (id === null || (id && !loading && !division)) {
    return <CategoryNotFound />;
  }

  // Until the category table loads, ProductsView shows its loading state for this slug.
  return (
    <>
      {id === String(OIL_CATEGORY_ID) && <OilHighlights />}
      <ProductsView division={division?.slug || `kategori-${id ?? ''}`} category={category} />
    </>
  );
};

export default CategoryView;

// Reads ?id= and ?kategori= from the URL. Rendered inside <Suspense> so the page can still be prerendered.
export const CategoryViewFromUrl = () => {
  const searchParams = useSearchParams();
  return <CategoryView id={searchParams.get('id')} category={searchParams.get('kategori') || ALL} />;
};
