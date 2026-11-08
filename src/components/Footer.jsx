'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { EnvelopeSimpleIcon, MapPinIcon, PhoneIcon } from '@phosphor-icons/react';
import { COMPANY } from '@/lib/company';
import { categoryPath } from '@/lib/divisions';
import { useCatalog } from '@/contexts/CatalogContext.jsx';
import { cn } from '@/lib/utils';

const companyLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Tentang kami', href: '/about' },
  { name: 'Semua produk', href: '/products' },
  { name: 'Hubungi kami', href: '/#contact-us' },
];

const focusRing = 'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950';
const linkClass = cn('text-white/70 transition-colors duration-200 hover:text-white', focusRing);

const Column = ({ title, className, children }) => (
  <div className={className}>
    <h2 className="text-sm font-semibold text-white">{title}</h2>
    <div className="mt-5">{children}</div>
  </div>
);

const ContactItem = ({ icon: Icon, label, children }) => (
  <li className="flex gap-3">
    <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-white/45" aria-hidden="true" />
    <div className="min-w-0">
      <p className="text-xs font-medium text-white/50">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  </li>
);

const Footer = () => {
  const { products, divisions } = useCatalog();
  // Same rule as the navbar menu: only categories with active products, so no link leads to an empty page.
  const productLinks = useMemo(() => {
    const used = new Set(products.map((p) => p.categoryId));
    return divisions.filter((d) => used.has(d.categoryId));
  }, [products, divisions]);

  return (
    <footer className="relative isolate overflow-hidden bg-brand-950 text-white">
      {/* One soft green light from the top left, and fine grain so the dark green isn't a flat fill. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_0%,theme(colors.brand.ink/55%),transparent_70%)]" />
        <div className="bg-grain absolute inset-0 opacity-[0.14] mix-blend-overlay" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 pb-14 pt-16 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" className={cn('group inline-flex items-center gap-3.5 rounded-xl', focusRing)}>
              {/* White badge keeps the grey gear and yellow drop readable on green. */}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white transition-transform duration-300 ease-out-expo group-hover:-rotate-6">
                <img src={COMPANY.logoUrl} alt="" className="h-9 w-9" />
              </span>
              <span>
                <span className="block text-[17px] font-extrabold leading-tight tracking-tight">{COMPANY.shortName}</span>
                <span className="mt-0.5 block text-[13px] text-white/60">Sejak {COMPANY.foundedYear} · Jakarta</span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-pretty text-[15px] leading-relaxed text-white/70">
              Distributor dan pemasok kebutuhan industri untuk pabrik, galangan kapal, dan perkebunan, dari Jakarta ke seluruh Indonesia.
            </p>
          </div>

          <Column title="Produk" className="lg:col-span-2 lg:col-start-6">
            <ul className="space-y-3 text-[15px]">
              {productLinks.map((d) => (
                <li key={d.categoryId}>
                  <Link href={categoryPath(d.categoryId)} className={linkClass}>{d.name}</Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Perusahaan" className="lg:col-span-2">
            <ul className="space-y-3 text-[15px]">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Kontak" className="col-span-2 lg:col-span-3">
            <ul className="space-y-5 text-[15px]">
              <ContactItem icon={MapPinIcon} label="Kantor">
                <a href={COMPANY.mapsUrl} target="_blank" rel="noopener noreferrer" className={cn(linkClass, 'text-pretty leading-snug')}>
                  {COMPANY.address}
                  <span className="sr-only"> (buka di Google Maps, tab baru)</span>
                </a>
              </ContactItem>
              <ContactItem icon={PhoneIcon} label="Telepon">
                <a href={COMPANY.phoneHref} className={cn(linkClass, 'tabular-nums')}>{COMPANY.phoneDisplay}</a>
              </ContactItem>
              <ContactItem icon={EnvelopeSimpleIcon} label="Email">
                <a href={`mailto:${COMPANY.email}`} className={cn(linkClass, 'break-all')}>{COMPANY.email}</a>
              </ContactItem>
            </ul>
          </Column>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-[13px] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Hak cipta dilindungi.</p>
          <Link href="/privacy" className={cn(linkClass, 'self-start text-white/55 sm:self-auto')}>Kebijakan privasi</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
