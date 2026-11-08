import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// Shown on a category or merk page whose row does not exist.
const CategoryNotFound = ({
  title = 'Kategori tidak ditemukan',
  text = 'Kategori ini tidak tersedia atau sudah dihapus. Lihat semua produk kami di katalog.',
}) => (
  <section className="mx-auto flex min-h-[60dvh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">{title}</h1>
    <p className="mt-4 max-w-lg text-gray-600">{text}</p>
    <Button asChild size="lg" className="mt-8">
      <Link href="/products">
        Lihat katalog produk
        <ArrowRightIcon className="btn-arrow h-4 w-4" weight="bold" aria-hidden="true" />
      </Link>
    </Button>
  </section>
);

export default CategoryNotFound;
