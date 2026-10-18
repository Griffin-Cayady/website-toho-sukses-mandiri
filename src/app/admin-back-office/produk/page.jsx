'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, PackageIcon, PlusIcon, StarIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame from '@/components/admin/AdminFrame';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { LoadError, Select } from '@/components/admin/FormParts';
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

const EDIT = '/admin-back-office/produk/edit/';

const HEAD = [
  { label: 'No', className: 'w-14' },
  { label: 'Produk', className: 'w-[34%]' },
  { label: 'Jenis', sortKey: 'type' },
  { label: 'Kategori', sortKey: 'category' },
  { label: 'Ukuran', sortKey: 'size' },
  { label: 'Last update', sortKey: 'last_update' },
  { label: 'User update', sortKey: 'user_update' },
  { label: 'Aktif', className: 'w-20' },
  { label: 'Aksi', srOnly: true, className: 'w-24' },
];

// Status tabs: each one is a filter and shows how many products it holds.
const VIEWS = [
  { value: 'all', label: 'Semua', test: () => true },
  { value: 'active', label: 'Aktif', test: (p) => p.product_status },
  { value: 'inactive', label: 'Nonaktif', test: (p) => !p.product_status },
  { value: 'featured', label: 'Pilihan', test: (p) => p.product_best_selling },
];

// Sortable columns. `first` is the direction a column starts in when picked (newest update first, A–Z otherwise).
const SORTS = {
  last_update: { label: 'Last update', first: 'desc', asc: 'terlama dulu', desc: 'terbaru dulu' },
  user_update: { label: 'User update', first: 'asc', asc: 'A–Z', desc: 'Z–A' },
  category: { label: 'Kategori', first: 'asc', asc: 'A–Z', desc: 'Z–A' },
  type: { label: 'Jenis', first: 'asc', asc: 'A–Z', desc: 'Z–A' },
  size: { label: 'Ukuran', first: 'asc', asc: 'kecil ke besar', desc: 'besar ke kecil' },
};

// Numbers inside text compare as numbers, so sizes go 18, 20, 200 (not 18, 200, 20).
const collator = new Intl.Collator('id', { numeric: true, sensitivity: 'base' });

// Sorts a copy of `list`. Rows without a value always go last; equal rows keep their product-number order.
const sortProducts = (list, { key, dir }, categoryName) => {
  if (!key) return list;
  const value = {
    last_update: (p) => p.last_update || '',
    user_update: (p) => p.user_update_name || p.user_update || '',
    category: (p) => categoryName.get(p.product_category) || '',
    type: (p) => p.product_type_1 || '',
    size: (p) => p.product_size || '',
  }[key];
  const sign = dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = String(value(a)).trim();
    const vb = String(value(b)).trim();
    if (!va || !vb) return !va && !vb ? a.id - b.id : va ? -1 : 1;
    return sign * collator.compare(va, vb) || a.id - b.id;
  });
};

const fetchProductsAndCategories = () => Promise.all([adminApi.products.list(), adminApi.categories.list()]);

const AddButton = () => (
  <Button asChild>
    <Link href={EDIT}>
      <PlusIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
      Tambah produk
    </Link>
  </Button>
);

const FeaturedFlag = () => (
  <span className="inline-flex items-center gap-1 rounded bg-sun-soft px-1.5 py-px text-[11px] font-semibold text-gray-800">
    <StarIcon className="h-3 w-3" weight="fill" aria-hidden="true" />
    Pilihan
  </span>
);

export default function AdminProductsPage() {
  return (
    <AdminFrame wide title="Produk" description="Produk aktif tampil di katalog website. Matikan produk untuk menyembunyikannya tanpa menghapus." actions={<AddButton />}>
      {/* ?kategori=<id> (from the category page) opens the list filtered to that category. */}
      <Suspense>
        <ProductList />
      </Suspense>
    </AdminFrame>
  );
}

