'use client';

import React, { useState } from 'react';
import { FloppyDiskIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame from '@/components/admin/AdminFrame';
import { Field, Spinner, describedBy } from '@/components/admin/FormParts';
import { adminApi } from '@/lib/adminApi';

export default function AdminPasswordPage() {
  return (
    <AdminFrame title="Ganti password" description="Password baru berlaku untuk login berikutnya. Sesi ini tetap aktif.">
      <PasswordForm />
    </AdminFrame>
  );
}

function PasswordForm() {
  const { toast } = useToast();
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formElement = e.target;
    const form = new FormData(formElement);
    const [current, next, repeat] = ['current', 'new', 'repeat'].map((key) => String(form.get(key) || ''));

    const found = {};
    if (!current) found.current = 'Isi password saat ini.';
    if (next.length < 8 || next.length > 72) found.new = 'Password baru harus 8 sampai 72 karakter.';
    else if (next !== repeat) found.repeat = 'Password tidak sama.';
    setErrors(found);
    if (Object.keys(found).length) {
      formElement.elements[Object.keys(found)[0]]?.focus();
      return;
    }

    setSaving(true);
    try {
      await adminApi.changePassword(current, next);
      toast({ title: 'Password diganti', description: 'Gunakan password baru saat masuk berikutnya.' });
      formElement.reset();
    } catch (err) {
      setErrors(err.fields || {});
      if (!err.fields) toast({ variant: 'destructive', title: 'Password belum diganti', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-5 rounded-xl border border-gray-200 bg-white p-6">
      {/* Lets password managers file the new password under the right account. */}
      <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" readOnly />
      <Field id="current" label="Password saat ini" error={errors.current}>
        <Input {...describedBy('current', errors.current)} name="current" type="password" autoComplete="current-password" />
      </Field>
      <Field id="new" label="Password baru" hint="8 sampai 72 karakter." error={errors.new}>
        <Input {...describedBy('new', errors.new)} name="new" type="password" autoComplete="new-password" />
      </Field>
      <Field id="repeat" label="Ulangi password baru" error={errors.repeat}>
        <Input {...describedBy('repeat', errors.repeat)} name="repeat" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" disabled={saving}>
        {saving ? <Spinner /> : <FloppyDiskIcon className="h-4 w-4" weight="bold" aria-hidden="true" />}
        {saving ? 'Menyimpan…' : 'Ganti password'}
      </Button>
    </form>
  );
}
