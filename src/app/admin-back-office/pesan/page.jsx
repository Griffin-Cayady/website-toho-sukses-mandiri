'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  EnvelopeOpenIcon,
  EnvelopeSimpleIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  SquaresFourIcon,
  TrashIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AdminFrame from '@/components/admin/AdminFrame';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { LoadError, Select, Spinner } from '@/components/admin/FormParts';
import { EmptyState, IconAction, SearchBox } from '@/components/admin/ListParts';
import { adminApi } from '@/lib/adminApi';
import { cn } from '@/lib/utils';

const REPLY_SUBJECT = 'Balasan dari CV. Toho Sukses Mandiri';

// MySQL timestamp ("2026-10-19 14:05:00") -> Date, or null.
const toDate = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(String(timestamp).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const TIME = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
const SHORT_DATE = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });
const SHORT_DATE_YEAR = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const FULL_DATE = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Like a mail app: the time for today's messages, "17 Okt" for this year, "17 Okt 2025" for older ones.
const listDate = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return TIME.format(date);
  return (date.getFullYear() === now.getFullYear() ? SHORT_DATE : SHORT_DATE_YEAR).format(date);
};

// The form accepts 08…, +62… and 62… numbers; wa.me wants 62… without the plus.
const whatsappNumber = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
};

const initials = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?';

const Avatar = ({ name, className }) => (
  <span
    className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800', className)}
    aria-hidden="true"
  >
    {initials(name)}
  </span>
);

// The product category the visitor picked in the form. `compact` (list rows) shows nothing when none was picked;
// the reading pane says so. A category deleted since then shows its old id.
const CategoryBadge = ({ message, compact }) => {
  if (message.category == null) {
    return compact ? null : <span className="text-[13px] italic text-gray-400">Kategori tidak dipilih</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-1 truncate rounded-md bg-brand-50 font-medium text-brand-800 ring-1 ring-inset ring-brand-100',
        compact ? 'px-1.5 py-px text-[11px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      {!compact && <SquaresFourIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span className="sr-only">Kategori: </span>
      {message.category_name || `Kategori #${message.category} (dihapus)`}
    </span>
  );
};

export default function AdminMessagesPage() {
  return (
    <AdminFrame wide title="Pesan masuk" description="Pesan yang dikirim pengunjung lewat formulir kontak di website.">
      <Inbox />
    </AdminFrame>
  );
}

