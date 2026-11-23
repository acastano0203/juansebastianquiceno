// Datos de la Academia (Curso de Exportación de Café). Todo lo que cambia con el negocio vive aquí.
// Fuente: diseño "Academia · Acceso Internacional" y documento "Academia — Contenido web del Curso".

export const RUTAS_ACADEMIA = {
  inicio: '/academia',
  masterclass: '/academia/masterclass',
  gracias: '/academia/gracias',
  inscripcion: '/academia/inscripcion',
};

// TODO: completar antes de publicar (lista "Datos que faltan" del documento de contenido)
export const ENLACES_ACADEMIA = {
  /** Checkout del plan pregrabado en Hotmart. Vacío = el botón lleva a WhatsApp. */
  hotmart: '',
  /** Invitación al grupo de WhatsApp de la Academia. Vacío = se escribe al asesor. */
  grupoWhatsApp: '',
  /** PDF del checklist de documentos para exportar. Vacío = botón inactivo con aviso. */
  checklistPdf: '',
  /** Video embebible de la masterclass (YouTube/Vimeo "embed"). Vacío = reproductor de muestra. */
  videoMasterclass: '',
  /** Video de 60 a 90 s de la inmersión en finca y trilladora. */
  videoInmersion: '',
};

// TODO: fecha de la próxima cohorte (AAAA-MM-DD) y cupos. null = se muestra "cupos limitados".
export const COHORTE = { inicio: null, cupos: null };

export const MODULOS = [
  { n: '01', clave: 'm1' },
  { n: '02', clave: 'm2' },
  { n: '03', clave: 'm3' },
  { n: '04', clave: 'm4' },
  { n: '05', clave: 'm5' },
  { n: '06', clave: 'm6' },
  { n: '07', clave: 'm7' },
];

/**
 * Planes. precio = null → "por definir". TODO: precio del pregrabado y una sola cifra oficial del PRO
 * (el PDF trae COP 9.850.000 y USD 2.800).
 */
export const PLANES = [
  { id: 'pregrabado', precio: null, moneda: 'COP', accion: 'hotmart' },
  { id: 'pro', precio: 9_850_000, moneda: 'COP', precioUsd: 2_800, accion: 'agendar', destacado: true },
  { id: 'vivo', precio: 3_500_000, moneda: 'COP', accion: 'agendar' },
];

// Filas de la tabla comparativa: [clave del texto, pregrabado, personalizado, pro]
export const COMPARATIVA = [
  ['hotmart', true, false, false],
  ['grabados', true, false, false],
  ['formatos', true, true, true],
  ['sesiones', false, true, true],
  ['acompanamiento', false, true, true],
  ['ventas', false, true, true],
  ['inmersiones', false, true, true],
  ['cafe', false, false, true],
  ['compradores', false, false, true],
  ['tostador', false, false, true],
];

/**
 * Regla de recomendación del documento: con café pero sin haber exportado → PRO;
 * ya exportó o es empresa con equipo → Personalizado; quiere ir a su ritmo → Pregrabado.
 */
export function recomendarPlan({ ritmo, tieneCafe, exporto, perfil } = {}) {
  if (ritmo === 'SOLO') return 'pregrabado';
  const empresa = ['Cooperativa', 'Comercializador', 'Tostador'].includes(perfil);
  if (exporto === 'Sí' || exporto === true || empresa) return 'vivo';
  if (tieneCafe === false) return 'vivo';
  return 'pro';
}

// Testimonios reales con números. Mientras esté vacío, la sección no se muestra (regla del documento).
export const TESTIMONIOS = [];

// Ficha del café del plan PRO
export const FICHA_PRO = ['variedad', 'altura', 'fermentacion', 'grano', 'catacion'];

// Calculadora de la portada: referencia rápida, no es una oferta
export const CALCULADORA = {
  bolsa: { min: 150, max: 500, paso: 5, inicial: 380 },
  diferencial: { min: -20, max: 100, paso: 5, inicial: 35 },
  kgSaco: 70,
  lbPorKg: 2.20462,
};
