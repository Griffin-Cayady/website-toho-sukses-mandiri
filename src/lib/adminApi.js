// Client for the back office API in public/api/admin/. The session lives in an HttpOnly cookie the browser sends
// itself (credentials: 'include'); change requests also carry the CSRF token handed out by login.php / me.php.
import { API_URL } from '@/lib/api';

let csrfToken = null;
let onSessionLost = () => {};

export const setCsrfToken = (token) => {
  csrfToken = token;
};

// Called when the server answers 401 (session expired or account removed), so the back office can return to the login.
export const setSessionLostHandler = (handler) => {
  onSessionLost = handler;
};

export class AdminApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    // Per-field messages from the server's form validation, keyed by column name.
    this.fields = fields;
  }
}

const request = async (endpoint, { method = 'GET', body, form } = {}) => {
  const headers = {};
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}/admin/${endpoint}`, {
      method,
      headers,
      credentials: 'include',
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new AdminApiError('Server tidak dapat dihubungi. Periksa koneksi internet Anda.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A wrong password is also a 401, but that is the login form's own error, not a lost session.
    if (response.status === 401 && endpoint !== 'login.php') onSessionLost();
    throw new AdminApiError(data.error || `Terjadi kesalahan (HTTP ${response.status}).`, response.status, data.fields);
  }
  return data;
};

const resource = (file, one, many) => ({
  list: () => request(file).then((d) => d[many]),
  get: (id) => request(`${file}?id=${id}`).then((d) => d[one]),
  create: (data) => request(file, { method: 'POST', body: data }).then((d) => d[one]),
  update: (id, data) => request(`${file}?id=${id}`, { method: 'PUT', body: data }).then((d) => d[one]),
  remove: (id) => request(`${file}?id=${id}`, { method: 'DELETE' }),
});

export const adminApi = {
  me: () => request('me.php'),
  login: (username, password) => request('login.php', { method: 'POST', body: { username, password } }),
  logout: () => request('logout.php', { method: 'POST' }),
  changePassword: (current, next) => request('password.php', { method: 'POST', body: { current, new: next } }),
  products: resource('products.php', 'product', 'products'),
  categories: resource('categories.php', 'category', 'categories'),
  merks: resource('merks.php', 'merk', 'merks'),
  // Contact form messages (tbl_contact_submissions): read and delete only.
  messages: {
    list: () => request('messages.php').then((d) => d.messages),
    remove: (id) => request(`messages.php?id=${id}`, { method: 'DELETE' }),
  },
  // kind: 'products' | 'categories'. Resolves to the stored path, e.g. "products/<name>.webp".
  upload: (kind, file) => {
    const form = new FormData();
    form.append('kind', kind);
    form.append('file', file);
    return request('upload.php', { method: 'POST', form }).then((d) => d.path);
  },
};
