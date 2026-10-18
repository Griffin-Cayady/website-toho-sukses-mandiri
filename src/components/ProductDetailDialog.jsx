'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  WhatsappLogoIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useCatalog } from '@/contexts/CatalogContext.jsx';
import { whatsappLink } from '@/lib/company';
import { packLine, packName, productInfo, seriesName } from '@/lib/productInfo';
import { cn } from '@/lib/utils';

// One slide per product photo (product_image_1..5, empty ones already skipped).
// A product with no photos shows a single placeholder slide.
const slidesFor = (product) => {
  if (product.gallery?.length) return product.gallery.map((src, i) => ({ src, alt: `${product.name}, foto ${i + 1}`, contain: true }));
  return [{ src: product.imageUrl, alt: `${product.name}, ${packLine(product).toLowerCase()}`, contain: true }];
};

const Carousel = ({ slides, fallback }) => {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const many = slides.length > 1;

  const goTo = (i) => {
    const track = trackRef.current;
    const next = (i + slides.length) % slides.length;
    track?.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100">
        <div
          ref={trackRef}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
          aria-label="Foto produk"
        >
          {slides.map((slide, i) => (
            <div
              key={slide.src + i}
              className="aspect-square w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${slides.length}`}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className={cn('h-full w-full', slide.contain ? 'object-contain p-8 sm:p-10' : 'object-cover')}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallback; }}
              />
            </div>
          ))}
        </div>

        {many && (
          <>
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
                'h-16 w-16 overflow-hidden rounded-lg bg-gray-50 ring-2 transition-[box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-brand-600',
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

const SectionTitle = ({ children }) => <h3 className="text-sm font-semibold text-gray-900">{children}</h3>;

// Modal product detail built on the native <dialog> (focus trap, Esc to close and top-layer stacking for free).
// Portalled to <body> so hovering it does not trigger the product card's hover styles.
// `renderQuote(product, className, onBeforeQuote)` renders the card's quote button for whichever product is shown.
const ProductDetailDialog = ({ product: initialProduct, onClose, renderQuote }) => {
  const dialogRef = useRef(null);
  const { products, divisionOf } = useCatalog();
  const [product, setProduct] = useState(initialProduct);

  const division = divisionOf(product);
  const { description, uses } = productInfo(product);
  const series = seriesName(product);

  // Same product in other pack sizes.
  const sizes = products.filter((p) => p.name === product.name).sort((a, b) => (b.quantity || 0) - (a.quantity || 0));

  // Rendered only while open: show it as a modal on mount. Unmounting removes it from the top layer.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => dialogRef.current?.close();

  const specs = [
    { label: 'Kategori', value: division.name },
    { label: 'Jenis produk', value: product.category },
    series && { label: 'Seri produk', value: series },
    { label: product.spec ? 'Spesifikasi' : 'Kemasan', value: packName(product) },
  ].filter(Boolean);

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
          className="absolute right-3 top-3 z-raised sm:right-4 sm:top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-soft ring-1 ring-gray-200 transition-[background-color,transform] duration-200 hover:bg-gray-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <XIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
        </button>

        <div className="relative min-h-0 flex-1 overflow-y-auto">

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-12 lg:gap-10 lg:p-10">
            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-0">
                <Carousel key={product.id} slides={slidesFor(product)} fallback={division.placeholder} />
              </div>
            </div>

            <div className="flex flex-col gap-7 lg:col-span-6">
              <div>
                <p className="pr-12 text-sm font-semibold text-brand-700">
                  {division.name} · {product.category}
                </p>
                <h2 id="product-dialog-title" className="mt-2 pr-12 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  {product.name}
                </h2>
                {description && <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-gray-600">{description}</p>}
              </div>

              {sizes.length > 1 && (
                <div>
                  <SectionTitle>Pilihan kemasan</SectionTitle>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Pilihan kemasan">
                    {sizes.map((size) => {
                      const active = size.id === product.id;
                      return (
                        <button
                          key={size.id}
                          type="button"
                          onClick={() => !active && setProduct(size)}
                          aria-pressed={active}
                          className={cn(
                            'rounded-xl px-4 py-2.5 text-sm font-semibold tabular-nums ring-1 transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                            active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-gray-700 ring-gray-300 hover:ring-brand-600'
                          )}
                        >
                          {packName(size)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {uses.length > 0 && (
                <div>
                  <SectionTitle>Cocok untuk</SectionTitle>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {uses.map((use) => (
                      <li key={use} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 ring-1 ring-brand-100">
                        <CheckIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
                        {use}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <SectionTitle>Spesifikasi</SectionTitle>
                <dl className="mt-3 overflow-hidden rounded-xl ring-1 ring-gray-200">
                  {specs.map((row, i) => (
                    <div key={row.label} className={cn('flex justify-between gap-4 px-4 py-3 text-sm', i % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                      <dt className="text-gray-500">{row.label}</dt>
                      <dd className="text-right font-semibold tabular-nums text-gray-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

            </div>
          </div>

        </div>

        {/* Actions stay in reach while the details scroll */}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <p className="hidden min-w-0 text-sm text-gray-600 sm:block">
            <span className="block truncate font-semibold text-gray-900">{product.name}</span>
            {packName(product)}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
            {renderQuote(product, 'h-11 w-full border-brand-600 bg-brand-600 px-5 text-white hover:bg-brand-700 hover:text-white sm:w-auto', onClose)}
            <a
              href={whatsappLink(`Halo Admin CV.Toho Sukses Mandiri, saya ingin bertanya tentang produk ${product.name} (${packName(product)}).`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition-[border-color,color,transform] duration-200 hover:border-brand-600 hover:text-brand-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <WhatsappLogoIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
              <span className="sm:hidden">WhatsApp</span>
              <span className="hidden sm:inline">Tanya via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </dialog>,
    document.body
  );
};

export default ProductDetailDialog;
