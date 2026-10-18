'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, MagnifyingGlassIcon, PlusIcon, SquaresFourIcon } from '@phosphor-icons/react';
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
  MobileRow,
  NumberCell,
  PAGE_SIZE,
  Pagination,
  Panel,
  RowActions,
  RowSwitch,
  SearchBox,
  Table,
  Thumb,
  formatDate,
  rowNumber,
} from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';

const EDIT = '/admin-back-office/kategori/edit/';
const PRODUCTS_IN = (id) => `/admin-back-office/produk/?kategori=${id}`;

const HEAD = [
  { label: 'No', className: 'w-14' },
  { label: 'Kategori', className: 'w-[40%]' },
  { label: 'Produk' },
  { label: 'Last update' },
  { label: 'User update' },
  { label: 'Aktif', className: 'w-20' },
  { label: 'Aksi', srOnly: true, className: 'w-24' },
];

const VIEWS = [
  { value: 'all', label: 'Semua', test: () => true },
  { value: 'active', label: 'Aktif', test: (c) => c.status },
  { value: 'inactive', label: 'Nonaktif', test: (c) => !c.status },
  { value: 'empty', label: 'Tanpa produk', test: (c) => c.product_count === 0 },
];

const AddButton = () => (
  <Button asChild>
    <Link href={EDIT}>
      <PlusIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
      Tambah kategori
    </Link>
  </Button>
);

// "100 produk →": opens the product list filtered to this category.
const ProductCountLink = ({ category }) => (
  <Link
    href={PRODUCTS_IN(category.id)}
    className="group/link inline-flex items-center gap-1.5 rounded-md text-sm text-gray-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
  >
    <span className="font-semibold tabular-nums text-gray-900 group-hover/link:text-brand-700">{category.product_count}</span> produk
    <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
  </Link>
);

export default function AdminCategoriesPage() {
  return (
    <AdminFrame
      wide
      title="Kategori"
      description="Setiap kategori aktif punya halaman sendiri di website. Produk dalam kategori nonaktif ikut disembunyikan."
      actions={<AddButton />}
    >
      <CategoryList />
    </AdminFrame>
  );
}

