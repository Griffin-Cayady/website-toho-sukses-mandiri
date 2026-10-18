'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ListIcon, XIcon, WhatsappLogoIcon, CaretDownIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COMPANY } from '@/lib/company';
import { isDivisionPage } from '@/lib/divisions';
import { useCatalog } from '@/contexts/CatalogContext.jsx';

// "Produk" opens a menu with the product categories from the database (see ProductsMenu below).
const navItems = [
  { name: 'Beranda', path: '/' },
  { name: 'Produk', path: '/products', hasMenu: true },
  { name: 'Tentang kami', path: '/about' },
];

const navLinkClass = (active) =>
  cn(
    'relative flex items-center gap-1 whitespace-nowrap px-3.5 py-2 text-[15px] font-medium transition-colors duration-200',
    "after:absolute after:inset-x-3.5 after:-bottom-px after:h-0.5 after:origin-left after:rounded-full after:bg-brand-600 after:transition-transform after:duration-300 after:ease-out-expo after:content-['']",
    active ? 'text-gray-900 after:scale-x-100' : 'text-gray-500 after:scale-x-0 hover:text-gray-900 hover:after:scale-x-100'
  );

const HOVER_OPEN_DELAY = 70;
const HOVER_CLOSE_DELAY = 180;

// Rows cascade in after the panel starts to open; capped so long lists don't lag.
const tileDelay = (i) => `${80 + Math.min(i, 8) * 35}ms`;

/**
 * "Produk" button with a full-width panel listing the product categories (tbl_product_category) that have products:
 * name, description and the number of active products with that product_category.
 * Mouse: opens on hover (short intent delay); a click pins it open. Touch and keyboard: the button toggles it.
 * Escape, clicking outside, or moving focus away closes it.
 */
