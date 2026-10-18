import HomeView from '@/views/HomeView';

export const metadata = {
  title: 'Toho Sukses Mandiri - Distributor & Pemasok Kebutuhan Industri',
  description: 'Distributor dan pemasok kebutuhan industri. Satu pemasok dan satu kontak untuk pabrik, galangan kapal, dan perkebunan di seluruh Indonesia.',
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CV Toho Sukses Mandiri",
  "url": "https://tohosuksesmandiri.com",
  "logo": "https://tohosuksesmandiri.com/images/logo-tsm.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+62-21-2262-4033",
    "contactType": "customer service"
  }
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "CV Toho Sukses Mandiri",
  "image": "https://tohosuksesmandiri.com/images/logo-tsm.png",
  "telephone": "+62-21-2262-4033",
  "email": "tsm.metal.oil@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Hayam Wuruk, Gedung HWI Lindeteves Lt. 1 CKS-024",
    "addressLocality": "Jakarta Barat",
    "addressRegion": "DKI Jakarta",
    "addressCountry": "ID"
  },
  "areaServed": "Indonesia",
  "description": "Distributor dan pemasok kebutuhan industri untuk pabrik, galangan kapal, dan perkebunan. Berlokasi di Jakarta Barat, melayani seluruh Indonesia."
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <HomeView />
    </>
  );
}
