'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CircleNotchIcon, FloppyDiskIcon, WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
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
    {hint && <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>}
    {error && (
      <p id={`${id}-error`} className="flex items-center gap-1.5 text-sm text-red-600">
        <WarningIcon className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
        {error}
      </p>
    )}
  </div>
);

// Props that connect a control to its Field's hint and error, e.g. <Input {...describedBy('name', errors.name, true)} />.
// Pass `hasHint` when the Field has a hint, so screen readers read it too.
export const describedBy = (id, error, hasHint) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': [hasHint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined,
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
      {description && <p id={`${id}-desc`} className="mt-0.5 text-sm text-gray-500">{description}</p>}
    </div>
    {/* The ::after layer stretches the tap area to 44px tall without changing how the switch looks. */}
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        checked ? 'bg-brand-600' : 'bg-gray-500'
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  </div>
);

export const Spinner = ({ className }) => <CircleNotchIcon className={cn('h-4 w-4 animate-spin', className)} aria-hidden="true" />;

// The edit pages (product, category, merk) share one layout: a single card read top to bottom, its sections
// (FormGroup) divided by lines, and a SaveBar as the last section.
export const EDITOR_CARD = 'divide-y divide-gray-100 rounded-2xl bg-white shadow-soft ring-1 ring-gray-200/70';

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
  <span className={cn('shrink-0 whitespace-nowrap tabular-nums', value.length > max * 0.9 ? 'text-amber-700' : 'text-gray-500')}>
    {value.length} / {max}
  </span>
);

// Label + value row in an edit page's "Riwayat" list.
export const InfoRow = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
    <dt className="text-gray-500">{label}</dt>
    <dd className="min-w-0 truncate text-right font-medium text-gray-900">{children}</dd>
  </div>
);

// The last section of an edit card: Batal and the save button on the right, pinned to the bottom of the screen
// while the form scrolls. `data-editor-actions` lets globals.css keep a focused field from scrolling under it.
// `busyLabel` replaces the button text while `busy` (e.g. "Menyimpan…").
export const SaveBar = ({ cancelHref, label, busy, busyLabel, disabled }) => (
  <div data-editor-actions className="sticky bottom-0 z-raised rounded-b-2xl bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
    <div className="flex items-center justify-end gap-3">
      <Button asChild variant="outline" className="h-11">
        <Link href={cancelHref}>Batal</Link>
      </Button>
      <Button type="submit" disabled={busy || disabled} className="h-11 flex-1 px-6 sm:flex-none">
        {busy ? <Spinner /> : <FloppyDiskIcon className="h-4 w-4" weight="bold" aria-hidden="true" />}
        {busy ? busyLabel : label}
      </Button>
    </div>
  </div>
);

// Shown above the edit card when saving failed; takes focus so the message is read out and seen.
export const SaveError = ({ title, message }) => {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, [message]);
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 focus:outline-none">
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" weight="fill" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm">{message} Isian Anda masih ada; coba simpan lagi.</p>
      </div>
    </div>
  );
};

// A grey block in the shape of the edit card while its data loads.
export const EditorSkeleton = () => (
  <div role="status" aria-busy="true">
    <span className="sr-only">Memuat…</span>
    <div className="h-[720px] animate-pulse rounded-2xl bg-white ring-1 ring-gray-200/70" aria-hidden="true" />
  </div>
);

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