const ProductsMenu = ({ item, counts, active, currentPath, categoryParam }) => {
  const { products, loading } = useCatalog();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const hoverTimer = useRef(null);
  // 'hover' while the pointer holds it open; 'click' once pinned, so leaving with the mouse no longer closes it.
  const openedBy = useRef(null);

  const setMenu = (next, source = null) => {
    clearTimeout(hoverTimer.current);
    openedBy.current = next ? source : null;
    setOpen(next);
  };

  const close = () => setMenu(false);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (rootRef.current?.contains(e.target)) return;
      clearTimeout(hoverTimer.current);
      openedBy.current = null;
      setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handlePointerEnter = (e) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer.current);
    if (!open) hoverTimer.current = setTimeout(() => setMenu(true, 'hover'), HOVER_OPEN_DELAY);
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType !== 'mouse' || openedBy.current === 'click') return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(close, HOVER_CLOSE_DELAY);
  };

  // A click on a hover-opened menu pins it rather than closing it under the cursor.
  const handleButtonClick = () => {
    if (open && openedBy.current === 'hover') openedBy.current = 'click';
    else setMenu(!open, 'click');
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Escape' || !open) return;
    close();
    buttonRef.current?.focus();
  };

  return (
    <li
      ref={rootRef}
      className="flex"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && close()}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        aria-expanded={open}
        aria-controls="products-menu"
        className={cn(navLinkClass(active || open), 'self-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
      >
        {item.name}
        <CaretDownIcon className={cn('h-3.5 w-3.5 transition-transform duration-300 ease-out-expo', open && 'rotate-180')} weight="bold" aria-hidden="true" />
      </button>

      {/* Dims the page under the panel. Absolute (not fixed): the header's backdrop blur would trap a fixed child. Purely visual; outside clicks are handled above. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-full -z-10 h-[100dvh] bg-gray-950/25 transition-opacity duration-300 ease-out-expo',
          open ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div
        id="products-menu"
        className={cn(
          'absolute inset-x-0 top-full border-t border-gray-200 bg-white shadow-lift transition-[opacity,clip-path,visibility] ease-out-expo motion-reduce:transition-none',
          open
            ? 'visible opacity-100 duration-500 [clip-path:inset(0_0_0_0)]'
            : 'invisible opacity-0 duration-200 [clip-path:inset(0_0_100%_0)]'
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 py-7 sm:px-6 lg:px-8">
          {/* Summary and the way out to the full catalogue */}
          <div
            className={cn(
              'col-span-3 flex flex-col border-r border-gray-200 pr-8 transition-opacity duration-500 ease-out-expo motion-reduce:transition-none',
              open ? 'opacity-100 delay-100' : 'opacity-0 delay-0'
            )}
          >
            <p className="text-sm font-semibold text-brand-700">Kategori produk</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {loading ? (
                'Memuat katalog...'
              ) : (
                <>
                  <span className="font-semibold tabular-nums text-gray-900">{item.children.length}</span> kategori,{' '}
                  <span className="font-semibold tabular-nums text-gray-900">{products.length}</span> produk aktif.
                </>
              )}
            </p>
            <Link
              href="/products"
              onClick={close}
              className="group mt-auto inline-flex items-center gap-2 self-start pt-6 text-sm font-semibold text-gray-900 transition-colors hover:text-brand-700"
            >
              Lihat semua produk
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-1" weight="bold" aria-hidden="true" />
            </Link>
          </div>

          {/* One row per tbl_product_category row; any number of categories wraps into the columns. */}
          <ul className="col-span-9 grid grid-cols-2 content-start gap-x-8 xl:grid-cols-3">
            {loading && item.children.length === 0
              ? [0, 1, 2, 3].map((i) => (
                  <li key={i} className="border-t border-gray-100 py-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  </li>
                ))
              : item.children.map((division, i) => {
                  const current = isDivisionPage(division, currentPath, categoryParam);
                  const count = counts[division.categoryId] || 0;
                  return (
                    <li
                      key={division.slug}
                      className={cn(
                        'border-t border-gray-100 transition-[opacity,transform] duration-500 ease-out-expo motion-reduce:transition-none',
                        open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0 delay-0'
                      )}
                      style={open ? { transitionDelay: tileDelay(i) } : undefined}
                    >
                      <Link
                        href={division.path}
                        onClick={close}
                        aria-current={current ? 'page' : undefined}
                        className={cn(
                          'group -mx-3 my-1 flex flex-col rounded-lg px-3 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 active:bg-gray-100',
                          !current && 'hover:bg-gray-50'
                        )}
                      >
                        <span className="flex items-baseline justify-between gap-4">
                          <span
                            className={cn(
                              'flex min-w-0 items-center gap-1.5 text-[15px] font-semibold tracking-tight transition-colors duration-200',
                              current ? 'text-brand-700' : 'text-gray-900 group-hover:text-brand-700'
                            )}
                          >
                            {current && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />}
                            <span className="[text-wrap:balance]">{division.name}</span>
                            <ArrowRightIcon
                              className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 ease-out-expo group-hover:translate-x-0 group-hover:opacity-100"
                              weight="bold"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-gray-500">
                            {loading ? '...' : `${count} produk`}
                          </span>
                        </span>
                        {division.description && (
                          <span className="mt-1 line-clamp-2 text-sm leading-snug text-gray-600 [text-wrap:pretty]">{division.description}</span>
                        )}
                        {current && <span className="sr-only">(sedang dilihat)</span>}
                      </Link>
                    </li>
                  );
                })}
          </ul>
        </div>
      </div>
    </li>
  );
};

