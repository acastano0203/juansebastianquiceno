// Sesiones diagnósticas agendadas desde el pie de las páginas.
// Con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY se guardan en Supabase (migración 20261125000000_agendas_diagnostico.sql);
// además, siempre entran al tablero de prospectos del panel (LeadsContext.registrarAgenda).

import { origenActual } from './academia';

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

let clientePromise;
function cliente() {
  clientePromise ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, ANON));
  return clientePromise;
}

/** Guarda la solicitud. Lanza error si Supabase está configurado y falla (la pantalla ofrece reintentar). */
export async function guardarAgendaDiagnostico({ nombre, whatsapp, correo, tema, canal = 'whatsapp', cita, contactarAntes, lang }) {
  const fila = {
    nombre: nombre.trim(),
    whatsapp: whatsapp.replace(/[^\d+]/g, ''),
    correo: correo.trim().toLowerCase(),
    tema,
    canal_contacto: canal,
    cita: cita.toISOString(),
    contactar_antes: contactarAntes.toISOString(),
    pagina: typeof window !== 'undefined' ? window.location.pathname : null,
    origen: origenActual(),
    idioma: lang,
  };
  if (URL && ANON) {
    const sb = await cliente();
    const { error } = await sb.from('agendas_diagnostico').insert(fila);
    if (error) throw error;
  }
  return fila;
}
