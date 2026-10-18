'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightIcon, FloppyDiskIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame, { FullPageSpinner } from '@/components/admin/AdminFrame';
import { CoverPhotoField } from '@/components/admin/PhotoField';
import {
  CharCount,
  EDITOR_CARD,
  EDITOR_GRID,
  EDITOR_PANEL,
  EditorActions,
  EditorSkeleton,
  Field,
  FormGroup,
  InfoRow,
  LoadError,
  PANEL_SWITCH,
  PanelActions,
  Spinner,
  StatusBadge,
  Switch,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';
import { imageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

const LIST = '/admin-back-office/kategori/';
const NAME_MAX = 255;
const DESCRIPTION_MAX = 2000;

const EMPTY = { category_name: '', category_description: '', image: null, status: true };

// Static export: one page for new and existing categories; ?id= picks the category.
export default function AdminCategoryEditPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CategoryEditor />
    </Suspense>
  );
}

function CategoryEditor() {
  const id = useSearchParams().get('id');
  return (
    <AdminFrame
      wide
      title={id ? 'Edit kategori' : 'Tambah kategori'}
      description={id ? 'Perubahan tampil di website setelah disimpan.' : 'Kategori aktif langsung punya halaman sendiri di website.'}
      back={{ href: LIST, label: 'Semua kategori' }}
    >
      <CategoryForm key={id ?? 'new'} id={id} />
    </AdminFrame>
  );
}

// The category's card as the website's category list draws it (CategoryShowcase), updated as the admin types.
function WebsitePreview({ form, productCount }) {
  const src = form.image ? imageUrl(form.image) : null;
  const name = form.category_name.trim();
  const description = form.category_description.trim();
  return (
    <div
      className={cn(
        'relative isolate flex aspect-[16/11] flex-col justify-between overflow-hidden rounded-xl bg-brand-950 p-4 text-white transition-[filter,opacity] duration-300',
        !form.status && 'opacity-70 grayscale'
      )}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <span className="bg-dots-light absolute inset-0 -z-10" aria-hidden="true" />
      )}
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-gray-950/10" aria-hidden="true" />
      <span className="flex items-center justify-between gap-2 text-xs font-semibold tabular-nums">
        <StatusBadge active={form.status} />
        <span className="rounded-md bg-white/15 px-2 py-1 ring-1 ring-inset ring-white/25 backdrop-blur-md">
          {productCount ? `${productCount} produk` : 'Katalog menyusul'}
        </span>
      </span>
      <span className="min-w-0">
        <span className={cn('block truncate text-xl font-extrabold leading-tight tracking-tight', !name && 'text-white/50')}>
          {name || 'Nama kategori'}
        </span>
        <span className={cn('mt-1 line-clamp-2 text-sm leading-snug', description ? 'text-white/80' : 'text-white/45')}>
          {description || 'Deskripsi kategori tampil di sini.'}
        </span>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold">
          Lihat produk
          <ArrowRightIcon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
        </span>
      </span>
    </div>
  );
}

