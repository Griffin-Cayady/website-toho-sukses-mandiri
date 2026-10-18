// Client for the PHP API in public/api/, which reads the MySQL database on Hostinger.
// Production: the default '/api' (same domain). Local `npm run dev`: NEXT_PUBLIC_API_URL=http://localhost:8000/api
// with `npm run api` running alongside.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

// Product and category photos: a file name in the database is resolved against this folder or bucket URL.
const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '').replace(/\/$/, '');

const request = async (endpoint, init) => {
  const response = await fetch(`${API_URL}/${endpoint}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
};

export const apiGet = (endpoint) => request(endpoint);

export const apiPost = (endpoint, data) =>
  request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

// Full URLs pass through; anything else is a file name under IMAGE_BASE_URL.
export const imageUrl = (path) => {
  if (path.startsWith('http')) return path;
  if (!IMAGE_BASE_URL) return null;
  return `${IMAGE_BASE_URL}/${path.split('/').map(encodeURIComponent).join('/')}`;
};

/**
 * Standardized error logger for API calls.
 */
export const logApiError = (operation, error, context = {}) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    operation,
    message: error?.message || 'Unknown error',
    status: error?.status || 'No status',
    context
  };

  console.group(`🚨 API Error: ${operation}`);
  console.error(JSON.stringify(errorReport, null, 2));
  if (errorReport.message.includes('Failed to fetch') || errorReport.message.includes('NetworkError')) {
    console.warn(`💡 HINT: The API at ${API_URL} could not be reached. In local dev, check that \`npm run api\` is running and that toho-db-config.php allows this origin.`);
  }
  console.groupEnd();

  return errorReport;
};
