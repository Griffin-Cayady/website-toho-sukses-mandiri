'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
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
  Select,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';

const LIST = '/admin-back-office/merk/';
// tbl_master_merk.merk_name is varchar(100).
const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;

// product_category: the tbl_product_category.id the merk belongs to, as a string for the <select> ('' = not chosen yet).
// merk_image: the logo's stored path (merk_image/<name>.png) or null.
// certifications: the merk's tbl_certification_merk rows; `key` only tells the rows apart on screen and is not sent.
// file_catalog_merk: link to the merk's catalogue (Google Drive), shown on the website as "Download Katalog"; '' = none.
const EMPTY = { merk_name: '', product_category: '', merk_description: '', merk_image: null, file_catalog_merk: '', certifications: [] };
const CATALOG_URL_MAX = 2000;
// tbl_certification_merk.certification_name is varchar(255).
const CERT_NAME_MAX = 255;
const CERT_DESCRIPTION_MAX = 2000;

let nextCertKey = 0;
const certRow = (row = {}) => ({
  key: row.id ? `saved-${row.id}` : `new-${nextCertKey++}`,
  id: row.id,
  certification_name: row.certification_name ?? '',
  certification_description: row.certification_description ?? '',
  certification_image: row.certification_image || null,
});

// Static export: one page for new and existing merks; ?id= picks the merk.
export default function AdminMerkEditPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <MerkEditor />
    </Suspense>
  );
}

function MerkEditor() {
  const id = useSearchParams().get('id');
  return (
    <AdminFrame
      wide
      title={id ? 'Edit brand' : 'Tambah brand'}
      description={id ? 'Perubahan berlaku untuk semua produk dengan brand ini.' : 'Brand baru bisa langsung dipilih untuk produk.'}
      back={{ href: LIST, label: 'Semua brand' }}
    >
      <MerkForm key={id ?? 'new'} id={id} />
    </AdminFrame>
  );
}

