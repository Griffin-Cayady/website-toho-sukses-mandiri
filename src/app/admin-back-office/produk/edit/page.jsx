'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FloppyDiskIcon, ImageIcon, StarIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame, { FullPageSpinner } from '@/components/admin/AdminFrame';
import PhotoField from '@/components/admin/PhotoField';
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
  Select,
  Spinner,
  StatusBadge,
  Switch,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';
import { imageUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

const LIST = '/admin-back-office/produk/';
const MAX_PHOTOS = 5;
const DESCRIPTION_MAX = 5000;

const EMPTY = {
  product_name: '',
  product_category: '',
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
});

// Static export: one page for new and existing products; ?id= picks the product.
export default function AdminProductEditPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ProductEditor />
    </Suspense>
  );
}

function ProductEditor() {
  const id = useSearchParams().get('id');
  return (
    <AdminFrame
      wide
      title={id ? 'Edit produk' : 'Tambah produk'}
      description={id ? 'Perubahan tampil di katalog website setelah disimpan.' : 'Produk aktif langsung tampil di katalog website.'}
      back={{ href: LIST, label: 'Semua produk' }}
    >
      <ProductForm key={id ?? 'new'} id={id} />
    </AdminFrame>
  );
}

// The product's card as the website's catalogue draws it (ProductCard), updated as the admin types.
function WebsitePreview({ form, categoryName }) {
  const src = form.images[0] ? imageUrl(form.images[0]) : null;
  const name = form.product_name.trim();
  const size = form.product_size.trim();
  return (
    <div className={cn('overflow-hidden rounded-xl bg-white ring-1 ring-gray-300/80 transition-[filter,opacity] duration-300', !form.product_status && 'opacity-70 grayscale')}>
      <div className="relative aspect-[4/3] border-b border-gray-200/80 bg-gradient-to-b from-gray-50 to-gray-100/70">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-contain p-6" />
        ) : (
          <span className="bg-dots flex h-full w-full items-center justify-center" aria-hidden="true">
            <ImageIcon className="h-9 w-9 text-gray-300" />
          </span>
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1.5">
          <StatusBadge active={form.product_status} />
          {form.product_best_selling && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sun-soft px-2 py-0.5 text-xs font-semibold text-gray-800">
              <StarIcon className="h-3 w-3" weight="fill" aria-hidden="true" />
              Pilihan
            </span>
          )}
        </span>
        {size && <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-gray-700 ring-1 ring-gray-200">{size}</span>}
      </div>
      <div className="p-4">
        <p className="truncate text-xs font-medium text-brand-700">{[categoryName, form.product_type_1.trim()].filter(Boolean).join(' · ') || 'Kategori · Jenis'}</p>
        <p className={cn('mt-1 line-clamp-2 font-semibold leading-snug', name ? 'text-gray-900' : 'text-gray-400')}>{name || 'Nama produk'}</p>
        <p className={cn('mt-1 text-sm', size ? 'text-gray-500' : 'text-gray-400')}>{size ? `Ukuran ${size}` : 'Ukuran / kemasan'}</p>
      </div>
    </div>
  );
}

