'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame, { FullPageSpinner } from '@/components/admin/AdminFrame';
import PhotoField from '@/components/admin/PhotoField';
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
  Select,
  Switch,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';
import { packLine, parseSize } from '@/lib/productInfo';

const LIST = '/admin-back-office/produk/';
const MAX_PHOTOS = 5;
const DESCRIPTION_MAX = 5000;

const EMPTY = {
  product_name: '',
  product_category: '',
  // '' = no merk (tbl_master_product.product_merk NULL)
  product_merk: '',
  product_type_1: '',
  product_size: '',
  product_description: '',
  product_best_selling: false,
  product_status: true,
  images: [],
};

const toForm = (product) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((key) => [key, product[key] ?? EMPTY[key]])),
  product_category: product.product_category ? String(product.product_category) : '',
  product_merk: product.product_merk ? String(product.product_merk) : '',
});

// Static export: one page for new and existing products; ?id= picks the product, ?copy= starts a new product
// pre-filled from an existing one (without its photos: those files belong to the original and are deleted with it).
export default function AdminProductEditPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ProductEditor />
    </Suspense>
  );
}

function ProductEditor() {
  const params = useSearchParams();
  const id = params.get('id');
  const copyId = id ? null : params.get('copy');
  return (
    <AdminFrame
      wide
      title={id ? 'Edit produk' : 'Tambah produk'}
      description={
        id
          ? 'Perubahan tampil di katalog website setelah disimpan.'
          : copyId
            ? 'Disalin dari produk lain, tanpa fotonya. Ubah yang berbeda, lalu simpan sebagai produk baru.'
            : 'Produk aktif langsung tampil di katalog website.'
      }
      back={{ href: LIST, label: 'Semua produk' }}
    >
      <ProductForm key={id ?? (copyId ? `copy-${copyId}` : 'new')} id={id} copyId={copyId} />
    </AdminFrame>
  );
}

const normalName = (name) => name.trim().toLowerCase();

