import { IMAGES } from '@/lib/images';

// The oil category: its page also shows the oil clients and certifications band.
export const OIL_CATEGORY_ID = 1;

// Designed look for some categories. `categoryId` is the tbl_product_category.id they belong to; an entry is only
// used while that row exists in the table (the table decides which categories exist). `slug` matches the
// `division` field on each product. Name and description in the table override `name` and `menuBlurb`.
export const DIVISIONS = [
  {
    categoryId: OIL_CATEGORY_ID,
    slug: 'oli',
    menuBlurb: 'Oli hidrolik, mesin diesel, gear, kompresor, dan oli kapal.',
    name: 'Oli & pelumas',
    catalogName: 'oli & pelumas',
    headline: 'Pelumas industri yang menjaga mesin tetap jalan',
    summary: 'Oli hidrolik, oli mesin diesel, oli gear, oli kompresor, dan pelumas khusus untuk pabrik, armada, dan kapal.',
    intro: 'Pelumas kualitas Jepang yang diformulasikan untuk iklim tropis Indonesia. Tersedia dalam kemasan pail 18–20 liter dan drum 200 liter, dengan rekomendasi grade sesuai mesin Anda.',
    placeholder: IMAGES.placeholderOil,
    tags: ['Oli hidrolik', 'Oli mesin diesel', 'Oli gear & transmisi', 'Oli kompresor', 'Oli kapal', 'Cutting coolant'],
    highlights: [
      { figure: '30%', text: 'Peningkatan efisiensi pada mesin industri' },
      { figure: '2x', text: 'Interval perawatan lebih panjang untuk armada dan alat berat' },
      { figure: '15%', text: 'Pengurangan konsumsi bahan bakar pada mesin diesel' },
    ],
  },
  {
    categoryId: 2,
    slug: 'kawat-las',
    menuBlurb: 'Kawat CO2/MIG, flux core, stainless, SAW, dan elektroda.',
    name: 'Kawat las',
    catalogName: 'kawat las',
    headline: 'Kawat las untuk fabrikasi, galangan, dan perbaikan',
    summary: 'Kawat las CO2/MIG, flux core, stainless, SAW, dan elektroda untuk fabrikasi baja, galangan kapal, dan perbaikan alat berat.',
    intro: 'Kawat las baja karbon dan stainless untuk proses MIG/CO2, flux core, dan SAW, serta elektroda untuk las listrik. Kami bantu memilih tipe dan diameter yang cocok dengan material dan mesin las Anda.',
    placeholder: IMAGES.placeholderWire,
    tags: ['CO2 / MIG', 'Flux core', 'Stainless', 'Submerged arc (SAW)', 'Elektroda'],
    highlights: [
      { figure: 'Ø0.8–3.2', text: 'Rentang diameter kawat untuk pekerjaan tipis hingga tebal' },
      { figure: '5–25 kg', text: 'Kemasan spool dan dus sesuai skala produksi' },
      { figure: '2 jenis', text: 'Baja karbon dan stainless untuk berbagai material' },
    ],
  },
  {
    categoryId: 3,
    slug: 'mesin',
    menuBlurb: 'Mesin pertanian, pompa air, mesin kapal, genset, dan kompresor.',
    name: 'Mesin & peralatan',
    catalogName: 'mesin & peralatan',
    headline: 'Mesin untuk lahan, laut, dan lantai pabrik',
    summary: 'Hand traktor, pompa air, mesin kapal, genset, kompresor, dan mesin las untuk pertanian, kelautan, dan kebutuhan pabrik.',
    intro: 'Mesin penggerak dan peralatan kerja untuk tiga sektor: pertanian, kelautan, dan kebutuhan pabrik. Ceritakan kebutuhan daya dan lokasi kerja Anda, dan kami siapkan spesifikasi yang sesuai.',
    placeholder: IMAGES.placeholderMachine,
    tags: ['Mesin pertanian', 'Pompa air', 'Mesin kelautan', 'Genset', 'Kompresor', 'Mesin las'],
    highlights: [
      { figure: '3 sektor', text: 'Pertanian, kelautan, dan kebutuhan pabrik' },
      { figure: 'Diesel & bensin', text: 'Pilihan penggerak sesuai lokasi dan bahan bakar' },
      { figure: '1 kontak', text: 'Mesin, oli, dan kawat las dari satu pemasok' },
    ],
  },
];

// Look of categories added in the database that have no designed page yet.
const GENERIC_DIVISION = {
  placeholder: IMAGES.productPlaceholder,
  tags: [],
  highlights: [],
};

// Every category shares one page, /kategori/, which reads the category id from ?id=.
export const categoryPath = (id) => `/kategori/?id=${id}`;

// tbl_product_category row -> the category shape the site uses. Its photo and thumbnail are `row.imageUrl` (resolved
// from the image column), or the branded category placeholder while that column is empty.
export const divisionFromCategory = (row) => {
  const curated = DIVISIONS.find((d) => d.categoryId === row.id);
  const name = row.category_name?.trim() || curated?.name || `Kategori ${row.id}`;
  // category_description as stored; null when empty. `menuBlurb` falls back to the designed text, `description` does not.
  const description = row.category_description?.trim() || null;
  const photo = { image: row.imageUrl || IMAGES.categoryPlaceholder, thumb: row.imageUrl || IMAGES.categoryPlaceholder };
  if (curated) {
    return { ...curated, ...photo, path: categoryPath(row.id), name, description, catalogName: name.toLowerCase(), menuBlurb: description || curated.menuBlurb };
  }
  return {
    ...GENERIC_DIVISION,
    ...photo,
    categoryId: row.id,
    slug: `kategori-${row.id}`,
    path: categoryPath(row.id),
    name,
    description,
    catalogName: name.toLowerCase(),
    menuBlurb: description || '',
  };
};

// Shown for a product whose category is unknown (never expected: those products are filtered out).
export const UNKNOWN_DIVISION = { ...GENERIC_DIVISION, slug: '', path: '/products', name: 'Produk', catalogName: 'produk', menuBlurb: '' };

// Whether `division` is the page at `pathname` (no trailing slash) with ?id=`categoryParam`.
export const isDivisionPage = (division, pathname, categoryParam) =>
  pathname === '/kategori' && String(division.categoryId) === categoryParam;

// Sectors shown on the home page. Informational only (no links): a sector spans several product categories.
export const SECTORS = [
  {
    slug: 'perkebunan',
    name: 'Perkebunan',
    summary: 'Untuk kebun dan pengolahan lahan.',
    image: IMAGES.sectorAgriculture,
    imageAlt: 'Traktor bekerja di ladang',
  },
  {
    slug: 'kelautan',
    name: 'Kelautan',
    summary: 'Untuk kapal niaga, kapal ikan, dan galangan.',
    image: IMAGES.sectorMarine,
    imageAlt: 'Kapal kontainer berlayar di laut',
  },
  {
    slug: 'industri',
    name: 'Kebutuhan pabrik',
    summary: 'Untuk lini produksi, bengkel, dan armada.',
    image: IMAGES.sectorIndustry,
    imageAlt: 'Lini perakitan otomotif dengan lengan robot',
  },
];
