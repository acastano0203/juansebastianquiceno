import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Cuenta administrativa de demostración. Reemplazar por un backend real antes de publicar.
export const DEMO_USER = { usuario: 'admin', clave: 'captacion2026', nombre: 'Juan Sebastián', rol: 'Consultor' };

const KEY = 'jsq.session.v1';
const AuthContext = createContext(null);

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const login = useCallback((usuario, clave) => {
    if (usuario.trim().toLowerCase() !== DEMO_USER.usuario || clave !== DEMO_USER.clave) return false;
    const u = { usuario: DEMO_USER.usuario, nombre: DEMO_USER.nombre, rol: DEMO_USER.rol };
    try {
      localStorage.setItem(KEY, JSON.stringify(u));
    } catch {
      // la sesión dura solo mientras la pestaña esté abierta
    }
    setUser(u);
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // nada que limpiar
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
