'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/admin/FormParts';

// Modal "are you sure?" built on <dialog>, which handles focus trapping and Escape itself.
// Without onConfirm it is a plain notice with only a close button.
export default function ConfirmDialog({ open, title, children, confirmLabel = 'Hapus', busy, onConfirm, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="confirm-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 shadow-lift backdrop:bg-gray-950/50"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-bold text-gray-900">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-gray-600">{children}</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          {onConfirm ? 'Batal' : 'Tutup'}
        </Button>
        {onConfirm && (
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy && <Spinner />}
            {confirmLabel}
          </Button>
        )}
      </div>
    </dialog>
  );
}
