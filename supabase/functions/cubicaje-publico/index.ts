// Endpoint público: guarda el cubicaje que un cliente genera desde la landing.
// - Valida todo de nuevo con los límites públicos (no confía en el navegador)
// - Recalcula el acomodo en el servidor (el resultado del cliente se ignora)
// - Rate limit por IP
// Despliegue: supabase functions deploy cubicaje-publico --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { LIMITES } from '../../../src/cubicaje/config.js';
import { validarCubicaje } from '../../../src/cubicaje/validate.js';
import { calcularCubicaje } from '../../../src/cubicaje/packing.js';

const POR_HORA = 10;
const POR_DIA = 40;
const MAX_BODY = 64 * 1024;

const ORIGENES = (Deno.env.get('ALLOWED_ORIGINS') || '*').split(',').map((s) => s.trim());

function cors(origin: string | null) {
  const permitido = ORIGENES.includes('*') ? '*' : origin && ORIGENES.includes(origin) ? origin : ORIGENES[0];
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

function texto(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function validarContacto(c: Record<string, unknown> | null) {
  const nombre = texto(c?.nombre, 80);
  const whatsapp = texto(c?.whatsapp, 30);
  const correo = texto(c?.correo, 120);
  const digitos = whatsapp.replace(/\D/g, '');
  const errores: string[] = [];
  if (nombre.length < 2) errores.push('contacto.nombre');
  if (digitos.length < 7 || digitos.length > 15) errores.push('contacto.whatsapp');
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.push('contacto.correo');
  return { errores, valor: { nombre, whatsapp, correo: correo || null } };
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, headers);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'demasiado_grande' }, 413, headers);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'json' }, 400, headers);
  }

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconocida';
  const [{ data: okHora }, { data: okDia }] = await Promise.all([
    sb.rpc('rate_limit_hit', { p_clave: 'cub:h:' + ip, p_segundos: 3600, p_max: POR_HORA }),
    sb.rpc('rate_limit_hit', { p_clave: 'cub:d:' + ip, p_segundos: 86400, p_max: POR_DIA }),
  ]);
  if (okHora === false || okDia === false) return json({ error: 'rate_limit' }, 429, headers);

  const v = validarCubicaje(body, LIMITES.diagnostico);
  const contacto = validarContacto(body.contacto as Record<string, unknown> | null);
  if (!v.ok || contacto.errores.length) {
    return json({ error: 'validacion', detalles: [...v.errores, ...contacto.errores] }, 422, headers);
  }

  const { nombre, tipoContenedor, productos } = v.valor;
  const resultado = calcularCubicaje(tipoContenedor, productos);
  const m = resultado.metricas;

  const { data: fila, error } = await sb
    .from('cubicajes')
    .insert({
      nombre,
      tipo_contenedor: tipoContenedor,
      origen: 'landing',
      prospecto_id: texto(body.prospectoId, 80) || null,
      contacto: contacto.valor,
      estado: resultado.noColocadas.length ? 'excede' : 'listo',
      resultado,
      ocupacion: Math.round(m.ocupacion * 100) / 100,
      peso_total: m.pesoTotal,
      cajas_total: m.cajasTotales,
    })
    .select('id, created_at')
    .single();
  if (error) return json({ error: 'guardar' }, 500, headers);

  const { error: errProd } = await sb.from('cubicaje_productos').insert(
    productos.map((p, i) => ({
      cubicaje_id: fila.id,
      orden: i,
      nombre: p.nombre,
      tipo_paquete: p.tipoPaquete,
      largo: p.largo,
      ancho: p.ancho,
      alto: p.alto,
      peso: p.peso,
      cantidad: p.cantidad,
      color: p.color,
      limita_rot_x: p.limitaRotX,
      limita_rot_z: p.limitaRotZ,
      limite_peso_activo: p.limitePeso.activo,
      carga_superior: p.limitePeso.superior,
      carga_frontal: p.limitePeso.frontal,
    })),
  );
  if (errProd) {
    await sb.from('cubicajes').delete().eq('id', fila.id);
    return json({ error: 'guardar' }, 500, headers);
  }

  // Solo se devuelve lo necesario para el PDF del cliente; el cubicaje guardado no se puede volver a leer desde la web
  return json({ id: fila.id, createdAt: fila.created_at, resultado }, 201, headers);
});
