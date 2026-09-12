import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as apiLogout } from '../api/auth.js';
import { isDemoMode, exitDemoMode } from '../utils/demo.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (isDemoMode()) {
        setUser({ id: 'demo_user', name: 'You (Demo)', email: 'demo@roomsplit.app', isDemo: true });
        setLoading(false);
        return;
      }

      try {
        const userData = await getMe();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function logout() {
    if (isDemoMode()) {
      exitDemoMode();
    } else {
      await apiLogout();
    }
    setUser(null);
    window.location.href = '/';
  }

  async function login(email, password) {
    const { login: apiLogin } = await import('../api/auth.js');
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const { register: apiRegister } = await import('../api/auth.js');
    const data = await apiRegister(name, email, password);
    setUser(data.user);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, login, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
