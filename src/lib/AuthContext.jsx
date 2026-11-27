import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { obtenerSupabase, supabaseConfigurado } from './supabase';
import { CLAVES_MODULOS, puedeEntrar } from '../config/permisos';

// Dos modos:
// - Con Supabase configurado: inicio de sesión real (Supabase Auth, correo + contraseña). Después de entrar se carga
//   el perfil (tabla perfiles) con su rol y permisos: eso decide qué módulos ve en el menú y qué datos le deja leer
//   la base. Una cuenta sin perfil o desactivada no entra.
// - Sin Supabase: cuenta de demostración con acceso total, solo para probar el panel en este navegador.
export const DEMO_USER = { usuario: 'admin', clave: 'captacion2026', nombre: 'Juan Sebastián', rol: 'Consultor' };
export const MODO_DEMO = !supabaseConfigurado;

const KEY = 'jsq.session.v1';
const AuthContext = createContext(null);

const usuarioDemo = () => ({ id: 'demo', usuario: DEMO_USER.usuario, nombre: DEMO_USER.nombre, rol: DEMO_USER.rol, esAdmin: true, permisos: CLAVES_MODULOS });

function readSession() {
  if (!MODO_DEMO) return null;
  try {
    return localStorage.getItem(KEY) ? usuarioDemo() : null;
  } catch {
    return null;
  }
}

/** Perfil + rol de la cuenta. null si no tiene perfil o está desactivada. */
async function cargarPerfil(sb, authUser) {
  if (!authUser) return null;
  const { data } = await sb.from('perfiles').select('nombre, activo, rol:roles(nombre, permisos, sistema)').eq('id', authUser.id).maybeSingle();
  if (!data?.activo || !data.rol) return null;
  return {
    id: authUser.id,
    usuario: authUser.email,
    nombre: data.nombre,
    rol: data.rol.nombre,
    esAdmin: data.rol.sistema,
    permisos: data.rol.permisos || [],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  // Con Supabase, la sesión guardada se recupera de forma asíncrona: mientras tanto no se redirige al login
  const [cargando, setCargando] = useState(!MODO_DEMO);

  useEffect(() => {
    if (MODO_DEMO) return undefined;
    let sub;
    let vivo = true;
    obtenerSupabase().then(async (sb) => {
      const { data } = await sb.auth.getSession();
      const u = await cargarPerfil(sb, data.session?.user);
      if (!vivo) return;
      setUser(u);
      setCargando(false);
      sub = sb.auth.onAuthStateChange((evento, sesion) => {
        if (evento === 'SIGNED_OUT' || !sesion) setUser(null);
        // No se llama a Supabase dentro del callback (puede bloquear el cliente): se difiere
        else if (evento === 'USER_UPDATED') setTimeout(() => cargarPerfil(sb, sesion.user).then((p) => vivo && setUser(p)), 0);
      }).data.subscription;
    });
    return () => {
      vivo = false;
      sub?.unsubscribe();
    };
  }, []);

  /** Devuelve true si entró, false si el correo o la contraseña no coinciden, 'sin_acceso' si la cuenta no tiene acceso al panel. */
  const login = useCallback(async (usuario, clave) => {
    if (!MODO_DEMO) {
      const sb = await obtenerSupabase();
      const { data, error } = await sb.auth.signInWithPassword({ email: usuario.trim(), password: clave });
      if (error) return /banned/i.test(error.message) ? 'sin_acceso' : false;
      const u = await cargarPerfil(sb, data.user);
      if (!u) {
        await sb.auth.signOut();
        return 'sin_acceso';
      }
      setUser(u);
      return true;
    }
    if (usuario.trim().toLowerCase() !== DEMO_USER.usuario || clave !== DEMO_USER.clave) return false;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // la sesión dura solo mientras la pestaña esté abierta
    }
    setUser(usuarioDemo());
    return true;
  }, []);

  const logout = useCallback(async () => {
    if (!MODO_DEMO) {
      const sb = await obtenerSupabase();
      await sb.auth.signOut();
    }
    try {
      localStorage.removeItem(KEY);
    } catch {
      // nada que limpiar
    }
    setUser(null);
  }, []);

  const puede = useCallback((modulo) => puedeEntrar(user, modulo), [user]);

  const value = useMemo(() => ({ user, cargando, login, logout, puede }), [user, cargando, login, logout, puede]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
