// Un solo cliente de Supabase para toda la app (la sesión del panel vive aquí).
// Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY la app funciona en modo demostración.
const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = !!(URL && ANON);
export const SUPABASE_URL = URL;
export const SUPABASE_ANON = ANON;

let promesa;
/** El SDK se descarga solo cuando hace falta, para no pesar en la portada */
export function obtenerSupabase() {
  if (!supabaseConfigurado) return Promise.resolve(null);
  promesa ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, ANON));
  return promesa;
}
