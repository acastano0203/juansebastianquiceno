// Usuarios y roles del panel.
// · Leer usuarios y roles, y crear/editar/borrar roles: directo a Supabase (las políticas solo dejan a quien corresponde).
// · Crear, editar, desactivar, cambiar contraseña y eliminar usuarios: función "usuarios-admin" (usa la service role).
import { obtenerSupabase, SUPABASE_ANON, SUPABASE_URL } from '../lib/supabase';

const fallo = (codigo, campos) => Object.assign(new Error(codigo), { codigo, campos });

export async function listarRoles() {
  const sb = await obtenerSupabase();
  const { data, error } = await sb.from('roles').select('id, nombre, descripcion, permisos, sistema').order('sistema', { ascending: false }).order('nombre');
  if (error) throw fallo('cargar');
  return data;
}

export async function listarUsuarios() {
  const sb = await obtenerSupabase();
  const { data, error } = await sb.from('perfiles').select('id, nombre, correo, activo, creado_en, rol_id').order('creado_en');
  if (error) throw fallo('cargar');
  return data;
}

/** Crea (sin id) o actualiza un rol. Solo administradores (lo exige la base). */
export async function guardarRol({ id, nombre, descripcion, permisos }) {
  const sb = await obtenerSupabase();
  const fila = { nombre: nombre.trim(), descripcion: descripcion.trim() || null, permisos };
  const { error } = id ? await sb.from('roles').update(fila).eq('id', id) : await sb.from('roles').insert(fila);
  if (error) throw fallo(error.code === '23505' ? 'rol_existe' : 'guardar');
}

export async function eliminarRol(id) {
  const sb = await obtenerSupabase();
  const { error } = await sb.from('roles').delete().eq('id', id);
  // 23503: hay usuarios con este rol (la base no deja borrarlo)
  if (error) throw fallo(error.code === '23503' ? 'rol_en_uso' : 'guardar');
}

async function llamar(cuerpo) {
  const sb = await obtenerSupabase();
  const { data } = await sb.auth.getSession();
  let r;
  try {
    r = await fetch(`${SUPABASE_URL}/functions/v1/usuarios-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw fallo('red');
  }
  const res = await r.json().catch(() => ({}));
  if (!r.ok) throw fallo(res.error || 'servidor', res.campos);
  return res;
}

export const crearUsuario = (u) => llamar({ accion: 'crear', ...u });
export const actualizarUsuario = (id, cambios) => llamar({ accion: 'actualizar', id, ...cambios });
export const cambiarClave = (id, clave) => llamar({ accion: 'clave', id, clave });
export const eliminarUsuario = (id) => llamar({ accion: 'eliminar', id });

/** Contraseña temporal legible (sin 0/O ni 1/l) para entregarle al usuario nuevo. */
export function claveTemporal(largo = 12) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const n = crypto.getRandomValues(new Uint32Array(largo));
  return [...n].map((x) => abc[x % abc.length]).join('');
}