function Inbox() {
  const { toast } = useToast();
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  // 'all', 'none' (no category picked) or a tbl_product_category.id as a string.
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    adminApi.messages.list().then(
      (list) => {
        setMessages(list);
        setError(null);
      },
      (err) => setError(err.message)
    );

  useEffect(() => {
    load();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const retry = () => {
    setError(null);
    setMessages(null);
    load();
  };

  // The categories that appear in the inbox, for the filter. Only names still in tbl_product_category are listed.
  const categories = useMemo(() => {
    const byId = new Map();
    (messages || []).forEach((m) => m.category_name && byId.set(m.category, m.category_name));
    return [...byId].sort((a, b) => a[1].localeCompare(b[1], 'id'));
  }, [messages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (messages || []).filter(
      (m) =>
        (categoryFilter === 'all' || (categoryFilter === 'none' ? m.category == null : String(m.category) === categoryFilter)) &&
        (!q || `${m.name} ${m.email} ${m.phone} ${m.message} ${m.category_name ?? ''}`.toLowerCase().includes(q))
    );
  }, [messages, query, categoryFilter]);

  // Desktop shows the first message straight away; phones keep showing the list until one is tapped.
  const selected = filtered.find((m) => m.id === selectedId) || null;
  const shown = selected || filtered[0] || null;

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.messages.remove(toDelete.id);
      toast({ title: 'Pesan dihapus', description: `Dari ${toDelete.name || 'tanpa nama'}` });
    } catch (err) {
      // 404: someone else already deleted it, which is the outcome asked for anyway.
      if (err.status !== 404) {
        toast({ variant: 'destructive', title: 'Pesan belum dihapus', description: err.message });
        setDeleting(false);
        return;
      }
    }
    setMessages((list) => list.filter((m) => m.id !== toDelete.id));
    if (selectedId === toDelete.id) setSelectedId(null);
    setToDelete(null);
    setDeleting(false);
  };

  if (error) return <LoadError message={error} onRetry={retry} />;

  const loading = messages === null;

  return (
    <>
      <section
        aria-busy={loading}
        className="grid overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-gray-200/70 lg:h-[calc(100dvh-13rem)] lg:min-h-[520px] lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]"
      >
        {/* Message list. On phones it is hidden while a message is open. */}
        <div className={cn('flex min-h-0 flex-col border-gray-100 lg:border-r', selected && 'hidden lg:flex')}>
          <div className="flex items-center gap-2 border-b border-gray-100 p-3">
            <SearchBox id="message-search" value={query} onChange={setQuery} placeholder="Cari nama, email, atau isi pesan" className="min-w-0 flex-1" />
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing || loading}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:opacity-50"
            >
              {refreshing ? <Spinner /> : <ArrowClockwiseIcon className="h-[18px] w-[18px]" aria-hidden="true" />}
              <span className="sr-only">Muat ulang pesan</span>
            </button>
          </div>
          {!loading && messages.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2">
              <p className="text-xs font-medium tabular-nums text-gray-500">
                {filtered.length === messages.length ? `${messages.length} pesan` : `${filtered.length} dari ${messages.length} pesan`}
              </p>
              <label htmlFor="message-category" className="sr-only">Filter kategori</label>
              <Select
                id="message-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 w-auto max-w-[60%] truncate py-0 pl-2.5 pr-8 text-[13px]"
              >
                <option value="all">Semua kategori</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={String(id)}>{name}</option>
                ))}
                <option value="none">Tanpa kategori</option>
              </Select>
            </div>
          )}

          <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
            {loading ? (
              Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="flex gap-3 px-4 py-3.5" aria-hidden="true">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
                  </div>
                </li>
              ))
            ) : filtered.length === 0 ? (
              <li>
                {messages.length === 0 ? (
                  <EmptyState icon={EnvelopeSimpleIcon} title="Belum ada pesan">
                    Pesan dari formulir kontak di website akan muncul di sini.
                  </EmptyState>
                ) : (
                  <EmptyState
                    icon={MagnifyingGlassIcon}
                    title="Tidak ada pesan yang cocok"
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery('');
                          setCategoryFilter('all');
                        }}
                      >
                        Hapus semua filter
                      </Button>
                    }
                  >
                    Coba kata kunci atau kategori lain.
                  </EmptyState>
                )}
              </li>
            ) : (
              filtered.map((m) => {
                const active = shown?.id === m.id;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(m.id)}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600',
                        active ? 'bg-brand-50/70 lg:bg-brand-50' : 'hover:bg-gray-50'
                      )}
                    >
                      {active && <span className="absolute inset-y-0 left-0 hidden w-1 bg-brand-600 lg:block" aria-hidden="true" />}
                      <Avatar name={m.name} className="h-10 w-10 text-[13px]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-gray-900">{m.name || 'Tanpa nama'}</span>
                          <span className="shrink-0 text-xs tabular-nums text-gray-500">{listDate(m.created_at)}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[13px] text-gray-600">{m.email || m.phone}</span>
                          <CategoryBadge message={m} compact />
                        </span>
                        <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-gray-500">{m.message}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Reading pane. On phones it only appears once a message is tapped. */}
        <div className={cn('min-h-0 overflow-y-auto', selected ? 'block' : 'hidden lg:block')}>
          {shown ? (
            <MessageView message={shown} onBack={() => setSelectedId(null)} onDelete={() => setToDelete(shown)} />
          ) : (
            !loading && (
              <div className="flex h-full items-center justify-center">
                <EmptyState icon={EnvelopeOpenIcon} title="Tidak ada pesan dipilih">
                  Pilih pesan di daftar untuk membacanya.
                </EmptyState>
              </div>
            )
          )}
        </div>
      </section>

      <ConfirmDialog open={!!toDelete} title="Hapus pesan?" busy={deleting} onConfirm={confirmDelete} onClose={() => setToDelete(null)}>
        Pesan dari <strong className="text-gray-900">{toDelete?.name || 'tanpa nama'}</strong> akan dihapus permanen dari database.
      </ConfirmDialog>
    </>
  );
}

