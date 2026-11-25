// Ancla de la sección "Agenda una sesión" (AgendaDiagnostico), que va sobre el pie de las páginas públicas.
// Todos los botones de agendar llevan aquí: el formulario registra al cliente en /admin para que soporte lo contacte.
export const ANCLA_AGENDA = '#agendar-sesion';

// Contacto con el asesor por WhatsApp. El número se configura en VITE_WHATSAPP_ASESOR (con indicativo, solo dígitos).
export function enlaceWhatsApp(mensaje) {
  const numero = (import.meta.env.VITE_WHATSAPP_ASESOR || '').replace(/\D/g, '');
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` : null;
}