function CategoryForm({ id }) {
  const router = useRouter();
  const { toast } = useToast();
  // Starts filled for a new category; an existing one is loaded first.
  const [form, setForm] = useState(id ? null : EMPTY);
  // Read-only facts about an existing category (products, last saved), shown beside the form.
  const [meta, setMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi.categories.get(id).then(
      (category) => {
        setForm({
          category_name: category.category_name ?? '',
          category_description: category.category_description ?? '',
          image: category.image || null,
          status: category.status,
        });
        setMeta(category);
      },
      (err) => setLoadError(err.status === 404 ? 'Kategori ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
    );
  }, [id]);

  if (loadError) return <LoadError message={loadError} />;
  if (!form) return <EditorSkeleton />;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_name.trim()) {
      setErrors({ category_name: 'Nama kategori wajib diisi.' });
      document.getElementById('category_name')?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = id ? await adminApi.categories.update(id, form) : await adminApi.categories.create(form);
      toast({ title: id ? 'Perubahan disimpan' : 'Kategori ditambahkan', description: saved.category_name });
      router.push(LIST);
    } catch (err) {
      setErrors(err.fields || {});
      toast({ variant: 'destructive', title: 'Kategori belum disimpan', description: err.message });
      setSaving(false);
    }
  };

  // The same two buttons sit in the side panel on desktop and in a bar along the bottom on smaller screens.
  const actions = (
    <>
      <Button asChild variant="outline">
        <Link href={LIST}>Batal</Link>
      </Button>
      <Button type="submit" disabled={saving} className="flex-1">
        {saving ? <Spinner /> : <FloppyDiskIcon className="h-4 w-4" weight="bold" aria-hidden="true" />}
        {saving ? 'Menyimpan…' : id ? 'Simpan perubahan' : 'Tambah kategori'}
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={EDITOR_GRID}>
        {/* Wide screens: text and photo side by side, so the form fills the width without the 16:9 photo growing taller than the screen. */}
        <div className={EDITOR_CARD}>
          <FormGroup title="Nama dan deskripsi" subtitle="Yang dibaca pengunjung di menu dan halaman kategori.">
            <div className="space-y-5">
              <Field id="category_name" label="Nama kategori" required error={errors.category_name}>
                <Input
                  {...describedBy('category_name', errors.category_name)}
                  aria-required="true"
                  value={form.category_name}
                  onChange={(e) => set('category_name')(e.target.value)}
                  maxLength={NAME_MAX}
                  placeholder="Contoh: Oli & Pelumas"
                />
              </Field>
              <Field id="category_description" label="Deskripsi" error={errors.category_description}>
                <Textarea
                  {...describedBy('category_description', errors.category_description)}
                  value={form.category_description}
                  onChange={(e) => set('category_description')(e.target.value)}
                  maxLength={DESCRIPTION_MAX}
                  rows={5}
                  placeholder="Contoh: Pelumas industri merek Sugimura untuk mesin hidrolik, kompresor, dan roda gigi."
                />
                <p className="flex justify-between gap-4 text-xs">
                  <span className="text-gray-500">Boleh dikosongkan.</span>
                  <CharCount value={form.category_description} max={DESCRIPTION_MAX} />
                </p>
              </Field>
            </div>
          </FormGroup>

          <FormGroup title="Foto kategori" subtitle="Latar kartu kategori di beranda dan menu produk.">
            <CoverPhotoField id="category-photo" kind="categories" value={form.image} onChange={set('image')} error={errors.image} />
          </FormGroup>
        </div>

        {/* Stays in view while the form scrolls. */}
        <aside className={EDITOR_PANEL}>
          <div className="p-4">
            <p className="mb-2.5 px-1 text-xs font-semibold text-gray-500">Pratinjau di website</p>
            <WebsitePreview form={form} productCount={meta?.product_count} />
          </div>

          <Switch
            id="status"
            label="Tampilkan di website"
            description={form.status ? 'Kategori dan produknya terlihat pengunjung.' : 'Disembunyikan dari pengunjung.'}
            checked={form.status}
            onChange={set('status')}
            className={PANEL_SWITCH}
          />

          <dl className="divide-y divide-gray-100 border-t border-gray-100 px-5 py-1.5">
            {meta ? (
              <>
                <InfoRow label="Nomor kategori"><span className="tabular-nums">{meta.id}</span></InfoRow>
                <InfoRow label="Jumlah produk">
                  <Link href={`/admin-back-office/produk/?kategori=${meta.id}`} className="tabular-nums text-brand-700 hover:underline">
                    {meta.product_count} produk
                  </Link>
                </InfoRow>
                <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
                <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
              </>
            ) : (
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-2 text-sm">
                <dt className="text-gray-500">Nomor kategori</dt>
                <dd className="font-medium text-gray-900">Otomatis</dd>
                <dd className="col-span-2 mt-1 text-pretty text-xs leading-relaxed text-gray-500">Nomor terkecil yang belum dipakai, jadi tidak ada nomor yang terlewat.</dd>
              </div>
            )}
          </dl>

          <PanelActions>{actions}</PanelActions>
        </aside>
      </div>

      <EditorActions>{actions}</EditorActions>
    </form>
  );
}
