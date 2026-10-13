'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  PackageIcon,
  SealCheckIcon,
  WrenchIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  CircleNotchIcon,
  WarningIcon,
  CheckCircleIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';
import IndexScrollbar from '@/components/IndexScrollbar';
import { useSupabase } from '@/contexts/SupabaseContext.jsx';
import { supabase, logSupabaseError, TABLES } from '@/lib/supabase';
import { COMPANY } from '@/lib/company';
import { IMAGES } from '@/lib/images';
import { SECTORS } from '@/lib/divisions';
import { cn } from '@/lib/utils';

// '3' -> 'Tiga' for the category heading; larger counts stay as digits.
const COUNT_WORDS = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh'];

// Previous/next buttons for a sideways-scrolling row. `edges` says whether the row is at its start or end.
const CarouselArrows = ({ edges, onScroll, controls, prevLabel, nextLabel }) => (
  <div className="flex gap-2">
    {[
      { dir: -1, label: prevLabel, Icon: CaretLeftIcon, disabled: edges.start },
      { dir: 1, label: nextLabel, Icon: CaretRightIcon, disabled: edges.end },
    ].map(({ dir, label, Icon, disabled }) => (
      <button
        key={dir}
        type="button"
        onClick={() => onScroll(dir)}
        disabled={disabled}
        aria-label={label}
        aria-controls={controls}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-soft ring-1 ring-gray-200 transition-[background-color,color,opacity,transform] duration-200 hover:bg-brand-600 hover:text-white hover:ring-brand-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon className="h-4 w-4" weight="bold" aria-hidden="true" />
      </button>
    ))}
  </div>
);

// Category index rows (wide screens): every row has the same height, and the list shows at most this many before it
// scrolls, so the section keeps the same height however many categories there are.
const CATEGORY_ROWS_VISIBLE = 6;
const CATEGORY_ROW_REM = 5.5;

// Row edges from its scroll position, with a few pixels of slack for rounding.
const edgesOf = (track) => ({ start: track.scrollLeft <= 4, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 });

const BENEFITS = [
  {
    icon: PackageIcon,
    title: 'Satu pemasok',
    text: 'Satu penawaran, satu jadwal kirim.',
  },
  {
    icon: SealCheckIcon,
    title: 'Produk asli',
    text: 'Langsung dari pemasok resmi.',
  },
  {
    icon: WrenchIcon,
    title: 'Konsultasi spesifikasi',
    text: 'Kami bantu pilih yang tepat.',
  },
  {
    icon: TruckIcon,
    title: 'Kirim ke seluruh Indonesia',
    text: 'Dari Jakarta ke lokasi Anda.',
  },
];

const validators = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Masukkan nama lengkap Anda.'),
  phone: (v) => (/^\+?[0-9][0-9\s-]{7,17}$/.test(v.trim()) ? '' : 'Masukkan nomor telepon yang valid, contoh +62 812 3456 7890.'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Masukkan alamat email yang valid.'),
  message: (v) => (v.trim().length >= 10 ? '' : 'Jelaskan kebutuhan Anda, minimal 10 karakter.'),
};

const FIELD_ORDER = ['name', 'phone', 'email', 'message'];

const FormField = ({ id, label, error, children }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-gray-800">{label}</Label>
    {children}
    {error && (
      <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-red-600">
        <WarningIcon className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
        {error}
      </p>
    )}
  </div>
);

