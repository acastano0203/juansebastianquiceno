// Landing de campaña del Curso de Exportación de Café (antes juansebastianquiceno.com/presentacion-del-curso/).
// Todo lo que cambia con la campaña vive aquí. Lo que está en null no se muestra en la página
// (así nunca sale un "[FECHA]" o "[N]" al público): basta con llenarlo para que aparezca.
import { ENLACES_ACADEMIA } from './academia';

export const RUTA_CURSO_CAFE = '/curso-exportacion-cafe';

export const CURSO_CAFE = {
  /** Checkout de Hotmart. Vacío = los botones de compra abren WhatsApp con un mensaje de inscripción. */
  checkout: ENLACES_ACADEMIA.hotmart,
  /** Precio de lanzamiento en COP (propuesta de marketing). */
  precio: 1_600_000,
  /** TODO: precio regular en COP (se muestra tachado). */
  precioRegular: null,
  /** TODO: número de cuotas con tarjeta en Hotmart. */
  cuotas: null,
  /** TODO: fecha fin del precio de lanzamiento, 'AAAA-MM-DD'. */
  validoHasta: null,
  /** TODO: total de lecciones en video y horas de contenido. */
  lecciones: null,
  horas: null,
  /** TODO: 'vida' para acceso de por vida, o número de meses. */
  acceso: null,
  /** Video de presentación (YouTube Short, vertical 9:16): cabecera de la landing y banner de la portada. */
  videoVenta: '_BhguC0-26o',
  /** WhatsApp de Juan Sebastián (mismo de la página anterior y del pie del sitio). */
  whatsapp: '573014140259',
};
