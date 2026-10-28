// Configuración del módulo de cubicaje. Las medidas son internas, en cm; la carga máxima en kg.
// Para agregar o ajustar un contenedor basta con editar esta tabla.

export const CONTENEDORES = {
  '20': { id: '20', nombre: "20' Standard", largo: 589, ancho: 235, alto: 239, cargaMax: 28200 },
  '40': { id: '40', nombre: "40' Standard", largo: 1203, ancho: 235, alto: 239, cargaMax: 26700 },
  '40HC': { id: '40HC', nombre: "40' High Cube", largo: 1203, ancho: 235, alto: 269, cargaMax: 26500 },
};

export const CONTENEDOR_DEFAULT = '20';

export function getContenedor(id) {
  return CONTENEDORES[id] || null;
}

// Tipos de paquete. Solo `habilitado: true` se puede elegir; el resto queda visible pero deshabilitado.
export const TIPOS_PAQUETE = [
  { id: 'box', habilitado: true },
  { id: 'bigbag', habilitado: false },
  { id: 'sack', habilitado: false },
  { id: 'barrel', habilitado: false },
  { id: 'roll', habilitado: false },
  { id: 'pipe', habilitado: false },
  { id: 'bulk', habilitado: false },
];

export const TIPOS_PAQUETE_IDS = TIPOS_PAQUETE.map((t) => t.id);

// Colores para distinguir productos en la lista y en el visor 3D (el nombre se traduce en cub.colores)
export const COLORES = ['#995837', '#123638', '#DDBD62', '#B8D8B8', '#2C6B6E', '#C9774B', '#7FB07F', '#5B7F95'];

// Límites por cubicaje. El diagnóstico público usa los más estrictos (también los aplica el servidor).
export const LIMITES = {
  admin: { productos: 50, cajas: 3000, dimension: 1500, peso: 30000 },
  diagnostico: { productos: 10, cajas: 600, dimension: 1500, peso: 30000 },
};

// Fracción mínima de la base que debe quedar apoyada sobre el piso u otras cajas
export const APOYO_MINIMO = 0.75;
