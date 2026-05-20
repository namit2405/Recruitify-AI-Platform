import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchApi, setToken, clearToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loginStatus, setLoginStatus] = useState('idle');



  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const data = await fetchApi('/auth/profile/');
      const u = {
        id: data.user.id,
        email: data.user.email,
        userType: data.user.user_type,
        organization: data.organization,
        candidate: data.candidate,
      };
      setUser(u);
      return u;
    } catch {
      clearToken();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    setLoginStatus('logging-in');
    try {
      const data = await fetchApi('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Check if MFA is required
      if (data.requires_mfa) {
        setLoginStatus('idle');
        return { requires_mfa: true, email: data.email };
      }
      
      // No MFA, login directly
      setToken(data.access, data.refresh);
      setUser(data.user);
      setLoginStatus('idle');
      return data.user;
    } catch (err) {
      setLoginStatus('idle');
      throw err;
    }
  }, []);

  const register = useCallback(async (email, password, userType) => {
    setLoginStatus('logging-in');
    try {
      const data = await fetchApi('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({ email, password, user_type: userType }),
      });
      
      // Check if email verification is required
      if (data.requires_verification) {
        setLoginStatus('idle');
        return { requires_verification: true, email: data.email };
      }
      
      // Old flow (shouldn't happen with new backend)
      setToken(data.access, data.refresh);
      setUser(data.user);
      setLoginStatus('idle');
      return data.user;
    } catch (err) {
      setLoginStatus('idle');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);


  const value = {
    user,
    identity: user,
    setUser,
    login,
    register,
    logout,
    loginStatus,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      identity: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      loginStatus: 'idle',
      loadUser: async () => null,
    };
  }
  return ctx;
}