const Navbar = ({ categoryParam = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { products, divisions } = useCatalog();

  // Active products per tbl_product_category.id.
  const counts = useMemo(
    () => products.reduce((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] || 0) + 1 }), {}),
    [products]
  );
  // The menus list only categories that have active products; an empty one would lead to an empty page.
  const menuDivisions = useMemo(() => divisions.filter((d) => counts[d.categoryId]), [divisions, counts]);
  const items = navItems.map((item) => (item.hasMenu ? { ...item, children: menuDivisions } : item));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // trailingSlash: true means pathnames can arrive as "/products/".
  const currentPath = pathname?.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const productPaths = ['/products', '/kategori'];
  const isActive = (item) => (item.children ? productPaths.includes(currentPath) : currentPath === item.path);
  const isCurrentDivision = (division) => isDivisionPage(division, currentPath, categoryParam);

  return (
    <header
      className={cn(
        'sticky top-0 z-nav w-full border-b transition-[background-color,border-color,box-shadow] duration-300',
        scrolled || isOpen
          ? 'border-gray-200/80 bg-white/90 shadow-soft backdrop-blur-md'
          : 'border-transparent bg-white'
      )}
    >
      <nav aria-label="Navigasi utama" className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 rounded-lg" aria-label={`${COMPANY.shortName}, ke beranda`}>
          <img
            src={COMPANY.logoUrl}
            alt=""
            className="h-11 w-11 transition-transform duration-300 ease-out-expo group-hover:-rotate-6"
          />
          <span className="text-lg font-extrabold leading-tight tracking-tight text-gray-900">{COMPANY.shortName}</span>
        </Link>

        <ul className="hidden gap-0.5 self-stretch lg:flex">
          {items.map((item) =>
            item.children ? (
              <ProductsMenu key={item.path} item={item} counts={counts} active={isActive(item)} currentPath={currentPath} categoryParam={categoryParam} />
            ) : (
              <li key={item.path} className="flex items-center">
                <Link href={item.path} aria-current={isActive(item) ? 'page' : undefined} className={navLinkClass(isActive(item))}>
                  {item.name}
                </Link>
              </li>
            )
          )}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">
          <a href={COMPANY.phoneHref} className="hidden text-sm font-medium tabular-nums text-gray-600 transition-colors hover:text-brand-700 xl:block">
            {COMPANY.phoneDisplay}
          </a>
          <Button asChild>
            <a href={COMPANY.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Hubungi kami lewat WhatsApp (tab baru)">
              <WhatsappLogoIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
              Hubungi kami
            </a>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
          className="text-gray-900 lg:hidden"
        >
          {isOpen ? <XIcon className="h-6 w-6" aria-hidden="true" /> : <ListIcon className="h-6 w-6" aria-hidden="true" />}
        </Button>
      </nav>

      <div
        id="mobile-menu"
        className={cn(
          'grid border-t border-gray-100 bg-white transition-[grid-template-rows,opacity] duration-300 ease-out-expo lg:hidden',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] border-transparent opacity-0'
        )}
        inert={!isOpen}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1 px-4 pb-6 pt-3">
            {items.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  aria-current={currentPath === item.path ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-4 py-3 text-base transition-colors',
                    currentPath === item.path
                      ? 'bg-brand-50 font-semibold text-brand-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.name}
                  {currentPath === item.path && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />}
                </Link>
                {item.children?.length > 0 && (
                  <ul className="mb-1 ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                    {item.children.map((division) => (
                      <li key={division.slug}>
                        <Link
                          href={division.path}
                          onClick={() => setIsOpen(false)}
                          aria-current={isCurrentDivision(division) ? 'page' : undefined}
                          className={cn(
                            'block rounded-lg px-3 py-2.5 text-[15px] transition-colors',
                            isCurrentDivision(division) ? 'bg-brand-50 font-semibold text-brand-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          {division.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="pt-3">
              <Button asChild size="lg" className="w-full">
                <a
                  href={COMPANY.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  aria-label="Hubungi kami lewat WhatsApp (tab baru)"
                >
                  <WhatsappLogoIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
                  Hubungi kami
                </a>
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

// Reads ?id= so a /kategori/ page can be marked current. Rendered inside <Suspense> so pages can still be prerendered.
export const NavbarFromUrl = () => {
  const searchParams = useSearchParams();
  return <Navbar categoryParam={searchParams.get('id')} />;
};
