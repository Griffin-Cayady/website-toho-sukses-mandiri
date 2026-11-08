'use client';

import React from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

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
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-soft ring-1 ring-gray-200 transition-[background-color,color,opacity,transform] duration-200 hover:bg-brand-action hover:text-white hover:ring-brand-action active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon className="h-4 w-4" weight="bold" aria-hidden="true" />
      </button>
    ))}
  </div>
);

// Row edges from its scroll position, with a few pixels of slack for rounding.
export const edgesOf = (track) => ({ start: track.scrollLeft <= 4, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 });

export default CarouselArrows;
