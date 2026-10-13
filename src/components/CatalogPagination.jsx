import React from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const GAP = 'gap';

// First, last and the current page (plus its neighbours when there is room); everything else collapses into a gap.
// Always `slots` items (7 on wide screens, 5 on phones), so the bar keeps its width and a gap never stands in for a single page.
const getPageItems = (current, total, slots) => {
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);

  const siblings = (slots - 5) / 2;
  const nearStart = current <= siblings + 3;
  const nearEnd = current >= total - siblings - 2;
  const start = nearStart ? 2 : nearEnd ? total - (slots - 3) : current - siblings;
  const end = nearStart ? slots - 2 : nearEnd ? total - 1 : current + siblings;
  const items = [1];
  if (start > 2) items.push(GAP);
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push(GAP);
  items.push(total);
  return items;
};

const stepClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-[background-color,color,transform] duration-200 ease-out hover:bg-gray-100 hover:text-gray-900 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:text-gray-300';

const CatalogPagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  const firstItem = (currentPage - 1) * itemsPerPage + 1;
  const lastItem = Math.min(currentPage * itemsPerPage, totalItems);
  const progress = (currentPage / totalPages) * 100;

  return (
    <nav
      aria-label="Halaman katalog"
      className="mt-12 flex flex-col items-center gap-5 border-t border-gray-200 pt-8 sm:flex-row sm:justify-between md:mt-16"
    >
      <div className="flex flex-col items-center gap-2.5 sm:items-start">
        <p className="text-sm text-gray-600" aria-live="polite">
          Menampilkan{' '}
          <span className="font-semibold tabular-nums text-gray-900">
            {firstItem}–{lastItem}
          </span>{' '}
          dari <span className="font-semibold tabular-nums text-gray-900">{totalItems}</span> produk
        </p>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out-expo"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-soft ring-1 ring-gray-200">
        <button
          type="button"
          className={stepClass}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Halaman sebelumnya"
        >
          <CaretLeftIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
        </button>

        {/* Phones: 5 slots so the bar fits; from sm: 7 slots. Both let users jump straight to a page. */}
        {[
          { slots: 5, className: 'flex sm:hidden' },
          { slots: 7, className: 'hidden sm:flex' },
        ].map(({ slots, className }) => (
          <ol key={slots} className={cn('items-center gap-1', className)}>
            {getPageItems(currentPage, totalPages, slots).map((item, i) =>
              item === GAP ? (
                <li key={`gap-${i}`} className="flex h-10 w-5 items-end justify-center pb-2.5 text-gray-400 sm:w-6" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => onPageChange(item)}
                    aria-current={item === currentPage ? 'page' : undefined}
                    aria-label={`Halaman ${item}`}
                    className={cn(
                      'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 sm:px-3',
                      item === currentPage
                        ? 'bg-brand-600 text-white shadow-brand'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    {item}
                  </button>
                </li>
              ),
            )}
          </ol>
        ))}

        <button
          type="button"
          className={stepClass}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Halaman berikutnya"
        >
          <CaretRightIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default CatalogPagination;
