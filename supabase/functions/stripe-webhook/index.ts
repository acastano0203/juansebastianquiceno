// Webhook de Stripe: Stripe avisa aquí cuando un pago se completa, vence o se reembolsa,
// y la inscripción del curso cambia de estado en la tabla (eso es lo que ve el panel).
// Es la ÚNICA fuente de verdad del pago: la página de "gracias" no marca nada como pagado.
//
// Secretos: STRIPE_WEBHOOK_SECRET (whsec_..., lo da Stripe al crear el endpoint).
// Despliegue: supabase functions deploy stripe-webhook --no-verify-jwt
// Eventos a suscribir en Stripe: checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.async_payment_failed, checkout.session.expired, charge.refunded
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const TOLERANCIA_S = 300;

async function firmaValida(payload: string, cabecera: string | null, secreto: string) {
  if (!cabecera) return false;
  const partes = Object.fromEntries(cabecera.split(',').map((p) => p.split('=') as [string, string]));
  const t = Number(partes.t);
  const firmas = cabecera
    .split(',')
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));
  if (!t || !firmas.length || Math.abs(Date.now() / 1000 - t) > TOLERANCIA_S) return false;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`${t}.${payload}`));
  const esperada = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Comparación en tiempo constante
  return firmas.some((f) => f.length === esperada.length && [...f].reduce((d, c, i) => d | (c.charCodeAt(0) ^ esperada.charCodeAt(i)), 0) === 0);
}

// Monedas sin decimales en Stripe: el monto llega en unidades enteras
const SIN_DECIMALES = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);
const aUnidades = (monto: number, moneda: string) => (SIN_DECIMALES.has(moneda) ? monto : monto / 100);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 });
  const secreto = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secreto) return new Response('sin_configurar', { status: 500 });

  const payload = await req.text();
  if (!(await firmaValida(payload, req.headers.get('stripe-signature'), secreto))) return new Response('firma', { status: 400 });

  const evento = JSON.parse(payload);
  const obj = evento.data?.object ?? {};
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const porSesion = (cambios: Record<string, unknown>) => sb.from('inscripciones_curso').update(cambios).eq('stripe_session_id', obj.id);

  switch (evento.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      // "completed" llega también con pagos que aún se están procesando (p. ej. transferencias): solo "paid" cuenta
      if (obj.payment_status === 'paid') {
        const moneda = String(obj.currency || '').toLowerCase();
        await porSesion({
          estado: 'pagado',
          pagado_en: new Date((evento.created ?? Date.now() / 1000) * 1000).toISOString(),
          monto: aUnidades(obj.amount_total ?? 0, moneda),
          moneda: moneda.toUpperCase(),
          stripe_payment_intent: obj.payment_intent ?? null,
        }).neq('estado', 'acceso_enviado');
      }
      break;
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      await porSesion({ estado: 'abandonado' }).eq('estado', 'pendiente');
      break;
    case 'charge.refunded':
      if (obj.payment_intent) await sb.from('inscripciones_curso').update({ estado: 'reembolsado' }).eq('stripe_payment_intent', obj.payment_intent);
      break;
  }
  return new Response(JSON.stringify({ recibido: true }), { headers: { 'Content-Type': 'application/json' } });
});
