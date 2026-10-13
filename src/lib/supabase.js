import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  // The site has no login, so there is no auth session to keep.
  { auth: { persistSession: false } }
);

// Table names in the Supabase project. Change them here if the database is renamed.
export const TABLES = {
  products: 'tbl_master_product',
  categories: 'tbl_product_category',
  contactSubmissions: 'tbl_contact_submissions',
};

/**
 * Standardized error logger for Supabase operations.
 */
export const logSupabaseError = (operation, error, context = {}) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    operation,
    message: error?.message || 'Unknown error',
    code: error?.code || 'NO_CODE',
    details: error?.details || 'No additional details',
    hint: error?.hint || 'No hint available',
    status: error?.status || 'No status',
    context
  };

  console.group(`🚨 Supabase Error: ${operation}`);
  console.error(JSON.stringify(errorReport, null, 2));
  if (errorReport.message.includes('Failed to fetch') || errorReport.message.includes('NetworkError')) {
    console.warn('💡 HINT: This looks like a network or CORS issue. Please check your Supabase CORS settings and internet connection.');
  }
  console.groupEnd();

  return errorReport;
};
