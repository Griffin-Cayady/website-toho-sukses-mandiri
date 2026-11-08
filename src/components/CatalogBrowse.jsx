'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { IMAGES } from '@/lib/images';
import Reveal from '@/components/Reveal';
import CarouselArrows, { edgesOf } from '@/components/CarouselArrows';
import { useCatalog } from '@/contexts/CatalogContext.jsx';
import { cn } from '@/lib/utils';

const CARD = 'min-h-[17rem] rounded-xl md:min-h-[19rem]';

// BrowseSection rows: four in a row on wide screens (two on phones). More than four scroll sideways with previous/next
// buttons, the same carousel as the home page's best sellers.
const CATEGORY_GRID = 'grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4';
const CATEGORY_TRACK =
  'no-scrollbar -mx-4 -my-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overflow-y-hidden px-4 pb-8 pt-4 sm:-mx-2 sm:scroll-px-2 sm:px-2 md:gap-6';
const CATEGORY_SLIDE = 'w-[calc((100%-0.75rem)/2)] shrink-0 snap-start md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]';

/**
 * `image` is the card's background with a white fade behind the dark name at the bottom; on hover (or keyboard
 * focus) a brand-green fade and 40% shade cover the card, the text turns white and the `action` text link appears at the
 * bottom right. `meta` is a small line above the name (e.g. "12 produk"). Renders `as` (a Link by default, or a button for
 * the merk cards) with the remaining props.
 */
export const BrowseCard = ({ as: Tag = Link, image, meta, name, description, action, ...props }) => (
  <Tag
    {...props}
    className={`${CARD} group relative isolate flex h-full w-full flex-col justify-end overflow-hidden bg-gray-100 text-left text-gray-900 shadow-soft ring-1 ring-gray-200/80 transition-[color,box-shadow] duration-500 hover:text-white hover:shadow-lift focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4`}
  >
    {/* The image as the background, cropped to fill, with a white fade behind the dark name at rest so it reads on any
        photo (it gives way to the green layer on hover). No image yet: the name's first letter, large and faint. */}
    {image ? (
      <>
        <img
          src={image}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 h-full w-full bg-white object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105 group-focus-visible:scale-105"
        />
        <span
          className="absolute inset-x-0 bottom-0 -z-10 h-3/5 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0"
          aria-hidden="true"
        />
      </>
    ) : (
      <span
        className="pointer-events-none absolute -right-2 -top-10 -z-10 select-none text-[11rem] font-extrabold leading-none text-gray-200"
        aria-hidden="true"
      >
        {name?.trim().charAt(0)}
      </span>
    )}
    {/* On hover only: a brand-green fade along the bottom (so the white name reads on any image) and the 40% green shade. */}
    <span className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
      <span className="absolute inset-0 bg-brand-ink/40" />
      <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-brand-ink/95 via-brand-ink/70 to-transparent" />
    </span>

    <span className="block p-5 md:p-6 lg:p-4 xl:p-5">
      {meta && (
        <span className="mb-1 block text-xs font-semibold tabular-nums text-gray-600 transition-colors duration-500 group-hover:text-white group-focus-visible:text-white">
          {meta}
        </span>
      )}
      <span className="block text-xl font-semibold leading-snug tracking-tight [text-wrap:balance] md:text-[22px] lg:text-lg xl:text-xl">
        {name}
      </span>
      {description && (
        <span className="mt-2 line-clamp-3 block text-[15px] leading-relaxed opacity-85 [text-wrap:pretty]">{description}</span>
      )}
      {/* Text link at the bottom right. With a mouse its row is collapsed (0fr) at rest, so nothing sits under the name,
          and opens on hover, lifting the name; touch screens can't hover, so there it always shows. */}
      <span className="grid transition-[grid-template-rows] duration-500 ease-out-expo group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] [@media(hover:hover)]:grid-rows-[0fr]">
        <span className="overflow-hidden">
          <span className="flex justify-end pt-2">
            {/* Hidden from screen readers so the link is announced by its name alone. */}
            <span aria-hidden="true" className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-700 transition-[opacity,color] duration-500 group-hover:text-white group-hover:opacity-100 group-focus-visible:text-white group-focus-visible:opacity-100 [@media(hover:hover)]:opacity-0">
              {action}
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" weight="bold" aria-hidden="true" />
            </span>
          </span>
        </span>
      </span>
    </span>
  </Tag>
);

