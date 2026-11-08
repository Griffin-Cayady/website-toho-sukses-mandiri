'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
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
  Select,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';

const LIST = '/admin-back-office/sertifikasi/';
// tbl_certification_merk.certification_name is varchar(255); same limits as the merk editor's certification rows.
const NAME_MAX = 255;
const DESCRIPTION_MAX = 2000;

// merk_id: the tbl_master_merk.id as a string for the <select> ('' = not chosen yet).
// certification_image: the logo's stored path (certification_image/<name>.png) or null.
const EMPTY = { merk_id: '', certification_name: '', certification_description: '', certification_image: null };

// Static export: one page for new and existing certifications; ?id= picks the certification.
export default function AdminCertificationEditPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <CertificationEditor />
    </Suspense>
  );
}

function CertificationEditor() {
  const id = useSearchParams().get('id');
  return (
    <AdminFrame
      wide
      title={id ? 'Edit sertifikasi' : 'Tambah sertifikasi'}
      description="Ditampilkan di pop-up brand pada halaman utama."
      back={{ href: LIST, label: 'Semua sertifikasi' }}
    >
      <CertificationForm key={id ?? 'new'} id={id} />
    </AdminFrame>
  );
}

function CertificationForm({ id }) {
  const router = useRouter();
  const { toast } = useToast();
  // Loaded together with the certification (if any), so the form never shows without its merk list.
  const [form, setForm] = useState(null);
  // The form as loaded; differences from it are unsaved changes.
  const [initial, setInitial] = useState(null);
  const [meta, setMeta] = useState(null);
  const [merks, setMerks] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.merks.list(), id ? adminApi.certifications.get(id) : null]).then(
      ([merkRows, cert]) => {
        setMerks([...merkRows].sort((a, b) => a.merk_name.localeCompare(b.merk_name)));
        const loaded = cert
          ? {
              merk_id: cert.merk_id ? String(cert.merk_id) : '',
              certification_name: cert.certification_name ?? '',
              certification_description: cert.certification_description ?? '',
              certification_image: cert.certification_image || null,
            }
          : EMPTY;
        setForm(loaded);
        setInitial(loaded);
        setMeta(cert);
      },
      (err) => setLoadError(err.status === 404 ? 'Sertifikasi ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
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
    const missing = {};
    if (!form.merk_id) missing.merk_id = 'Pilih brand.';
    if (!form.certification_name.trim()) missing.certification_name = 'Nama sertifikasi wajib diisi.';
    setErrors(missing);
    if (Object.keys(missing).length) {
      document.getElementById(Object.keys(missing)[0])?.focus();
      return;
    }
    setSaving(true);
    setSaveError(null);
    const data = { ...form, merk_id: Number(form.merk_id) };
    try {
      const saved = id ? await adminApi.certifications.update(id, data) : await adminApi.certifications.create(data);
      toast({ title: id ? 'Perubahan disimpan' : 'Sertifikasi ditambahkan', description: saved.certification_name });
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
      {saveError && <SaveError title="Sertifikasi belum disimpan" message={saveError} />}

      <div className={EDITOR_CARD}>
        <FormGroup title="Sertifikasi" subtitle="Nama, keterangan, dan logo yang dilihat pengunjung di pop-up brand.">
          <div className="space-y-5">
            <Field id="merk_id" label="Brand" required hint="Brand pemilik sertifikasi ini." error={errors.merk_id}>
              <Select
                {...describedBy('merk_id', errors.merk_id, true)}
                aria-required="true"
                value={form.merk_id}
                onChange={(e) => set('merk_id')(e.target.value)}
              >
                <option value="">Pilih brand</option>
                {merks.map((m) => (
                  <option key={m.id} value={m.id}>{m.merk_name}</option>
                ))}
              </Select>
            </Field>
            <Field id="certification_name" label="Nama sertifikasi" required error={errors.certification_name}>
              <Input
                {...describedBy('certification_name', errors.certification_name)}
                aria-required="true"
                value={form.certification_name}
                onChange={(e) => set('certification_name')(e.target.value)}
                maxLength={NAME_MAX}
                placeholder="Contoh: ISO 9001:2015"
              />
            </Field>
            <Field id="certification_description" label="Keterangan" error={errors.certification_description}>
              <Textarea
                {...describedBy('certification_description', errors.certification_description, true)}
                value={form.certification_description}
                onChange={(e) => set('certification_description')(e.target.value)}
                maxLength={DESCRIPTION_MAX}
                rows={3}
                placeholder="Contoh: Manajemen mutu"
              />
              <p id="certification_description-hint" className="flex justify-between gap-4 text-xs">
                <span className="text-gray-500">Boleh dikosongkan.</span>
                <CharCount value={form.certification_description} max={DESCRIPTION_MAX} />
              </p>
            </Field>
            {/* Capped width, like the merk logo; the dark tile previews the white logo as the website shows it. */}
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium text-gray-800">
                Logo <span className="font-normal text-gray-500">(opsional)</span>
              </p>
              <CoverPhotoField
                logo
                dark
                id="certification_image"
                kind="certifications"
                value={form.certification_image}
                onChange={set('certification_image')}
                error={errors.certification_image}
              />
            </div>
          </div>
        </FormGroup>

        {meta && (
          <FormGroup title="Riwayat">
            <dl className="divide-y divide-gray-100">
              <InfoRow label="Nomor sertifikasi"><span className="tabular-nums">{meta.id}</span></InfoRow>
              <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
              <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
            </dl>
          </FormGroup>
        )}

        <SaveBar cancelHref={LIST} label={id ? 'Simpan perubahan' : 'Tambah sertifikasi'} busy={saving} busyLabel="Menyimpan…" />
      </div>
    </form>
  );
}
