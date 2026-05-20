const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://tag-committee-appliance-obtain.trycloudflare.com/api';

function getToken() {
  return localStorage.getItem('access_token');
}

function setToken(access, refresh) {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

function clearToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function fetchApi(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const token = getToken();

  const headers = {
    ...options.headers,
    // Bypass ngrok browser warning for API requests
    'ngrok-skip-browser-warning': '69420',
    'User-Agent': 'CustomClient',
  };

  // Default to JSON for non-FormData bodies.
  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log('Fetching:', { url, method: options.method || 'GET', headers, body: options.body });

  let res = await fetch(url, { ...options, headers });

  console.log('Response:', { status: res.status, statusText: res.statusText, headers: Object.fromEntries(res.headers.entries()) });

  if (res.status === 401 && getToken()) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    try {
      const text = await res.text();
      console.log('Response text:', text.substring(0, 500)); // Log first 500 chars
      err.body = JSON.parse(text);
      console.error('API Error:', {
        url,
        status: res.status,
        statusText: res.statusText,
        body: err.body
      });
    } catch (parseError) {
      err.body = null;
      console.error('API Error (no JSON):', {
        url,
        status: res.status,
        statusText: res.statusText
      });
    }
    throw err;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res;
}

async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'CustomClient',
      },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.access, data.refresh);
    return true;
  } catch {
    return false;
  }
}

/**
 * Rewrites localhost/127.0.0.1 media URLs to the correct public domain.
 * Django behind IIS reverse proxy returns http://127.0.0.1:8000/media/...
 * We replace that origin with the real API origin derived from API_BASE.
 */
export function fixMediaUrl(url) {
  if (!url) return url;
  // Derive the public origin from API_BASE (strip trailing /api or /api/)
  const publicOrigin = API_BASE.replace(/\/api\/?$/, '');
  return url.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/, publicOrigin);
}

export { getToken, setToken, clearToken, API_BASE };
