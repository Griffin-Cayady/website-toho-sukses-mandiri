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
    name: 'Oli & Pelumas',
    catalogName: 'Oli & Pelumas',
    placeholder: IMAGES.placeholderOil,
  },
  {
    categoryId: 2,
    slug: 'kawat-las',
    menuBlurb: 'Kawat CO2/MIG, flux core, stainless, SAW, dan elektroda.',
    name: 'Kawat Las',
    catalogName: 'Kawat Las',
    placeholder: IMAGES.placeholderWire,
  },
  {
    categoryId: 3,
    slug: 'mesin',
    menuBlurb: 'Mesin pertanian, pompa air, mesin kapal, genset, dan kompresor.',
    name: 'Mesin & Peralatan',
    catalogName: 'Mesin & Peralatan',
    placeholder: IMAGES.placeholderMachine,
  },
];

// Look of categories added in the database that have no designed page yet.
const GENERIC_DIVISION = {
  placeholder: IMAGES.productPlaceholder,
};

// Category names are shown with every word capitalised ("oli & pelumas" -> "Oli & Pelumas"); the rest of each word is kept.
export const titleCase = (text) => text.replace(/(^|[\s/(-])(\p{L})/gu, (_, before, letter) => before + letter.toUpperCase());

// Every category shares one page, /kategori/, which reads the category id from ?id=.
export const categoryPath = (id) => `/kategori/?id=${id}`;

// tbl_product_category row -> the category shape the site uses. Its photo and thumbnail are `row.imageUrl` (resolved
// from the image column), or the branded category placeholder while that column is empty.
export const divisionFromCategory = (row) => {
  const curated = DIVISIONS.find((d) => d.categoryId === row.id);
  const name = titleCase(row.category_name?.trim() || curated?.name || `Kategori ${row.id}`);
  // category_description as stored; null when empty. `menuBlurb` falls back to the designed text, `description` does not.
  const description = row.category_description?.trim() || null;
  const photo = { image: row.imageUrl || IMAGES.categoryPlaceholder, thumb: row.imageUrl || IMAGES.categoryPlaceholder };
  if (curated) {
    return { ...curated, ...photo, path: categoryPath(row.id), name, description, catalogName: name, menuBlurb: description || curated.menuBlurb };
  }
  return {
    ...GENERIC_DIVISION,
    ...photo,
    categoryId: row.id,
    slug: `kategori-${row.id}`,
    path: categoryPath(row.id),
    name,
    description,
    catalogName: name,
    menuBlurb: description || '',
  };
};

// Shown for a product whose category is unknown (never expected: those products are filtered out).
export const UNKNOWN_DIVISION = { ...GENERIC_DIVISION, slug: '', path: '/products', name: 'Produk', catalogName: 'Produk', menuBlurb: '' };

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