function CategoryList() {
  const { toast } = useToast();
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [savingIds, setSavingIds] = useState(() => new Set());

  const applyLoad = (promise) => promise.then(setCategories, (err) => setError(err.message));

  useEffect(() => {
    applyLoad(adminApi.categories.list());
  }, []);

  // 404 on a change: the category was deleted or renumbered after this list loaded (by another admin or in
  // phpMyAdmin). Reload the list instead of retrying a row that no longer exists.
  const reloadStale = () => {
    setToDelete(null);
    toast({ variant: 'destructive', title: 'Data sudah berubah', description: 'Kategori ini sudah tidak ada di database. Daftar dimuat ulang.' });
    applyLoad(adminApi.categories.list());
  };

  const retry = () => {
    setError(null);
    setCategories(null);
    applyLoad(adminApi.categories.list());
  };

  // Search applies first, so the tab counts always match what each tab would show.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (categories || []).filter((c) => !q || `${c.category_name} ${c.category_description ?? ''}`.toLowerCase().includes(q));
  }, [categories, query]);

  const tabs = VIEWS.map((v) => ({ ...v, count: searched.filter(v.test).length }));
  const filtered = searched.filter(VIEWS.find((v) => v.value === view).test);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const toggleActive = async (category) => {
    const next = !category.status;
    const replace = (row) => setCategories((list) => list.map((c) => (c.id === category.id ? row : c)));
    replace({ ...category, status: next });
    setSavingIds((ids) => new Set(ids).add(category.id));
    try {
      const { category_name, category_description, image } = category;
      replace(await adminApi.categories.update(category.id, { category_name, category_description, image, status: next }));
      toast({ title: next ? 'Kategori diaktifkan' : 'Kategori dinonaktifkan', description: category.category_name });
    } catch (err) {
      replace(category);
      if (err.status === 404) reloadStale();
      else toast({ variant: 'destructive', title: 'Status belum diubah', description: err.message });
    } finally {
      setSavingIds((ids) => {
        const rest = new Set(ids);
        rest.delete(category.id);
        return rest;
      });
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.categories.remove(toDelete.id);
      setCategories((list) => list.filter((c) => c.id !== toDelete.id));
      toast({ title: 'Kategori dihapus', description: toDelete.category_name });
      setToDelete(null);
    } catch (err) {
      if (err.status === 404) reloadStale();
      else toast({ variant: 'destructive', title: 'Kategori belum dihapus', description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <LoadError message={error} onRetry={retry} />;

  const blocked = toDelete?.product_count > 0;
  const empty =
    categories?.length === 0 ? (
      <EmptyState icon={SquaresFourIcon} title="Belum ada kategori" action={<AddButton />}>
        Kategori mengelompokkan produk dan masing-masing punya halaman di website.
      </EmptyState>
    ) : (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="Tidak ada kategori yang cocok"
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
        Coba kata kunci lain atau pilih status yang berbeda.
      </EmptyState>
    );

  const switchFor = (c) => (
    <RowSwitch checked={c.status} busy={savingIds.has(c.id)} onChange={() => toggleActive(c)} label={`Aktifkan ${c.category_name}`} />
  );
  // Categories that still have products can't be deleted (the API refuses too), so the bin is greyed out.
  const actionsFor = (c) => (
    <RowActions
      editHref={`${EDIT}?id=${c.id}`}
      onDelete={() => setToDelete(c)}
      name={c.category_name}
      deleteBlocked={c.product_count > 0 ? `Tidak bisa dihapus: masih ada ${c.product_count} produk` : undefined}
    />
  );

  return (
    <>
      <Panel
        busy={categories === null}
        toolbar={
          <>
            <FilterTabs label="Filter status kategori" options={tabs} value={view} onChange={resetPage(setView)} />
            <SearchBox id="category-search" value={query} onChange={resetPage(setQuery)} placeholder="Cari kategori" className="lg:w-80" />
          </>
        }
      >
        <MobileList loading={categories === null} empty={rows.length === 0 && empty}>
          {rows.map((c, i) => (
            <MobileRow
              key={c.id}
              no={rowNumber(currentPage, i)}
              thumb={c.image}
              href={`${EDIT}?id=${c.id}`}
              title={c.category_name || 'Tanpa nama'}
              meta={<ProductCountLink category={c} />}
              status={<span className="flex items-center gap-2 text-sm text-gray-600">{switchFor(c)}{c.status ? 'Aktif' : 'Nonaktif'}</span>}
              actions={actionsFor(c)}
            />
          ))}
        </MobileList>

        <Table head={HEAD}>
          {categories === null ? (
            <LoadingRows colSpan={HEAD.length} rows={5} />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={HEAD.length}>{empty}</EmptyRow>
          ) : (
            rows.map((c, i) => (
              <tr key={c.id} className={c.status ? 'transition-colors hover:bg-gray-50/80' : 'bg-gray-50/60 transition-colors hover:bg-gray-50'}>
                <NumberCell value={rowNumber(currentPage, i)} />
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Thumb path={c.image} className={c.status ? undefined : 'opacity-60'} />
                    <div className="min-w-0 flex-1">
                      <Link href={`${EDIT}?id=${c.id}`} className={`font-semibold hover:text-brand-700 ${c.status ? 'text-gray-900' : 'text-gray-500'}`}>
                        {c.category_name || <span className="italic text-gray-400">Tanpa nama</span>}
                      </Link>
                      {/* Capped width: a long description would otherwise stretch the whole column. */}
                      <p className={`mt-1 max-w-[32rem] truncate pr-1 text-[13px] ${c.category_description ? 'text-gray-500' : 'italic text-gray-400'}`}>
                        {c.category_description || 'Belum ada deskripsi'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><ProductCountLink category={c} /></td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">{formatDate(c.last_update) ?? <span className="text-gray-400">—</span>}</td>
                {/* The name of the tbl_user whose user_code is in user_update; the raw value if no user has that code. */}
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{c.user_update_name || c.user_update || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3">{switchFor(c)}</td>
                <td className="py-3 pl-4 pr-5">{actionsFor(c)}</td>
              </tr>
            ))
          )}
        </Table>
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      </Panel>

      {/* A category that still has products cannot be deleted, so the dialog only explains why. */}
      <ConfirmDialog
        open={!!toDelete}
        title={blocked ? 'Kategori belum bisa dihapus' : 'Hapus kategori?'}
        busy={deleting}
        onConfirm={blocked ? undefined : confirmDelete}
        onClose={() => setToDelete(null)}
      >
        {blocked ? (
          <>
            <strong className="text-gray-900">{toDelete.category_name}</strong> masih dipakai oleh {toDelete.product_count} produk. Pindahkan
            produk tersebut ke kategori lain atau hapus produknya terlebih dahulu. Untuk menyembunyikan kategori, matikan statusnya.
          </>
        ) : (
          <>
            <strong className="text-gray-900">{toDelete?.category_name}</strong> akan dihapus permanen dari database, termasuk halamannya di
            website.
          </>
        )}
      </ConfirmDialog>
    </>
  );
}
