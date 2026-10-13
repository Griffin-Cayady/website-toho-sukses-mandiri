import { Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import Navbar, { NavbarFromUrl } from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConnectionBanner from '@/components/ConnectionBanner';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseProvider } from '@/contexts/SupabaseContext.jsx';
import { IMAGES } from '@/lib/images';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const DEFAULT_TITLE = 'CV Toho Sukses Mandiri | Distributor & Pemasok Kebutuhan Industri';
const DEFAULT_DESCRIPTION = 'CV Toho Sukses Mandiri adalah distributor dan pemasok kebutuhan industri untuk pabrik, galangan kapal, dan perkebunan, dari Jakarta ke seluruh Indonesia.';

// Without JavaScript, Reveal never marks content visible, so this keeps scroll-reveal content shown.
const NO_JS_STYLE = '.reveal,.reveal .timeline-line,.reveal .timeline-node{opacity:1!important;transform:none!important}';

export const metadata = {
  metadataBase: new URL('https://tohosuksesmandiri.com'),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  keywords: ['tohosuksesmandiri', 'distributor oli industri', 'pelumas industri jakarta', 'distributor kawat las', 'kawat las co2', 'mesin pertanian', 'mesin kapal', 'genset diesel', 'pemasok mesin industri'],
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: 'website',
    locale: 'id_ID',
    url: 'https://tohosuksesmandiri.com',
    images: [IMAGES.homeHero],
  },
};

export const viewport = {
  themeColor: '#009200',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <noscript>
          <style>{NO_JS_STYLE}</style>
        </noscript>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="" />
      </head>
      <body className="font-sans bg-white text-gray-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-skip focus:rounded-lg focus:bg-gray-900 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lift"
        >
          Langsung ke konten utama
        </a>
        <SupabaseProvider>
          <ConnectionBanner />
          <div className="min-h-[100dvh] flex flex-col">
            <Suspense fallback={<Navbar />}>
              <NavbarFromUrl />
            </Suspense>
            <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
