'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon, LockSimpleIcon, WarningIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Spinner } from '@/components/admin/FormParts';
import { FullPageSpinner } from '@/components/admin/AdminFrame';
import { useAdmin } from '@/contexts/AdminContext.jsx';
import { IMAGES } from '@/lib/images';

const AFTER_LOGIN = '/admin-back-office/produk/';

export default function AdminLoginPage() {
  const { status, login, connectionError } = useAdmin();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === 'in') router.replace(AFTER_LOGIN);
  }, [status, router]);

  if (status !== 'out') return <FullPageSpinner />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const username = String(form.get('username') || '').trim();
    const password = String(form.get('password') || '');
    if (!username || !password) {
      setError('Isi username dan password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const message = error || connectionError;

  return (
    <main id="main-content" className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={IMAGES.logo} alt="" className="h-14 w-14" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">Back office</h1>
          <p className="mt-1 text-sm text-gray-600">Toho Sukses Mandiri. Khusus admin.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-soft">
          {message && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
              {message}
            </p>
          )}

          <Field id="username" label="Username">
            <Input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus required />
          </Field>

          <Field id="password" label="Password">
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="pr-11" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Spinner /> : <LockSimpleIcon className="h-4 w-4" weight="bold" aria-hidden="true" />}
            {submitting ? 'Memeriksa…' : 'Masuk'}
          </Button>
        </form>
      </div>
    </main>
  );
}
