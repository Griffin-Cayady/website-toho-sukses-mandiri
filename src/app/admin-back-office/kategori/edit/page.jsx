'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame, { FullPageSpinner } from '@/components/admin/AdminFrame';
import { CoverPhotoField } from '@/components/admin/PhotoField';
import UnsavedChangesGuard from '@/components/admin/UnsavedChangesGuard';
import {
  CharCount,
  EDITOR_CARD,
  EditorSkeleton,
  Field,
  FormGroup,
  InfoRow,
  LoadError,
  SaveBar,
  SaveError,
  Switch,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';

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

function CategoryForm({ id }) {
  const router = useRouter();
  const { toast } = useToast();
  // Starts filled for a new category; an existing one is loaded first.
  const [form, setForm] = useState(id ? null : EMPTY);
  // The form as loaded; differences from it are unsaved changes.
  const [initial, setInitial] = useState(id ? null : EMPTY);
  // Read-only facts about an existing category (products, last saved), shown in "Riwayat".
  const [meta, setMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi.categories.get(id).then(
      (category) => {
        const loaded = {
          category_name: category.category_name ?? '',
          category_description: category.category_description ?? '',
          image: category.image || null,
          status: category.status,
        };
        setForm(loaded);
        setInitial(loaded);
        setMeta(category);
      },
      (err) => setLoadError(err.status === 404 ? 'Kategori ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
    );
  }, [id]);

  const dirty = useMemo(() => form !== null && JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  if (loadError) return <LoadError message={loadError} />;
  if (!form) return <EditorSkeleton />;

  // Editing a field clears its error straight away, so only problems that still exist stay on screen.
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.category_name.trim()) {
      setErrors({ category_name: 'Nama kategori wajib diisi.' });
      document.getElementById('category_name')?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveError(null);
    try {
      const saved = id ? await adminApi.categories.update(id, form) : await adminApi.categories.create(form);
      toast({ title: id ? 'Perubahan disimpan' : 'Kategori ditambahkan', description: saved.category_name });
      setInitial(form);
      router.push(LIST);
    } catch (err) {
      setErrors(err.fields || {});
      setSaveError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <UnsavedChangesGuard when={dirty && !saving} />
      {saveError && <SaveError title="Kategori belum disimpan" message={saveError} />}

      {/* One column, read top to bottom; the save bar at the end stays in view while the form scrolls. */}
      <div className={EDITOR_CARD}>
        <FormGroup title="Informasi kategori" subtitle="Yang dibaca pengunjung di menu dan halaman kategori.">
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
                {...describedBy('category_description', errors.category_description, true)}
                value={form.category_description}
                onChange={(e) => set('category_description')(e.target.value)}
                maxLength={DESCRIPTION_MAX}
                rows={5}
                placeholder="Contoh: Pelumas industri merek Sugimura untuk mesin hidrolik, kompresor, dan roda gigi."
              />
              <p id="category_description-hint" className="flex justify-between gap-4 text-xs">
                <span className="text-gray-500">Boleh dikosongkan.</span>
                <CharCount value={form.category_description} max={DESCRIPTION_MAX} />
              </p>
            </Field>
          </div>
        </FormGroup>

        <FormGroup title="Foto kategori" subtitle="Latar kartu kategori di beranda dan menu produk.">
          {/* Capped width: a full-width 16:9 photo would be taller than the screen. */}
          <div className="max-w-2xl">
            <CoverPhotoField id="category-photo" kind="categories" value={form.image} onChange={set('image')} error={errors.image} />
          </div>
        </FormGroup>

        <FormGroup title="Tampilan di website" subtitle="Atur apakah kategori ini terlihat di website.">
          <Switch
            id="status"
            label="Tampilkan di website"
            description={form.status ? 'Kategori dan produknya terlihat pengunjung.' : 'Disembunyikan dari pengunjung.'}
            checked={form.status}
            onChange={set('status')}
          />
        </FormGroup>

        {meta && (
          <FormGroup title="Riwayat">
            <dl className="divide-y divide-gray-100">
              <InfoRow label="Nomor kategori"><span className="tabular-nums">{meta.id}</span></InfoRow>
              <InfoRow label="Jumlah produk">
                <Link href={`/admin-back-office/produk/?kategori=${meta.id}`} className="tabular-nums text-brand-700 hover:underline">
                  {meta.product_count} produk
                </Link>
              </InfoRow>
              <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
              <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
            </dl>
          </FormGroup>
        )}

        <SaveBar cancelHref={LIST} label={id ? 'Simpan perubahan' : 'Tambah kategori'} busy={saving} busyLabel="Menyimpan…" />
      </div>
    </form>
  );
}
