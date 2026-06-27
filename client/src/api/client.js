const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let accessToken = localStorage.getItem('accessToken');

export function setAccessToken(token) {
  accessToken = token;
  localStorage.setItem('accessToken', token);
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('accessToken');
}

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 401) {
    clearAccessToken();
    // Only redirect if we're on a protected page, not on login/register
    const publicPaths = ['/login', '/register', '/'];
    if (!publicPaths.includes(window.location.pathname)) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}