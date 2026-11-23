// Pasos del asistente. El orden es el de la conversación; Precio se salta si el usuario solo quiere el cubicaje.

export const ETAPAS = ['destino', 'necesidad', 'volumen', 'entrega', 'producto', 'empaque', 'precio', 'resultado', 'reporte', 'soporte'];

const DE_ENTRADA = ['destino', 'necesidad', 'volumen', 'entrega', 'producto', 'empaque', 'precio'];

export const soloCubicaje = (r) => r.necesidad === 'CUBICAJE';

export const etapasVisibles = (r) => ETAPAS.filter((e) => e !== 'precio' || !soloCubicaje(r));

/** El paso desde el que "Siguiente" calcula y lleva al resultado */
export const ultimaEtapaDeEntrada = (r) => (soloCubicaje(r) ? 'empaque' : 'precio');

export const esDeEntrada = (e) => DE_ENTRADA.includes(e);

/** Una etapa está completa cuando tiene lo necesario para seguir */
export function etapasCompletas(r, asistente, calculada) {
  const destino = !!r.destino.pais;
  const necesidad = !!r.necesidad;
  const volumen = r.kilos != null && r.kilos > 0 && !!asistente.via;
  const entrega = !!r.recogida.lugar && !!r.entrega;
  const producto = !!r.partida;
  const empaque = !!r.empaque && !!asistente.cubicaje && asistente.cubicaje.escenas.length > 0;
  // Sin precio escrito se usa el de referencia del liquidador: basta con la moneda
  const precio = soloCubicaje(r) || !!r.moneda;
  return { destino, necesidad, volumen, entrega, producto, empaque, precio, resultado: calculada, reporte: calculada, soporte: false };
}

/** Primer paso de entrada que falta, para mandar ahí al usuario */
export function primeraPendiente(r, completas) {
  return etapasVisibles(r).find((e) => esDeEntrada(e) && !completas[e]) ?? null;
}
