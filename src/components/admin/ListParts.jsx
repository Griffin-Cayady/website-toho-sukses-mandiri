'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDownIcon, ArrowUpIcon, ArrowsDownUpIcon, CaretLeftIcon, CaretRightIcon, ImageIcon, MagnifyingGlassIcon, PencilSimpleIcon, TrashIcon, XIcon } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { imageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export const PAGE_SIZE = 20;

export const SearchBox = ({ id, value, onChange, placeholder, className }) => (
  <div className={cn('relative', className)}>
    <label htmlFor={id} className="sr-only">{placeholder}</label>
    <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
    <Input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 pl-10 pr-9 text-sm [&::-webkit-search-cancel-button]:hidden" />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <XIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
        <span className="sr-only">Hapus pencarian</span>
      </button>
    )}
  </div>
);

// Segmented filter with a count on each option, e.g. Semua 100 · Aktif 98 · Nonaktif 2. Doubles as the page's overview.
export const FilterTabs = ({ label, options, value, onChange }) => (
  // Phones: a 2-column grid, so four tabs never push the page wider than the screen.
  <div role="radiogroup" aria-label={label} className="grid min-w-0 grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 sm:inline-flex sm:self-start">
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex h-8 items-center justify-between gap-2 rounded-md px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:justify-start',
            active ? 'bg-white text-gray-900 shadow-soft' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {option.label}
          <span className={cn('rounded px-1.5 text-xs tabular-nums', active ? 'bg-brand-50 text-brand-800' : 'bg-gray-200/70 text-gray-600')}>
            {option.count}
          </span>
        </button>
      );
    })}
  </div>
);

// The "No" column: the row's position in the list as shown (after search and filters, continuing across pages),
// so admins can say "row 23". It is not the database id and changes when the list is filtered.
export const rowNumber = (page, index) => (page - 1) * PAGE_SIZE + index + 1;

export const NumberCell = ({ value }) => <td className="w-14 py-3 pl-5 pr-2 tabular-nums text-gray-500">{value}</td>;

// Product or category photo; a quiet placeholder when there is none.
export const Thumb = ({ path, className }) => {
  const src = path ? imageUrl(path) : null;
  return (
    <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 ring-1 ring-inset ring-gray-200/80', className)}>
      {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />}
    </div>
  );
};

