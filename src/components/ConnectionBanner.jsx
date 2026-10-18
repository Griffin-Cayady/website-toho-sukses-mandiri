'use client';

import React, { useState } from 'react';
import { WarningIcon, XIcon } from '@phosphor-icons/react';
import { useCatalog } from '@/contexts/CatalogContext.jsx';

const ConnectionBanner = () => {
  const { error } = useCatalog();
  const [showBanner, setShowBanner] = useState(true);

  if (!error || !showBanner) return null;

  return (
    <div role="status" className="relative z-banner border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <WarningIcon className="h-5 w-5 shrink-0 text-amber-600" weight="fill" aria-hidden="true" />
          <p>Koneksi ke database terganggu. Situs menampilkan data katalog lokal.</p>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          aria-label="Tutup pemberitahuan"
          className="rounded-md p-1.5 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
        >
          <XIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default ConnectionBanner;
