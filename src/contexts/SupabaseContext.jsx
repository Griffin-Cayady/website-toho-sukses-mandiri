'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { supabase, logSupabaseError, TABLES } from '@/lib/supabase';
import { UNKNOWN_DIVISION, divisionFromCategory } from '@/lib/divisions';

const SupabaseContext = createContext();

// Public bucket with the product photos; set per environment in .env.local (Dev and Prod use different buckets).
const IMAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET;

// Full URLs pass through; anything else is a file name in IMAGE_BUCKET.
const storageUrl = (path) => {
  if (path.startsWith('http')) return path;
  if (!IMAGE_BUCKET) return null;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
};

// The first photo is the card image; all photos feed the product detail carousel.
const withImageUrl = (product, division) => ({
  ...product,
  imageUrl: (product.image && storageUrl(product.image)) || division.placeholder,
  gallery: product.images?.map(storageUrl).filter(Boolean),
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

const PRODUCT_COLUMNS = [
  'id',
  'product_name',
  'product_type_1',
  'product_size',
  'product_image_1',
  'product_image_2',
  'product_image_3',
  'product_image_4',
  'product_image_5',
  'product_category',
  'product_best_selling',
  'product_description',
].join(',');

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

// Loads the active product categories (tbl_product_category, status = true), the only source of categories: an active row
// adds a category and its page, and a category without one does not exist on the site (its products are hidden too).
// Returns null if the table cannot be read.
const loadDivisions = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from(TABLES.categories)
      .select('id,category_name,category_description,image')
      .eq('status', true)
      .order('id');
    if (fetchError) {
      throw fetchError;
    }
    if (data.length === 0) {
      console.warn(`Supabase table "${TABLES.categories}" returned no active categories (none with status = true, or no SELECT policy for anon).`);
    }
    // tbl_product_category.image: a file name in the image bucket or a full URL; empty shows the category placeholder.
    return data.map((row) => divisionFromCategory({ ...row, imageUrl: row.image?.trim() ? storageUrl(row.image.trim()) : null }));
  } catch (err) {
    logSupabaseError('fetchCategories', err);
    return null;
  }
};

// Loads the active products from Supabase, the only source of product data. Read-only: manage products in the Supabase dashboard.
// `divisionsRequest` is the pending loadDivisions() call, so both tables are fetched at the same time.
const loadProducts = async (divisionsRequest) => {
  try {
    const { data, error: fetchError } = await supabase
      .from(TABLES.products)
      .select(PRODUCT_COLUMNS)
      .eq('product_status', true)
      .order('id');
    if (fetchError) {
      throw fetchError;
    }
    if (data.length === 0) {
      console.warn(`Supabase table "${TABLES.products}" returned no active products (empty, or no SELECT policy for anon).`);
    }
    // tbl_master_product.product_category -> tbl_product_category.id
    const divisions = await divisionsRequest;
    if (!divisions) throw new Error(`Could not load ${TABLES.categories}`);
    const divisionById = new Map(divisions.map((d) => [d.categoryId, d]));
    const unmapped = data.filter((row) => !divisionById.has(row.product_category));
    if (unmapped.length) {
      console.warn(`${unmapped.length} product(s) have a product_category that is not in ${TABLES.categories} and are hidden:`, [...new Set(unmapped.map((r) => r.product_category))]);
    }
    const products = data
      .filter((row) => divisionById.has(row.product_category))
      .map((row) => {
        const division = divisionById.get(row.product_category);
        return withImageUrl(fromProductRow(row, division), division);
      });
    return { products, error: null };
  } catch (err) {
    logSupabaseError('fetchProducts', err);
    return { products: [], error: 'Produk tidak dapat dimuat karena server tidak dapat dihubungi.' };
  }
};

const loadCatalog = async () => {
  const divisionsRequest = loadDivisions();
  const result = await loadProducts(divisionsRequest);
  return { divisions: (await divisionsRequest) || [], ...result };
};

export const SupabaseProvider = ({ children }) => {
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

  // What the server rendered: no data yet. Handed to components while they hydrate (see useSupabase).
  const initialValue = useMemo(
    () => ({ products: [], divisions: [], divisionBySlug: {}, divisionOf: () => UNKNOWN_DIVISION, loading: true, error: null, refetch }),
    [refetch]
  );

  return (
    <SupabaseContext.Provider value={{ products, divisions, divisionBySlug, divisionOf, loading, error, refetch, initialValue }}>
      {children}
    </SupabaseContext.Provider>
  );
};

const subscribeNever = () => () => {};

// False while React hydrates server HTML, true from then on (and straight away for components mounted later).
const useHydrated = () => useSyncExternalStore(subscribeNever, () => true, () => false);

// Components inside <Suspense> (the navbar, the catalogue) hydrate after the data may already have loaded.
// Rendering the server's no-data state during hydration keeps that first render identical to the HTML;
// the real data follows in the next render.
export const useSupabase = () => {
  const value = useContext(SupabaseContext);
  return useHydrated() ? value : value.initialValue;
};