/**
 * A home page section of BrowseCards: heading and intro, then four cards in a row (two on phones). More than four
 * scroll sideways with previous/next buttons beside the intro. `items` render through `renderCard`; `id` names the
 * section (its heading is `${id}-heading`, the card row `${id}-cards`).
 */
export const BrowseSection = ({ id, eyebrow, title, intro, items, getKey, renderCard, loading = false, prevLabel, nextLabel, className }) => {
  const carousel = items.length > 4;
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const scrollTrack = (direction) => {
    const track = trackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <section aria-labelledby={`${id}-heading`} className={cn('pb-24 pt-16 md:pb-28 md:pt-24', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Same header as the other home page sections: green label, heading, intro under it; arrows at the bottom right. */}
        <Reveal className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {eyebrow && <p className="mb-2 text-sm font-semibold text-brand-700">{eyebrow}</p>}
            <h2 id={`${id}-heading`} className="text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 [text-wrap:balance] md:text-[2.75rem]">
              {title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 [text-wrap:pretty] md:text-lg">{intro}</p>
          </div>
          {carousel && (
            <div className="shrink-0">
              <CarouselArrows edges={edges} onScroll={scrollTrack} controls={`${id}-cards`} prevLabel={prevLabel} nextLabel={nextLabel} />
            </div>
          )}
        </Reveal>

        {loading ? (
          <ul aria-busy="true" className={CATEGORY_GRID}>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className={`${CARD} animate-pulse bg-gray-100 ring-1 ring-gray-200/80`} />
            ))}
          </ul>
        ) : (
          // Carousel scrolls sideways only; the padding (offset by negative margins) gives the hover shadow and focus ring room.
          <ul
            id={`${id}-cards`}
            ref={trackRef}
            onScroll={carousel ? (e) => setEdges(edgesOf(e.currentTarget)) : undefined}
            className={carousel ? CATEGORY_TRACK : CATEGORY_GRID}
          >
            {items.map((item, i) => (
              <Reveal as="li" key={getKey(item)} delay={Math.min(i, 3) * 70} className={cn(carousel && CATEGORY_SLIDE)}>
                {renderCard(item)}
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

/**
 * The home page's way into the catalogue: one card per category (tbl_product_category) that has active products, since
 * an empty one would open an empty page. The merks have their own section further down.
 */
const CatalogBrowse = () => {
  const { products, divisions, loading } = useCatalog();

  const categories = useMemo(
    () =>
      divisions
        .map((d) => ({ ...d, count: products.filter((p) => p.categoryId === d.categoryId).length }))
        .filter((d) => d.count > 0),
    [products, divisions]
  );

  if (!loading && categories.length === 0) return null;

  return (
    <BrowseSection
      id="categories"
      eyebrow="Kategori produk"
      title="Cari produk berdasarkan kategori"
      intro="Pilih kategori untuk melihat spesifikasi dan ukuran yang tersedia, lalu minta penawaran langsung dari tim kami."
      items={categories}
      getKey={(category) => category.slug}
      loading={loading}
      prevLabel="Kategori sebelumnya"
      nextLabel="Kategori berikutnya"
      renderCard={(category) => (
        // Links to /kategori/?id=<id>; the photo behind it is tbl_product_category.image.
        <BrowseCard
          href={category.path}
          image={category.image === IMAGES.categoryPlaceholder ? null : category.image}
          name={category.name}
          meta={`${category.count} produk`}
          action="Lihat Produk"
        />
      )}
    />
  );
};

export default CatalogBrowse;
