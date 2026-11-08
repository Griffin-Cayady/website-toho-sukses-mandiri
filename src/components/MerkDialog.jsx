'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowRightIcon, DownloadSimpleIcon, PackageIcon, SealCheckIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// The merk's logo (tbl_master_merk.merk_image), whole and centred, or its initial while that column is empty. Put it on a light
// surface: multiply blending drops a JPG's white box into that surface so the logo looks cut out. Decorative: the merk name
// is always printed next to it.
export const MerkLogo = ({ merk, className, initialClassName }) =>
  merk.imageUrl ? (
    <img src={merk.imageUrl} alt="" className={cn('object-contain mix-blend-multiply', className)} loading="lazy" />
  ) : (
    <span className={cn('flex select-none items-center justify-center font-extrabold uppercase leading-none tracking-tighter', className, initialClassName)} aria-hidden="true">
      {merk.name.charAt(0)}
    </span>
  );

// A certification logo (tbl_certification_merk.certification_image) in black, or a seal while that column is empty.
// Logos are meant to be white on transparent, like the ones the oil page uses.
const CertLogo = ({ cert, className }) => (
  <span className={cn('flex shrink-0 items-center justify-center', className)} aria-hidden="true">
    {cert.imageUrl ? (
      // White-on-transparent logos would vanish on the white card, so the #cert-tint filter (in MerkDialog) paints them black.
      // shortcut: a logo uploaded with an opaque background (e.g. a JPG) shows as a solid black square; upload transparent PNG/WebP.
      <img src={cert.imageUrl} alt="" width={160} height={160} className="h-full w-full object-contain [filter:url(#cert-tint)]" loading="lazy" />
    ) : (
      <SealCheckIcon className="h-3/4 w-3/4 text-gray-900" weight="fill" />
    )}
  </span>
);

