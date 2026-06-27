import { apiRequest, setAccessToken, clearAccessToken } from './client.js';
import { isDemoMode, DEMO_USER } from '../utils/demo.js';

export async function register(name, email, password) {
  if (isDemoMode()) {
    return { user: DEMO_USER, accessToken: 'demo-token' };
  }
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function login(email, password) {
  if (isDemoMode()) {
    return { user: DEMO_USER, accessToken: 'demo-token' };
  }
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  if (isDemoMode()) {
    clearAccessToken();
    return;
  }
  await apiRequest('/api/auth/logout', { method: 'POST' });
  clearAccessToken();
}

export async function getMe() {
  if (isDemoMode()) {
    return DEMO_USER;
  }
  return apiRequest('/api/auth/me');
}

export async function updateMe(name, upiId) {
  if (isDemoMode()) {
    return { ...DEMO_USER, name, upiId };
  }
  return apiRequest('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify({ name, upiId })
  });
}