function ProductForm({ id, copyId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  // The form as loaded or last saved; differences from it are unsaved changes.
  const [initial, setInitial] = useState(null);
  // Read-only facts about an existing product (number, last saved), shown in the side panel.
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [merks, setMerks] = useState([]);
  // Existing product types, offered as suggestions so the catalogue's "Jenis produk" filter stays consistent.
  const [types, setTypes] = useState([]);
  // Every product's id and name, to warn before a second product gets the same name.
  const [names, setNames] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(0);

  useEffect(() => {
    const source = id ?? copyId;
    Promise.all([adminApi.categories.list(), adminApi.merks.list(), adminApi.products.list(), source ? adminApi.products.get(source) : null]).then(
      ([categoryRows, merkRows, productRows, product]) => {
        setCategories(categoryRows);
        setMerks([...merkRows].sort((a, b) => a.merk_name.localeCompare(b.merk_name)));
        setTypes([...new Set(productRows.map((p) => p.product_type_1).filter(Boolean))].sort());
        setNames(productRows.map((p) => ({ id: p.id, name: normalName(p.product_name || '') })));
        const loaded = product ? { ...toForm(product), ...(id ? {} : { images: [] }) } : EMPTY;
        setForm(loaded);
        setInitial(loaded);
        setMeta(id ? product : null);
      },
      (err) => setLoadError(err.status === 404 ? 'Produk ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
    );
  }, [id, copyId]);

  const dirty = useMemo(() => form !== null && JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Editing a field clears its error straight away, so only problems that still exist stay on screen.
  const clearError = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key);
  };
  const setImages = (update) => {
    setForm((f) => ({ ...f, images: typeof update === 'function' ? update(f.images) : update }));
    clearError('images');
  };

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.category_name.localeCompare(b.category_name)), [categories]);

  if (loadError) return <LoadError message={loadError} />;
  if (!form) return <EditorSkeleton />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || uploadingPhotos > 0) return;
    const missing = {};
    if (!form.product_name.trim()) missing.product_name = 'Nama produk wajib diisi.';
    if (!form.product_category) missing.product_category = 'Pilih kategori.';
    setErrors(missing);
    if (Object.keys(missing).length) {
      document.getElementById(Object.keys(missing)[0])?.focus();
      return;
    }

    setSaving(true);
    setSaveError(null);
    const data = { ...form, product_category: Number(form.product_category), product_merk: form.product_merk ? Number(form.product_merk) : null };
    try {
      const saved = id ? await adminApi.products.update(id, data) : await adminApi.products.create(data);
      toast({ title: id ? 'Perubahan disimpan' : 'Produk ditambahkan', description: saved.product_name });
      setInitial(form);
      router.push(LIST);
    } catch (err) {
      setErrors(err.fields || {});
      setSaveError(err.message);
      setSaving(false);
    }
  };

  const category = categories.find((c) => String(c.id) === form.product_category);
  const nameTaken = form.product_name.trim() !== '' && names.some((n) => String(n.id) !== String(id) && n.name === normalName(form.product_name));
  const waitingForPhotos = uploadingPhotos > 0;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <UnsavedChangesGuard when={dirty && !saving} />
      {saveError && <SaveError title="Produk belum disimpan" message={saveError} />}

      {/* One column, read top to bottom; the save bar at the end stays in view while the form scrolls. */}
      <div className={EDITOR_CARD}>
        <FormGroup title="Informasi produk" subtitle="Nama, kategori, brand, dan jenis yang dipakai untuk filter di katalog.">
          <div className="space-y-5">
            <Field
              id="product_name"
              label="Nama produk"
              required
              hint={nameTaken && <span className="text-amber-700">Sudah ada produk dengan nama ini. Pastikan ini bukan produk yang sama.</span>}
              error={errors.product_name}
            >
              <Input
                {...describedBy('product_name', errors.product_name, nameTaken)}
                aria-required="true"
                value={form.product_name}
                onChange={(e) => set('product_name')(e.target.value)}
                maxLength={255}
                placeholder="Contoh: Sugilube AW-68"
              />
            </Field>

            <Field
              id="product_category"
              label="Kategori"
              required
              hint={category && !category.status && <span className="text-amber-700">Kategori ini sedang nonaktif, jadi tidak tampil di website.</span>}
              error={errors.product_category}
            >
              <Select
                {...describedBy('product_category', errors.product_category, category && !category.status)}
                aria-required="true"
                value={form.product_category}
                onChange={(e) => set('product_category')(e.target.value)}
              >
                <option value="">Pilih kategori</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}{c.status ? '' : ' (nonaktif)'}
                  </option>
                ))}
              </Select>
            </Field>

            <Field id="product_type_1" label="Jenis produk" hint="Pilih dari daftar atau ketik jenis baru." error={errors.product_type_1}>
              <Input
                {...describedBy('product_type_1', errors.product_type_1, true)}
                list="product-types"
                value={form.product_type_1}
                onChange={(e) => set('product_type_1')(e.target.value)}
                maxLength={255}
                placeholder="Contoh: Hydraulic Oil"
              />
              <datalist id="product-types">
                {types.map((t) => <option key={t} value={t} />)}
              </datalist>
            </Field>

            <Field
              id="product_merk"
              label="Brand"
              hint={
                merks.length ? (
                  'Boleh dikosongkan.'
                ) : (
                  <>
                    Belum ada brand. <Link href="/admin-back-office/merk/edit/" className="font-medium text-brand-700 hover:underline">Tambah brand</Link>
                  </>
                )
              }
              error={errors.product_merk}
            >
              <Select
                {...describedBy('product_merk', errors.product_merk, true)}
                value={form.product_merk}
                onChange={(e) => set('product_merk')(e.target.value)}
              >
                <option value="">Tanpa brand</option>
                {merks.map((m) => (
                  <option key={m.id} value={m.id}>{m.merk_name}</option>
                ))}
              </Select>
            </Field>

            <Field
              id="product_size"
              label="Ukuran / kemasan"
              hint={
                form.product_size.trim()
                  ? `Di website: ${packLine(parseSize(form.product_size))}.`
                  : 'Contoh: 200 (liter), 15 kg, atau 10 kVA.'
              }
              error={errors.product_size}
            >
              <Input
                {...describedBy('product_size', errors.product_size, true)}
                value={form.product_size}
                onChange={(e) => set('product_size')(e.target.value)}
                maxLength={255}
              />
            </Field>
          </div>
        </FormGroup>

        <FormGroup title="Deskripsi" subtitle="Tampil di jendela detail produk.">
          <Field id="product_description" label="Deskripsi produk" error={errors.product_description}>
            <Textarea
              {...describedBy('product_description', errors.product_description, true)}
              value={form.product_description}
              onChange={(e) => set('product_description')(e.target.value)}
              maxLength={DESCRIPTION_MAX}
              rows={5}
              placeholder="Contoh: Oli hidrolik anti-aus untuk mesin injeksi plastik dan alat berat."
            />
            <p id="product_description-hint" className="flex justify-between gap-4 text-xs">
              <span className="text-gray-500">Boleh dikosongkan.</span>
              <CharCount value={form.product_description} max={DESCRIPTION_MAX} />
            </p>
          </Field>
        </FormGroup>

        <FormGroup title="Foto produk" subtitle={form.images.length > 1 ? 'Ubah urutan dengan tombol panah di setiap foto.' : undefined}>
          <PhotoField
            id="product-photos"
            kind="products"
            label="Foto produk"
            value={form.images}
            onChange={setImages}
            onUploadingChange={setUploadingPhotos}
            max={MAX_PHOTOS}
            error={errors.images}
          />
        </FormGroup>

        <FormGroup title="Tampilan di website" subtitle="Atur apakah produk ini terlihat dan ditonjolkan di website.">
          <div className="space-y-3">
            <Switch
              id="product_status"
              label="Tampilkan di website"
              description={form.product_status ? 'Produk terlihat di katalog website.' : 'Disembunyikan dari pengunjung.'}
              checked={form.product_status}
              onChange={set('product_status')}
            />
            <Switch
              id="product_best_selling"
              label="Produk pilihan"
              description='Tampil di bagian "Produk pilihan" di beranda.'
              checked={form.product_best_selling}
              onChange={set('product_best_selling')}
            />
          </div>
        </FormGroup>

        {meta && (
          <FormGroup title="Riwayat">
            <dl className="divide-y divide-gray-100">
              <InfoRow label="Nomor produk"><span className="tabular-nums">{meta.id}</span></InfoRow>
              <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
              <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
            </dl>
          </FormGroup>
        )}

        <SaveBar
          cancelHref={LIST}
          label={id ? 'Simpan perubahan' : 'Tambah produk'}
          busy={saving || waitingForPhotos}
          busyLabel={waitingForPhotos ? 'Menunggu foto…' : 'Menyimpan…'}
        />
      </div>
    </form>
  );
}
