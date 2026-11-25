// Agenda de Google Calendar para la sesión diagnóstica de 30-45 min (la misma de juansebastianquiceno.com)
export const ENLACE_AGENDA = 'https://calendar.app.google/zFPtJ2F63z5MpiNh9';

// Contacto con el asesor por WhatsApp. El número se configura en VITE_WHATSAPP_ASESOR (con indicativo, solo dígitos).
export function enlaceWhatsApp(mensaje) {
  const numero = (import.meta.env.VITE_WHATSAPP_ASESOR || '').replace(/\D/g, '');
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
}