// Merk pop-up: name and description, the merk's certifications, and the way to its products (/merk/?id=, the catalogue filtered
// to tbl_master_product.product_merk). Built like ProductDetailDialog on the native <dialog> (focus trap, Esc to close, top layer)
// and portalled to <body>.
const MerkDialog = ({ merk, onClose }) => {
  const dialogRef = useRef(null);
  const { certifications } = merk;

  // Rendered only while open: show it as a modal on mount. Unmounting removes it from the top layer.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-labelledby="merk-dialog-title"
      className="product-dialog mb-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-white p-0 text-gray-900 shadow-lift backdrop:bg-gray-950/60 backdrop:backdrop-blur-sm sm:m-auto sm:max-h-[90dvh] sm:w-[calc(100%-3rem)] sm:max-w-2xl sm:rounded-3xl"
    >
      {/* Recolours each certification logo to its shape filled with near-black, the heading colour (CertLogo). */}
      <svg className="absolute h-0 w-0 text-gray-900" aria-hidden="true">
        <filter id="cert-tint" colorInterpolationFilters="sRGB">
          <feFlood floodColor="currentColor" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </svg>
      <div className="flex max-h-[inherit] flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Deep green band with texture (fine diagonal lines like certificate paper, film grain, a soft light at the top right),
              the logo on a white tile so any merk_image stays visible. */}
          <header className="relative isolate overflow-hidden bg-gradient-to-br from-brand-ink via-brand-900 to-brand-950 px-5 pb-6 pt-6 text-white sm:px-8 sm:pb-7 sm:pt-8">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.05)_0_1px,transparent_1px_10px)] [mask-image:linear-gradient(to_left,black,transparent_75%)]" aria-hidden="true" />
            <div className="absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" aria-hidden="true" />
            <div className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.18] mix-blend-overlay" aria-hidden="true" />

            <button
              type="button"
              onClick={close}
              aria-label="Tutup"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20 transition-[background-color,transform] duration-200 hover:bg-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun sm:right-4 sm:top-4"
            >
              <XIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-4 pr-12 sm:gap-6">
              {/* Logo in a glassy bezel: a translucent frame around the white tile, so it sits in the band rather than on it. */}
              <span className="shrink-0 rounded-[1.375rem] bg-white/10 p-1.5 shadow-lift ring-1 ring-inset ring-white/20 backdrop-blur-sm">
                <span className="isolate flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 sm:h-24 sm:w-24">
                  <MerkLogo merk={merk} className="h-full w-full" initialClassName="text-4xl text-brand-ink" />
                </span>
              </span>
              <div className="min-w-0">
                <h2 id="merk-dialog-title" className="break-words text-3xl font-extrabold leading-[1.05] tracking-[-0.025em] [text-wrap:balance] sm:text-[2.5rem]">
                  {merk.name}
                </h2>
                <ul className="mt-3 flex flex-wrap gap-2 text-sm text-brand-100">
                  {[
                    { Icon: PackageIcon, value: merk.count, label: 'produk' },
                    { Icon: SealCheckIcon, value: certifications.length, label: 'sertifikasi' },
                  ].map(({ Icon, value, label }) => (
                    <li key={label} className="inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1 ring-1 ring-inset ring-white/10">
                      <Icon className="h-4 w-4 text-sun" weight="fill" aria-hidden="true" />
                      <span className="font-bold tabular-nums text-white">{value}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </header>

          {/* Light green-grey body with faint grain, so the white certificate cards sit on a surface rather than plain white. */}
          <div className="relative isolate bg-gray-50 px-5 py-6 sm:px-8 sm:py-8">
            <div className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-multiply" aria-hidden="true" />
            {/* space-y on this inner wrapper, so the grain layer above doesn't count as a spaced item. */}
            <div className="space-y-7">
            {/* About the merk: same heading-and-hairline as "Sertifikasi", the text straight on the body surface. */}
            {merk.description && (
              <section aria-labelledby="merk-dialog-about">
                <div className="flex items-center gap-3">
                  <h3 id="merk-dialog-about" className="text-lg font-bold tracking-tight text-gray-900">
                    Tentang {merk.name}
                  </h3>
                  <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
                </div>
                <p className="mt-3 max-w-prose whitespace-pre-line text-base leading-relaxed text-gray-700 [text-wrap:pretty] sm:text-[17px]">
                  {merk.description}
                </p>
              </section>
            )}

            <section aria-labelledby="merk-dialog-certs">
              <div className="flex items-center gap-3">
                <h3 id="merk-dialog-certs" className="text-lg font-bold tracking-tight text-gray-900">Sertifikasi</h3>
                <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
              </div>

              {certifications.length > 0 ? (
                // Certificate cards, one per row.
                <ul className="mt-4 grid gap-3">
                  {certifications.map((cert) => (
                    <li key={cert.id} className="relative isolate flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-soft ring-1 ring-gray-200/80 sm:p-5">
                      <SealCheckIcon className="absolute -bottom-8 -right-8 -z-10 h-32 w-32 text-brand-50" weight="fill" aria-hidden="true" />
                      <div className="flex items-center gap-4">
                        <CertLogo cert={cert} className="h-14 w-14 sm:h-16 sm:w-16" />
                        <div className="min-w-0">
                          <p className="font-bold tabular-nums leading-tight tracking-tight text-gray-900 sm:text-lg">{cert.name}</p>
                          {cert.desc && <p className="mt-1 text-sm leading-snug text-gray-600 [text-wrap:pretty]">{cert.desc}</p>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 flex items-start gap-4 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-inset ring-gray-200">
                  <SealCheckIcon className="mt-0.5 h-6 w-6 shrink-0 text-gray-400" weight="duotone" aria-hidden="true" />
                  <p className="text-[15px] leading-relaxed text-gray-600 [text-wrap:pretty]">
                    Sertifikasi untuk brand ini belum kami cantumkan. Hubungi tim kami bila Anda membutuhkan dokumen sertifikatnya.
                  </p>
                </div>
              )}
            </section>
            </div>
          </div>
        </div>

        {/* The site's main button; the count and name are already in the header, so the label stays short. The catalogue
            download (tbl_master_merk.file_catalog_merk) sits beside it as the second action, only when the merk has one. */}
        <footer className={cn('gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex sm:justify-end sm:px-8', merk.catalogUrl ? 'grid grid-cols-2' : 'flex justify-end')}>
          {merk.catalogUrl && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a href={merk.catalogUrl} target="_blank" rel="noopener noreferrer">
                {/* Phones: the half-width button has no room for the icon (the button clips it), so the label stands alone. */}
                <DownloadSimpleIcon className="hidden h-4 w-4 sm:block" weight="bold" aria-hidden="true" />
                Download Katalog
                <span className="sr-only"> {merk.name} (tab baru)</span>
              </a>
            </Button>
          )}
          <Button asChild className="w-full sm:w-auto">
            <Link href={merk.path} aria-label={`Lihat ${merk.count} produk ${merk.name}`}>
              Lihat produk
              <ArrowRightIcon className="btn-arrow h-4 w-4" weight="bold" aria-hidden="true" />
            </Link>
          </Button>
        </footer>
      </div>
    </dialog>,
    document.body
  );
};

export default MerkDialog;
