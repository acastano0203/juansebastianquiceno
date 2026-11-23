// Registros de la masterclass y llamadas agendadas de la Academia.
// Con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY se guardan en Supabase (tablas de la migración
// 20261123000000_academia.sql). Sin ellas quedan solo en este navegador, para probar el embudo.

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const KEY_REGISTRO = 'ai.academia.registro.v1';
const KEY_ORIGEN = 'ai.academia.origen.v1';

let clientePromise;
function cliente() {
  clientePromise ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, ANON));
  return clientePromise;
}

const conSupabase = () => !!(URL && ANON);

/** De dónde llegó la persona: ?origen=, ?utm_source= o el sitio anterior. Se recuerda en la sesión. */
export function registrarOrigen(search = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const q = new URLSearchParams(search);
    const directo = q.get('origen') || q.get('utm_source');
    if (directo) {
      sessionStorage.setItem(KEY_ORIGEN, directo.slice(0, 60));
      return;
    }
    if (sessionStorage.getItem(KEY_ORIGEN)) return;
    const ref = document.referrer ? new window.URL(document.referrer).hostname : '';
    const mismo = ref && ref === window.location.hostname;
    sessionStorage.setItem(KEY_ORIGEN, mismo ? 'sitio' : ref || 'directo');
  } catch {
    // sin almacenamiento: el origen queda como "directo"
  }
}

export function origenActual() {
  try {
    return sessionStorage.getItem(KEY_ORIGEN) || 'directo';
  } catch {
    return 'directo';
  }
}

/** Lo que la persona contó al registrarse, para personalizar el resto del embudo */
export function registroGuardado() {
  try {
    const raw = localStorage.getItem(KEY_REGISTRO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function recordar(registro) {
  try {
    localStorage.setItem(KEY_REGISTRO, JSON.stringify(registro));
  } catch {
    // el embudo funciona igual, solo sin personalizar
  }
}

/** Guarda el registro de la masterclass. Lanza error si Supabase está configurado y falla. */
export async function guardarRegistro(datos, lang = 'es') {
  const fila = {
    nombre: datos.nombre.trim(),
    indicativo: datos.indicativo,
    whatsapp: datos.whatsapp.replace(/\D/g, ''),
    correo: datos.correo.trim().toLowerCase(),
    pais: datos.pais,
    perfil: datos.rol,
    volumen: datos.volumen,
    exporto: datos.exporto || null,
    origen: origenActual(),
    idioma: lang,
  };
  if (conSupabase()) {
    const sb = await cliente();
    const { error } = await sb.from('academia_registros').insert(fila);
    if (error) throw error;
  }
  recordar({ ...fila, en: new Date().toISOString() });
  return fila;
}

/** Guarda la solicitud de llamada de 15 minutos */
export async function guardarAgenda(datos) {
  const fila = {
    nombre: datos.nombre.trim(),
    whatsapp: datos.whatsapp.replace(/[^\d+]/g, ''),
    plan: datos.plan,
    fecha: datos.fecha,
    hora: datos.hora,
    origen: origenActual(),
  };
  if (conSupabase()) {
    const sb = await cliente();
    const { error } = await sb.from('academia_agendas').insert(fila);
    if (error) throw error;
  }
  return fila;
}
