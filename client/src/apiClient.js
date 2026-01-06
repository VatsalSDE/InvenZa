import { API_BASE_URL } from './config';

function getToken() {
  try {
    return localStorage.getItem('auth_token') || '';
  } catch (_) {
    return '';
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Unauthorized: clear token and redirect to login
    try { localStorage.removeItem('auth_token'); } catch (_) {}
    if (window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login';
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

export function setToken(token) {
  try { localStorage.setItem('auth_token', token); } catch (_) {}
}

export function clearToken() {
  try { localStorage.removeItem('auth_token'); } catch (_) {}
}

export function isAuthenticated() {
  return Boolean(getToken());
}