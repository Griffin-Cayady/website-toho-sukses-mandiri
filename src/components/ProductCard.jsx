'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { BUTTON_SHINE, Button } from '@/components/ui/button';
import ProductDetailDialog from '@/components/ProductDetailDialog';
import { useCatalog } from '@/contexts/CatalogContext.jsx';
import { cn } from '@/lib/utils';
import { packLine, packName } from '@/lib/productInfo';

// The card's quote action: a full-width row with a light green arrow chip, built on the ghost Button (no lift: it is flush
// with the card edges). Hovering the card fills the chip green; hovering or focusing the row gives it the main button's
// hover, the site green with the light sweep (BUTTON_SHINE), and the chip turns white.
const CARD_QUOTE = cn(
  'h-11 w-full justify-between gap-2 rounded-none border-t border-gray-100 bg-transparent px-3 text-[13px] font-semibold text-gray-900 md:h-12 md:px-5 md:text-sm',
  'hover:border-brand-action hover:bg-brand-action hover:text-white focus-visible:bg-brand-action focus-visible:text-white',
  'focus-visible:ring-inset focus-visible:ring-white focus-visible:ring-offset-0',
  BUTTON_SHINE
);

// Each tbl_master_product row is one pack size, so "Sugilube AW-68" can appear twice; the pop-up's "Pilihan kemasan" lists
// the sizes. The tag on the photo is the product category. Without `onQuoteRequest` the quote button links to the home page contact form, which reads ?divisi= and ?produk=
// to preselect the category and prefill the message. The name is the card's link to the detail pop-up; its ::after
// stretches over the whole card, so the photo and empty space open it too.
// showMerk / showCategory: off where every card would print the same merk or product type (ProductsView decides).
const ProductCard = ({ product, imageAlt, showMerk = true, showCategory = true, onQuoteRequest }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const { divisionOf } = useCatalog();
  const division = divisionOf(product);
  // Rows without a size (product_size NULL) get no tag rather than "Pail undefined L". Other pack sizes are listed in the
  // detail pop-up ("Pilihan kemasan"), not on the card.
  const pack = product.spec || product.quantity ? packName(product) : null;
  // Product type only; the category is already the tag on the photo.
  const label = showCategory && product.category;

  // Works for any product so the detail pop-up can quote whichever size or related item it is showing. The card passes its
  // own look in `card`; the pop-up passes layout classes for the main button.
  const quoteButton = (item, className, onBeforeQuote, card = false) => {
    const quoteHref = `/?${new URLSearchParams({ divisi: divisionOf(item).slug, produk: item.name })}#contact-us`;
    const content = card ? (
      <>
        Minta penawaran
        {/* ! so the row's own hover (white chip on green) wins over the card's hover (green chip). */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100 transition-colors duration-300 ease-out-expo group-hover:bg-brand-action group-hover:text-white group-hover:ring-transparent group-hover/btn:!bg-white group-hover/btn:!text-brand-700 group-focus-visible/btn:!bg-white group-focus-visible/btn:!text-brand-700">
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 ease-out-expo motion-safe:group-hover/btn:translate-x-0.5" weight="bold" aria-hidden="true" />
        </span>
      </>
    ) : (
      <>
        Minta penawaran
        <ArrowRightIcon className="btn-arrow hidden h-4 w-4 sm:block" weight="bold" aria-hidden="true" />
      </>
    );
    const accessibleName = card ? `Minta penawaran ${item.name}${pack ? `, ${pack}` : ''}` : undefined;
    // The pop-up's quote is the main (green) button; the card's row is drawn on the ghost variant.
    const variant = card ? 'ghost' : 'default';
    return onQuoteRequest ? (
      <Button
        variant={variant}
        aria-label={accessibleName}
        onClick={() => {
          onBeforeQuote?.();
          onQuoteRequest(item);
        }}
        className={className}
      >
        {content}
      </Button>
    ) : (
      <Button asChild variant={variant} className={className}>
        <Link href={quoteHref} onClick={onBeforeQuote} aria-label={accessibleName}>{content}</Link>
      </Button>
    );
  };

  return (
    <article className="group relative isolate flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-gray-200 transition-[box-shadow,transform] duration-300 ease-out-expo hover:shadow-lift hover:ring-brand-600/30 motion-safe:hover:-translate-y-1">
      <span className="relative block aspect-[4/3] w-full overflow-hidden border-b border-gray-100 bg-gradient-to-b from-gray-50 to-gray-100/70">
        <img
          src={product.imageUrl}
          alt={imageAlt || `${product.name}${pack ? `, ${packLine(product).toLowerCase()}` : ''}`}
          loading="lazy"
          className="h-full w-full object-contain p-5 transition-transform duration-500 ease-out-expo motion-safe:group-hover:scale-105 md:p-7"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = division.placeholder; }}
        />
        {/* Product category (tbl_product_category) as a frosted white label on the photo; turns brand green when the card is
            hovered. */}
        {division.name && (
          <span className="absolute left-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold leading-none tracking-tight text-brand-900 shadow-soft ring-1 ring-inset ring-brand-900/10 backdrop-blur-sm transition-colors duration-300 group-hover:bg-brand-action group-hover:text-white group-hover:ring-transparent md:left-3 md:top-3 md:px-2.5 md:py-1.5 md:text-xs">
            {division.name}
          </span>
        )}
      </span>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 md:px-5 md:pb-4 md:pt-4">
        {/* Merk above the name, category · product type under it, stepping down in size: merk, name (largest), then the label. */}
        {showMerk && product.merk && <p className="truncate text-[13px] font-semibold text-brand-700 md:text-sm">{product.merk}</p>}
        <h3 className={cn('line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-gray-950 md:text-[17px]', showMerk && product.merk && 'mt-1')}>
          <button
            type="button"
            onClick={() => setDetailOpen(true)}
            aria-haspopup="dialog"
            className="text-left after:absolute after:inset-0 after:z-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand-600"
          >
            {product.name}
          </button>
        </h3>
        {label && <p className="mt-1 truncate text-xs text-gray-500">{label}</p>}
      </div>

      {/* Above the stretched name link, so it stays its own target. */}
      <div className="relative z-10">{quoteButton(product, CARD_QUOTE, undefined, true)}</div>

      {detailOpen && (
        <ProductDetailDialog
          product={product}
          onClose={() => setDetailOpen(false)}
          renderQuote={quoteButton}
        />
      )}
    </article>
  );
};

export default ProductCard;
