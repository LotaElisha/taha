import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getCurrentPosition } from '../services/geolocationService';
import { verifyOtp } from '../services/mockOtp';
import { api } from '../services/api';
import { ensureCsrf, apiFetch } from '../lib/apiClient';
import { useUser } from './UserContext';

interface GeolocationState {
  lat: number;
  lon: number;
}

interface AuthContextType {
  user: User | null;
  /** True until the first /me probe completes, so guards can wait. */
  isBootstrapping: boolean;
  location: GeolocationState | null;
  locationError: string | null;
  isRequestingLocation: boolean;
  signInWithPhone: (input: {
    phone: string;
    code: string;
    region: 'TZ' | 'KE';
    role?: UserRole;
    name?: string;
  }) => Promise<User>;
  /** Admin/agronomist email path — kept for backwards compat. */
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserAuthData: (updatedData: Partial<User>) => void;
  requestLocation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { users, addUser, updateUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(false);

  // On boot: pull the CSRF cookie and ask the server who we are.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureCsrf();
        const me = await api.auth.me();
        if (!cancelled) setUser(me);
      } catch (e) {
        // Server unreachable — stay anonymous; the UI will surface offline state.
        console.warn('Auth bootstrap failed:', e);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocation = async () => {
    if (isRequestingLocation || location) return;
    setIsRequestingLocation(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      setLocation(coords);
    } catch (error: any) {
      setLocationError(error.message);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const signInWithPhone: AuthContextType['signInWithPhone'] = async ({
    phone,
    code,
    region,
    role,
    name,
  }) => {
    const result = await verifyOtp(phone, code, { region, role, name });
    if (!result.ok) {
      throw new Error(result.reason || 'Incorrect code');
    }
    // The server set the session cookie inside verify. Hydrate from /me so we
    // get the canonical user shape (including server-assigned id).
    const me = await api.auth.me();
    if (!me) throw new Error('Verify succeeded but no session — try again.');
    setUser(me);
    return me;
  };

  const loginWithEmail = async (email: string, password: string) => {
    // Staff-only path. Server enforces role membership; we just call and
    // hydrate from the response (which is the same shape as /me).
    const res = await apiFetch<{ ok: true; user: User }>(
      '/api/v1/auth/admin/login',
      { method: 'POST', body: { email, password } },
    );
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn('Logout request failed (clearing local state anyway):', e);
    }
    setUser(null);
  };

  const updateUserAuthData = (updatedData: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedData };
      updateUser(newUser);
      return newUser;
    });
  };

  // The lint complains about `addUser` being unused — it's intentionally kept
  // so the legacy code paths in UserContext still compile.
  void addUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        isBootstrapping,
        location,
        locationError,
        isRequestingLocation,
        signInWithPhone,
        loginWithEmail,
        logout,
        updateUserAuthData,
        requestLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
