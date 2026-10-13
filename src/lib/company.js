import { IMAGES } from '@/lib/images';

// Opens a WhatsApp chat with 0812-8964-6720 (international format) with `message` prefilled.
export const whatsappLink = (message) => `https://wa.me/6281289646720?text=${encodeURIComponent(message)}`;

// Oil & lubricant catalogue (PDF) on Google Drive.
export const OIL_BROCHURE_URL = 'https://drive.google.com/file/d/1JQPmUD80tka2l-pSpQoZWw05DqHQk61b/view?usp=sharing';

// Company facts shared by the navbar, footer, contact section and structured data.
export const COMPANY = {
  name: 'CV Toho Sukses Mandiri',
  shortName: 'Toho Sukses Mandiri',
  foundedYear: 2019,
  phoneDisplay: '(021) 2262-4033',
  phoneHref: 'tel:+622122624033',
  whatsappHref: whatsappLink('Halo Admin CV.Toho Sukses Mandiri, saya ingin bertanya tentang produk Anda.'),
  email: 'tsm.metal.oil@gmail.com',
  address: 'Jl. Hayam Wuruk, Gedung HWI Lindeteves Lt. 1 CKS-024, Jakarta Barat',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gedung+HWI+Lindeteves+Hayam+Wuruk+Jakarta+Barat',
  logoUrl: IMAGES.logo,
};

// Evaluated at build time, so the figure stays current with each deploy.
export const YEARS_IN_BUSINESS = new Date().getFullYear() - COMPANY.foundedYear;

export const FALLBACK_PRODUCT_IMAGE = IMAGES.productPlaceholder;
