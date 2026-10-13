const UNIT_NAMES = { L: 'liter', kg: 'kg' };

// Certifications that apply to the oil & lubricant products.
export const OIL_CERTIFICATIONS = [
  { name: 'ISO 9001:2015', desc: 'Manajemen mutu' },
  { name: 'ISO 14001:2015', desc: 'Manajemen lingkungan' },
  { name: 'SNI', desc: 'Standar Nasional Indonesia' },
];

// Oil ships in 200 L drums and 18–20 L pails.
export const packName = (product) => {
  if (product.spec) return product.spec;
  const unit = product.unit || 'L';
  if (unit !== 'L') return `${product.quantity} ${unit}`;
  return `${product.quantity >= 200 ? 'Drum' : 'Pail'} ${product.quantity} L`;
};

// Oil names start with the product series, e.g. "Sugigear HD-68" belongs to Sugigear.
export const seriesName = (product) => (product.division === 'oli' ? product.name.split(' ')[0] : null);

// Machines carry a `spec` (e.g. "10 kVA"); oil and welding wire carry a pack size.
export const packBadge = (product) => product.spec || `${product.quantity} ${product.unit || 'L'}`;
export const packLine = (product) =>
  product.spec ? `Spesifikasi ${product.spec}` : `Kemasan ${product.quantity} ${UNIT_NAMES[product.unit || 'L'] || product.unit}`;

// Typical uses per product type, shown as "Cocok untuk" in the product detail pop-up. Keyed by the product's `category`.
const CATEGORY_INFO = {
  // Oli & pelumas
  'Hydraulic Oil': {
    uses: ['Mesin injeksi & press', 'Alat berat', 'Sistem hidrolik pabrik'],
  },
  'Diesel Engine Oil': {
    uses: ['Truk & armada', 'Alat berat', 'Genset diesel'],
  },
  'Gasoline Engine Oil': {
    uses: ['Kendaraan operasional', 'Mesin bensin kecil'],
  },
  'Transmission Oil': {
    uses: ['Transmisi kendaraan', 'Alat berat'],
  },
  'Gear Oil': {
    uses: ['Gearbox industri', 'Reducer', 'Konveyor'],
  },
  'Compressor Oil': {
    uses: ['Kompresor screw', 'Kompresor piston'],
  },
  'Refrigeration Oil': {
    uses: ['Cold storage', 'Chiller & AC'],
  },
  'Heat Transfer Oil': {
    uses: ['Sistem thermal oil', 'Industri pengolahan'],
  },
  'Turbine Oil': {
    uses: ['Turbin uap & gas', 'Sistem sirkulasi'],
  },
  'Slide Oil': {
    uses: ['Mesin CNC', 'Mesin bubut & milling'],
  },
  'Marine Engine Oil': {
    uses: ['Kapal niaga', 'Kapal ikan'],
  },
  'Speed Boat Engine Oil': {
    uses: ['Speed boat', 'Mesin tempel'],
  },
  'Rubber Processing Oil': {
    uses: ['Pabrik karet', 'Komponen karet'],
  },
  'Cleaning Oil': {
    uses: ['Flushing sistem', 'Pembersihan komponen'],
  },
  'Cutting Coolant': {
    uses: ['Mesin CNC', 'Bubut & milling', 'Grinding'],
  },
  'Pressing Oil': {
    uses: ['Press stamping', 'Pembentukan logam'],
  },
  // Kawat las
  'Kawat Las CO2 / MIG': {
    uses: ['Fabrikasi baja', 'Konstruksi'],
  },
  'Kawat Las Flux Core': {
    uses: ['Galangan kapal', 'Konstruksi baja'],
  },
  'Kawat Las Stainless': {
    uses: ['Pipa & tangki stainless', 'Peralatan pabrik makanan'],
  },
  'Kawat Las SAW': {
    uses: ['Pelat tebal', 'Pipa & tangki besar'],
  },
  'Elektroda Las': {
    uses: ['Perbaikan & perawatan', 'Fabrikasi umum'],
  },
  // Mesin & peralatan
  'Mesin Pertanian': {
    uses: ['Olah lahan', 'Pasca panen'],
  },
  'Pompa Air': {
    uses: ['Irigasi', 'Suplai air'],
  },
  'Mesin Kelautan': {
    uses: ['Kapal ikan', 'Perahu kerja'],
  },
  Genset: {
    uses: ['Listrik cadangan', 'Lokasi proyek'],
  },
  Kompresor: {
    uses: ['Bengkel', 'Peralatan pneumatik'],
  },
  'Mesin Las': {
    uses: ['Fabrikasi', 'Perbaikan'],
  },
};

// The description comes only from the database (product_description); null means the product has none.
export const productInfo = (product) => ({
  description: product.description || null,
  uses: product.uses || CATEGORY_INFO[product.category]?.uses || [],
});
