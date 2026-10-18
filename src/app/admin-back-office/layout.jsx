import { AdminProvider } from '@/contexts/AdminContext.jsx';

export const metadata = {
  title: 'Back office | Toho Sukses Mandiri',
  // Not for search engines; the back office is also never linked from the public site.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <div className="min-h-[100dvh] bg-gray-50">{children}</div>
    </AdminProvider>
  );
}
