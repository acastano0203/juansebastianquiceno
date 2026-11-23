// Partidas arancelarias del café (capítulo 09.01). El usuario nunca elige el código: lo deduce su respuesta.

export interface PartidaCafe {
  codigo: string;
  nombre: { es: string; en: string };
  /** Categorías del motor de costos que disparan alertas y requisitos */
  categorias: string[];
  /** Tarjeta destacada en el paso Producto */
  destacada?: boolean;
}

export const PARTIDAS_CAFE: PartidaCafe[] = [
  { codigo: '0901.21.10.00', nombre: { es: 'Café tostado en grano, listo para la venta', en: 'Roasted whole-bean coffee, ready to sell' }, categorias: ['ALIMENTOS'], destacada: true },
  { codigo: '0901.11.90.00', nombre: { es: 'Café verde (sin tostar), sin descafeinar, listo para la venta', en: 'Green (unroasted), non-decaf coffee, ready to sell' }, categorias: ['ALIMENTOS', 'VEGETAL_ANIMAL'], destacada: true },
  { codigo: '0901.11.10.00', nombre: { es: 'Café verde sin descafeinar, para la siembra', en: 'Green non-decaf coffee, for planting' }, categorias: ['VEGETAL_ANIMAL'] },
  { codigo: '0901.12.00.00', nombre: { es: 'Café verde descafeinado', en: 'Green decaffeinated coffee' }, categorias: ['ALIMENTOS', 'VEGETAL_ANIMAL'] },
  { codigo: '0901.21.20.00', nombre: { es: 'Café tostado sin descafeinar, molido', en: 'Roasted non-decaf coffee, ground' }, categorias: ['ALIMENTOS'] },
  { codigo: '0901.22.00.00', nombre: { es: 'Café tostado descafeinado', en: 'Roasted decaffeinated coffee' }, categorias: ['ALIMENTOS'] },
  { codigo: '0901.90.00.00', nombre: { es: 'Cáscara y cascarilla de café', en: 'Coffee husks and skins' }, categorias: ['VEGETAL_ANIMAL'] },
];

export const partidaPorCodigo = (codigo: string): PartidaCafe | undefined => PARTIDAS_CAFE.find((p) => p.codigo === codigo);
