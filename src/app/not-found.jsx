import Link from 'next/link';
import { ArrowRightIcon, HouseIcon, PhoneIcon } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { COMPANY } from '@/lib/company';

export const metadata = {
  title: 'Halaman tidak ditemukan | Toho Sukses Mandiri',
};

export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="bg-dots pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden="true" />
      <div className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <p className="text-sm font-semibold tabular-nums text-brand-700">Error 404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">Halaman tidak ditemukan</h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">
          Alamat yang Anda buka tidak tersedia atau sudah dipindahkan. Lanjutkan ke katalog produk, atau kembali ke beranda.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/products">
              Lihat katalog produk
              <ArrowRightIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <HouseIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
              Ke beranda
            </Link>
          </Button>
        </div>
        <a href={COMPANY.phoneHref} className="mt-10 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-brand-700">
          <PhoneIcon className="h-4 w-4" aria-hidden="true" />
          Butuh bantuan? Telepon <span className="font-medium tabular-nums">{COMPANY.phoneDisplay}</span>
        </a>
      </div>
    </section>
  );
}
