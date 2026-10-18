'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { apiGet, imageUrl, logApiError } from '@/lib/api';
import { UNKNOWN_DIVISION, divisionFromCategory } from '@/lib/divisions';

const CatalogContext = createContext();

// The first photo is the card image; all photos feed the product detail carousel.
const withImageUrl = (product, division) => ({
  ...product,
  imageUrl: (product.image && imageUrl(product.image)) || division.placeholder,
  gallery: product.images?.map(imageUrl).filter(Boolean),
});

// product_size may be a number (200), a number with a unit ("200 L", "15 kg") or a machine spec ("10 kVA").
const parseSize = (size) => {
  if (size == null || size === '') return {};
  if (typeof size === 'number') return { quantity: size, unit: 'L' };
  const match = String(size).trim().match(/^(\d+(?:[.,]\d+)?)\s*(l|liter|litre|kg)?$/i);
  if (!match) return { spec: String(size).trim() };
  const unit = match[2]?.toLowerCase() === 'kg' ? 'kg' : 'L';
  return { quantity: Number(match[1].replace(',', '.')), unit };
};

// Maps a tbl_master_product row onto the product shape the site uses.
// product_image_1 is the card photo; product_image_1..5 are the pop-up carousel slides. Empty (NULL) columns are skipped.
const imageColumn = (row, n) => {
  const value = row[`product_image_${n}`];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

const fromProductRow = (row, division) => {
  const images = [1, 2, 3, 4, 5].map((n) => imageColumn(row, n)).filter(Boolean);
  return {
    id: row.id,
    name: row.product_name,
    category: row.product_type_1,
    division: division.slug,
    // tbl_master_product.product_category (= tbl_product_category.id)
    categoryId: row.product_category,
    image: imageColumn(row, 1),
    images,
    // 1 = show in the home page "Produk pilihan" section
    bestSelling: Number(row.product_best_selling) === 1,
    // NULL = the product has no description
    description: typeof row.product_description === 'string' && row.product_description.trim() ? row.product_description.trim() : null,
    ...parseSize(row.product_size),
  };
};

// Loads the active categories and products from the MySQL database (public/api/catalog.php), the only source of catalog
// data. Read-only: manage products in phpMyAdmin.
// Categories (tbl_product_category, status = 1): an active row adds a category and its page, and a category without one
// does not exist on the site (its products are hidden too).
const loadCatalog = async () => {
  try {
    const { categories, products: rows } = await apiGet('catalog.php');
    if (categories.length === 0) console.warn('tbl_product_category returned no active categories (none with status = 1).');
    if (rows.length === 0) console.warn('tbl_master_product returned no active products (none with product_status = 1).');

    // tbl_product_category.image: a file name under NEXT_PUBLIC_IMAGE_BASE_URL or a full URL; empty shows the category placeholder.
    const divisions = categories.map((row) => divisionFromCategory({ ...row, imageUrl: row.image?.trim() ? imageUrl(row.image.trim()) : null }));

    // tbl_master_product.product_category -> tbl_product_category.id
    const divisionById = new Map(divisions.map((d) => [d.categoryId, d]));
    const unmapped = rows.filter((row) => !divisionById.has(row.product_category));
    if (unmapped.length) {
      console.warn(`${unmapped.length} product(s) have a product_category that is not in tbl_product_category and are hidden:`, [...new Set(unmapped.map((r) => r.product_category))]);
    }
    const products = rows
      .filter((row) => divisionById.has(row.product_category))
      .map((row) => {
        const division = divisionById.get(row.product_category);
        return withImageUrl(fromProductRow(row, division), division);
      });
    return { divisions, products, error: null };
  } catch (err) {
    logApiError('fetchCatalog', err);
    return { divisions: [], products: [], error: 'Produk tidak dapat dimuat karena server tidak dapat dihubungi.' };
  }
};

export const CatalogProvider = ({ children }) => {
  // Empty until tbl_product_category has loaded.
  const [divisions, setDivisions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const applyResult = useCallback((result) => {
    setDivisions(result.divisions);
    setProducts(result.products);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    loadCatalog().then(result => {
      if (active) applyResult(result);
    });
    return () => {
      active = false;
    };
  }, [applyResult]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    applyResult(await loadCatalog());
  }, [applyResult]);

  const divisionBySlug = useMemo(() => Object.fromEntries(divisions.map((d) => [d.slug, d])), [divisions]);
  const divisionOf = useCallback((product) => divisionBySlug[product.division] || UNKNOWN_DIVISION, [divisionBySlug]);

  // What the server rendered: no data yet. Handed to components while they hydrate (see useCatalog).
  const initialValue = useMemo(
    () => ({ products: [], divisions: [], divisionBySlug: {}, divisionOf: () => UNKNOWN_DIVISION, loading: true, error: null, refetch }),
    [refetch]
  );

  return (
    <CatalogContext.Provider value={{ products, divisions, divisionBySlug, divisionOf, loading, error, refetch, initialValue }}>
      {children}
    </CatalogContext.Provider>
  );
};

const subscribeNever = () => () => {};

// False while React hydrates server HTML, true from then on (and straight away for components mounted later).
const useHydrated = () => useSyncExternalStore(subscribeNever, () => true, () => false);

// Components inside <Suspense> (the navbar, the catalogue) hydrate after the data may already have loaded.
// Rendering the server's no-data state during hydration keeps that first render identical to the HTML;
// the real data follows in the next render.
export const useCatalog = () => {
  const value = useContext(CatalogContext);
  return useHydrated() ? value : value.initialValue;
};
