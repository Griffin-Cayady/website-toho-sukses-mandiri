'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon, SealCheckIcon } from '@phosphor-icons/react';
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
import { imageUrl } from '@/lib/api';

const EDIT = '/admin-back-office/sertifikasi/edit/';

const HEAD = [
  { label: 'No', className: 'w-14' },
  { label: 'Sertifikasi', className: 'w-[40%]' },
  { label: 'Brand' },
  { label: 'Last update' },
  { label: 'User update' },
  { label: 'Aksi', srOnly: true, className: 'w-24' },
];

// Logos are what the merk pop-up shows, so the tabs point out the ones still missing one.
const VIEWS = [
  { value: 'all', label: 'Semua', test: () => true },
  { value: 'logo', label: 'Dengan logo', test: (c) => !!c.certification_image },
  { value: 'nologo', label: 'Tanpa logo', test: (c) => !c.certification_image },
];

const AddButton = () => (
  <Button asChild>
    <Link href={EDIT}>
      <PlusIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
      Tambah sertifikasi
    </Link>
  </Button>
);

// The logo on the editor's dark green tile (logos are uploaded white on transparent); a seal when it has none.
const CertIcon = ({ cert }) => {
  const src = cert.certification_image ? imageUrl(cert.certification_image) : null;
  return src ? (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-ink p-1.5">
      <img src={src} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
    </span>
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100" aria-hidden="true">
      <SealCheckIcon className="h-5 w-5" weight="duotone" />
    </span>
  );
};

const MerkChip = ({ cert }) =>
  cert.merk_name ? (
    <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-[13px] font-medium text-gray-700">{cert.merk_name}</span>
  ) : (
    <span className="text-[13px] font-medium text-amber-700">Brand tidak ditemukan</span>
  );

export default function AdminCertificationsPage() {
  return (
    <AdminFrame
      wide
      title="Sertifikasi"
      description="Sertifikasi setiap brand, ditampilkan di pop-up brand pada halaman utama."
      actions={<AddButton />}
    >
      <CertificationList />
    </AdminFrame>
  );
}

