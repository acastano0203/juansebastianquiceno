// Gestión de usuarios del panel: crear, editar (nombre, rol, activo), cambiar contraseña y eliminar.
// Crear cuentas en Supabase Auth exige la service role, por eso vive aquí y no en el navegador.
//
// Quién puede llamarla: una cuenta con perfil activo y permiso "usuarios" (o administrador).
// Reglas que se aplican aquí, no en el navegador:
//   · Solo un administrador puede dar el rol de administrador o tocar a otro administrador.
//   · Nadie se cambia su propio rol, ni se desactiva ni se elimina a sí mismo.
//   · Siempre queda al menos un administrador activo.
//
// Secretos: ALLOWED_ORIGINS (opcional, el mismo de pago-curso). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase.
// Despliegue: supabase functions deploy usuarios-admin --no-verify-jwt   (el token se verifica abajo)
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';

const ORIGENES = (Deno.env.get('ALLOWED_ORIGINS') || '*').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
const BLOQUEO = '876000h'; // ~100 años: una cuenta desactivada no puede iniciar sesión

function cors(origin: string | null) {
  const permitido = ORIGENES.includes('*') ? '*' : origin && ORIGENES.includes(origin) ? origin : ORIGENES[0];
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const correoValido = (c: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
const claveValida = (c: unknown) => typeof c === 'string' && c.length >= 8 && c.length <= 72;

class Fallo extends Error {
  constructor(public codigo: string, public status = 400) {
    super(codigo);
  }
}

type Rol = { id: string; sistema: boolean };

async function rol(sb: SupabaseClient, id: unknown): Promise<Rol> {
  if (typeof id !== 'string') throw new Fallo('rol');
  const { data } = await sb.from('roles').select('id, sistema').eq('id', id).maybeSingle();
  if (!data) throw new Fallo('rol');
  return data;
}

async function perfilDe(sb: SupabaseClient, id: unknown) {
  if (typeof id !== 'string') throw new Fallo('no_existe', 404);
  const { data } = await sb.from('perfiles').select('id, activo, rol:roles(id, sistema)').eq('id', id).maybeSingle();
  if (!data) throw new Fallo('no_existe', 404);
  return data as unknown as { id: string; activo: boolean; rol: Rol };
}

// ¿Quedaría al menos un administrador activo si este usuario deja de serlo?
async function quedanOtrosAdmins(sb: SupabaseClient, sinContar: string) {
  const { count } = await sb
    .from('perfiles')
    .select('id, roles!inner(sistema)', { count: 'exact', head: true })
    .eq('activo', true)
    .eq('roles.sistema', true)
    .neq('id', sinContar);
  return (count ?? 0) > 0;
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  try {
    // 1. ¿Quién llama? Token de sesión del panel
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await sb.auth.getUser(token);
    if (!auth?.user) throw new Fallo('sesion', 401);
    const yo = auth.user.id;
    const { data: mio } = await sb.from('perfiles').select('activo, rol:roles(sistema, permisos)').eq('id', yo).maybeSingle();
    const miRol = (mio as unknown as { activo: boolean; rol: { sistema: boolean; permisos: string[] } } | null);
    const soyAdmin = !!miRol?.activo && miRol.rol.sistema;
    if (!miRol?.activo || !(soyAdmin || miRol.rol.permisos.includes('usuarios'))) throw new Fallo('permiso', 403);

    const b = await req.json().catch(() => ({}));

    switch (b.accion) {
      case 'crear': {
        const nombre = texto(b.nombre, 120);
        const correo = texto(b.correo, 160).toLowerCase();
        const r = await rol(sb, b.rol_id);
        const campos = [];
        if (nombre.length < 2) campos.push('nombre');
        if (!correoValido(correo)) campos.push('correo');
        if (!claveValida(b.clave)) campos.push('clave');
        if (campos.length) return json({ error: 'validacion', campos }, 422);
        if (r.sistema && !soyAdmin) throw new Fallo('permiso', 403);

        const { data: nuevo, error } = await sb.auth.admin.createUser({ email: correo, password: b.clave, email_confirm: true, user_metadata: { nombre } });
        if (error || !nuevo.user) throw new Fallo(/already|registered|exists/i.test(error?.message ?? '') ? 'correo_existe' : 'crear', 409);
        const { error: e2 } = await sb.from('perfiles').insert({ id: nuevo.user.id, nombre, correo, rol_id: r.id });
        if (e2) {
          await sb.auth.admin.deleteUser(nuevo.user.id); // no dejar una cuenta sin perfil
          throw new Fallo('crear', 500);
        }
        return json({ id: nuevo.user.id });
      }

      case 'actualizar': {
        const p = await perfilDe(sb, b.id);
        if (p.rol.sistema && !soyAdmin) throw new Fallo('permiso', 403);
        const cambios: Record<string, unknown> = {};
        if (b.nombre !== undefined) {
          const nombre = texto(b.nombre, 120);
          if (nombre.length < 2) return json({ error: 'validacion', campos: ['nombre'] }, 422);
          cambios.nombre = nombre;
        }
        if (b.rol_id !== undefined && b.rol_id !== p.rol.id) {
          if (p.id === yo) throw new Fallo('propio');
          const r = await rol(sb, b.rol_id);
          if (r.sistema && !soyAdmin) throw new Fallo('permiso', 403);
          if (p.rol.sistema && !r.sistema && !(await quedanOtrosAdmins(sb, p.id))) throw new Fallo('ultimo_admin');
          cambios.rol_id = r.id;
        }
        if (typeof b.activo === 'boolean' && b.activo !== p.activo) {
          if (p.id === yo) throw new Fallo('propio');
          if (!b.activo && p.rol.sistema && !(await quedanOtrosAdmins(sb, p.id))) throw new Fallo('ultimo_admin');
          cambios.activo = b.activo;
          // Bloquear la cuenta en Auth: cierra la puerta también a sesiones abiertas cuando su token venza
          await sb.auth.admin.updateUserById(p.id, { ban_duration: b.activo ? 'none' : BLOQUEO });
        }
        if (Object.keys(cambios).length) {
          const { error } = await sb.from('perfiles').update(cambios).eq('id', p.id);
          if (error) throw new Fallo('guardar', 500);
        }
        return json({ ok: true });
      }

      case 'clave': {
        const p = await perfilDe(sb, b.id);
        if (p.rol.sistema && !soyAdmin) throw new Fallo('permiso', 403);
        if (!claveValida(b.clave)) return json({ error: 'validacion', campos: ['clave'] }, 422);
        const { error } = await sb.auth.admin.updateUserById(p.id, { password: b.clave });
        if (error) throw new Fallo('guardar', 500);
        return json({ ok: true });
      }

      case 'eliminar': {
        const p = await perfilDe(sb, b.id);
        if (p.id === yo) throw new Fallo('propio');
        if (p.rol.sistema && !soyAdmin) throw new Fallo('permiso', 403);
        if (p.rol.sistema && !(await quedanOtrosAdmins(sb, p.id))) throw new Fallo('ultimo_admin');
        const { error } = await sb.auth.admin.deleteUser(p.id); // el perfil se borra en cascada
        if (error) throw new Fallo('guardar', 500);
        return json({ ok: true });
      }

      default:
        throw new Fallo('accion');
    }
  } catch (e) {
    if (e instanceof Fallo) return json({ error: e.codigo }, e.status);
    console.error(e);
    return json({ error: 'servidor' }, 500);
  }
});
