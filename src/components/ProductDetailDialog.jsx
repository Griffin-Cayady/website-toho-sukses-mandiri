'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  DropIcon,
  PackageIcon,
  SquaresFourIcon,
  TagIcon,
  WhatsappLogoIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/contexts/CatalogContext.jsx';
import { whatsappLink } from '@/lib/company';
import { packLine, packName, productInfo } from '@/lib/productInfo';
import { cn } from '@/lib/utils';

// One slide per product photo (product_image_1..5, empty ones already skipped).
// A product with no photos shows a single placeholder slide.
const slidesFor = (product) => {
  if (product.gallery?.length) return product.gallery.map((src, i) => ({ src, alt: `${product.name}, foto ${i + 1}`, contain: true }));
  return [{ src: product.imageUrl, alt: product.spec || product.quantity ? `${product.name}, ${packLine(product).toLowerCase()}` : product.name, contain: true }];
};

// Fine dot grid behind the photo, the same texture as the navigation's "Produk" panel.
const DOTS = 'bg-[radial-gradient(rgb(116_200_116/0.3)_1px,transparent_1.5px)] [background-size:18px_18px]';

const Carousel = ({ slides, fallback }) => {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const many = slides.length > 1;

  const goTo = (i) => {
    const track = trackRef.current;
    const next = (i + slides.length) % slides.length;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track?.scrollTo({ left: next * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* The stage: a soft green glow from below and a dot grid fading toward the edges, so the packaging sits on a lit surface. */}
      <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,theme(colors.brand.100),theme(colors.brand.50)_45%,white)] ring-1 ring-inset ring-brand-100">
        <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]', DOTS)} />
        <div
          ref={trackRef}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar relative flex snap-x snap-mandatory overflow-x-auto"
          role="region"
          aria-roledescription="carousel"
          aria-label="Foto produk"
        >
          {slides.map((slide, i) => (
            <div
              key={slide.src + i}
              // Shorter on phones so the details start within the first screen.
              className="aspect-[4/3] w-full shrink-0 snap-center sm:aspect-square"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${slides.length}`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className={cn('h-full w-full drop-shadow-[0_18px_24px_rgb(14_40_18/0.18)]', slide.contain ? 'object-contain p-6 sm:p-10' : 'object-cover')}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
              />
            </div>
          ))}
        </div>

        {many && (
          <>
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold tabular-nums text-gray-700 shadow-soft ring-1 ring-gray-200" aria-hidden="true">
              {index + 1} / {slides.length}
            </span>
            {[
              { dir: -1, label: 'Foto sebelumnya', Icon: CaretLeftIcon, side: 'left-3' },
              { dir: 1, label: 'Foto berikutnya', Icon: CaretRightIcon, side: 'right-3' },
            ].map(({ dir, label, Icon, side }) => (
              <button
                key={dir}
                type="button"
                onClick={() => goTo(index + dir)}
                aria-label={label}
                className={cn(
                  'absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-soft ring-1 ring-gray-200 backdrop-blur-sm transition-[background-color,transform] duration-200 hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:flex',
                  side
                )}
              >
                <Icon className="h-4 w-4" weight="bold" aria-hidden="true" />
              </button>
            ))}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2 py-1.5 backdrop-blur-sm" aria-hidden="true">
              {slides.map((slide, i) => (
                <span key={slide.src + i} className={cn('h-1.5 rounded-full transition-all duration-300', i === index ? 'w-5 bg-brand-600' : 'w-1.5 bg-gray-300')} />
              ))}
            </div>
          </>
        )}
      </div>

      {many && (
        <div className="flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.src + i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Tampilkan foto ${i + 1}`}
              aria-current={i === index || undefined}
              className={cn(
                'h-16 w-16 overflow-hidden rounded-lg bg-brand-50 ring-2 transition-[box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-brand-600',
                i === index ? 'ring-brand-600' : 'opacity-60 ring-transparent hover:opacity-100'
              )}
            >
              <img src={slide.src} alt="" className={cn('h-full w-full', slide.contain ? 'object-contain p-1.5' : 'object-cover')} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Section heading with a hairline running to the edge, so each block reads as its own chapter of the datasheet.
const SectionTitle = ({ id, children }) => (
  <h3 id={id} className="flex items-center gap-3 text-sm font-semibold text-gray-900">
    {children}
    <span className="h-px flex-1 bg-gray-200" aria-hidden="true" />
  </h3>
);

// Modal product detail built on the native <dialog> (focus trap, Esc to close and top-layer stacking for free).
// Portalled to <body> so hovering it does not trigger the product card's hover styles.
// `renderQuote(product, className, onBeforeQuote)` renders the card's quote button for whichever product is shown.
const ProductDetailDialog = ({ product: initialProduct, onClose, renderQuote }) => {
  const dialogRef = useRef(null);
  const { products, merks, divisionOf } = useCatalog();
  const [product, setProduct] = useState(initialProduct);

  const division = divisionOf(product);
  const { description } = productInfo(product);
  // The product's tbl_master_merk row (product_merk), for its name.
  const merk = merks.find((m) => m.id === product.merkId) ?? null;
  // Rows without a size (product_size NULL) show no pack rather than "Pail undefined L".
  const hasPack = (item) => Boolean(item.spec || item.quantity);
  const pack = hasPack(product) ? packName(product) : null;

  // Same product in other pack sizes.
  const sizes = products
    .filter((p) => p.name === product.name && hasPack(p))
    .sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

  // The specification table; rows with no value are left out.
  const specs = [
    merk && { label: 'Brand', value: merk.name, Icon: TagIcon },
    { label: 'Kategori', value: division.name, Icon: SquaresFourIcon },
    product.category && { label: 'Tipe produk', value: product.category, Icon: DropIcon },
    pack && { label: product.spec ? 'Spesifikasi' : 'Kemasan', value: pack, Icon: PackageIcon },
  ].filter(Boolean);

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
      aria-labelledby="product-dialog-title"
      className="product-dialog mb-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-white p-0 text-gray-900 shadow-lift backdrop:bg-gray-950/60 backdrop:backdrop-blur-sm sm:m-auto sm:max-h-[90dvh] sm:w-[calc(100%-3rem)] sm:max-w-6xl sm:rounded-3xl"
    >
      <div className="relative flex max-h-[inherit] flex-col">
        <button
          type="button"
          onClick={close}
          aria-label="Tutup detail produk"
          className="absolute right-3 top-3 z-raised flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-soft ring-1 ring-gray-200 transition-[background-color,transform] duration-200 hover:bg-gray-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:right-4 sm:top-4"
        >
          <XIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
        </button>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-12 lg:gap-12 lg:p-10">
            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-0">
                <Carousel key={product.id} slides={slidesFor(product)} fallback={division.placeholder} />
              </div>
            </div>

            <div className="flex flex-col gap-8 lg:col-span-6">
              {/* 1. Header: product type (product_type_1), the name, then product_description when there is one. */}
              <header className="pr-12">
                {product.category && <p className="text-sm font-semibold text-brand-700">{product.category}</p>}
                <h2 id="product-dialog-title" className="mt-2 text-3xl font-extrabold leading-[1.1] tracking-tight [text-wrap:balance] md:text-[2.5rem]">
                  {product.name}
                </h2>
                {description && (
                  <p className="mt-4 max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-gray-700 [text-wrap:pretty]">{description}</p>
                )}
              </header>

              {/* 2. Pack sizes: every row with this name is one size (product_size); picking one shows that row. */}
              {pack && (
                <section aria-labelledby="product-sizes">
                  <SectionTitle id="product-sizes">Pilihan kemasan</SectionTitle>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="product-sizes">
                    {sizes.map((size) => {
                      const active = size.id === product.id;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => !active && setProduct(size)}
                          aria-pressed={active}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold tabular-nums ring-1 transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                            // brand-700 rather than the bright action green: white 14px text needs 4.5:1 (5.5:1 here, 3.5:1 on action).
                            active ? 'bg-brand-700 text-white ring-brand-700 shadow-soft' : 'bg-white text-gray-700 ring-gray-300 hover:bg-brand-50 hover:ring-brand-600'
                          )}
                        >
                          {active && <CheckIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />}
                          {packName(size)}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. Specification table: merk (product_merk -> tbl_master_merk), category, product type, pack. */}
              <section aria-labelledby="product-specs">
                <SectionTitle id="product-specs">Spesifikasi</SectionTitle>
                {/* A datasheet plate: soft green tint with the photo stage's dot grid, an icon per row, dashed rules between
                    rows and the values right-aligned; a row lights up white on hover. */}
                <div className="relative mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-50/60 p-1.5 ring-1 ring-inset ring-brand-100">
                  <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_left,black,transparent_70%)]', DOTS)} />
                  <table className="relative w-full text-sm">
                    <tbody className="divide-y divide-dashed divide-brand-200/70">
                      {specs.map(({ label, value, Icon }) => (
                        <tr key={label} className="transition-colors duration-200 hover:bg-white/80">
                          <th scope="row" className="rounded-l-xl py-3 pl-2.5 pr-3 text-left font-medium text-gray-600">
                            <span className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 shadow-soft ring-1 ring-brand-100" aria-hidden="true">
                                <Icon className="h-4 w-4" weight="duotone" />
                              </span>
                              {label}
                            </span>
                          </th>
                          <td className="rounded-r-xl py-3 pl-3 pr-3.5 text-right font-semibold tabular-nums tracking-tight text-gray-950">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* 4. Actions, in reach while the details scroll: the quote goes to the home page contact form (prefilled with this
            product), WhatsApp opens a chat with the product named. */}
        <div className="border-t border-gray-200 bg-white px-5 py-4 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
            {renderQuote(product, 'w-full sm:w-auto', onClose)}
            <Button asChild variant="outline">
              <a
                href={whatsappLink(`Halo Admin CV.Toho Sukses Mandiri, saya ingin bertanya tentang produk ${product.name}${pack ? ` (${pack})` : ''}.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsappLogoIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
                <span className="sm:hidden">WhatsApp</span>
                <span className="hidden sm:inline">Tanya via WhatsApp</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  );
};

export default ProductDetailDialog;
