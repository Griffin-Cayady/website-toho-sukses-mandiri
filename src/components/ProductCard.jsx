'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import ProductDetailDialog from '@/components/ProductDetailDialog';
import { useSupabase } from '@/contexts/SupabaseContext.jsx';
import { packBadge, packLine } from '@/lib/productInfo';

// Without `onQuoteRequest` the quote button links to the home page contact form, which reads
// ?divisi= and ?produk= to preselect the category and prefill the message.
// Clicking the photo or name opens the product detail pop-up.
const ProductCard = ({ product, imageAlt, showDivision = false, onQuoteRequest }) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const { divisionOf } = useSupabase();
  const division = divisionOf(product);

  // Works for any product so the detail pop-up can quote whichever size or related item it is showing.
  const quoteButton = (item, className, onBeforeQuote) => {
    const quoteHref = `/?${new URLSearchParams({ divisi: divisionOf(item).slug, produk: item.name })}#contact-us`;
    const label = (
      <>
        Minta penawaran
        <ArrowRightIcon className="hidden h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 sm:block" weight="bold" aria-hidden="true" />
      </>
    );
    return onQuoteRequest ? (
      <Button
        variant="outline"
        onClick={() => {
          onBeforeQuote?.();
          onQuoteRequest(item);
        }}
        className={className}
      >
        {label}
      </Button>
    ) : (
      <Button asChild variant="outline" className={className}>
        <Link href={quoteHref} onClick={onBeforeQuote}>{label}</Link>
      </Button>
    );
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-gray-300/80 transition-[box-shadow,transform] duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-lift hover:ring-brand-300">
      <button
        type="button"
        onClick={() => setDetailOpen(true)}
        aria-haspopup="dialog"
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden border-b border-gray-200/80 bg-gradient-to-b from-gray-50 to-gray-100/70">
          <span className="absolute left-2.5 top-2.5 z-raised rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gray-700 ring-1 ring-gray-200 md:left-3 md:top-3">
            {packBadge(product)}
          </span>
          <span className="absolute bottom-2.5 right-2.5 z-raised hidden rounded-md bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block md:bottom-3 md:right-3" aria-hidden="true">
            Lihat detail
          </span>
          <img
            src={product.imageUrl}
            alt={imageAlt || `${product.name}, ${packLine(product).toLowerCase()}`}
            loading="lazy"
            className="h-full w-full object-contain p-5 transition-transform duration-500 ease-out-expo group-hover:scale-105 md:p-7"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = division.placeholder; }}
          />
        </span>

        <span className="block px-3 pt-3 md:px-5 md:pt-5">
          <span className="block truncate text-[11px] font-medium text-brand-700 md:text-xs">
            {showDivision ? `${division.name} · ${product.category}` : product.category}
          </span>
          <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-snug text-gray-900 md:text-base">{product.name}</span>
          <span className="mt-1 hidden text-sm text-gray-500 md:block">{packLine(product)}</span>
        </span>
      </button>

      <div className="mt-auto p-3 pt-3 md:p-5 md:pt-5">
        {quoteButton(product, 'h-9 w-full px-2 text-xs group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white md:h-10 md:text-sm')}
      </div>

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
