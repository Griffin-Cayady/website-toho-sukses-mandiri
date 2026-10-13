'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  DownloadSimpleIcon,
  FunnelIcon,
  CheckIcon,
  CaretDownIcon,
  WarningIcon,
  ArrowClockwiseIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import ProductCard from '@/components/ProductCard';
import CatalogPagination from '@/components/CatalogPagination';
import { useSupabase } from '@/contexts/SupabaseContext.jsx';
import { cn } from '@/lib/utils';
import { OIL_BROCHURE_URL } from '@/lib/company';

const ALL = 'All';

const categoryLabel = (cat) => (cat === ALL ? 'Semua jenis' : cat);

// Products per page the visitor can pick. All divide evenly into the 2- and 3-column grids.
const PAGE_SIZES = [12, 24, 36];
const PAGE_SIZE_KEY = 'tsm-catalog-page-size';

// The visitor's last choice on this device, or null (use the screen-size default). Storage can be blocked.
const readSavedPageSize = () => {
  try {
    const saved = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
};
const subscribeToStorage = (onChange) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};

/**
 * Product catalogue. On /products it shows every division with tabs (?divisi=...);
 * on a division page `division` locks it to that division. The category lives in ?kategori=.
 */
const ProductsView = ({ category = ALL, division = null, divisionParam = ALL }) => {
  const { toast } = useToast();
  const { products, divisions, divisionBySlug, loading, error, refetch } = useSupabase();

  const locked = Boolean(division);
  const activeDivision = locked ? division : divisionBySlug[divisionParam] ? divisionParam : ALL;
  // Undefined while the category table loads.
  const lockedDivision = locked ? divisionBySlug[division] : null;
  const selectedCategory = category;
  const [searchQuery, setSearchQuery] = useState('');
  // The page number belongs to one division + category; switching either starts again at page 1.
  const filterKey = `${activeDivision}|${selectedCategory}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const currentPage = pageState.key === filterKey ? pageState.page : 1;
  const setCurrentPage = (page) => setPageState({ key: filterKey, page });
  const [isMobile, setIsMobile] = useState(false);
  // A size picked now, else one saved on an earlier visit (null while prerendering), else the screen-size default.
  const [chosenPageSize, setChosenPageSize] = useState(null);
  const savedPageSize = useSyncExternalStore(subscribeToStorage, readSavedPageSize, () => null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = chosenPageSize || savedPageSize || (isMobile ? 24 : 12);

  const divisionCounts = useMemo(
    () => products.reduce((acc, p) => ({ ...acc, [p.division]: (acc[p.division] || 0) + 1 }), {}),
    [products]
  );

  const divisionProducts = useMemo(
    () => (activeDivision === ALL ? products : products.filter((p) => p.division === activeDivision)),
    [products, activeDivision]
  );

  const categories = useMemo(() => {
    if (loading) return [];
    const counts = divisionProducts.reduce((acc, p) => ({ ...acc, [p.category]: (acc[p.category] || 0) + 1 }), {});
    return [
      { name: ALL, count: divisionProducts.length },
      ...Object.keys(counts).sort().map((name) => ({ name, count: counts[name] })),
    ];
  }, [divisionProducts, loading]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return divisionProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
      const matchesCategory = selectedCategory === ALL || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [divisionProducts, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const scrollToCatalog = () => {
    if (locked) document.getElementById('katalog')?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Next.js syncs native replaceState into useSearchParams, which feeds the props above.
  const updateUrl = (changes) => {
    const url = new URL(window.location.href);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === ALL || value == null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    window.history.replaceState(null, '', url);
  };

  const changeCategory = (nextCategory) => {
    updateUrl({ kategori: nextCategory });
    scrollToCatalog();
  };

  const changeDivision = (nextDivision) => {
    updateUrl({ divisi: nextDivision, kategori: ALL });
  };

  const changeSearchQuery = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const changePage = (page) => {
    setCurrentPage(page);
    scrollToCatalog();
  };

  const changePageSize = (size) => {
    setChosenPageSize(size);
    setCurrentPage(1);
    try {
      window.localStorage.setItem(PAGE_SIZE_KEY, String(size));
    } catch {
      // Storage blocked: the choice still applies until the page is reloaded.
    }
  };

  const clearFilters = () => {
    changeSearchQuery('');
    changeCategory(ALL);
  };

  const showOilBrochure = activeDivision === 'oli' || activeDivision === ALL;
  // The brochure is the oil catalogue, so the button names the oil category (as stored in the database).
  const oilCategoryName = divisionBySlug.oli?.name || 'Oli & Pelumas';
  const handleDownloadBrochure = () => {
    window.open(OIL_BROCHURE_URL, '_blank', 'noopener');
    toast({
      title: 'Membuka katalog oli',
      description: 'Katalog PDF dibuka di tab baru.',
    });
  };

  const scopeName = activeDivision === ALL ? 'semua kategori' : divisionBySlug[activeDivision]?.catalogName || 'kategori ini';
  const resultSummary = loading
    ? 'Memuat katalog...'
    : `${filteredProducts.length} produk ${selectedCategory !== ALL ? `dalam ${selectedCategory}` : `di ${scopeName}`}${searchQuery ? ` untuk "${searchQuery}"` : ''}`;

  const searchControls = (
    // Phones: search on its own line, the catalogue button full width below it (always labelled). From sm: one row.
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
      <div className="relative flex-grow md:w-80">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" weight="bold" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Cari produk"
          placeholder="Cari nama atau jenis produk"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => changeSearchQuery(e.target.value)}
          disabled={loading}
        />
      </div>
      {showOilBrochure && (
        <Button variant="outline" onClick={handleDownloadBrochure} className="h-11 w-full shrink-0 sm:w-auto">
          <DownloadSimpleIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
          Download {oilCategoryName} Catalog
        </Button>
      )}
    </div>
  );

  return (
    <div id="katalog" className={cn('scroll-mt-20 bg-gray-50', !locked && 'min-h-[100dvh]')}>
      {locked ? (
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 sm:px-6 md:flex-row md:items-end md:justify-between md:pt-20 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-brand-700">Katalog</p>
            {lockedDivision ? (
              <>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                  Produk {lockedDivision.catalogName}
                </h2>
                {lockedDivision.menuBlurb && <p className="mt-3 max-w-xl text-gray-600">{lockedDivision.menuBlurb}</p>}
              </>
            ) : (
              <div className="mt-3 h-9 w-72 max-w-full animate-pulse rounded-lg bg-gray-200" aria-hidden="true" />
            )}
          </div>
          {searchControls}
        </div>
      ) : (
        <div className="relative border-b border-gray-200 bg-white">
          <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 md:pt-16 lg:px-8">
            <p className="text-sm font-semibold text-brand-700">Katalog</p>
            <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Semua produk</h1>
                <p className="mt-3 max-w-xl text-gray-600">
                  Telusuri produk kami per kategori, atau cari langsung berdasarkan nama dan jenis produk.
                </p>
              </div>
              {searchControls}
            </div>

            <div className="no-scrollbar -mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <div role="group" aria-label="Pilih kategori" className="inline-flex gap-1 rounded-xl bg-gray-100 p-1 ring-1 ring-gray-200">
                {[{ slug: ALL, name: 'Semua kategori' }, ...divisions].map((d) => {
                  const active = activeDivision === d.slug;
                  const count = d.slug === ALL ? products.length : divisionCounts[d.slug] || 0;
                  return (
                    <button
                      key={d.slug}
                      onClick={() => changeDivision(d.slug)}
                      aria-pressed={active}
                      className={cn(
                        'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-200',
                        active ? 'bg-white text-gray-900 shadow-soft' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {d.name}
                      {!loading && <span className={cn('text-xs tabular-nums', active ? 'text-brand-700' : 'text-gray-400')}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {error && (
          <div role="status" className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" weight="fill" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-amber-900">Produk gagal dimuat</h2>
              <p className="mt-1 text-sm text-amber-800">{error}</p>
              <button onClick={refetch} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline-offset-2 hover:underline">
                <ArrowClockwiseIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" /> Coba lagi
              </button>
            </div>
          </div>
        )}

        {/* Mobile category chips */}
        <div className="-mx-4 mb-6 md:hidden">
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter jenis produk">
            {loading
              ? [1, 2, 3, 4].map((i) => <div key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-gray-200" />)
              : categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => changeCategory(cat.name)}
                    aria-pressed={selectedCategory === cat.name}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors duration-200',
                      selectedCategory === cat.name
                        ? 'bg-gray-900 text-white ring-gray-900'
                        : 'bg-white text-gray-700 ring-gray-200 active:bg-gray-100'
                    )}
                  >
                    {categoryLabel(cat.name)}
                  </button>
                ))}
          </div>
        </div>

        <div className="flex flex-col gap-8 md:flex-row lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden flex-shrink-0 md:block md:w-60">
            <div className="sticky top-24">
              <h2 className="mb-3 flex items-center gap-2 px-3 text-sm font-semibold text-gray-900">
                <FunnelIcon className="h-4 w-4 text-brand-700" weight="bold" aria-hidden="true" />
                Jenis produk
              </h2>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-200/70" />)}
                </div>
              ) : (
                <ul className="max-h-[calc(100dvh-10rem)] space-y-0.5 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const active = selectedCategory === cat.name;
                    return (
                      <li key={cat.name}>
                        <button
                          onClick={() => changeCategory(cat.name)}
                          aria-pressed={active}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200',
                            active ? 'bg-white font-semibold text-brand-800 shadow-soft ring-1 ring-gray-200' : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                          )}
                        >
                          <span className="truncate">{categoryLabel(cat.name)}</span>
                          {active ? (
                            <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" weight="bold" aria-hidden="true" />
                          ) : (
                            <span className="text-xs tabular-nums text-gray-400">{cat.count}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <section className="min-w-0 flex-1" aria-label="Daftar produk">
            <div className="mb-5 flex min-h-[2rem] flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm text-gray-600" aria-live="polite">{resultSummary}</p>
                {(selectedCategory !== ALL || searchQuery) && !loading && (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200/60 hover:text-gray-900">
                    <XIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
                    Hapus filter
                  </button>
                )}
              </div>

              {/* Page size: only worth showing when there is more than one page at the smallest size. */}
              {!loading && filteredProducts.length > PAGE_SIZES[0] && (
                // Native select (same look as the contact form's), so phones open their own picker.
                <div className="flex items-center gap-2">
                  <label htmlFor="page-size" className="text-sm text-gray-600">Tampilkan</label>
                  <div className="relative">
                    <select
                      id="page-size"
                      value={itemsPerPage}
                      onChange={(e) => changePageSize(Number(e.target.value))}
                      className="flex h-9 appearance-none rounded-lg border border-input bg-white pl-3 pr-9 text-sm font-semibold tabular-nums text-gray-900 transition-[border-color,box-shadow] duration-200 hover:border-gray-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <CaretDownIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" weight="bold" aria-hidden="true" />
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-3" aria-busy="true">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
                    <div className="aspect-[4/3] animate-pulse bg-gray-100" />
                    <div className="flex-1 space-y-3 p-3 md:p-5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                      <div className="mt-6 h-9 animate-pulse rounded-lg bg-gray-100 md:h-10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center md:py-20">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                  <MagnifyingGlassIcon className="h-7 w-7 text-gray-400" aria-hidden="true" />
                </div>
                {divisionProducts.length === 0 ? (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900">Produk segera hadir</h2>
                    <p className="mx-auto mt-2 max-w-sm text-gray-600">
                      Katalog untuk kategori ini sedang kami siapkan. Hubungi tim kami untuk informasi produk dan penawaran.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900">Produk tidak ditemukan</h2>
                    <p className="mx-auto mt-2 max-w-sm text-gray-600">
                      Coba kata kunci lain atau pilih jenis produk lain. Jika produk yang Anda cari tidak ada di katalog, tim kami bisa membantu.
                    </p>
                  </>
                )}
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  {divisionProducts.length > 0 && <Button variant="outline" onClick={clearFilters}>Hapus semua filter</Button>}
                  <Button asChild>
                    <Link href="/#contact-us">Tanya tim kami</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:gap-6 xl:grid-cols-3">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} showDivision={activeDivision === ALL} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <CatalogPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredProducts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={changePage}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductsView;

// Reads ?kategori= and ?divisi= from the URL. Rendered inside <Suspense> so the page can still be prerendered.
export const ProductsViewFromUrl = ({ division = null }) => {
  const searchParams = useSearchParams();
  return (
    <ProductsView
      division={division}
      category={searchParams.get('kategori') || ALL}
      divisionParam={searchParams.get('divisi') || ALL}
    />
  );
};