function MessageView({ message, onBack, onDelete }) {
  const { toast } = useToast();
  // The id of the message whose email was copied, so the tick resets when another message opens.
  const [copiedId, setCopiedId] = useState(null);
  const copied = copiedId === message.id;
  const date = toDate(message.created_at);
  const wa = whatsappNumber(message.phone);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(message.email);
      setCopiedId(message.id);
    } catch {
      toast({ variant: 'destructive', title: 'Email belum disalin', description: 'Browser tidak mengizinkan akses clipboard.' });
    }
  };

  const greeting = `Halo ${message.name || ''}`.trim();

  return (
    <article className="flex min-h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 lg:hidden"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Kembali
        </button>
        <span className="hidden text-xs font-medium tabular-nums text-gray-400 lg:block">#{message.id}</span>
        <IconAction label="Hapus pesan" icon={TrashIcon} onClick={onDelete} tone="danger" />
      </div>

      <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Pesan dari {message.name || 'tanpa nama'}</h2>
        <div className="mt-2">
          <CategoryBadge message={message} />
        </div>

        {/* Sender block, like the From / To header of an email. */}
        <div className="mt-5 flex items-start gap-3.5">
          <Avatar name={message.name} className="h-11 w-11 text-sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <p className="truncate font-semibold text-gray-900">{message.name || 'Tanpa nama'}</p>
              {date && <time dateTime={date.toISOString()} className="shrink-0 text-[13px] text-gray-500">{FULL_DATE.format(date)}</time>}
            </div>
            <dl className="mt-1 space-y-0.5 text-sm text-gray-600">
              {message.email && (
                <div className="flex min-w-0 items-center gap-1.5">
                  <dt><EnvelopeSimpleIcon className="h-4 w-4 text-gray-400" aria-hidden="true" /><span className="sr-only">Email</span></dt>
                  <dd className="flex min-w-0 items-center gap-1">
                    <a href={`mailto:${message.email}`} className="truncate hover:text-brand-700 hover:underline">{message.email}</a>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      {copied ? <CheckIcon className="h-3.5 w-3.5 text-brand-700" weight="bold" aria-hidden="true" /> : <CopyIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                      <span className="sr-only">{copied ? 'Email disalin' : 'Salin email'}</span>
                    </button>
                  </dd>
                </div>
              )}
              {message.phone && (
                <div className="flex items-center gap-1.5">
                  <dt><PhoneIcon className="h-4 w-4 text-gray-400" aria-hidden="true" /><span className="sr-only">Telepon</span></dt>
                  <dd><a href={`tel:${message.phone.replace(/[\s-]/g, '')}`} className="tabular-nums hover:text-brand-700 hover:underline">{message.phone}</a></dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="mt-6 max-w-3xl whitespace-pre-wrap break-words border-t border-gray-100 pt-6 text-[15px] leading-relaxed text-gray-800">
          {message.message}
        </div>
      </div>

      {/* Reply actions open the admin's own mail app or WhatsApp; nothing is sent from the back office itself. */}
      <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-8">
        {message.email && (
          <Button asChild>
            <a href={`mailto:${message.email}?subject=${encodeURIComponent(REPLY_SUBJECT)}&body=${encodeURIComponent(`${greeting},\n\n`)}`}>
              <EnvelopeSimpleIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
              Balas via email
            </a>
          </Button>
        )}
        {wa && (
          <Button asChild variant="outline">
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`${greeting}, kami dari CV. Toho Sukses Mandiri menanggapi pesan Anda.`)}`} target="_blank" rel="noopener noreferrer">
              <WhatsappLogoIcon className="h-4 w-4" weight="bold" aria-hidden="true" />
              Balas via WhatsApp
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
