'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ListIcon, XIcon, WhatsappLogoIcon, CaretDownIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COMPANY } from '@/lib/company';
import { isDivisionPage, isMerkPage } from '@/lib/divisions';
import { IMAGES } from '@/lib/images';
import { useCatalog } from '@/contexts/CatalogContext.jsx';

// "Produk" opens a menu with the product categories and merks from the database (see ProductsMenu below).
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

// One category or merk in the "Produk" panel: a small card, the name over its product count. On hover (or keyboard focus)
// brand-700 wipes across it from the left, like the product cards' "Minta penawaran" row: the name turns white and the
// count light green as the fill passes under them (delays), and an arrow glides in at the right edge as the fill reaches
// it. All on one soft ease-in-out, ease-in-out-soft (tailwind.config.js).
const MenuRow = ({ row, index, open, loading, onNavigate }) => (
  <li
    className={cn(
      'min-w-0 transition-[opacity,transform] duration-500 ease-out-expo motion-reduce:transition-none',
      open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0 delay-0'
    )}
    style={open ? { transitionDelay: tileDelay(index) } : undefined}
  >
    <Link
      href={row.path}
      onClick={onNavigate}
      aria-current={row.current ? 'page' : undefined}
      className={cn(
        'group relative isolate flex h-full flex-col overflow-hidden rounded-xl py-3.5 pl-4 pr-10 ring-1 ring-inset transition-[box-shadow] duration-500 ease-in-out-soft hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        row.current ? 'bg-brand-50 ring-brand-200' : 'bg-gray-50 ring-gray-200/80 hover:ring-brand-700'
      )}
    >
      {/* The green fill that wipes in from the left. */}
      <span
        className="absolute inset-0 -z-10 origin-left scale-x-0 bg-brand-700 transition-transform duration-600 ease-in-out-soft group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
        aria-hidden="true"
      />
      <span
        className={cn(
          'truncate text-[15px] font-semibold tracking-tight transition-colors duration-300 ease-in-out-soft group-hover:text-white group-hover:delay-200 group-focus-visible:text-white',
          row.current ? 'text-brand-700' : 'text-gray-900'
        )}
      >
        {row.name}
      </span>
      <span className="mt-1 text-sm tabular-nums text-gray-500 transition-colors duration-300 ease-in-out-soft group-hover:text-brand-100 group-hover:delay-250 group-focus-visible:text-brand-100">
        {loading ? '...' : `${row.count} produk`}
      </span>
      <ArrowRightIcon
        className="absolute right-4 top-1/2 h-4 w-4 -translate-x-2 -translate-y-1/2 text-white opacity-0 transition-[opacity,transform] duration-500 ease-in-out-soft group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-250 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
        weight="bold"
        aria-hidden="true"
      />
    </Link>
  </li>
);

/**
 * "Produk" button with a full-width panel: two groups stacked on one white surface, each row a page of products: the categories (tbl_product_category) and the merks (tbl_master_merk) that
 * have active products. `item.children` holds the groups.
 * Mouse: opens on hover (short intent delay); a click pins it open. Touch and keyboard: the button toggles it.
 * Escape, clicking outside, or moving focus away closes it.
 */