function ProductList() {
  const { toast } = useToast();
  const initialCategory = useSearchParams().get('kategori') ?? '';
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [view, setView] = useState('all');
  // { key: null } keeps the default order (product number).
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Products whose Active switch is being saved.
  const [savingIds, setSavingIds] = useState(() => new Set());

  const applyLoad = (promise) =>
    promise.then(
      ([productRows, categoryRows]) => {
        setProducts(productRows);
        setCategories(categoryRows);
      },
      (err) => setError(err.message)
    );

  useEffect(() => {
    applyLoad(fetchProductsAndCategories());
  }, []);

  // 404 on a change: the product was deleted after this list loaded (by another admin or in phpMyAdmin).
  // Reload the list instead of retrying a row that no longer exists.
  const reloadStale = () => {
    setToDelete(null);
    toast({ variant: 'destructive', title: 'Data sudah berubah', description: 'Produk ini sudah tidak ada di database. Daftar dimuat ulang.' });
    applyLoad(fetchProductsAndCategories());
  };

  const retry = () => {
    setError(null);
    setProducts(null);
    applyLoad(fetchProductsAndCategories());
  };

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.category_name])), [categories]);

  // Search and category apply first, so the tab counts always match what each tab would show.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || []).filter(
      (p) =>
        (!q || `${p.product_name} ${p.product_type_1 ?? ''} ${p.product_size ?? ''}`.toLowerCase().includes(q)) &&
        (!categoryId || p.product_category === Number(categoryId))
    );
  }, [products, query, categoryId]);

  const tabs = VIEWS.map((v) => ({ ...v, count: searched.filter(v.test).length }));
  const filtered = sortProducts(searched.filter(VIEWS.find((v) => v.value === view).test), sort, categoryName);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  // Header click: a new column starts in its natural direction, the same column flips.
  const sortBy = (key) =>
    resetPage(setSort)(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: SORTS[key].first });

  const toggleActive = async (product) => {
    const next = !product.product_status;
    const replace = (row) => setProducts((list) => list.map((p) => (p.id === product.id ? row : p)));
    replace({ ...product, product_status: next });
    setSavingIds((ids) => new Set(ids).add(product.id));
    try {
      replace(await adminApi.products.update(product.id, { ...product, product_status: next }));
      toast({ title: next ? 'Produk diaktifkan' : 'Produk dinonaktifkan', description: product.product_name });
    } catch (err) {
      replace(product);
      if (err.status === 404) reloadStale();
      else toast({ variant: 'destructive', title: 'Status belum diubah', description: err.message });
    } finally {
      setSavingIds((ids) => {
        const rest = new Set(ids);
        rest.delete(product.id);
        return rest;
      });
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.products.remove(toDelete.id);
      setProducts((list) => list.filter((p) => p.id !== toDelete.id));
      toast({ title: 'Produk dihapus', description: toDelete.product_name });
      setToDelete(null);
    } catch (err) {
      if (err.status === 404) reloadStale();
      else toast({ variant: 'destructive', title: 'Produk belum dihapus', description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <LoadError message={error} onRetry={retry} />;

  const filtering = query.trim() || categoryId || view !== 'all';
  const empty =
    products?.length === 0 ? (
      <EmptyState icon={PackageIcon} title="Belum ada produk" action={<AddButton />}>
        Produk yang Anda tambahkan akan tampil di katalog website.
      </EmptyState>
    ) : (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="Tidak ada produk yang cocok"
        action={
          filtering && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery('');
                setCategoryId('');
                setView('all');
              }}
            >
              Hapus semua filter
            </Button>
          )
        }
      >
        Coba kata kunci lain atau ganti kategori dan status.
      </EmptyState>
    );

  const switchFor = (p) => (
    <RowSwitch checked={p.product_status} busy={savingIds.has(p.id)} onChange={() => toggleActive(p)} label={`Aktifkan ${p.product_name}`} />
  );
  const actionsFor = (p) => <RowActions editHref={`${EDIT}?id=${p.id}`} onDelete={() => setToDelete(p)} name={p.product_name} />;

  return (
    <>
      <Panel
        busy={products === null}
        toolbar={
          <>
            <FilterTabs label="Filter status produk" options={tabs} value={view} onChange={resetPage(setView)} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_170px_210px] xl:w-[600px] xl:shrink-0">
              <SearchBox id="product-search" value={query} onChange={resetPage(setQuery)} placeholder="Cari produk" />
              <Select aria-label="Filter kategori" value={categoryId} onChange={(e) => resetPage(setCategoryId)(e.target.value)} className="h-10 text-sm">
                <option value="">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
              </Select>
              {/* Same choices as clicking the table's column headings; the only way to sort on phones. */}
              <Select
                aria-label="Urutkan produk"
                value={sort.key ? `${sort.key}:${sort.dir}` : ''}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split(':');
                  resetPage(setSort)(key ? { key, dir } : { key: null, dir: 'asc' });
                }}
                className="h-10 text-sm sm:col-span-2 lg:col-span-1"
              >
                <option value="">Urutkan: nomor produk</option>
                {Object.entries(SORTS).flatMap(([key, s]) =>
                  [s.first, s.first === 'asc' ? 'desc' : 'asc'].map((dir) => (
                    <option key={`${key}:${dir}`} value={`${key}:${dir}`}>
                      {s.label}, {s[dir]}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </>
        }
      >
        <MobileList loading={products === null} empty={rows.length === 0 && empty}>
          {rows.map((p, i) => (
            <MobileRow
              key={p.id}
              no={rowNumber(currentPage, i)}
              thumb={p.images[0]}
              href={`${EDIT}?id=${p.id}`}
              title={p.product_name || 'Tanpa nama'}
              meta={
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {[categoryName.get(p.product_category) ?? 'Tanpa kategori', p.product_type_1, p.product_size].filter(Boolean).join(' · ')}
                  {p.product_best_selling && <FeaturedFlag />}
                </span>
              }
              status={<span className="flex items-center gap-2 text-sm text-gray-600">{switchFor(p)}{p.product_status ? 'Aktif' : 'Nonaktif'}</span>}
              actions={actionsFor(p)}
            />
          ))}
        </MobileList>

        <Table head={HEAD} sort={sort} onSort={sortBy}>
          {products === null ? (
            <LoadingRows colSpan={HEAD.length} />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={HEAD.length}>{empty}</EmptyRow>
          ) : (
            rows.map((p, i) => (
              <tr key={p.id} className={p.product_status ? 'transition-colors hover:bg-gray-50/80' : 'bg-gray-50/60 transition-colors hover:bg-gray-50'}>
                <NumberCell value={rowNumber(currentPage, i)} />
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <Thumb path={p.images[0]} className={p.product_status ? undefined : 'opacity-60'} />
                    <div className="min-w-0 flex-1">
                      <Link href={`${EDIT}?id=${p.id}`} className={`font-semibold hover:text-brand-700 ${p.product_status ? 'text-gray-900' : 'text-gray-500'}`}>
                        {p.product_name || <span className="italic text-gray-400">Tanpa nama</span>}
                      </Link>
                      <p className="mt-1 flex min-w-0 items-center gap-2 text-[13px]">
                        {p.product_best_selling && <FeaturedFlag />}
                        {/* Capped width: a long description would otherwise stretch the whole column. */}
                        <span className={`max-w-[26rem] truncate pr-1 ${p.product_description ? 'text-gray-500' : 'italic text-gray-400'}`}>
                          {p.product_description || 'Belum ada deskripsi'}
                        </span>
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{p.product_type_1 || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3">
                  {categoryName.has(p.product_category) ? (
                    <button
                      type="button"
                      onClick={() => resetPage(setCategoryId)(String(p.product_category))}
                      className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-[13px] font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-800"
                      title="Tampilkan produk dalam kategori ini saja"
                    >
                      {categoryName.get(p.product_category)}
                    </button>
                  ) : (
                    <span className="whitespace-nowrap rounded-md bg-amber-50 px-2 py-1 text-[13px] font-medium text-amber-800">Tanpa kategori</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">{p.product_size || <span className="text-gray-400">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">{formatDate(p.last_update) ?? <span className="text-gray-400">—</span>}</td>
                {/* The name of the tbl_user whose user_code is in user_update; the raw value if no user has that code. */}
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{p.user_update_name || p.user_update || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3">{switchFor(p)}</td>
                <td className="py-3 pl-4 pr-5">{actionsFor(p)}</td>
              </tr>
            ))
          )}
        </Table>
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      </Panel>

      <ConfirmDialog open={!!toDelete} title="Hapus produk?" busy={deleting} onConfirm={confirmDelete} onClose={() => setToDelete(null)}>
        <strong className="text-gray-900">{toDelete?.product_name}</strong> dan fotonya akan dihapus permanen dari database. Untuk
        menyembunyikan produk tanpa menghapusnya, matikan saja statusnya.
      </ConfirmDialog>
    </>
  );
}
