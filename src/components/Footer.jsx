import React from 'react';
import Link from 'next/link';
import { COMPANY } from '@/lib/company';
import { cn } from '@/lib/utils';

// Contact details, products and WhatsApp already live in the navbar and the contact section,
// so the footer only carries the brand, the main pages and the legal line.
const footerLinks = [
  { name: 'Beranda', href: '/' },
  { name: 'Produk', href: '/products' },
  { name: 'Tentang kami', href: '/about' },
  { name: 'Hubungi kami', href: '/#contact-us' },
];

const linkClass =
  'rounded-sm text-white/80 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-brand-800';

const Footer = () => (
  <footer className="relative isolate overflow-hidden bg-brand-800 text-white">
    <div className="bg-dots-light pointer-events-none absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />

    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between md:py-14">
        <Link href="/" className="group inline-flex items-center gap-4 self-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-4 focus-visible:ring-offset-brand-800 md:self-auto">
          {/* White badge keeps the grey gear and yellow drop readable on green. */}
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-lift transition-transform duration-300 ease-out-expo group-hover:-rotate-6">
            <img src={COMPANY.logoUrl} alt="" className="h-11 w-11" />
          </span>
          <span>
            <span className="block text-lg font-extrabold leading-tight tracking-tight">{COMPANY.shortName}</span>
            <span className="mt-0.5 block text-sm text-white/70">Distributor & pemasok industri sejak {COMPANY.foundedYear}</span>
          </span>
        </Link>

        {/* All four links stay on one line: spread across the width on phones (slightly smaller text), a tight row from sm. */}
        <nav aria-label="Footer">
          <ul className="flex justify-between gap-x-3 whitespace-nowrap text-sm font-medium sm:justify-start sm:gap-x-7 sm:text-[15px]">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/15 py-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {COMPANY.name}. Hak cipta dilindungi.</p>
        <Link href="/privacy" className={cn(linkClass, 'self-start text-white/65 sm:self-auto')}>Kebijakan privasi</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
