// Caso de "Cargar ejemplo" y de la prueba de aceptación LCL: 1.200 kg de café verde en sacos de 70 kg,
// sobre pallet americano, de Pereira a Madrid (España), entrega en el puerto de destino (CIF), en USD.

import { respuestasVacias } from '../../engine/asistente/derivar';
import type { Respuestas } from '../../engine/asistente/derivar';

export function ejemploMadrid(): Respuestas {
  return {
    ...respuestasVacias(),
    destino: { pais: 'ES', ciudad: 'Madrid' },
    necesidad: 'AMBOS',
    kilos: 1200,
    recogida: { lugar: 'TRILLADORA', ciudad: 'Pereira' },
    entrega: 'PUERTO',
    partida: '0901.11.90.00',
    empaque: 'SACO',
    saco: '70',
    pallet: 'AMERICANO',
    moneda: 'USD',
  };
}