const HomeView = () => {
  const { toast } = useToast();
  const { products, divisions, divisionBySlug, loading } = useSupabase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const formRef = useRef(null);

  // Preselects the category and, for a product quote, prefills the message unless the visitor already wrote one.
  const prefillContactForm = useCallback((divisionSlug, productName) => {
    const form = document.getElementById('contact-form');
    if (!form) return;
    if (divisionBySlug[divisionSlug]) form.elements.division.value = divisionSlug;
    if (productName && !form.elements.message.value.trim()) {
      form.elements.message.value = `Saya ingin meminta penawaran untuk ${productName}. Mohon info harga dan ketersediaan stok.`;
    }
  }, [divisionBySlug]);

  // Product cards and category pages link here as /?divisi=<slug>&produk=<name>#contact-us.
  // Runs again once the category table has loaded, since categories added in the database only exist from then on.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    prefillContactForm(params.get('divisi'), params.get('produk'));
  }, [prefillContactForm]);

  useEffect(() => {
    if (window.location.hash === '#contact-us') {
      document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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

  const featuredProducts = useMemo(() => {
    if (loading) return [];
    // Products marked product_best_selling = 1 in the database.
    return products.filter((p) => p.bestSelling);
  }, [products, loading]);

  // More than four best sellers scroll sideways instead of wrapping onto a second row.
  const featuredCarousel = featuredProducts.length > 4;
  const featuredTrackRef = useRef(null);
  const [featuredEdges, setFeaturedEdges] = useState({ start: true, end: false });
  const scrollFeatured = (direction) => {
    const track = featuredTrackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
  };

  const scrollToContact = () => document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });

  const fieldProps = (name) => ({
    id: name,
    name,
    'aria-invalid': fieldErrors[name] ? true : undefined,
    'aria-describedby': fieldErrors[name] ? `${name}-error` : undefined,
    onBlur: (e) => setFieldErrors((prev) => ({ ...prev, [name]: validators[name](e.target.value) })),
    onChange: (e) => {
      if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: validators[name](e.target.value) }));
    },
  });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitted(false);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(FIELD_ORDER.map((key) => [key, String(formData.get(key) || '').trim()]));

    const errors = Object.fromEntries(FIELD_ORDER.map((key) => [key, validators[key](data[key])]));
    setFieldErrors(errors);
    const firstInvalid = FIELD_ORDER.find((key) => errors[key]);
    if (firstInvalid) {
      formRef.current?.elements[firstInvalid]?.focus();
      return;
    }

    // The contact table has no division column, so the chosen division is prefixed to the message.
    const division = divisionBySlug[formData.get('division')];
    if (division) data.message = `[Kategori: ${division.name}] ${data.message}`;

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase.from(TABLES.contactSubmissions).insert([data]);
      if (insertError) throw insertError;

      toast({
        title: 'Pesan terkirim',
        description: 'Tim kami akan segera menghubungi Anda.',
      });
      setSubmitted(true);
      e.target.reset();
    } catch (err) {
      logSupabaseError('handleContactSubmit', err);
      setSubmitError('Pesan belum terkirim karena server tidak dapat dihubungi. Silakan coba lagi, atau hubungi kami langsung lewat telepon atau email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'ItemList',
    itemListElement: featuredProducts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        category: `${divisionBySlug[p.division]?.name} / ${p.category}`,
      },
    })),
  };

  return (
    <>
      {featuredProducts.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      )}

      {/* Hero */}
      <section className="relative isolate flex min-h-[calc(88dvh-72px)] items-center overflow-hidden bg-gray-950 py-20 md:py-24">
        <img
          src={IMAGES.homeHero}
          alt="Mesin pengering putar berukuran besar di dalam pabrik"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50"
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950 via-gray-950/85 to-gray-950/20" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_80%,rgb(0_146_0_/_0.22),transparent_55%)]" aria-hidden="true" />

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Reveal>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-gray-100 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-sun" aria-hidden="true" />
                Distributor & pemasok industri sejak {COMPANY.foundedYear}
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mb-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
                Pasokan industri yang tepat untuk <span className="text-sun">bisnis Indonesia.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
                Dari pabrik dan bengkel hingga galangan kapal dan perkebunan, kami memasok produk yang menjaga operasional Anda tetap berjalan, dengan spesifikasi yang dicek sebelum dikirim.
              </p>
            </Reveal>
            <Reveal delay={240} className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl">
                <Link href="/products">
                  Jelajahi produk
                  <ArrowRightIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" onClick={scrollToContact}>
                Minta penawaran
              </Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Categories, one per tbl_product_category row. Wide screens: a large photo panel that follows the hovered or
          focused row of the numbered index beside it. Small screens: a swipeable row of photo cards. */}
      <section aria-labelledby="categories-heading" className="pb-24 pt-20 md:pb-28 md:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 grid grid-cols-1 gap-5 md:mb-14 lg:grid-cols-12 lg:items-end lg:gap-16">
            <div className="lg:col-span-7">
              <p className="mb-3 text-sm font-semibold text-brand-700">Kategori produk</p>
              <h2 id="categories-heading" className="text-3xl font-extrabold leading-[1.05] tracking-tight text-gray-900 [text-wrap:balance] md:text-5xl">
                {divisions.length ? COUNT_WORDS[divisions.length] || divisions.length : 'Semua'} kategori, satu pemasok
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md text-[15px] leading-relaxed text-gray-600 [text-wrap:pretty]">
                Pilih kategori untuk melihat produk, spesifikasi, dan kemasan yang tersedia.
                {!loading && products.length > 0 && (
                  <> Saat ini <span className="font-semibold tabular-nums text-gray-900">{products.length} produk</span> aktif di katalog.</>
                )}
              </p>
              <Link href="/products" className="group mt-4 inline-flex items-center gap-2 font-semibold text-gray-900 transition-colors hover:text-brand-700">
                Lihat semua produk
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" weight="bold" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

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
                        {activeDivision.tags.length > 0 && (
                          <ul className="mt-5 flex flex-wrap gap-2">
                            {activeDivision.tags.slice(0, 5).map((tag) => (
                              <li key={tag} className="rounded-md bg-white/10 px-2.5 py-1 text-[13px] font-medium text-white/90 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
                                {tag}
                              </li>
                            ))}
                          </ul>
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
        </div>
      </section>

      <section aria-labelledby="sectors-heading" className="bg-gray-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 max-w-2xl">
            <p className="mb-3 text-sm font-semibold text-brand-700">Sektor yang kami layani</p>
            <h2 id="sectors-heading" className="text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 [text-wrap:balance] md:text-[2.75rem]">
              Dari kebun, ke laut, sampai lantai pabrik
            </h2>
          </Reveal>

          {/* Informational tiles: a sector is not a product category, so they don't link anywhere. */}
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
            {SECTORS.map((sector, i) => (
              <Reveal as="li" key={sector.slug} delay={i * 80} className="group relative isolate overflow-hidden rounded-2xl">
                <img
                  src={sector.image}
                  alt={sector.imageAlt}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] sm:aspect-[3/4] lg:aspect-[4/5]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/85 via-gray-950/25 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                  <h3 className="text-xl font-bold tracking-tight md:text-2xl">{sector.name}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-white/80 [text-wrap:pretty]">{sector.summary}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Why us: headline + four short reasons */}
      <section aria-labelledby="why-heading" className="py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <Reveal className="lg:col-span-5">
            <p className="mb-4 text-sm font-semibold text-brand-700">Mengapa memilih kami</p>
            <h2 id="why-heading" className="text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 [text-wrap:balance] md:text-[2.75rem]">
              Kurangi jumlah pemasok, bukan kualitas pasokan.
            </h2>
          </Reveal>

          <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:col-span-7">
            {BENEFITS.map((item, i) => (
              <Reveal as="li" key={item.title} delay={i * 70} className="flex gap-4 border-t border-gray-200 py-6">
                <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-brand-700" weight="duotone" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-gray-600">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured products (hidden until the database has products) */}
      {(loading || featuredProducts.length > 0) && (
      <section className="bg-gray-50 py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-brand-700">Produk pilihan</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Produk terlaris</h2>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/products" className="group inline-flex items-center gap-2 font-semibold text-gray-700 transition-colors hover:text-brand-700">
                Lihat semua produk
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" weight="bold" aria-hidden="true" />
              </Link>
              {featuredCarousel && (
                <CarouselArrows edges={featuredEdges} onScroll={scrollFeatured} controls="featured-products" prevLabel="Produk sebelumnya" nextLabel="Produk berikutnya" />
              )}
            </div>
          </Reveal>

          <div
            id="featured-products"
            ref={featuredTrackRef}
            onScroll={featuredCarousel ? (e) => setFeaturedEdges(edgesOf(e.currentTarget)) : undefined}
            aria-busy={loading}
            // Carousel scrolls sideways only: overflow-y-hidden stops vertical scrolling, and the padding
            // (offset by negative margins) gives the card outline, hover lift and shadow room so they aren't clipped.
            className={cn(
              featuredCarousel
                ? 'no-scrollbar -mx-4 -my-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overflow-y-hidden px-4 pb-8 pt-4 sm:-mx-2 sm:scroll-px-2 sm:px-2 md:gap-6'
                : 'grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4'
            )}
          >
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-gray-300/80">
                    <div className="aspect-[4/3] animate-pulse bg-gray-100" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                      <div className="mt-6 h-10 animate-pulse rounded-lg bg-gray-100" />
                    </div>
                  </div>
                ))
              : featuredProducts.map((product, i) => (
                  <Reveal
                    key={product.id}
                    delay={Math.min(i, 3) * 70}
                    className={cn(featuredCarousel && 'w-[calc((100%-0.75rem)/2)] shrink-0 snap-start md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]')}
                  >
                    <ProductCard
                      product={product}
                      showDivision
                      onQuoteRequest={(p) => {
                        prefillContactForm(p.division, p.name);
                        scrollToContact();
                      }}
                    />
                  </Reveal>
                ))}
          </div>
        </div>
      </section>
      )}

      {/* Contact */}
      <section id="contact-us" className="scroll-mt-20 py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <Reveal className="lg:col-span-5">
            <p className="text-sm font-semibold text-brand-700">Hubungi kami</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-[1.1] tracking-tight text-gray-900 md:text-[2.75rem]">
              Ceritakan kebutuhan Anda
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-600">
              Minta penawaran harga atau rekomendasi produk untuk kebutuhan Anda. Tim kami akan membalas dengan pilihan yang sesuai.
            </p>

            <ul className="mt-10 space-y-2">
              <li>
                <a href={COMPANY.mapsUrl} target="_blank" rel="noopener noreferrer" className="-mx-3 flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><MapPinIcon className="h-5 w-5" weight="duotone" aria-hidden="true" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Kantor</span>
                    <span className="block text-sm leading-relaxed text-gray-600">{COMPANY.address}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={COMPANY.phoneHref} className="-mx-3 flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><PhoneIcon className="h-5 w-5" weight="duotone" aria-hidden="true" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Telepon</span>
                    <span className="block text-sm tabular-nums text-gray-600">{COMPANY.phoneDisplay}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="-mx-3 flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><EnvelopeSimpleIcon className="h-5 w-5" weight="duotone" aria-hidden="true" /></span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">Email</span>
                    <span className="block text-sm text-gray-600">{COMPANY.email}</span>
                  </span>
                </a>
              </li>
            </ul>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-7">
            <div className="rounded-2xl bg-white p-6 shadow-lift ring-1 ring-gray-200 sm:p-10">
              {submitError && (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" weight="fill" aria-hidden="true" />
                  <p>{submitError}</p>
                </div>
              )}
              {submitted && (
                <div role="status" className="mb-6 flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" weight="fill" aria-hidden="true" />
                  <p>Terima kasih. Pesan Anda sudah kami terima, dan tim kami akan segera menghubungi Anda.</p>
                </div>
              )}
              <form id="contact-form" ref={formRef} onSubmit={handleContactSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField id="name" label="Nama lengkap" error={fieldErrors.name}>
                    <Input {...fieldProps('name')} autoComplete="name" placeholder="Nama Anda" />
                  </FormField>
                  <FormField id="phone" label="Nomor telepon" error={fieldErrors.phone}>
                    <Input {...fieldProps('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+62 812 3456 7890" />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField id="email" label="Email perusahaan" error={fieldErrors.email}>
                    <Input {...fieldProps('email')} type="email" autoComplete="email" placeholder="nama@perusahaan.co.id" />
                  </FormField>
                  <FormField id="division" label="Kategori yang dibutuhkan">
                    <div className="relative">
                      <select
                        id="division"
                        name="division"
                        defaultValue=""
                        className="flex h-11 w-full appearance-none rounded-lg border border-input bg-white px-3.5 pr-10 text-[15px] text-gray-900 transition-[border-color,box-shadow] duration-200 hover:border-gray-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      >
                        <option value="">Belum tahu / lebih dari satu</option>
                        {divisions.map((d) => (
                          <option key={d.slug} value={d.slug}>{d.name}</option>
                        ))}
                      </select>
                      <CaretDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" weight="bold" aria-hidden="true" />
                    </div>
                  </FormField>
                </div>
                <FormField id="message" label="Kebutuhan Anda" error={fieldErrors.message}>
                  <Textarea {...fieldProps('message')} rows={5} placeholder="Contoh: nama atau jenis produk, spesifikasi, jumlah, dan lokasi pengiriman." />
                </FormField>
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <CircleNotchIcon className="h-4 w-4 animate-spin" weight="bold" aria-hidden="true" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim permintaan'
                  )}
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Data Anda hanya dipakai untuk membalas pesan ini. Baca <Link href="/privacy" className="font-medium text-gray-700 underline underline-offset-2 hover:text-brand-700">kebijakan privasi</Link> kami.
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default HomeView;