function CertificationList() {
  const { toast } = useToast();
  const [certs, setCerts] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [merkId, setMerkId] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const applyLoad = (promise) => promise.then(setCerts, (err) => setError(err.message));

  useEffect(() => {
    applyLoad(adminApi.certifications.list());
  }, []);

  const retry = () => {
    setError(null);
    setCerts(null);
    applyLoad(adminApi.certifications.list());
  };

  // The merk filter offers only merks that have certifications.
  const merks = useMemo(() => {
    const byId = new Map((certs || []).filter((c) => c.merk_name).map((c) => [c.merk_id, c.merk_name]));
    return [...byId].sort((a, b) => a[1].localeCompare(b[1]));
  }, [certs]);

  // Search and the merk filter apply first, so the tab counts always match what each tab would show.
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (certs || []).filter(
      (c) =>
        (!merkId || String(c.merk_id) === merkId) &&
        (!q || `${c.certification_name} ${c.certification_description ?? ''} ${c.merk_name ?? ''}`.toLowerCase().includes(q))
    );
  }, [certs, query, merkId]);

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
      await adminApi.certifications.remove(toDelete.id);
      setCerts((list) => list.filter((c) => c.id !== toDelete.id));
      toast({ title: 'Sertifikasi dihapus', description: toDelete.certification_name });
      setToDelete(null);
    } catch (err) {
      if (err.status === 404) {
        // Already deleted elsewhere (e.g. from the merk editor) after this list loaded: reload instead of retrying.
        setToDelete(null);
        toast({ variant: 'destructive', title: 'Data sudah berubah', description: 'Sertifikasi ini sudah tidak ada di database. Daftar dimuat ulang.' });
        applyLoad(adminApi.certifications.list());
      } else {
        toast({ variant: 'destructive', title: 'Sertifikasi belum dihapus', description: err.message });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <LoadError message={error} onRetry={retry} />;

  const empty =
    certs?.length === 0 ? (
      <EmptyState icon={SealCheckIcon} title="Belum ada sertifikasi" action={<AddButton />}>
        Tambahkan sertifikasi seperti ISO 9001:2015 atau SNI, lalu pilih brand pemiliknya.
      </EmptyState>
    ) : (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="Tidak ada sertifikasi yang cocok"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery('');
              setView('all');
              setMerkId('');
            }}
          >
            Hapus semua filter
          </Button>
        }
      >
        Coba kata kunci lain atau pilih filter yang berbeda.
      </EmptyState>
    );

  const actionsFor = (c) => <RowActions editHref={`${EDIT}?id=${c.id}`} onDelete={() => setToDelete(c)} name={c.certification_name} />;

  return (
    <>
      <Panel
        busy={certs === null}
        toolbar={
          <>
            <FilterTabs label="Filter logo sertifikasi" options={tabs} value={view} onChange={resetPage(setView)} />
            <div className="grid gap-2 sm:grid-cols-[1fr_200px] xl:w-[520px] xl:shrink-0">
              <SearchBox id="cert-search" value={query} onChange={resetPage(setQuery)} placeholder="Cari sertifikasi atau brand" />
              <Select aria-label="Filter brand" value={merkId} onChange={(e) => resetPage(setMerkId)(e.target.value)} className="h-10 text-sm">
                <option value="">Semua brand</option>
                {merks.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </Select>
            </div>
          </>
        }
      >
        <MobileList loading={certs === null} empty={rows.length === 0 && empty}>
          {rows.map((c, i) => (
            <li key={c.id} className="flex gap-3 p-4">
              <CertIcon cert={c} />
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-baseline gap-1.5">
                  <span className="shrink-0 text-sm tabular-nums text-gray-400">{rowNumber(currentPage, i)}.</span>
                  <Link href={`${EDIT}?id=${c.id}`} className="truncate font-semibold text-gray-900 hover:text-brand-700">
                    {c.certification_name}
                  </Link>
                </p>
                {c.certification_description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{c.certification_description}</p>}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <MerkChip cert={c} />
                  {actionsFor(c)}
                </div>
              </div>
            </li>
          ))}
        </MobileList>

        <Table head={HEAD}>
          {certs === null ? (
            <LoadingRows colSpan={HEAD.length} rows={5} />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={HEAD.length}>{empty}</EmptyRow>
          ) : (
            rows.map((c, i) => (
              <tr key={c.id} className="transition-colors hover:bg-gray-50/80">
                <NumberCell value={rowNumber(currentPage, i)} />
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <CertIcon cert={c} />
                    <div className="min-w-0 flex-1">
                      <Link href={`${EDIT}?id=${c.id}`} className="font-semibold text-gray-900 hover:text-brand-700">
                        {c.certification_name}
                      </Link>
                      <p className={`mt-1 max-w-[32rem] truncate pr-1 text-[13px] ${c.certification_description ? 'text-gray-500' : 'italic text-gray-400'}`}>
                        {c.certification_description || 'Belum ada keterangan'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><MerkChip cert={c} /></td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">{formatDate(c.last_update) ?? <span className="text-gray-400">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-700">{c.user_update_name || c.user_update || <span className="text-gray-400">—</span>}</td>
                <td className="py-3 pl-4 pr-5">{actionsFor(c)}</td>
              </tr>
            ))
          )}
        </Table>
        <Pagination page={currentPage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      </Panel>

      <ConfirmDialog open={!!toDelete} title="Hapus sertifikasi?" busy={deleting} onConfirm={confirmDelete} onClose={() => setToDelete(null)}>
        <strong className="text-gray-900">{toDelete?.certification_name}</strong>
        {toDelete?.merk_name && <> milik brand {toDelete.merk_name}</>} akan dihapus permanen dari database, beserta logonya.
      </ConfirmDialog>
    </>
  );
}
