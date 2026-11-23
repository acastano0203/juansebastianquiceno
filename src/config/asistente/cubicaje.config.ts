// Reglas de cubicaje del asistente de café. Todo lo que cambia con el cliente, el país o el operador vive aquí:
// el motor (engine/asistente/cubicajeCafe.ts) no tiene ninguna medida escrita a mano.
//
// Unidades: milímetros y kilogramos.

export type ContenedorId = '20' | '40' | '40HC';
export type EmpaqueId = 'SACO_70' | 'SACO_35' | 'CAJA_24' | 'GRANEL';
export type PalletId = 'AMERICANO' | 'EUROPEO';
export type TipoCarga = 'COURIER' | 'AEREO' | 'LCL' | 'FCL';

export interface Contenedor {
  id: ContenedorId;
  nombre: { es: string; en: string };
  /** Medidas internas */
  largoMm: number;
  anchoMm: number;
  altoMm: number;
  volumenM3: number;
  /** Carga útil máxima (payload) según el fabricante */
  payloadKg: number;
}

export const CONTENEDORES: Contenedor[] = [
  { id: '20', nombre: { es: "20' Dry", en: "20' Dry" }, largoMm: 5898, anchoMm: 2352, altoMm: 2393, volumenM3: 33.2, payloadKg: 28_000 },
  { id: '40', nombre: { es: "40' Dry", en: "40' Dry" }, largoMm: 12_032, anchoMm: 2352, altoMm: 2393, volumenM3: 67.7, payloadKg: 26_500 },
  { id: '40HC', nombre: { es: "40' High Cube", en: "40' High Cube" }, largoMm: 12_032, anchoMm: 2352, altoMm: 2698, volumenM3: 76.3, payloadKg: 26_500 },
];

/**
 * Límite de peso "operativo" por país (restricciones de carretera en origen y destino).
 * Se usa el menor entre el payload del contenedor, el límite del país de origen y el del destino.
 * Colombia 20': 19.500 kg, confirmado con el cliente (un 20' con 275 sacos de 70 kg queda casi al 100 %).
 */
export const LIMITE_OPERATIVO_KG: Record<string, Partial<Record<ContenedorId, number>>> = {
  CO: { '20': 19_500, '40': 26_000, '40HC': 26_000 }, // TODO: validar el 40' con el transportador
};

export interface Empaque {
  id: EmpaqueId;
  /** Peso bruto por unidad */
  pesoKg: number;
  largoMm: number;
  anchoMm: number;
  altoMm: number;
  /** Capas máximas una sobre otra (suelto o sobre pallet) */
  apiladoMax: number;
  forma: 'saco' | 'caja' | 'granel';
  color: string;
}

// TODO(cliente): reemplazar por las medidas reales de los sacos y cajas del cliente.
// Validación: con el saco de 70 kg, un 20' acomoda 280 sacos sueltos (7 × 4 × 10), y la referencia
// de mercado es ~275 sacos de 70 kg (19.250 kg).
export const EMPAQUES: Record<EmpaqueId, Empaque> = {
  SACO_70: { id: 'SACO_70', pesoKg: 70, largoMm: 800, anchoMm: 580, altoMm: 230, apiladoMax: 10, forma: 'saco', color: '#C9A66B' },
  SACO_35: { id: 'SACO_35', pesoKg: 35, largoMm: 650, anchoMm: 450, altoMm: 180, apiladoMax: 12, forma: 'saco', color: '#D8BC86' },
  CAJA_24: { id: 'CAJA_24', pesoKg: 24, largoMm: 500, anchoMm: 350, altoMm: 350, apiladoMax: 6, forma: 'caja', color: '#B9875A' },
  // A granel: el café va en un liner dentro de un contenedor completo. Densidad aparente del café verde.
  GRANEL: { id: 'GRANEL', pesoKg: 1, largoMm: 0, anchoMm: 0, altoMm: 0, apiladoMax: 1, forma: 'granel', color: '#8B6A3E' },
};

/** Densidad aparente del café a granel (kg/m³). TODO: validar con el cliente. */
export const DENSIDAD_GRANEL_KG_M3 = 680;
/** Peso mínimo para que el granel tenga sentido (contenedor completo con liner) */
export const GRANEL_MINIMO_KG = 10_000;
/** Si el granel no alcanza el mínimo, el cálculo usa este empaque */
export const GRANEL_ALTERNATIVO: EmpaqueId = 'SACO_70';

export interface Pallet {
  id: PalletId;
  largoMm: number;
  anchoMm: number;
  altoMm: number;
  pesoKg: number;
  /** Carga máxima sobre el pallet */
  cargaMaxKg: number;
}

export const PALLETS: Record<PalletId, Pallet> = {
  AMERICANO: { id: 'AMERICANO', largoMm: 1200, anchoMm: 1000, altoMm: 150, pesoKg: 25, cargaMaxKg: 1000 },
  EUROPEO: { id: 'EUROPEO', largoMm: 1200, anchoMm: 800, altoMm: 150, pesoKg: 22, cargaMaxKg: 1000 },
};

/** Altura máxima de la carga paletizada (pallet incluido) según el tipo de carga */
export const ALTURA_MAX_PALLET_MM: Record<TipoCarga, number> = {
  LCL: 1600,
  FCL: 2200,
  AEREO: 1600,
  COURIER: 1200,
};

/** "No sé": qué sugerir según el tipo de carga */
export const PALLET_SUGERIDO: Record<TipoCarga, PalletId | null> = {
  LCL: 'AMERICANO', // en carga consolidada el pallet protege la carga y agiliza el manejo
  AEREO: 'AMERICANO',
  FCL: null, // en contenedor completo los sacos van sueltos (más unidades por contenedor)
  COURIER: null,
};

/** Umbral entre carga consolidada (LCL) y contenedor completo (FCL) */
export const UMBRAL_LCL = {
  volumenM3: 13,
  pesoKg: 10_000,
  /** Desde qué fracción del umbral se muestra la comparación LCL vs FCL */
  zonaComparacion: 0.6,
};

/** Factores de peso volumétrico (cm³ por kg) */
export const FACTOR_VOLUMETRICO = { AEREO: 6000, COURIER: 5000 };

/** 1 m³ equivale a 1.000 kg en el cobro W/M */
export const KG_POR_M3_WM = 1000;

/** Contenedor compartido que se dibuja en la vista LCL */
export const CONTENEDOR_LCL: ContenedorId = '40';

/** Desviación del centro de gravedad (fracción del largo o del ancho) desde la que se advierte */
export const TOLERANCIA_CENTRO_GRAVEDAD = 0.1;
