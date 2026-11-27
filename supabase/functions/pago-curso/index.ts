// Endpoint público: recibe los datos del formulario de inscripción del curso, los guarda (estado "pendiente")
// y crea una sesión de Stripe Checkout. Devuelve la URL de pago a la que el navegador redirige.
// La clave secreta de Stripe vive solo aquí (secreto de Supabase), nunca en el navegador.
//
// Secretos (supabase secrets set ...):
//   STRIPE_SECRET_KEY   sk_live_... (o sk_test_... para pruebas)
//   STRIPE_PRICE_ID     price_... del producto "Curso de Exportación de Café" creado en Stripe
//   SITE_URL            https://juansebastianquiceno.com (a dónde vuelve la persona después de pagar)
//   ALLOWED_ORIGINS     opcional: dominios que pueden llamar a esta función, separados por coma
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// Despliegue: supabase functions deploy pago-curso --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const MAX_BODY = 8 * 1024;
const POR_HORA = 8; // intentos por IP: evita que llenen la tabla con basura

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

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

function validar(b: Record<string, unknown>) {
  const v = {
    nombre: texto(b.nombre, 120),
    correo: texto(b.correo, 160).toLowerCase(),
    telefono: texto(b.telefono, 30).replace(/[^\d+]/g, ''),
    direccion: texto(b.direccion, 200),
    ciudad: texto(b.ciudad, 80),
    pais: texto(b.pais, 60),
    origen: texto(b.origen, 60) || null,
    idioma: b.idioma === 'en' ? 'en' : 'es',
  };
  const errores: string[] = [];
  if (v.nombre.length < 2) errores.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.correo)) errores.push('correo');
  const digitos = v.telefono.replace(/\D/g, '').length;
  if (digitos < 7 || digitos > 15) errores.push('telefono');
  if (v.direccion.length < 4) errores.push('direccion');
  if (v.ciudad.length < 2) errores.push('ciudad');
  if (v.pais.length < 2) errores.push('pais');
  return { errores, v };
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'method' }, 405, headers);

  const STRIPE = Deno.env.get('STRIPE_SECRET_KEY');
  const PRICE = Deno.env.get('STRIPE_PRICE_ID');
  const SITE = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');
  if (!STRIPE || !PRICE || !SITE) return json({ error: 'sin_configurar' }, 500, headers);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'demasiado_grande' }, 413, headers);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'json' }, 400, headers);
  }
  const { errores, v } = validar(body);
  if (errores.length) return json({ error: 'validacion', campos: errores }, 422, headers);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Límite sencillo por correo: no más de POR_HORA intentos por hora
  const haceUnaHora = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await sb.from('inscripciones_curso').select('id', { count: 'exact', head: true }).eq('correo', v.correo).gte('creado_en', haceUnaHora);
  if ((count ?? 0) >= POR_HORA) return json({ error: 'muchos_intentos' }, 429, headers);

  const { data: fila, error } = await sb.from('inscripciones_curso').insert(v).select('id').single();
  if (error || !fila) return json({ error: 'guardar' }, 500, headers);

  // Sesión de Stripe Checkout (API REST, sin SDK)
  const ruta = '/curso-exportacion-cafe';
  const form = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': PRICE,
    'line_items[0][quantity]': '1',
    customer_email: v.correo,
    client_reference_id: fila.id,
    'metadata[inscripcion_id]': fila.id,
    'payment_intent_data[metadata][inscripcion_id]': fila.id,
    locale: v.idioma,
    success_url: `${SITE}${ruta}/gracias?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE}${ruta}?pago=cancelado#oferta`,
  });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const sesion = await r.json();
  if (!r.ok || !sesion.url) {
    console.error('stripe', sesion?.error?.message);
    await sb.from('inscripciones_curso').update({ notas: `Error Stripe: ${sesion?.error?.message ?? r.status}` }).eq('id', fila.id);
    return json({ error: 'stripe' }, 502, headers);
  }
  await sb.from('inscripciones_curso').update({ stripe_session_id: sesion.id }).eq('id', fila.id);

  return json({ url: sesion.url }, 200, headers);
});