function ProductForm({ id }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  // Read-only facts about an existing product (number, last saved), shown in the side panel.
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  // Existing product types, offered as suggestions so the catalogue's "Jenis produk" filter stays consistent.
  const [types, setTypes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.categories.list(), adminApi.products.list(), id ? adminApi.products.get(id) : null]).then(
      ([categoryRows, productRows, product]) => {
        setCategories(categoryRows);
        setTypes([...new Set(productRows.map((p) => p.product_type_1).filter(Boolean))].sort());
        setForm(product ? toForm(product) : EMPTY);
        setMeta(product);
      },
      (err) => setLoadError(err.status === 404 ? 'Produk ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
    );
  }, [id]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setImages = (update) => setForm((f) => ({ ...f, images: typeof update === 'function' ? update(f.images) : update }));

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.category_name.localeCompare(b.category_name)), [categories]);

  if (loadError) return <LoadError message={loadError} />;
  if (!form) return <EditorSkeleton />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = {};
    if (!form.product_name.trim()) missing.product_name = 'Nama produk wajib diisi.';
    if (!form.product_category) missing.product_category = 'Pilih kategori.';
    setErrors(missing);
    if (Object.keys(missing).length) {
      document.getElementById(Object.keys(missing)[0])?.focus();
      return;
    }

    setSaving(true);
    const data = { ...form, product_category: Number(form.product_category) };
    try {
      const saved = id ? await adminApi.products.update(id, data) : await adminApi.products.create(data);
      toast({ title: id ? 'Perubahan disimpan' : 'Produk ditambahkan', description: saved.product_name });
      router.push(LIST);
    } catch (err) {
      setErrors(err.fields || {});
      toast({ variant: 'destructive', title: 'Produk belum disimpan', description: err.message });
      setSaving(false);
    }
  };

  const categoryName = categories.find((c) => String(c.id) === form.product_category)?.category_name;

  // The same two buttons sit in the side panel on desktop and in a bar along the bottom on smaller screens.
  const actions = (
    <>
      <Button asChild variant="outline">
        <Link href={LIST}>Batal</Link>
      </Button>
      <Button type="submit" disabled={saving} className="flex-1">
        {saving ? <Spinner /> : <FloppyDiskIcon className="h-4 w-4" weight="bold" aria-hidden="true" />}
        {saving ? 'Menyimpan…' : id ? 'Simpan perubahan' : 'Tambah produk'}
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={EDITOR_GRID}>
        <div className={EDITOR_CARD}>
          {/* Wide screens: details on the left, photos on the right. */}
          <div className="divide-y divide-gray-100">
            <FormGroup title="Informasi produk" subtitle="Nama, kategori, dan jenis yang dipakai untuk filter di katalog.">
              <div className="space-y-5">
                <Field id="product_name" label="Nama produk" required error={errors.product_name}>
                  <Input
                    {...describedBy('product_name', errors.product_name)}
                    aria-required="true"
                    value={form.product_name}
                    onChange={(e) => set('product_name')(e.target.value)}
                    maxLength={255}
                    placeholder="Contoh: Sugilube AW-68"
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="product_category" label="Kategori" required error={errors.product_category}>
                    <Select
                      {...describedBy('product_category', errors.product_category)}
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
                      {...describedBy('product_type_1', errors.product_type_1)}
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
                </div>

                <Field id="product_size" label="Ukuran / kemasan" hint="Contoh: 200 (liter), 15 kg, atau 10 kVA." error={errors.product_size}>
                  <Input
                    {...describedBy('product_size', errors.product_size)}
                    value={form.product_size}
                    onChange={(e) => set('product_size')(e.target.value)}
                    maxLength={255}
                    className="sm:max-w-xs"
                  />
                </Field>
              </div>
            </FormGroup>

            <FormGroup title="Deskripsi" subtitle="Tampil di jendela detail produk.">
              <Field id="product_description" label="Deskripsi produk" error={errors.product_description}>
                <Textarea
                  {...describedBy('product_description', errors.product_description)}
                  value={form.product_description}
                  onChange={(e) => set('product_description')(e.target.value)}
                  maxLength={DESCRIPTION_MAX}
                  rows={5}
                  placeholder="Contoh: Oli hidrolik anti-aus untuk mesin injeksi plastik dan alat berat."
                />
                <p className="flex justify-between gap-4 text-xs">
                  <span className="text-gray-500">Boleh dikosongkan.</span>
                  <CharCount value={form.product_description} max={DESCRIPTION_MAX} />
                </p>
              </Field>
            </FormGroup>
          </div>

          <FormGroup title="Foto produk" subtitle="Ubah urutan dengan tombol panah di setiap foto.">
            <PhotoField id="product-photos" kind="products" label="Foto produk" value={form.images} onChange={setImages} max={MAX_PHOTOS} error={errors.images} />
          </FormGroup>
        </div>

        {/* Stays in view while the form scrolls. */}
        <aside className={EDITOR_PANEL}>
          <div className="p-4">
            <p className="mb-2.5 px-1 text-xs font-semibold text-gray-500">Pratinjau di katalog</p>
            <WebsitePreview form={form} categoryName={categoryName} />
          </div>

          <Switch
            id="product_status"
            label="Tampilkan di website"
            description={form.product_status ? 'Produk terlihat di katalog website.' : 'Disembunyikan dari pengunjung.'}
            checked={form.product_status}
            onChange={set('product_status')}
            className={PANEL_SWITCH}
          />
          <Switch
            id="product_best_selling"
            label="Produk pilihan"
            description='Tampil di bagian "Produk pilihan" di beranda.'
            checked={form.product_best_selling}
            onChange={set('product_best_selling')}
            className={PANEL_SWITCH}
          />

          <dl className="divide-y divide-gray-100 border-t border-gray-100 px-5 py-1.5">
            {meta ? (
              <>
                <InfoRow label="Nomor produk"><span className="tabular-nums">{meta.id}</span></InfoRow>
                <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
                <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
              </>
            ) : (
              <InfoRow label="Nomor produk"><span className="font-normal text-gray-500">Otomatis</span></InfoRow>
            )}
          </dl>

          <PanelActions>{actions}</PanelActions>
        </aside>
      </div>

      <EditorActions>{actions}</EditorActions>
    </form>
  );
}
