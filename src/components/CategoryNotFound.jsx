import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// Shown on a category page whose row is not in tbl_product_category.
const CategoryNotFound = () => (
  <section className="mx-auto flex min-h-[60dvh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Kategori tidak ditemukan</h1>
    <p className="mt-4 max-w-lg text-gray-600">Kategori ini tidak tersedia atau sudah dihapus. Lihat semua produk kami di katalog.</p>
    <Button asChild size="lg" className="mt-8">
      <Link href="/products">
        Lihat katalog produk
        <ArrowRightIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
      </Link>
    </Button>
  </section>
);

export default CategoryNotFound;
