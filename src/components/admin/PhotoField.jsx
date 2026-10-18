'use client';

import React, { useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ImageIcon, UploadSimpleIcon, WarningIcon, XIcon } from '@phosphor-icons/react';
import { adminApi } from '@/lib/adminApi';
import { imageUrl } from '@/lib/api';
import { Spinner } from '@/components/admin/FormParts';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

const tileButton = 'inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-gray-800 shadow-sm transition-colors hover:bg-white disabled:opacity-40';

// The reason a file can't be uploaded, or null when it's fine (also checked again on the server).
const fileProblem = (file) => {
  if (!ACCEPTED.includes(file.type)) return `"${file.name}" bukan JPG, PNG, atau WebP.`;
  if (file.size > MAX_BYTES) return `"${file.name}" lebih dari 5 MB.`;
  return null;
};

// One large photo shown at the website's 16:9 banner shape, e.g. a category photo. Click or drag a file in to
// upload; `value` is the stored path or null, `onChange` receives the new path or null.
export function CoverPhotoField({ id, kind, value, onChange, error }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    const problem = fileProblem(file);
    setUploadError(problem);
    if (problem) return;
    setUploading(true);
    try {
      onChange(await adminApi.upload(kind, file));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  };

  const src = value ? imageUrl(value) : null;
  const message = uploadError || error;
  const pick = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative aspect-[16/9] overflow-hidden rounded-xl transition-colors ${
          src ? 'bg-gray-100' : 'border-2 border-dashed bg-gray-50/60'
        } ${dragging ? 'border-brand-600 bg-brand-50/60 ring-4 ring-brand-600/10' : 'border-gray-300'}`}
      >
        {src ? (
          <>
            <img src={src} alt="Foto kategori" className="h-full w-full object-cover" />
            {/* Controls over the photo, on a soft dark fade so they stay readable on any image. */}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-gray-950/60 to-transparent p-3 pt-10">
              <button type="button" onClick={pick} disabled={uploading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-white/95 px-3 text-sm font-semibold text-gray-900 shadow-soft transition-colors hover:bg-white">
                {uploading ? <Spinner /> : <UploadSimpleIcon className="h-4 w-4" aria-hidden="true" />}
                {uploading ? 'Mengunggah…' : 'Ganti foto'}
              </button>
              <button type="button" onClick={() => onChange(null)} disabled={uploading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-white/95 px-3 text-sm font-semibold text-red-600 shadow-soft transition-colors hover:bg-white">
                <XIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
                Hapus
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={pick}
            disabled={uploading}
            aria-describedby={`${id}-hint`}
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 disabled:cursor-wait"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft ring-1 ring-gray-200">
              {uploading ? <Spinner className="h-5 w-5" /> : <ImageIcon className="h-6 w-6" aria-hidden="true" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900">
                {uploading ? 'Mengunggah foto…' : dragging ? 'Lepaskan untuk mengunggah' : 'Klik untuk memilih foto'}
              </span>
              {!uploading && <span className="mt-0.5 block text-sm text-gray-500">atau seret file ke sini</span>}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          upload(e.target.files[0]);
          e.target.value = '';
        }}
      />

      {message ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <WarningIcon className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
          {message}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-gray-500">JPG, PNG, atau WebP, maksimal 5 MB. Rasio 16:9 (misalnya 1600 × 900 px) tampil paling baik.</p>
      )}
    </div>
  );
}

// Upload, order and remove photos. `value` is the list of stored paths; `onChange` receives an updater function,
// since uploads finish after the user may have changed the list. Files are uploaded straight away and only kept
// on the record once the form is saved.
export default function PhotoField({ id, kind, value, onChange, max, error, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const handleFiles = async (fileList) => {
    setUploadError(null);
    const files = [...fileList];
    const room = max - value.length;
    if (files.length > room) setUploadError(`Maksimal ${max} foto. Sebagian file tidak diunggah.`);
    const valid = files.slice(0, Math.max(room, 0)).filter((file) => {
      const problem = fileProblem(file);
      if (problem) setUploadError(problem);
      return !problem;
    });
    if (!valid.length) return;

    setUploading(valid.length);
    const results = await Promise.allSettled(valid.map((file) => adminApi.upload(kind, file)));
    setUploading(0);
    const failed = results.find((r) => r.status === 'rejected');
    if (failed) setUploadError(failed.reason.message);
    const paths = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    if (paths.length) onChange((current) => [...current, ...paths].slice(0, max));
  };

  const move = (index, step) =>
    onChange((current) => {
      const next = [...current];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });

  const remove = (index) => onChange((current) => current.filter((_, i) => i !== index));

  const message = uploadError || error;

  return (
    <fieldset className="space-y-3">
      {/* The form section around the field shows the visible heading. */}
      <legend className="sr-only">{label}</legend>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 min-[1600px]:grid-cols-3">
        {value.map((path, index) => {
          const src = imageUrl(path);
          return (
            <li key={path} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {src ? (
                <img src={src} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="m-auto h-full w-8 text-gray-400" aria-hidden="true" />
              )}
              {max > 1 && index === 0 && (
                <span className="absolute left-2 top-2 rounded-md bg-gray-900/80 px-2 py-0.5 text-xs font-semibold text-white">Foto utama</span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex justify-between">
                {max > 1 ? (
                  <div className="flex gap-1">
                    <button type="button" className={tileButton} onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Geser foto ${index + 1} ke kiri`}>
                      <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" className={tileButton} onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label={`Geser foto ${index + 1} ke kanan`}>
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : <span />}
                <button type="button" className={`${tileButton} hover:text-red-600`} onClick={() => remove(index)} aria-label={`Hapus foto ${index + 1}`}>
                  <XIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}

        {value.length < max && (
          <li className="aspect-square">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading > 0}
              aria-describedby={`${id}-hint`}
              className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white text-sm font-medium text-gray-600 transition-colors hover:border-brand-600 hover:text-brand-700 disabled:cursor-wait"
            >
              {uploading > 0 ? <Spinner className="h-6 w-6" /> : <UploadSimpleIcon className="h-6 w-6" aria-hidden="true" />}
              {uploading > 0 ? 'Mengunggah…' : 'Unggah foto'}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple={max > 1}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {message ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
          <WarningIcon className="h-4 w-4 shrink-0" weight="fill" aria-hidden="true" />
          {message}
        </p>
      ) : (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          JPG, PNG, atau WebP, maksimal 5 MB per foto{max > 1 ? `, sampai ${max} foto. Foto pertama tampil di kartu produk.` : '.'}
        </p>
      )}
    </fieldset>
  );
}