// Small on/off switch for changing a row's status without opening the form.
export const RowSwitch = ({ checked, onChange, busy, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={busy}
    onClick={onChange}
    className={cn(
      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60',
      checked ? 'bg-brand-600' : 'bg-gray-300'
    )}
  >
    <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
  </button>
);

// Square icon button with a tooltip; the label stays readable for screen readers.
// `disabledReason` greys the button out and shows the reason as its tooltip. It uses aria-disabled rather than
// disabled so the button stays focusable and the tooltip still appears on hover and keyboard focus.
export const IconAction = ({ label, icon: Icon, href, onClick, tone = 'default', disabledReason }) => {
  const className = cn(
    'group relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
    disabledReason
      ? 'cursor-not-allowed text-gray-300'
      : tone === 'danger'
        ? 'text-gray-500 hover:bg-red-50 hover:text-red-600'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
  );
  if (disabledReason) label = disabledReason;
  const content = (
    <>
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {/* Anchored to the right edge so it grows leftwards: these buttons sit at the end of a row, and a centred
          tooltip would stick out past the screen and make phones scroll sideways (even while invisible). */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full right-0 z-dropdown mb-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {label}
      </span>
    </>
  );
  if (href) return <Link href={href} className={className}>{content}</Link>;
  return (
    <button type="button" onClick={disabledReason ? undefined : onClick} aria-disabled={disabledReason ? true : undefined} className={className}>
      {content}
    </button>
  );
};

// `deleteBlocked`: why this row can't be deleted (e.g. a category that still has products); greys out the bin.
export const RowActions = ({ editHref, onDelete, name, deleteBlocked }) => (
  <div className="flex justify-end gap-0.5">
    <IconAction label={`Edit ${name}`} icon={PencilSimpleIcon} href={editHref} />
    <IconAction label={`Hapus ${name}`} icon={TrashIcon} onClick={onDelete} tone="danger" disabledReason={deleteBlocked} />
  </div>
);

const DATE_FORMAT = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// "17 Okt 2026" from a MySQL timestamp ("2026-10-17 09:41:02"); null when the row was never stamped.
export const formatDate = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(String(timestamp).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : DATE_FORMAT.format(date);
};

export const Pagination = ({ page, pageCount, total, onPage }) => {
  if (total <= PAGE_SIZE) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const button = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:border-brand-600 hover:text-brand-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40';
  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:px-5">
      <p className="tabular-nums">
        Menampilkan <span className="font-medium text-gray-900">{from}–{to}</span> dari {total}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={button} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Halaman sebelumnya">
          <CaretLeftIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="min-w-[3.5rem] text-center tabular-nums">
          {page} / {pageCount}
        </span>
        <button type="button" className={button} onClick={() => onPage(page + 1)} disabled={page >= pageCount} aria-label="Halaman berikutnya">
          <CaretRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

// The white panel holding a list: toolbar on top, then rows, then pagination.
export const Panel = ({ toolbar, busy, children }) => (
  <section className="rounded-2xl bg-white shadow-soft ring-1 ring-gray-200/70" aria-busy={busy}>
    {toolbar && <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">{toolbar}</div>}
    {children}
  </section>
);

// Table for md and up; phones get <MobileList> instead, so the page never scrolls sideways.
// A head cell with `sortKey` becomes a button: `sort` is { key, dir } and `onSort(key)` is called on click.
export const Table = ({ head, sort, onSort, children }) => (
  <div className="hidden overflow-x-auto md:block">
    <table className="w-full min-w-[880px] text-left text-sm">
      <thead className="text-[13px] font-medium text-gray-500">
        <tr className="border-b border-gray-100">
          {head.map((cell) => (
            <th
              key={cell.label}
              scope="col"
              aria-sort={cell.sortKey && sort?.key === cell.sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
              className={cn('whitespace-nowrap px-4 py-3 first:pl-5 last:pr-5', cell.className)}
            >
              {cell.srOnly ? (
                <span className="sr-only">{cell.label}</span>
              ) : cell.sortKey && onSort ? (
                <SortButton label={cell.label} active={sort?.key === cell.sortKey} dir={sort?.dir} onClick={() => onSort(cell.sortKey)} />
              ) : (
                cell.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    </table>
  </div>
);

// Column heading that sorts the list; the arrow shows the current direction, a faint double arrow means "sortable".
const SortButton = ({ label, active, dir, onClick }) => {
  const Icon = !active ? ArrowsDownUpIcon : dir === 'asc' ? ArrowUpIcon : ArrowDownIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        active && 'text-gray-900'
      )}
    >
      {label}
      <Icon className={cn('h-3.5 w-3.5', active ? 'text-brand-700' : 'text-gray-300 group-hover:text-gray-500')} weight="bold" aria-hidden="true" />
    </button>
  );
};

export const MobileList = ({ loading, empty, children }) => (
  <ul className="divide-y divide-gray-100 md:hidden">
    {loading
      ? Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex gap-3 p-4" aria-hidden="true">
            <div className="h-14 w-14 animate-pulse rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          </li>
        ))
      : empty
        ? <li>{empty}</li>
        : children}
  </ul>
);

// One stacked row on phones: photo, row number and title linking to the edit page, a meta line, then status and actions.
export const MobileRow = ({ no, thumb, title, href, meta, status, actions }) => (
  <li className="flex gap-3 p-4">
    <Thumb path={thumb} />
    <div className="min-w-0 flex-1">
      <p className="flex min-w-0 items-baseline gap-1.5">
        {no != null && <span className="shrink-0 text-sm tabular-nums text-gray-400">{no}.</span>}
        <Link href={href} className="truncate font-semibold text-gray-900 hover:text-brand-700">
          {title}
        </Link>
      </p>
      <div className="mt-0.5 text-sm text-gray-500">{meta}</div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {status}
        {actions}
      </div>
    </div>
  </li>
);

export const EmptyRow = ({ colSpan, children }) => (
  <tr>
    <td colSpan={colSpan}>{children}</td>
  </tr>
);

// Empty list: an icon, what happened, and the next step.
export const EmptyState = ({ icon: Icon, title, children, action }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
    <p className="mt-4 font-semibold text-gray-900">{title}</p>
    {children && <p className="mt-1 max-w-sm text-pretty text-sm text-gray-500">{children}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// Placeholder rows while the table loads, shaped like the real rows.
export const LoadingRows = ({ colSpan, rows = 6 }) =>
  Array.from({ length: rows }, (_, i) => (
    <tr key={i} aria-hidden="true">
      <td colSpan={colSpan} className="px-5 py-3">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </td>
    </tr>
  ));
