'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

// While `when` is true, asks before the admin leaves an edit page with unsaved changes: the browser's own prompt
// on reload/close, and a dialog for links inside the back office (Batal, the back link, the sidebar) and for
// buttons marked `data-leave-guard` (Keluar). Browser back is not covered: the app router gives no hook for it.
export default function UnsavedChangesGuard({ when }) {
  const router = useRouter();
  const [pending, setPending] = useState(null);
  const bypass = useRef(false);

  useEffect(() => {
    if (!when) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e) => {
      if (bypass.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const button = e.target.closest('[data-leave-guard]');
      const link = e.target.closest('a[href]');
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        setPending(() => () => {
          bypass.current = true;
          button.click();
          bypass.current = false;
        });
        return;
      }
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      setPending(() => () => router.push(url.pathname + url.search + url.hash));
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [when, router]);

  return (
    <ConfirmDialog
      open={pending !== null}
      title="Buang perubahan?"
      confirmLabel="Buang perubahan"
      cancelLabel="Lanjut mengedit"
      onClose={() => setPending(null)}
      onConfirm={() => {
        const leave = pending;
        setPending(null);
        leave();
      }}
    >
      Perubahan di halaman ini belum disimpan dan akan hilang.
    </ConfirmDialog>
  );
}