function MerkForm({ id }) {
  const router = useRouter();
  const { toast } = useToast();
  // Loaded together with the merk (if any), so the form never shows without its category list.
  const [form, setForm] = useState(null);
  // The form as loaded; differences from it are unsaved changes.
  const [initial, setInitial] = useState(null);
  // Read-only facts about an existing merk (products, last saved), shown in "Riwayat".
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.categories.list(), id ? adminApi.merks.get(id) : null]).then(
      ([categoryRows, merk]) => {
        setCategories([...categoryRows].sort((a, b) => a.category_name.localeCompare(b.category_name)));
        const loaded = merk
          ? {
              merk_name: merk.merk_name ?? '',
              product_category: merk.product_category ? String(merk.product_category) : '',
              merk_description: merk.merk_description ?? '',
              merk_image: merk.merk_image || null,
              file_catalog_merk: merk.file_catalog_merk ?? '',
              certifications: (merk.certifications ?? []).map(certRow),
            }
          : EMPTY;
        setForm(loaded);
        setInitial(loaded);
        setMeta(merk);
      },
      (err) => setLoadError(err.status === 404 ? 'Brand ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
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

  // One certification's field; its error is keyed by the input's id, the server's by 'certifications'.
  const setCert = (certKey, field) => (value) => {
    setForm((f) => ({ ...f, certifications: f.certifications.map((c) => (c.key === certKey ? { ...c, [field]: value } : c)) }));
    setErrors((e) => ({ ...e, [`cert-${certKey}-${field}`]: undefined, certifications: undefined }));
  };
  const addCert = () => {
    const row = certRow();
    setForm((f) => ({ ...f, certifications: [...f.certifications, row] }));
    // Focus the new row's name once it has rendered.
    setTimeout(() => document.getElementById(`cert-${row.key}-certification_name`)?.focus());
  };
  const removeCert = (certKey) => {
    setForm((f) => ({ ...f, certifications: f.certifications.filter((c) => c.key !== certKey) }));
    setErrors((e) => ({ ...e, certifications: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const missing = {};
    if (!form.merk_name.trim()) missing.merk_name = 'Nama brand wajib diisi.';
    if (!form.product_category) missing.product_category = 'Pilih kategori.';
    // Same rule as the API: the website links to it, so it must be a full http(s) address.
    if (form.file_catalog_merk.trim() && !/^https?:\/\/\S+$/i.test(form.file_catalog_merk.trim())) {
      missing.file_catalog_merk = 'Masukkan link lengkap yang diawali https://, misalnya link Google Drive.';
    }
    for (const c of form.certifications) {
      if (!c.certification_name.trim()) missing[`cert-${c.key}-certification_name`] = 'Nama sertifikasi wajib diisi.';
    }
    setErrors(missing);
    if (Object.keys(missing).length) {
      document.getElementById(Object.keys(missing)[0])?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    const data = {
      ...form,
      product_category: Number(form.product_category),
      certifications: form.certifications.map(({ key, ...c }) => c),
    };
    try {
      const saved = id ? await adminApi.merks.update(id, data) : await adminApi.merks.create(data);
      toast({ title: id ? 'Perubahan disimpan' : 'Brand ditambahkan', description: saved.merk_name });
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
      {saveError && <SaveError title="Brand belum disimpan" message={saveError} />}

      {/* One column, read top to bottom; the save bar at the end stays in view while the form scrolls. */}
      <div className={EDITOR_CARD}>
        <FormGroup title="Identitas brand" subtitle="Nama dan logo yang dilihat pengunjung di halaman brand dan produk.">
          <div className="space-y-5">
            <Field id="merk_name" label="Nama brand" required hint="Harus berbeda dari brand lain." error={errors.merk_name}>
              <Input
                {...describedBy('merk_name', errors.merk_name, true)}
                aria-required="true"
                value={form.merk_name}
                onChange={(e) => set('merk_name')(e.target.value)}
                maxLength={NAME_MAX}
                placeholder="Contoh: Sugimura"
              />
            </Field>
            <Field id="product_category" label="Kategori" required hint="Kategori produk yang memakai brand ini." error={errors.product_category}>
              <Select
                {...describedBy('product_category', errors.product_category, true)}
                aria-required="true"
                value={form.product_category}
                onChange={(e) => set('product_category')(e.target.value)}
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}{c.status ? '' : ' (nonaktif)'}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="merk_description" label="Deskripsi" error={errors.merk_description}>
              <Textarea
                {...describedBy('merk_description', errors.merk_description, true)}
                value={form.merk_description}
                onChange={(e) => set('merk_description')(e.target.value)}
                maxLength={DESCRIPTION_MAX}
                rows={5}
                placeholder="Contoh: Pelumas industri buatan Jepang untuk mesin hidrolik, kompresor, dan roda gigi."
              />
              <p id="merk_description-hint" className="flex justify-between gap-4 text-xs">
                <span className="text-gray-500">Boleh dikosongkan.</span>
                <CharCount value={form.merk_description} max={DESCRIPTION_MAX} />
              </p>
            </Field>
            <Field
              id="file_catalog_merk"
              label="Link katalog (Google Drive)"
              hint="Muncul sebagai tombol “Download Katalog” di pop-up merk. Atur akses file di Google Drive ke “Siapa saja yang memiliki link”. Kosongkan bila belum ada."
              error={errors.file_catalog_merk}
            >
              <Input
                {...describedBy('file_catalog_merk', errors.file_catalog_merk, true)}
                type="url"
                inputMode="url"
                value={form.file_catalog_merk}
                onChange={(e) => set('file_catalog_merk')(e.target.value)}
                maxLength={CATALOG_URL_MAX}
                placeholder="https://drive.google.com/file/d/…/view"
              />
            </Field>
            {/* Capped width: a full-width 3:2 logo box would be taller than every field above it. */}
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium text-gray-800">
                Logo brand <span className="font-normal text-gray-500">(opsional)</span>
              </p>
              <CoverPhotoField logo id="merk_image" kind="merks" value={form.merk_image} onChange={set('merk_image')} error={errors.merk_image} />
            </div>
          </div>
        </FormGroup>

        <FormGroup title="Sertifikasi" subtitle="Ditampilkan di pop-up brand pada halaman utama. Kosongkan bila brand ini belum bersertifikat.">
          <div className="space-y-4">
            {form.certifications.map((cert, i) => {
              const nameId = `cert-${cert.key}-certification_name`;
              const descriptionId = `cert-${cert.key}-certification_description`;
              return (
                <fieldset key={cert.key} className="rounded-xl p-4 ring-1 ring-gray-200 sm:p-5">
                  <legend className="sr-only">Sertifikasi {i + 1}</legend>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-gray-900" aria-hidden="true">Sertifikasi {i + 1}</p>
                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => removeCert(cert.key)}>
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Hapus<span className="sr-only"> sertifikasi {i + 1}</span>
                    </Button>
                  </div>
                  <div className="grid gap-5 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-800">
                        Logo <span className="font-normal text-gray-500">(opsional)</span>
                      </p>
                      <CoverPhotoField
                        logo
                        dark
                        id={`cert-${cert.key}-certification_image`}
                        kind="certifications"
                        value={cert.certification_image}
                        onChange={setCert(cert.key, 'certification_image')}
                      />
                    </div>
                    <div className="space-y-5">
                      <Field id={nameId} label="Nama sertifikasi" required error={errors[nameId]}>
                        <Input
                          {...describedBy(nameId, errors[nameId])}
                          aria-required="true"
                          value={cert.certification_name}
                          onChange={(e) => setCert(cert.key, 'certification_name')(e.target.value)}
                          maxLength={CERT_NAME_MAX}
                          placeholder="Contoh: ISO 9001:2015"
                        />
                      </Field>
                      <Field id={descriptionId} label="Keterangan">
                        <Textarea
                          {...describedBy(descriptionId, null, true)}
                          value={cert.certification_description}
                          onChange={(e) => setCert(cert.key, 'certification_description')(e.target.value)}
                          maxLength={CERT_DESCRIPTION_MAX}
                          rows={2}
                          placeholder="Contoh: Manajemen mutu"
                        />
                        <p id={`${descriptionId}-hint`} className="flex justify-between gap-4 text-xs">
                          <span className="text-gray-500">Boleh dikosongkan.</span>
                          <CharCount value={cert.certification_description} max={CERT_DESCRIPTION_MAX} />
                        </p>
                      </Field>
                    </div>
                  </div>
                </fieldset>
              );
            })}
            {errors.certifications && (
              <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
                <WarningIcon className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
                {errors.certifications}
              </p>
            )}
            <Button type="button" variant="outline" onClick={addCert}>
              <PlusIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
              Tambah sertifikasi
            </Button>
          </div>
        </FormGroup>

        {meta && (
          <FormGroup title="Riwayat">
            <dl className="divide-y divide-gray-100">
              <InfoRow label="Nomor brand"><span className="tabular-nums">{meta.id}</span></InfoRow>
              <InfoRow label="Jumlah produk"><span className="tabular-nums">{meta.product_count} produk</span></InfoRow>
              <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
              <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
            </dl>
          </FormGroup>
        )}

        <SaveBar cancelHref={LIST} label={id ? 'Simpan perubahan' : 'Tambah brand'} busy={saving} busyLabel="Menyimpan…" />
      </div>
    </form>
  );
}
