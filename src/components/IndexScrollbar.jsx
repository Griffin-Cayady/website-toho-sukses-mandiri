'use client';

import React, { useRef, useState } from 'react';
import { CaretUpIcon, CaretDownIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

/**
 * Branded vertical scrollbar for a list of equal-height rows (the home page category index).
 * Green thumb sized to the visible share of the list; one dot per row, white while that row is in view and logo
 * yellow for `activeIndex`. Drag the thumb, click the track to jump, hover the track to see which row sits there,
 * or step a row with the caret buttons. Mouse-only: keyboard users scroll the list itself by tabbing through its rows,
 * so the rail is hidden from assistive technology.
 *
 * `metrics` is the list's { top, client, height } (scrollTop, clientHeight, scrollHeight); `labels` one name per row.
 */
const IndexScrollbar = ({ listRef, metrics, labels, activeIndex }) => {
  const trackRef = useRef(null);
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(null); // { y: px within the track, index }

  const { top, client, height } = metrics;
  const count = labels.length;
  const maxScroll = Math.max(1, height - client);
  const thumbSize = Math.min(100, (client / height) * 100);
  const thumbTop = (top / maxScroll) * (100 - thumbSize);
  const rowHeight = height / count;

  const trackBox = () => trackRef.current.getBoundingClientRect();

  // Row index under a pointer position on the track (track spans the whole list, top to bottom).
  const indexAt = (clientY) => {
    const box = trackBox();
    return Math.min(count - 1, Math.max(0, Math.floor(((clientY - box.top) / box.height) * count)));
  };

  const onThumbDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startTop: listRef.current.scrollTop };
    setDragging(true);
  };

  const onThumbMove = (e) => {
    if (!drag.current) return;
    // Thumb travel maps linearly onto scroll range.
    const travel = trackBox().height * (1 - thumbSize / 100);
    listRef.current.scrollTop = drag.current.startTop + ((e.clientY - drag.current.startY) / travel) * maxScroll;
  };

  const onThumbUp = () => {
    drag.current = null;
    setDragging(false);
  };

  // Click on the track: bring the row under the pointer to the middle of the list.
  const onTrackDown = (e) => {
    const index = indexAt(e.clientY);
    listRef.current.scrollTo({ top: (index + 0.5) * rowHeight - client / 2, behavior: 'smooth' });
  };

  const onTrackMove = (e) => {
    if (drag.current) return;
    setHover({ y: e.clientY - trackBox().top, index: indexAt(e.clientY) });
  };

  const step = (direction) => listRef.current.scrollBy({ top: direction * rowHeight, behavior: 'smooth' });

  const atTop = top <= 4;
  const atBottom = top + client >= height - 4;

  const stepButton = (direction, disabled, Icon) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => step(direction)}
      disabled={disabled}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-[background-color,color,opacity,transform] duration-200 hover:bg-brand-50 hover:text-brand-700 active:scale-90 disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="h-3.5 w-3.5" weight="bold" />
    </button>
  );

  return (
    <div className="flex w-7 shrink-0 select-none flex-col items-center gap-1.5" aria-hidden="true">
      {stepButton(-1, atTop, CaretUpIcon)}

      <div
        ref={trackRef}
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerLeave={() => setHover(null)}
        className="group/rail relative w-full flex-1 cursor-pointer touch-none"
      >
        {/* Track line */}
        <span className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-gray-200 transition-[width,background-color] duration-300 group-hover/rail:w-1.5 group-hover/rail:bg-gray-300/70" />

        {/* Thumb: the share of the list in view */}
        <span
          onPointerDown={onThumbDown}
          onPointerMove={onThumbMove}
          onPointerUp={onThumbUp}
          onPointerCancel={onThumbUp}
          style={{ top: `${thumbTop}%`, height: `${thumbSize}%` }}
          className={cn(
            'absolute left-1/2 -translate-x-1/2 rounded-full bg-brand-600 transition-[width,background-color,box-shadow] duration-300 ease-out-expo',
            dragging ? 'w-3 cursor-grabbing bg-brand-700 shadow-brand' : 'w-2 cursor-grab group-hover/rail:w-3 group-hover/rail:shadow-brand'
          )}
        />

        {/* One dot per row */}
        {labels.map((label, i) => {
          const rowTop = i * rowHeight;
          const inView = rowTop + rowHeight > top + 1 && rowTop < top + client - 1;
          return (
            <span
              key={label + i}
              style={{ top: `${((i + 0.5) / count) * 100}%` }}
              className={cn(
                'pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,width,height] duration-300',
                i === activeIndex ? 'h-1.5 w-1.5 bg-sun' : inView ? 'h-1 w-1 bg-white/90' : 'h-1 w-1 bg-gray-400/70'
              )}
            />
          );
        })}

        {/* Hover label: which row a click would bring into view */}
        {hover && !dragging && (
          <span
            style={{ top: hover.y }}
            className="pointer-events-none absolute right-full z-raised mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lift"
          >
            <span className="mr-1.5 tabular-nums text-sun">{String(hover.index + 1).padStart(2, '0')}</span>
            {labels[hover.index]}
          </span>
        )}
      </div>

      {stepButton(1, atBottom, CaretDownIcon)}
    </div>
  );
};

export default IndexScrollbar;
