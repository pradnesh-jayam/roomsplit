const API_URL = import.meta.env.VITE_API_URL || 'https://roomsplit-9f0g.onrender.com';

let accessToken = localStorage.getItem('accessToken');
let isRefreshing = false;
let refreshSubscribers = [];

export function setAccessToken(token) {
  accessToken = token;
  localStorage.setItem('accessToken', token);
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('accessToken');
}

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken() {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
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
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          const newHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
          };
          return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: newHeaders,
            credentials: 'include'
          }).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      onTokenRefreshed(newToken);
      isRefreshing = false;

      const newHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options.headers
      };

      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: newHeaders,
        credentials: 'include'
      });

      const data = await retryResponse.json();
      if (!retryResponse.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (error) {
      isRefreshing = false;
      clearAccessToken();
      const publicPaths = ['/login', '/register', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}