const ProductsMenu = ({ item, active }) => {
  const { loading } = useCatalog();
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
    // On the document, not the menu: a hover-opened panel must close on Escape while focus is elsewhere (WCAG 1.4.13).
    // Focus goes back to the button only when it was inside the menu.
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      const focusInside = rootRef.current?.contains(document.activeElement);
      clearTimeout(hoverTimer.current);
      openedBy.current = null;
      setOpen(false);
      if (focusInside) buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  return (
    <li
      ref={rootRef}
      className="flex"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && close()}
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
          'absolute inset-x-0 top-full max-h-[calc(100dvh-4.5rem)] overflow-y-auto overflow-x-hidden border-t border-gray-200 bg-white shadow-lift transition-[opacity,clip-path,visibility] ease-out-expo motion-reduce:transition-none',
          open
            ? 'visible opacity-100 duration-500 [clip-path:inset(0_0_0_0)]'
            : 'invisible opacity-0 duration-200 [clip-path:inset(0_0_100%_0)]'
        )}
      >
        {/* Plain white panel structured by hairlines: each group is a band with its label on the left and its rows in
            columns on the right, like a catalogue index. */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="divide-y divide-gray-200">
            {item.children.map((group, g) => {
              // Rows keep cascading from one group into the next.
              const offset = item.children.slice(0, g).reduce((n, prev) => n + prev.rows.length, 0);
              return (
                <section key={group.key} aria-labelledby={`menu-group-${group.key}`} className="grid min-w-0 grid-cols-12 gap-x-10 py-7">
                  <div className="col-span-3 pt-3 xl:col-span-2">
                    <p id={`menu-group-${group.key}`} className="text-sm font-semibold text-gray-900">
                      {group.label}
                    </p>
                    {!loading && group.rows.length > 0 && (
                      <p className="mt-1 text-sm tabular-nums text-gray-500">
                        {group.rows.length} {group.label.toLowerCase()}
                      </p>
                    )}
                  </div>

                  <ul className="col-span-9 grid grid-cols-3 gap-3 xl:col-span-10 xl:grid-cols-4">
                    {loading && group.rows.length === 0 ? (
                      [0, 1].map((i) => (
                        <li key={i} className="space-y-2 rounded-xl bg-gray-50 px-4 py-4 ring-1 ring-inset ring-gray-200/80">
                          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                          <div className="h-3.5 w-16 animate-pulse rounded bg-gray-200" />
                        </li>
                      ))
                    ) : group.rows.length === 0 ? (
                      <li className="col-span-full px-2 py-3 text-sm text-gray-600">{group.empty}</li>
                    ) : (
                      group.rows.map((row, i) => (
                        <MenuRow key={row.key} row={row} index={offset + i} open={open} loading={loading} onNavigate={close} />
                      ))
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </li>
  );
};

const Navbar = ({ idParam = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { products, divisions, merks } = useCatalog();

  // Active products per tbl_product_category.id.
  const counts = useMemo(
    () => products.reduce((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] || 0) + 1 }), {}),
    [products]
  );
  // The menus list only categories that have active products; an empty one would lead to an empty page.
  const menuDivisions = useMemo(() => divisions.filter((d) => counts[d.categoryId]), [divisions, counts]);

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
  const productPaths = ['/products', '/kategori', '/merk'];
  const isActive = (item) => (item.children ? productPaths.includes(currentPath) : currentPath === item.path);

  const menuGroups = [
    {
      key: 'kategori',
      label: 'Kategori',
      empty: 'Belum ada kategori.',
      rows: menuDivisions.map((d) => ({
        key: d.slug,
        name: d.name,
        path: d.path,
        // The category photo; the shared placeholder art counts as none, so the tile shows the first letter instead.
        image: d.image === IMAGES.categoryPlaceholder ? null : d.image,
        count: counts[d.categoryId],
        current: isDivisionPage(d, currentPath, idParam),
      })),
    },
    {
      key: 'merk',
      label: 'Brand',
      empty: 'Belum ada brand.',
      rows: merks.map((m) => ({ ...m, key: m.id, image: m.imageUrl, current: isMerkPage(m, currentPath, idParam) })),
    },
  ];
  const items = navItems.map((item) => (item.hasMenu ? { ...item, children: menuGroups } : item));

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
              <ProductsMenu key={item.path} item={item} active={isActive(item)} />
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
        {/* Scrolls inside itself: the sticky header would otherwise push the end of a long category/merk list off screen. */}
        {/* 74px = the 72px bar plus the header's and this panel's 1px borders. */}
        <div className="max-h-[calc(100dvh-74px)] overflow-y-auto overscroll-contain">
          <ul className="space-y-1 px-4 pb-6 pt-3">
            {items.map((item) => (
              <li key={item.path}>
                {/* Highlighted like the desktop bar (Produk on /kategori and /merk too); aria-current only on the exact page. */}
                <Link
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  aria-current={currentPath === item.path ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-4 py-3 text-base transition-colors',
                    isActive(item)
                      ? 'bg-brand-50 font-semibold text-brand-800'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.name}
                  {isActive(item) && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden="true" />}
                </Link>
                {item.children?.filter((group) => group.rows.length > 0).map((group) => (
                  <div key={group.key} className="mb-1 ml-4 mt-2 border-l border-gray-200 pl-3">
                    <p id={`mobile-group-${group.key}`} className="px-3 pb-1 text-xs font-semibold text-gray-500">{group.label}</p>
                    <ul aria-labelledby={`mobile-group-${group.key}`} className="space-y-0.5">
                      {group.rows.map((row) => (
                        <li key={row.key}>
                          <Link
                            href={row.path}
                            onClick={() => setIsOpen(false)}
                            aria-current={row.current ? 'page' : undefined}
                            className={cn(
                              'block rounded-lg px-3 py-3 text-[15px] transition-colors',
                              row.current ? 'bg-brand-50 font-semibold text-brand-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            {row.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
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

// Reads ?id= so the /kategori/ or /merk/ page being viewed can be marked current. Rendered inside <Suspense> so pages can still be prerendered.
export const NavbarFromUrl = () => {
  const searchParams = useSearchParams();
  return <Navbar idParam={searchParams.get('id')} />;
};
