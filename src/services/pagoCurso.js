// Inicia el pago del curso: manda los datos a la función "pago-curso" de Supabase, que guarda la inscripción
// (queda en el panel como "pendiente") y devuelve la URL de Stripe Checkout.
import { SUPABASE_ANON, SUPABASE_URL, supabaseConfigurado } from '../lib/supabase';
import { origenActual } from './academia';

export const pagoDisponible = supabaseConfigurado;

/** Devuelve la URL de Stripe. Lanza Error con .codigo ('sin_configurar' | 'validacion' | 'muchos_intentos' | 'stripe' | 'red'). */
export async function iniciarPagoCurso(datos, lang) {
  if (!supabaseConfigurado) throw Object.assign(new Error('sin_configurar'), { codigo: 'sin_configurar' });
  let r;
  try {
    r = await fetch(`${SUPABASE_URL}/functions/v1/pago-curso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ ...datos, idioma: lang, origen: origenActual() }),
    });
  } catch {
    throw Object.assign(new Error('red'), { codigo: 'red' });
  }
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok || !cuerpo.url) throw Object.assign(new Error(cuerpo.error || 'stripe'), { codigo: cuerpo.error || 'stripe', campos: cuerpo.campos });
  return cuerpo.url;
}
