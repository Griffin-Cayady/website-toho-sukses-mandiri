'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon, TagIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame from '@/components/admin/AdminFrame';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { LoadError } from '@/components/admin/FormParts';
import {
  EmptyRow,
  EmptyState,
  FilterTabs,
  LoadingRows,
  MobileList,
  NumberCell,
  PAGE_SIZE,
  Pagination,
  Panel,
  RowActions,
  SearchBox,
  Table,
  formatDate,
  rowNumber,
} from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';

const EDIT = '/admin-back-office/merk/edit/';

const HEAD = [
  { label: 'No', className: 'w-14' },
  { label: 'Merk', className: 'w-[45%]' },
  { label: 'Produk' },
  { label: 'Last update' },
  { label: 'User update' },
  { label: 'Aksi', srOnly: true, className: 'w-24' },
];

const VIEWS = [
  { value: 'all', label: 'Semua', test: () => true },
  { value: 'used', label: 'Dipakai', test: (m) => m.product_count > 0 },
  { value: 'unused', label: 'Tanpa produk', test: (m) => m.product_count === 0 },
];

const AddButton = () => (
  <Button asChild>
    <Link href={EDIT}>
      <PlusIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
      Tambah merk
    </Link>
  </Button>
);

// Square tag icon in place of a photo: merks have no image column.
const MerkIcon = () => (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" aria-hidden="true">
    <TagIcon className="h-5 w-5" weight="duotone" />
  </span>
);

const ProductCount = ({ merk }) => (
  <span className="text-sm text-gray-600">
    <span className="font-semibold tabular-nums text-gray-900">{merk.product_count}</span> produk
  </span>
);

export default function AdminMerksPage() {
  return (
    <AdminFrame
      wide
      title="Merk"
      description="Merk (brand) yang bisa dipilih untuk setiap produk."
      actions={<AddButton />}
    >
      <MerkList />
    </AdminFrame>
  );
}

function MerkList() {
  const { toast } = useToast();
  const [merks, setMerks] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const applyLoad = (promise) => promise.then(setMerks, (err) => setError(err.message));

  useEffect(() => {
    applyLoad(adminApi.merks.list());
  }, []);

  const retry = () => {
    setError(null);
    setMerks(null);
    applyLoad(adminApi.merks.list());
  };

  // Search applies first, so the tab counts always match what each tab would show.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (merks || []).filter((m) => !q || `${m.merk_name} ${m.merk_description ?? ''}`.toLowerCase().includes(q));
  }, [merks, query]);

  const tabs = VIEWS.map((v) => ({ ...v, count: searched.filter(v.test).length }));
  const filtered = searched.filter(VIEWS.find((v) => v.value === view).test);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.merks.remove(toDelete.id);
      setMerks((list) => list.filter((m) => m.id !== toDelete.id));
      toast({ title: 'Merk dihapus', description: toDelete.merk_name });
      setToDelete(null);
    } catch (err) {
      if (err.status === 404) {
        // Deleted or renumbered elsewhere after this list loaded: reload instead of retrying.
        setToDelete(null);
        toast({ variant: 'destructive', title: 'Data sudah berubah', description: 'Merk ini sudah tidak ada di database. Daftar dimuat ulang.' });
        applyLoad(adminApi.merks.list());
      } else {
        toast({ variant: 'destructive', title: 'Merk belum dihapus', description: err.message });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <LoadError message={error} onRetry={retry} />;

  const blocked = toDelete?.product_count > 0;
  const empty =
    merks?.length === 0 ? (
      <EmptyState icon={TagIcon} title="Belum ada merk" action={<AddButton />}>
        Tambahkan merk seperti Sugimura atau Compero, lalu pilih merk untuk setiap produk.
      </EmptyState>
    ) : (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="Tidak ada merk yang cocok"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery('');
              setView('all');
            }}
          >
            Hapus semua filter
          </Button>
        }
      >
        Coba kata kunci lain atau pilih filter yang berbeda.
      </EmptyState>
    );

  // Merks that products still use can't be deleted (the API refuses too), so the bin is greyed out.
  const actionsFor = (m) => (
    <RowActions
      editHref={`${EDIT}?id=${m.id}`}
      onDelete={() => setToDelete(m)}
      name={m.merk_name}
      deleteBlocked={m.product_count > 0 ? `Tidak bisa dihapus: masih ada ${m.product_count} produk` : undefined}
    />
  );

  return (
    <>
      <Panel
        busy={merks === null}
        toolbar={
          <>
            <FilterTabs label="Filter merk" options={tabs} value={view} onChange={resetPage(setView)} />
            <SearchBox id="merk-search" value={query} onChange={resetPage(setQuery)} placeholder="Cari merk" className="lg:w-80" />
          </>
        }
      >
        <MobileList loading={merks === null} empty={rows.length === 0 && empty}>
          {rows.map((m, i) => (
            <li key={m.id} className="flex gap-3 p-4">
              <MerkIcon />
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-baseline gap-1.5">
                  <span className="shrink-0 text-sm tabular-nums text-gray-400">{rowNumber(currentPage, i)}.</span>
                  <Link href={`${EDIT}?id=${m.id}`} className="truncate font-semibold text-gray-900 hover:text-brand-700">
                    {m.merk_name}
                  </Link>
                </p>
                {m.merk_description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{m.merk_description}</p>}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <ProductCount merk={m} />
                  {actionsFor(m)}
                </div>
              </div>
            </li>
          ))}
        </MobileList>

        <Table head={HEAD}>
          {merks === null ? (
            <LoadingRows colSpan={HEAD.length} rows={5} />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={HEAD.length}>{empty}</EmptyRow>
          ) : (
            rows.map((m, i) => (
              <tr key={m.id} className="transition-colors hover:bg-gray-50/80">
                <NumberCell value={rowNumber(currentPage, i)} />
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <MerkIcon />
                    <div className="min-w-0 flex-1">
                      <Link href={`${EDIT}?id=${m.id}`} className="font-semibold text-gray-900 hover:text-brand-700">
                        {m.merk_name}
                      </Link>
                      {/* Capped width: a long description would otherwise stretch the whole column. */}
                      <p className={`mt-1 max-w-[32rem] truncate pr-1 text-[13px] ${m.merk_description ? 'text-gray-500' : 'italic text-gray-400'}`}>
                        {m.merk_description || 'Belum ada deskripsi'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><ProductCount merk={m} /></td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">{formatDate(m.last_update) ?? <span className="text-gray-400">—</span>}</td>
                {/* The name of the tbl_user whose user_code is in user_update; the raw value if no user has that code. */}
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{m.user_update_name || m.user_update || <span className="text-gray-400">—</span>}</td>
                <td className="py-3 pl-4 pr-5">{actionsFor(m)}</td>
              </tr>
            ))
          )}
        </Table>
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      </Panel>

      {/* A merk that products still use cannot be deleted, so the dialog only explains why. */}
      <ConfirmDialog
        open={!!toDelete}
        title={blocked ? 'Merk belum bisa dihapus' : 'Hapus merk?'}
        busy={deleting}
        onConfirm={blocked ? undefined : confirmDelete}
        onClose={() => setToDelete(null)}
      >
        {blocked ? (
          <>
            <strong className="text-gray-900">{toDelete.merk_name}</strong> masih dipakai oleh {toDelete.product_count} produk. Ganti merk
            produk tersebut terlebih dahulu.
          </>
        ) : (
          <>
            <strong className="text-gray-900">{toDelete?.merk_name}</strong> akan dihapus permanen dari database.
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
