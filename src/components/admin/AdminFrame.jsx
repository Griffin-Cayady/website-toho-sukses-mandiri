'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
  CircleNotchIcon,
  EnvelopeSimpleIcon,
  ListIcon,
  PackageIcon,
  SignOutIcon,
  SquaresFourIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useAdmin } from '@/contexts/AdminContext.jsx';
import { IMAGES } from '@/lib/images';
import { cn } from '@/lib/utils';

export const ADMIN_HOME = '/admin-back-office/';

// The sidebar menu. New back office sections (e.g. settings) are added here as another group or item.
const NAV_GROUPS = [
  {
    label: 'Katalog',
    items: [
      { href: '/admin-back-office/produk/', label: 'Produk', icon: PackageIcon },
      { href: '/admin-back-office/kategori/', label: 'Kategori', icon: SquaresFourIcon },
    ],
  },
  {
    label: 'Kontak',
    items: [{ href: '/admin-back-office/pesan/', label: 'Pesan masuk', icon: EnvelopeSimpleIcon }],
  },
];

// Remembers whether the desktop sidebar is narrowed to icons (per browser; the default is the full sidebar).
const COLLAPSED_KEY = 'tsm-admin-sidebar-collapsed';
const readCollapsed = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
};

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

export const FullPageSpinner = ({ label = 'Memuat…' }) => (
  <div className="flex min-h-[100dvh] items-center justify-center" role="status">
    <CircleNotchIcon className="h-7 w-7 animate-spin text-brand-600" aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

// Wraps every back office page except the login: sends logged-out visitors to the login page, then shows the
// sidebar and the page heading. `back` ({ href, label }) adds a link above the title, used by the edit pages.
// `wide` lets list pages use the whole screen width; forms keep a narrower, easier-to-read column.
export default function AdminFrame({ title, description, actions, back, wide, children }) {
  const { user, status, logout } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (status === 'out') router.replace(ADMIN_HOME);
  }, [status, router]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  if (status !== 'in') return <FullPageSpinner />;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Storage blocked (private mode): the choice just isn't remembered.
    }
  };

  const sidebarProps = { pathname, user, logout };

  return (
    <div className="min-h-[100dvh] lg:flex">
      {/* Desktop: full sidebar, or an icon rail when collapsed. */}
      <aside
        aria-label="Menu back office"
        className={cn(
          'sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 ease-out-expo lg:flex',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent {...sidebarProps} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {/* Phones and tablets: a top bar that opens the same menu as a drawer. */}
      <div className="sticky top-0 z-nav flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-2 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <ListIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
          <span className="sr-only">Buka menu</span>
        </button>
        <Brand />
      </div>

      <div
        className={cn(
          'fixed inset-0 z-nav bg-gray-950/40 transition-opacity duration-200 lg:hidden',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="admin-drawer"
        aria-label="Menu back office"
        inert={!drawerOpen}
        className={cn(
          'fixed inset-y-0 left-0 z-banner flex w-72 max-w-[85vw] flex-col bg-white shadow-lift transition-transform duration-300 ease-out-expo lg:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent {...sidebarProps} collapsed={false} onNavigate={() => setDrawerOpen(false)} onClose={() => setDrawerOpen(false)} />
      </aside>

      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
        <div className={cn('mx-auto px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10', wide ? 'max-w-[1800px]' : 'max-w-6xl')}>
          <header className="mb-8">
            {back && (
              <Link
                href={back.href}
                className="mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-gray-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                {back.label}
              </Link>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">{title}</h1>
                {description && <p className="mt-1.5 max-w-2xl text-pretty text-[15px] leading-relaxed text-gray-600">{description}</p>}
              </div>
              {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
            </div>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}

const Brand = ({ compact }) => (
  <Link
    href="/admin-back-office/produk/"
    className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
  >
    <img src={IMAGES.logo} alt="" className="h-9 w-9 shrink-0" />
    <span className={cn('min-w-0 leading-tight', compact && 'sr-only')}>
      <span className="block truncate text-sm font-bold text-gray-900">Toho Sukses Mandiri</span>
      <span className="block text-xs font-medium text-gray-500">Back office</span>
    </span>
  </Link>
);

// Shown next to rail icons on hover and keyboard focus; the label itself stays in the DOM for screen readers.
const RailTooltip = ({ children }) => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute left-full top-1/2 z-dropdown ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lift transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
  >
    {children}
  </span>
);

function SidebarContent({ pathname, user, logout, collapsed, onToggleCollapsed, onNavigate, onClose }) {
  return (
    <>
      <div className={cn('flex h-16 shrink-0 items-center border-b border-gray-100', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
        <Brand compact={collapsed} />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <XIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Tutup menu</span>
          </button>
        )}
      </div>

      {/* The rail can't scroll: overflow would clip the tooltips that stick out to the right. */}
      <nav aria-label="Menu utama" className={cn('flex-1 px-3 py-5', collapsed ? 'overflow-visible' : 'overflow-y-auto')}>
        {NAV_GROUPS.map((group, index) => (
          <div key={group.label} className={index > 0 ? 'mt-6' : undefined}>
            {collapsed ? (
              index > 0 && <hr className="mx-2 mb-6 -mt-2 border-gray-200" />
            ) : (
              <p className="mb-1.5 px-3 text-xs font-semibold text-gray-500">{group.label}</p>
            )}
            <ul className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-11 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                        collapsed ? 'justify-center' : 'px-3',
                        active ? 'bg-brand-50 text-brand-800' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      {active && <span className="absolute -left-3 top-2.5 h-6 w-1 rounded-r-full bg-brand-600" aria-hidden="true" />}
                      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-brand-700' : 'text-gray-500 group-hover:text-gray-700')} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                      <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
                      {collapsed && <RailTooltip>{label}</RailTooltip>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-gray-100 p-3">
        <div className={cn('flex items-center gap-3', collapsed ? 'flex-col' : 'px-1')}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-100 text-[13px] font-bold text-brand-800"
            title={collapsed ? user.name : undefined}
            aria-hidden="true"
          >
            {initials(user.name) || '?'}
          </span>
          <div className={collapsed ? 'sr-only' : 'min-w-0 flex-1 leading-tight'}>
            <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <SignOutIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Keluar</span>
            <RailTooltip>Keluar</RailTooltip>
          </button>
        </div>

        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            className={cn(
              'group relative mt-2 flex h-11 w-full items-center gap-3 rounded-lg text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
              collapsed ? 'justify-center' : 'px-3'
            )}
          >
            {collapsed ? <CaretDoubleRightIcon className="h-5 w-5" aria-hidden="true" /> : <CaretDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />}
            <span className={collapsed ? 'sr-only' : undefined}>{collapsed ? 'Lebarkan menu' : 'Ciutkan menu'}</span>
            {collapsed && <RailTooltip>Lebarkan menu</RailTooltip>}
          </button>
        )}
      </div>
    </>
  );
}
