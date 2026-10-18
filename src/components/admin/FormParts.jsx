'use client';

import React from 'react';
import { CircleNotchIcon, WarningIcon } from '@phosphor-icons/react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Label, control, optional hint and the server's validation message for one form field.
export const Field = ({ id, label, required, hint, error, children, className }) => (
  <div className={cn('space-y-2', className)}>
    <Label htmlFor={id} className="text-sm font-medium text-gray-800">
      {label}
      {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
    </Label>
    {children}
    {hint && !error && <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>}
    {error && (
      <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-red-600">
        <WarningIcon className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
        {error}
      </p>
    )}
  </div>
);

// Props that connect a control to its Field's hint/error, e.g. <Input {...describedBy('name', errors.name)} />.
export const describedBy = (id, error) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
});

export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-lg border border-input bg-white px-3 text-[15px] text-gray-900 transition-[border-color,box-shadow] duration-200 hover:border-gray-400 focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-4 focus-visible:ring-brand-600/15 aria-[invalid=true]:border-red-500',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

// On/off switch with its label and an explanation of what "on" means.
export const Switch = ({ id, checked, onChange, label, description, className }) => (
  <div className={cn('flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4', className)}>
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-900">{label}</label>
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
    </div>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        checked ? 'bg-brand-600' : 'bg-gray-300'
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  </div>
);

export const StatusBadge = ({ active }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold',
      active ? 'bg-brand-50 text-brand-800' : 'bg-gray-100 text-gray-600'
    )}
  >
    <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-brand-600' : 'bg-gray-400')} aria-hidden="true" />
    {active ? 'Aktif' : 'Nonaktif'}
  </span>
);

export const Spinner = ({ className }) => <CircleNotchIcon className={cn('h-4 w-4 animate-spin', className)} aria-hidden="true" />;

// Layout shared by the product and category edit pages: the form card, then a side panel (preview, switches,
// details, buttons) that stays in view. Wide screens split the form card in two (see EDITOR_CARD).
export const EDITOR_GRID = 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] min-[1600px]:grid-cols-[minmax(0,1fr)_400px]';
export const EDITOR_CARD = 'divide-y divide-gray-100 rounded-2xl bg-white shadow-soft ring-1 ring-gray-200/70 min-[1600px]:grid min-[1600px]:grid-cols-2 min-[1600px]:divide-x min-[1600px]:divide-y-0';
export const EDITOR_PANEL = 'overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-200/70 lg:sticky lg:top-6';

// One part of the form card: a short heading and what it's for, then its fields.
export const FormGroup = ({ title, subtitle, children }) => (
  <section className="px-5 pb-7 pt-6 sm:px-8">
    <header className="mb-5">
      <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
      {subtitle && <p className="mt-0.5 text-pretty text-sm text-gray-500">{subtitle}</p>}
    </header>
    {children}
  </section>
);

// "12 / 255" under a text field; turns amber close to the limit.
export const CharCount = ({ value, max }) => (
  <span className={cn('shrink-0 whitespace-nowrap tabular-nums', value.length > max * 0.9 ? 'text-amber-700' : 'text-gray-400')}>
    {value.length} / {max}
  </span>
);

// Label + value row in the side panel's details list.
export const InfoRow = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
    <dt className="text-gray-500">{label}</dt>
    <dd className="min-w-0 truncate text-right font-medium text-gray-900">{children}</dd>
  </div>
);

// The side panel's on/off switch, without the switch's own border box.
export const PANEL_SWITCH = 'rounded-none border-x-0 border-b-0 border-gray-100 px-5';

// Save and cancel: in the side panel on desktop, in a bar along the bottom of the screen on smaller screens.
export const EditorActions = ({ children }) => (
  <div className="sticky bottom-0 z-raised -mx-4 mt-6 flex gap-2 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
    {children}
  </div>
);
export const PanelActions = ({ children }) => <div className="hidden gap-2 border-t border-gray-100 bg-gray-50/70 p-4 lg:flex">{children}</div>;

// Grey blocks in the shape of an edit page (form card left, side panel right) while its data loads.
export const EditorSkeleton = () => {
  const block = 'animate-pulse rounded-2xl bg-white ring-1 ring-gray-200/70';
  return (
    <div className={EDITOR_GRID} role="status" aria-busy="true">
      <span className="sr-only">Memuat…</span>
      <div className={`${block} h-[720px]`} aria-hidden="true" />
      <div className={`${block} h-[460px]`} aria-hidden="true" />
    </div>
  );
};

// Message box for a list or form that could not load.
export const LoadError = ({ message, onRetry }) => (
  <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
    <p className="flex items-center gap-2 font-semibold">
      <WarningIcon className="h-5 w-5 text-amber-600" weight="fill" aria-hidden="true" />
      Data tidak dapat dimuat
    </p>
    <p className="mt-1 text-sm">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="mt-4 text-sm font-semibold text-amber-900 underline underline-offset-4">
        Coba lagi
      </button>
    )}
  </div>
);
