import React from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const GAP = 'gap';

// First, last and the neighbours of the current page; everything else collapses into a gap.
// Always seven slots, so the bar keeps its width and a gap never stands in for a single page.
const getPageItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const nearStart = current <= 4;
  const nearEnd = current >= total - 3;
  const start = nearStart ? 2 : nearEnd ? total - 4 : current - 1;
  const end = nearStart ? 5 : nearEnd ? total - 1 : current + 1;
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

        <ol className="hidden items-center gap-1 sm:flex">
          {getPageItems(currentPage, totalPages).map((item, i) =>
            item === GAP ? (
              <li key={`gap-${i}`} className="flex h-10 w-6 items-end justify-center pb-2.5 text-gray-400" aria-hidden="true">
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
                    'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold tabular-nums transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1',
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

        <span className="min-w-[4.5rem] px-2 text-center text-sm font-semibold tabular-nums text-gray-900 sm:hidden">
          {currentPage} <span className="font-normal text-gray-400">/</span> {totalPages}
        </span>

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
