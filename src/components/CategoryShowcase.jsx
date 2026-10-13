'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CaretDownIcon } from '@phosphor-icons/react';
import Reveal from '@/components/Reveal';
import IndexScrollbar from '@/components/IndexScrollbar';
import { useSupabase } from '@/contexts/SupabaseContext.jsx';
import { cn } from '@/lib/utils';

// Category index rows (wide screens): every row has the same height, and the list shows at most this many before it
// scrolls, so the block keeps the same height however many categories there are.
const CATEGORY_ROWS_VISIBLE = 6;
const CATEGORY_ROW_REM = 5.5;

/**
 * The product categories, one per tbl_product_category row (home and About pages). Wide screens: a large photo panel
 * that follows the hovered or focused row of the numbered index beside it. Small screens: a swipeable row of photo cards.
 */
const CategoryShowcase = () => {
  const { products, divisions, loading } = useSupabase();

  // Active products per tbl_product_category.id.
  const categoryCounts = useMemo(
    () => products.reduce((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] || 0) + 1 }), {}),
    [products]
  );

  // Category shown in the large photo panel (wide screens): follows the hovered or focused index row.
  const [activeCategory, setActiveCategory] = useState(0);
  // More than CATEGORY_ROWS_VISIBLE categories: the index scrolls. `indexMetrics` (its scroll position and sizes)
  // drives the branded scrollbar, the edge fades and the scroll hint.
  const indexScrolls = divisions.length > CATEGORY_ROWS_VISIBLE;
  const indexListRef = useRef(null);
  const [indexMetrics, setIndexMetrics] = useState({ top: 0, client: 1, height: 1 });
  const measureIndex = useCallback(() => {
    const list = indexListRef.current;
    if (list) setIndexMetrics({ top: list.scrollTop, client: list.clientHeight, height: list.scrollHeight });
  }, []);
  useEffect(() => {
    const list = indexListRef.current;
    if (!indexScrolls || !list) return undefined;
    measureIndex();
    const observer = new ResizeObserver(measureIndex);
    observer.observe(list);
    return () => observer.disconnect();
  }, [indexScrolls, divisions.length, measureIndex]);
  const indexEdges = {
    top: indexMetrics.top <= 4,
    bottom: indexMetrics.top + indexMetrics.client >= indexMetrics.height - 4,
  };
  const hiddenCategories = Math.max(0, divisions.length - CATEGORY_ROWS_VISIBLE);
  const activeIndex = Math.max(0, Math.min(activeCategory, divisions.length - 1));
  const activeDivision = divisions[activeIndex];
  const activeCount = activeDivision ? categoryCounts[activeDivision.categoryId] || 0 : 0;

  return (
    <>
      {loading && (
        <div aria-busy="true" className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-gray-100 sm:aspect-[16/10] lg:col-span-7 lg:aspect-auto lg:min-h-[34rem]" />
          <div className="hidden space-y-3 lg:col-span-5 lg:block">
            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
          </div>
        </div>
      )}

      {!loading && divisions.length > 0 && (
        <>
          {/* Wide screens: preview panel + index */}
          <div className="hidden grid-cols-12 gap-10 lg:grid">
            <Reveal className="col-span-7">
              <Link
                href={activeDivision.path}
                tabIndex={-1}
                aria-hidden="true"
                className="group relative isolate block h-full min-h-[34rem] overflow-hidden rounded-3xl bg-gray-900 shadow-lift"
              >
                {divisions.map((division, i) => (
                  <img
                    key={division.slug}
                    src={division.image}
                    alt=""
                    loading="lazy"
                    className={cn(
                      'absolute inset-0 -z-10 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out-expo group-hover:scale-[1.03]',
                      i === activeIndex ? 'opacity-100' : 'scale-105 opacity-0'
                    )}
                  />
                ))}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-gray-950/10" />

                <div className="flex h-full min-h-[34rem] flex-col justify-between p-8 text-white xl:p-10">
                  <div className="flex items-start justify-between gap-6">
                    <span className="text-sm font-semibold tabular-nums text-white/70">
                      <span className="text-white">{String(activeIndex + 1).padStart(2, '0')}</span> / {String(divisions.length).padStart(2, '0')}
                    </span>
                    <span className="rounded-md bg-white/15 px-3 py-1.5 text-sm font-semibold tabular-nums ring-1 ring-inset ring-white/25 backdrop-blur-md">
                      {activeCount ? `${activeCount} produk` : 'Katalog menyusul'}
                    </span>
                  </div>

                  {/* Keyed so the text replays its entry animation when the category changes. */}
                  <div key={activeDivision.slug} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h3 className="text-4xl font-extrabold leading-[1.05] tracking-tight [text-wrap:balance] xl:text-5xl">{activeDivision.name}</h3>
                    {activeDivision.description && (
                      <p className="mt-3 max-w-md text-base leading-relaxed text-white/80 [text-wrap:pretty]">{activeDivision.description}</p>
                    )}
                    <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white">
                      Lihat produk
                      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5" weight="bold" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>

            <div className="col-span-5 flex flex-col justify-center">
              <div className="flex gap-3">
                <ul
                  ref={indexListRef}
                  onScroll={indexScrolls ? measureIndex : undefined}
                  style={indexScrolls ? {
                    maxHeight: `${CATEGORY_ROWS_VISIBLE * CATEGORY_ROW_REM}rem`,
                    // Fade the edge that has more rows beyond it.
                    maskImage: `linear-gradient(to bottom, ${indexEdges.top ? '#000' : 'transparent'}, #000 3rem, #000 calc(100% - 3rem), ${indexEdges.bottom ? '#000' : 'transparent'})`,
                  } : undefined}
                  className={cn('min-w-0 flex-1', indexScrolls && 'no-scrollbar overflow-y-auto overscroll-contain')}
                >
                  {divisions.map((division, i) => {
                    const count = categoryCounts[division.categoryId] || 0;
                    const active = i === activeIndex;
                    return (
                      <Reveal as="li" key={division.slug} delay={i < CATEGORY_ROWS_VISIBLE ? i * 60 : 0}>
                        <Link
                          href={division.path}
                          onMouseEnter={() => setActiveCategory(i)}
                          onFocus={() => setActiveCategory(i)}
                          style={{ height: `${CATEGORY_ROW_REM}rem` }}
                          className={cn(
                            'group relative flex items-center gap-4 rounded-2xl px-4 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
                            active ? 'bg-gray-50' : 'hover:bg-gray-50'
                          )}
                        >
                          {/* Green bar marking the row shown in the panel. */}
                          <span
                            className={cn(
                              'absolute inset-y-4 left-0 w-1 origin-center rounded-full bg-brand-600 transition-transform duration-500 ease-out-expo',
                              active ? 'scale-y-100' : 'scale-y-0'
                            )}
                            aria-hidden="true"
                          />
                          <span className={cn('w-6 shrink-0 text-sm font-semibold tabular-nums transition-colors', active ? 'text-brand-700' : 'text-gray-400')}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-lg font-bold tracking-tight transition-colors xl:text-xl', active ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900')}>
                              {division.name}
                            </span>
                            <span className="mt-0.5 block text-[13px] font-medium tabular-nums text-gray-500">
                              {count ? `${count} produk` : 'Katalog menyusul'}
                            </span>
                          </span>
                          <ArrowRightIcon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-[opacity,transform,color] duration-300 ease-out-expo',
                              active ? 'translate-x-0 text-brand-700 opacity-100' : '-translate-x-2 text-gray-400 opacity-0'
                            )}
                            weight="bold"
                            aria-hidden="true"
                          />
                        </Link>
                      </Reveal>
                    );
                  })}
                </ul>
                {indexScrolls && (
                  <IndexScrollbar listRef={indexListRef} metrics={indexMetrics} labels={divisions.map((d) => d.name)} activeIndex={activeIndex} />
                )}
              </div>
              {indexScrolls && (
                <p
                  className={cn(
                    'mt-3 flex items-center gap-1.5 pl-4 text-[13px] font-medium text-gray-500 transition-opacity duration-300',
                    indexEdges.bottom && 'opacity-0'
                  )}
                  aria-hidden="true"
                >
                  <CaretDownIcon className="h-3.5 w-3.5 animate-bounce" weight="bold" />
                  Gulir untuk {hiddenCategories} kategori lainnya
                </p>
              )}
            </div>
          </div>

          {/* Small screens: swipeable photo cards */}
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:hidden">
            {divisions.map((division, i) => {
              const count = categoryCounts[division.categoryId] || 0;
              return (
                <li key={division.slug} className="w-[82%] shrink-0 snap-start sm:w-[46%]">
                  <Link
                    href={division.path}
                    className="relative isolate flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-3xl bg-gray-900 p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 active:scale-[0.99]"
                  >
                    <img src={division.image} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                    <span className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950/90 via-gray-950/25 to-gray-950/10" aria-hidden="true" />
                    <span className="flex items-center justify-between text-sm font-semibold tabular-nums">
                      <span className="text-white/70">{String(i + 1).padStart(2, '0')}</span>
                      <span className="rounded-md bg-white/15 px-2.5 py-1 ring-1 ring-inset ring-white/25 backdrop-blur-md">
                        {count ? `${count} produk` : 'Katalog menyusul'}
                      </span>
                    </span>
                    <span>
                      <span className="block text-2xl font-extrabold leading-tight tracking-tight">{division.name}</span>
                      {division.description && (
                        <span className="mt-1 line-clamp-2 block text-[15px] leading-snug text-white/80">{division.description}</span>
                      )}
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                        Lihat produk
                        <ArrowRightIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
};

export default CategoryShowcase;
