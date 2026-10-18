import { Suspense } from 'react';
import Navbar, { NavbarFromUrl } from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConnectionBanner from '@/components/ConnectionBanner';
import { CatalogProvider } from '@/contexts/CatalogContext.jsx';

// Navbar, footer and catalog data around every public page (src/app/(site)) and the 404 page.
// The back office (src/app/admin-back-office) has its own frame instead.
export default function SiteChrome({ children }) {
  return (
    <CatalogProvider>
      <ConnectionBanner />
      <div className="min-h-[100dvh] flex flex-col">
        <Suspense fallback={<Navbar />}>
          <NavbarFromUrl />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
        <Footer />
      </div>
    </CatalogProvider>
  );
}
