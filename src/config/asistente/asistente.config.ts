// Reglas del asistente conversacional de exportación de café. Umbrales, mapeos y supuestos viven aquí,
// nunca en los componentes. Cada valor marcado PENDIENTE o TODO debe confirmarse con el cliente.

import type { Incoterm } from '../../engine/types';
import type { TipoCarga } from './cubicaje.config';

// ---------- Paso 3: modalidad según los kilos ----------
export const UMBRALES_MODALIDAD = {
  /** Hasta este peso (incluido) la carga va por courier */
  courierMaxKg: 50,
  /** Desde este peso (incluido) la carga va por vía marítima */
  maritimoMinKg: 500,
  // PENDIENTE: el rango intermedio (50–500 kg) está por confirmar con el cliente.
  // Hoy se pregunta la urgencia: urgente → aéreo; puede esperar → marítimo consolidado.
};

export type Urgencia = 'URGENTE' | 'ESPERAR';
export type ViaTransporte = 'COURIER' | 'AEREO' | 'MARITIMO';

export const VIA_POR_URGENCIA: Record<Urgencia, ViaTransporte> = {
  URGENTE: 'AEREO',
  ESPERAR: 'MARITIMO',
};

// ---------- Paso 4: entrega → Incoterm ----------
export type LugarRecogida = 'TRILLADORA' | 'TOSTADORA';
export type LugarEntrega = 'PUERTO' | 'COMPRADOR';

export const INCOTERM_POR_ENTREGA: Record<LugarEntrega, { maritimo: Incoterm; noMaritimo: Incoterm; alternativa?: Incoterm }> = {
  // CIF solo aplica al transporte marítimo (Incoterms 2020); por aire o courier su equivalente es CIP.
  PUERTO: { maritimo: 'CIF', noMaritimo: 'CIP' },
  // DDP queda como alternativa: el vendedor también asume la aduana y los tributos de importación.
  COMPRADOR: { maritimo: 'DAP', noMaritimo: 'DAP', alternativa: 'DDP' },
};

/** Explicación de una línea de cada Incoterm que puede asignar el asistente */
export const EXPLICACION_INCOTERM: Partial<Record<Incoterm, { es: string; en: string }>> = {
  CIF: { es: 'Tú pagas el transporte y el seguro hasta el puerto de destino; desde que la carga sube al barco, el riesgo es del comprador.', en: 'You pay freight and insurance to the destination port; once the cargo is on board, the risk is the buyer’s.' },
  CIP: { es: 'Tú pagas el transporte y el seguro hasta el aeropuerto o terminal de destino; el riesgo pasa al comprador cuando entregas al transportador.', en: 'You pay carriage and insurance to the destination airport or terminal; risk passes to the buyer when you hand over to the carrier.' },
  DAP: { es: 'Tú llevas la carga hasta las oficinas del comprador; él se encarga de la aduana y los impuestos de su país.', en: 'You take the cargo to the buyer’s premises; the buyer handles customs and taxes in their country.' },
  DDP: { es: 'Tú llevas la carga hasta las oficinas del comprador y pagas también la aduana y los impuestos de su país.', en: 'You take the cargo to the buyer’s premises and also pay customs and taxes in their country.' },
};

// ---------- Paso 6: avisos por destino ----------
/** Países de la Unión Europea: los pallets de madera deben llevar el sello NIMF-15 */
export const PAISES_UE = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];

/** País de origen fijo: el asistente es para exportadores colombianos */
export const PAIS_ORIGEN = 'CO';

/** Países de destino que ofrece el selector (ISO 3166-1 alfa-2) */
export const PAISES_DESTINO = 'AE,AR,AT,AU,BE,BG,BO,BR,CA,CH,CL,CN,CR,CY,CZ,DE,DK,DO,EC,EE,EG,ES,FI,FR,GB,GR,GT,HK,HN,HR,HU,ID,IE,IL,IN,IT,JP,KR,LT,LU,LV,MA,MT,MX,MY,NL,NO,NZ,PA,PE,PH,PL,PT,PY,RO,SA,SE,SG,SI,SK,SV,TH,TR,TW,US,UY,VN,ZA'.split(',');

// ---------- Paso 7: precio ----------
export const PRECIO = {
  monedas: ['USD', 'EUR'] as const,
  /** Diferencial por defecto sobre el contrato C, en centavos de USD por libra. TODO: validar con el cliente. */
  diferencialCentavosLb: 35,
  /** Margen objetivo para el precio de venta sugerido */
  margenObjetivo: 0.15,
};

// ---------- Costos locales tentativos (USD) ----------
// SUPUESTO SEMILLA por calibrar con cotizaciones reales. Se usan solo cuando la ruta no tiene tarifas cargadas.
// Valor = máx(mínimo, fijo + porKg × kg brutos).
type Locales = Record<string, { fijo: number; porKg?: number; minimo?: number }>;

const MARITIMOS: Locales = {
  B02: { fijo: 180, porKg: 0.02 }, // transporte de la trilladora o tostadora al puerto
  B03: { fijo: 60, porKg: 0.004 }, // cargue
  B06: { fijo: 60 }, // documentos de exportación
  B10: { fijo: 150 }, // agencia de aduanas en origen
  D07: { fijo: 150, porKg: 0.03 }, // entrega en las oficinas del comprador (solo DAP/DDP)
};

export const COSTOS_LOCALES_TENTATIVOS: Record<TipoCarga, Locales> = {
  FCL: { ...MARITIMOS, B02: { fijo: 450, porKg: 0.012 }, B03: { fijo: 120 }, D07: { fijo: 450, porKg: 0.01 } },
  LCL: MARITIMOS,
  AEREO: { B02: { fijo: 80, porKg: 0.03 }, B03: { fijo: 30 }, B06: { fijo: 50 }, B10: { fijo: 120 }, D07: { fijo: 90, porKg: 0.08 } },
  // El courier recoge y entrega puerta a puerta: solo quedan los documentos.
  COURIER: { B02: { fijo: 0 }, B03: { fijo: 0 }, B06: { fijo: 15 }, B10: { fijo: 0 }, D07: { fijo: 0 } },
};

// TODO(fuera de alcance): módulo "¿a qué país exportar?" basado en mapas de oportunidades:
// - https://atlas.hks.harvard.edu/
// - https://integra.iadb.org/contents/trade-goods
// - https://oec.world/es/tariff-simulator-report?country=col
