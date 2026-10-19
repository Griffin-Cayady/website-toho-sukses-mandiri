'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame, { FullPageSpinner } from '@/components/admin/AdminFrame';
import {
  CharCount,
  EDITOR_GRID,
  EDITOR_PANEL,
  EditorActions,
  EditorSkeleton,
  Field,
  FormGroup,
  InfoRow,
  LoadError,
  PanelActions,
  Spinner,
  describedBy,
} from '@/components/admin/FormParts';
import { formatDate } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';

const LIST = '/admin-back-office/merk/';
// tbl_master_merk.merk_name is varchar(100).
const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;

const EMPTY = { merk_name: '', merk_description: '' };

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
      title={id ? 'Edit merk' : 'Tambah merk'}
      description={id ? 'Perubahan berlaku untuk semua produk dengan merk ini.' : 'Merk baru bisa langsung dipilih untuk produk.'}
      back={{ href: LIST, label: 'Semua merk' }}
    >
      <MerkForm key={id ?? 'new'} id={id} />
    </AdminFrame>
  );
}

function MerkForm({ id }) {
  const router = useRouter();
  const { toast } = useToast();
  // Starts filled for a new merk; an existing one is loaded first.
  const [form, setForm] = useState(id ? null : EMPTY);
  // Read-only facts about an existing merk (products, last saved), shown beside the form.
  const [meta, setMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi.merks.get(id).then(
      (merk) => {
        setForm({ merk_name: merk.merk_name ?? '', merk_description: merk.merk_description ?? '' });
        setMeta(merk);
      },
      (err) => setLoadError(err.status === 404 ? 'Merk ini tidak ditemukan. Mungkin sudah dihapus.' : err.message)
    );
  }, [id]);

  if (loadError) return <LoadError message={loadError} />;
  if (!form) return <EditorSkeleton />;

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.merk_name.trim()) {
      setErrors({ merk_name: 'Nama merk wajib diisi.' });
      document.getElementById('merk_name')?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const saved = id ? await adminApi.merks.update(id, form) : await adminApi.merks.create(form);
      toast({ title: id ? 'Perubahan disimpan' : 'Merk ditambahkan', description: saved.merk_name });
      router.push(LIST);
    } catch (err) {
      setErrors(err.fields || {});
      if (err.fields?.merk_name) document.getElementById('merk_name')?.focus();
      toast({ variant: 'destructive', title: 'Merk belum disimpan', description: err.message });
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
        {saving ? 'Menyimpan…' : id ? 'Simpan perubahan' : 'Tambah merk'}
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className={EDITOR_GRID}>
        <div className="rounded-2xl bg-white shadow-soft ring-1 ring-gray-200/70">
          <FormGroup title="Nama dan deskripsi" subtitle="Nama merk harus berbeda dari merk lain.">
            <div className="space-y-5">
              <Field id="merk_name" label="Nama merk" required error={errors.merk_name}>
                <Input
                  {...describedBy('merk_name', errors.merk_name)}
                  aria-required="true"
                  value={form.merk_name}
                  onChange={(e) => set('merk_name')(e.target.value)}
                  maxLength={NAME_MAX}
                  placeholder="Contoh: Sugimura"
                />
              </Field>
              <Field id="merk_description" label="Deskripsi" error={errors.merk_description}>
                <Textarea
                  {...describedBy('merk_description', errors.merk_description)}
                  value={form.merk_description}
                  onChange={(e) => set('merk_description')(e.target.value)}
                  maxLength={DESCRIPTION_MAX}
                  rows={5}
                  placeholder="Contoh: Pelumas industri buatan Jepang untuk mesin hidrolik, kompresor, dan roda gigi."
                />
                <p className="flex justify-between gap-4 text-xs">
                  <span className="text-gray-500">Boleh dikosongkan.</span>
                  <CharCount value={form.merk_description} max={DESCRIPTION_MAX} />
                </p>
              </Field>
            </div>
          </FormGroup>
        </div>

        {/* Stays in view while the form scrolls. */}
        <aside className={EDITOR_PANEL}>
          <dl className="divide-y divide-gray-100 px-5 py-1.5">
            {meta ? (
              <>
                <InfoRow label="Nomor merk"><span className="tabular-nums">{meta.id}</span></InfoRow>
                <InfoRow label="Jumlah produk"><span className="tabular-nums">{meta.product_count} produk</span></InfoRow>
                <InfoRow label="Last update"><span className="tabular-nums">{formatDate(meta.last_update) ?? '—'}</span></InfoRow>
                <InfoRow label="User update">{meta.user_update_name || meta.user_update || '—'}</InfoRow>
              </>
            ) : (
              <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-2 text-sm">
                <dt className="text-gray-500">Nomor merk</dt>
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
