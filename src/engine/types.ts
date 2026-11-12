// Tipos del motor de Costos y Cubicaje Inteligente. Sin React ni acceso al navegador.
// Unidades canónicas: longitud en mm, masa en g, volumen en cm³ (mm³ en sumas internas).
// Porcentajes como fracción: 19 % = 0.19. Fechas de negocio como 'AAAA-MM-DD'.

export interface Texto {
  es: string;
  en: string;
}

export type TipoOperacion = 'IMPORTACION' | 'EXPORTACION' | 'COMPRA_INTERNACIONAL' | 'VENTA_INTERNACIONAL' | 'ANALISIS_LOGISTICO';
export type Modalidad = 'MARITIMA_FCL' | 'MARITIMA_LCL' | 'AEREA' | 'TERRESTRE' | 'COURIER' | 'MULTIMODAL' | 'POR_EVALUAR';
export type Incoterm = 'EXW' | 'FCA' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';
export type Necesidad = 'CONOCER_COSTO' | 'PRECIO_VENTA' | 'VALIDAR_IMPORTACION' | 'EXPORTAR' | 'CALCULAR_CARGA' | 'COMPARAR_ESCENARIOS';
export type Perspectiva = 'V' | 'C';
export type Rotacion = 'LIBRE' | 'SOLO_BASE' | 'FIJA';
export type Tramo = 'ORIGEN' | 'ADUANA_EXPO' | 'FLETE' | 'SEGURO' | 'DESTINO' | 'ADUANA_IMPO' | 'ENTREGA';
export type Modulo = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type TramoResultado = 'MERCANCIA' | 'ORIGEN' | 'INTERNACIONAL' | 'DESTINO' | 'TRIBUTOS' | 'ENTREGA' | 'SERVICIOS';

export type EstadoRubro = 'INCLUIDO' | 'ESTIMADO' | 'PENDIENTE' | 'NO_APLICA' | 'VALIDACION';
export type OrigenDato = 'INGRESADO' | 'ESTIMACION' | 'TARIFA' | 'POR_CONFIRMAR' | 'TENTATIVA';

// ---------- Transporte internacional tentativo (sin tarifa cargada para la ruta) ----------
export type DistanciaRuta = 'CORTA' | 'MEDIA' | 'LARGA';

export interface TarifaTentativa {
  fcl: Record<string, number>; // USD por contenedor según equipo
  lclWm: number; // USD por W/M
  lclMin: number;
  aereoKg: number; // USD por kg cobrable
  aereoMin: number;
  courierKg: number;
  courierMin: number;
  terrestreKg: number | null; // null: sin conexión terrestre razonable
  transitoDias: { MAR: [number, number]; AIRE: [number, number]; TIERRA: [number, number] };
}

export interface FleteTentativo {
  fuente: string;
  variacion: number; // ± sobre el valor central para el rango
  zonas: Record<string, string>; // país → zona
  rutasMedias: [string, string][]; // pares de zonas a distancia media; el resto entre zonas distintas es larga
  porDistancia: Record<DistanciaRuta, TarifaTentativa>;
  recargosPct: number; // sobre el flete
  documentos: number; // USD por embarque
  fumigacionPorEquipo: number; // USD
  seguro: { tasa: number; primaMinima: number }; // USD, si no hay regla de seguro para la ruta
}

export interface DetalleTentativo {
  distancia: DistanciaRuta;
  unidad: 'EQUIPO' | 'WM' | 'KG';
  cantidad: number;
  equipoId?: string;
  dias: [number, number] | null;
}

export interface Lugar {
  pais: string; // ISO 3166-1 alfa-2
  ciudad: string;
  tipo?: string;
}

export interface Operacion {
  tipo: TipoOperacion;
  origen: Lugar;
  destino: Lugar;
  modalidad: Modalidad;
  incoterm: Incoterm;
  lugarConvenido: string;
  moneda: string;
  valorEstimado: number | null;
  fechaSalida: string | null;
  tipoProducto: string;
  partida: string;
  necesidad: Necesidad;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  paisOrigen: string;
  uso: string;
  cantidad: number;
  unidad: string;
  valorUnitario: number;
  moneda: string;
  empaque: string;
  requisitos: string[];
  certificaciones: string;
  /** Creado desde Cubicaje cuando el usuario solo escribió el nombre (sin pasar por la Etapa 2). */
  desdeCubicaje?: boolean;
}

export interface PalletConfig {
  largoMm: number;
  anchoMm: number;
  altoMm: number;
  pesoG: number;
  alturaMaxMm: number;
}

export interface Manejo {
  fragil: boolean;
  peligroso: boolean;
  claseOnu: string;
  refrigerado: boolean;
  tempMin: number | null;
  tempMax: number | null;
}

export interface ReferenciaCarga {
  id: string;
  nombre: string;
  productoId: string;
  /** Tipo de empaque (caja, saco, tambor…). Solo cambia los textos que ve el usuario. */
  empaque?: string;
  bultos: number;
  unidadesPorBulto: number | null;
  largoMm: number;
  anchoMm: number;
  altoMm: number;
  unidadMedida: 'cm' | 'm' | 'in';
  pesoNetoG: number | null;
  pesoBrutoG: number;
  apilable: boolean;
  /** null = sin límite declarado: se apila hasta donde deje la altura (techo del equipo o del pallet) */
  niveles: number | null;
  rotacion: Rotacion;
  manejo: Manejo;
  paletizar: boolean;
  pallet: PalletConfig;
}

export interface OverrideRubro {
  valor?: number | null; // en la moneda de la simulación
  noAplica?: boolean;
  validacion?: boolean;
  activo?: boolean;
}

export interface RubroOtro {
  id: string;
  modulo: Modulo;
  nombre: string;
  valor: number | null;
}

export interface EntradaHistorial {
  fecha: string;
  rubro: string;
  anterior: number | string | null;
  nuevo: number | string | null;
  motivo?: string;
}

export interface Escenario {
  id: string;
  nombre: string;
  modalidad: Modalidad;
  incoterm: Incoterm;
  equipoId: string | null;
}

export interface Simulacion {
  operacion: Operacion;
  productos: Producto[];
  referencias: ReferenciaCarga[];
  equipoId: string | null; // null = usar el recomendado
  overrides: Record<string, OverrideRubro>;
  otros: RubroOtro[];
  rubrosActivados: string[]; // rubros opcionales que el usuario agregó
  arancelPct: number | null; // tarifa escrita por el usuario si la subpartida no tiene tarifa cargada
  trmUsuario: number | null; // COP por USD
  comisionPct: number | null;
  contingenciaPct: number | null;
  margenObjetivo: number | null;
}

// ---------- Parámetros ----------

export interface Equipo {
  id: string;
  nombre: Texto;
  modalidad: Modalidad;
  largoMm: number;
  anchoMm: number;
  altoMm: number;
  volumenCm3: number;
  cargaMaxG: number;
  reefer: boolean;
  habilitado: boolean;
}

export interface PagoIncoterm {
  ORIGEN: Perspectiva;
  ADUANA_EXPO: Perspectiva;
  FLETE: Perspectiva;
  SEGURO: Perspectiva;
  DESTINO: Perspectiva;
  ADUANA_IMPO: Perspectiva;
  ENTREGA: Perspectiva;
  seguroOpcional?: boolean; // RN-OPE-02
  soloMaritimo?: boolean; // RN-OPE-03
  ayuda: Texto; // RN-OPE-04
}

export type CalculoRubro = 'TARIFA' | 'MERCANCIA' | 'SEGURO' | 'BASE_GRAVABLE' | 'ARANCEL' | 'IVA' | 'OTROS_TRIBUTOS' | 'VISTO_BUENO' | 'CUMPLIMIENTO_DESTINO' | 'HONORARIOS' | 'COMISION' | 'CONTINGENCIA' | 'MANUAL';

export interface RubroCatalogo {
  codigo: string;
  modulo: Modulo;
  nombre: Texto;
  tramo: Tramo | null; // null = siempre a cargo del usuario
  tramoResultado: TramoResultado;
  calculo: CalculoRubro;
  /** obligatorio: se crea siempre y queda Pendiente si no hay tarifa. Si no, solo con tarifa o si el usuario lo agrega. */
  obligatorio: boolean;
  perspectiva?: Perspectiva;
  modalidades?: Modalidad[];
  categorias?: string[]; // se crea solo con estas categorías de producto
  informativo?: boolean; // tiene valor pero no suma al total (E01)
}

export type UnidadTarifa = 'FIJO' | 'POR_EQUIPO' | 'POR_WM' | 'POR_KG' | 'POR_PALLET' | 'PORCENTAJE';

export interface Tarifa {
  id: string;
  rubro: string;
  origen: { pais: string; ciudad?: string };
  destino: { pais: string; ciudad?: string };
  modalidades: Modalidad[];
  equipoId?: string;
  unidad: UnidadTarifa;
  valor: number; // valor en moneda, o fracción si unidad = PORCENTAJE
  base?: 'FOB' | 'CIF' | 'EXW'; // RN-COS-06
  minimo?: number;
  moneda: string;
  proveedor: string;
  fuente: string;
  vigenteDesde: string;
  vigenteHasta: string;
  requiereValidacion?: boolean;
}

export interface ReglaSeguro {
  id: string;
  origenPais?: string;
  destinoPais?: string;
  tasa: number;
  primaMinima: number;
  moneda: string;
  fuente: string;
}

export interface GastoImportacion {
  id: string;
  rubro: string; // código del catálogo al que pertenece
  nombre: Texto;
  minimo: number;
  monedaMinimo: string;
  porcentaje: number; // fracción sobre CIF
  ciudades?: string[];
  ivaServicio?: boolean; // genera una línea de IVA sobre el servicio
  porConfirmar?: boolean;
  principal?: boolean; // false: no sustituye al rubro obligatorio (default true)
}

export interface ReglaTributaria {
  subpartida: string;
  arancel: number;
  iva: number;
  especificoPorKg?: number;
  otros?: { nombre: string; tipo: 'PORCENTAJE' | 'ESPECIFICO'; valor: number }[];
}

export interface ReglaAlerta {
  id: string;
  categorias?: string[];
  requisitos?: string[];
  perspectiva?: Perspectiva;
  paisDestino?: string;
  entidad: string;
  categoriaTexto: Texto;
  requisito: Texto;
  cumplimiento: boolean; // crea rubro de vistos buenos (RN-PRO-05)
}

export interface Parametros {
  version: string;
  algoritmo: string;
  equipos: Equipo[];
  palletEstandar: PalletConfig;
  pesoMaxCargaPalletG: number;
  factorAereoCm3Kg: number;
  factorCourierCm3Kg: number;
  factorEstiba: number;
  umbralLcl: number | null;
  umbralPaletizacionLcl: number;
  kgALibra: number;
  matrizIncoterms: Record<Incoterm, PagoIncoterm>;
  perspectivas: Record<TipoOperacion, Perspectiva>;
  rubros: RubroCatalogo[];
  tarifas: Tarifa[];
  reglasSeguro: ReglaSeguro[];
  gastosImportacion: { paisDestino: string; modalidades: Modalidad[]; items: GastoImportacion[] };
  fx: { copPorUnidad: Record<string, number>; aduaneraCopPorUsd: number | null; fecha: string; fuente: string };
  iva: { general: number; ivaServicios: number };
  reglasTributarias: ReglaTributaria[];
  tributosPaisModelado: string;
  honorarios: { tipo: 'FIJO'; valor: number; moneda: string } | { tipo: 'PORCENTAJE'; valor: number };
  reglasAlerta: ReglaAlerta[];
  fronterasTerrestres: [string, string][];
  fleteTentativo?: FleteTentativo;
  textosLegales: { cubicaje: Texto; tributos: Texto; resultado: Texto; datos: Texto };
}

// ---------- Resultados de cubicaje ----------

export interface GrupoPallet {
  cantidad: number;
  bultos: number; // por pallet
  capas: number;
  alturaMm: number;
  pesoG: number; // por pallet, con la tarima
}

export interface NoUbicado {
  referenciaId: string;
  nombre: string;
  cantidad: number;
  motivo: 'ESPACIO' | 'PESO' | 'DIMENSION' | 'PALLET' | 'REEFER';
}

export interface CalculoReferencia {
  referenciaId: string;
  nombre: string;
  paletizada: boolean;
  volumenBultoMm3: number;
  volumenSueltoMm3: number;
  pesoBrutoG: number;
  bultosPorCapa: number;
  capasPorPallet: number;
  bultosPorPallet: number;
  pallets: GrupoPallet[];
  numPallets: number;
  bultosEnPallet: number;
  volumenCargaMm3: number; // real de cada pallet, o suelto
  pesoCargaG: number;
  sinPallet: number; // bultos que no pudieron paletizarse
}

export interface CalculoCubicaje {
  referencias: CalculoReferencia[];
  volumenSueltoCm3: number;
  volumenCargaCm3: number;
  pesoBrutoG: number;
  pesoCargaG: number;
  totalPallets: number;
  totalBultos: number;
  hayPaletizacion: boolean;
}

export interface BasesCobro {
  aereoVolumetricoKg: number;
  aereoCobrableKg: number;
  courierVolumetricoKg: number;
  courierCobrableKg: number;
  wmSuelto: number;
  wmCarga: number;
}

export interface EvaluacionEquipo {
  equipoId: string;
  factible: boolean;
  posicionesPiso: number;
  posicionesUsadas: number;
  ocupacionVolumen: number;
  ocupacionPeso: number;
  cantidadRequerida: number | null;
  noUbicados: NoUbicado[];
}

export interface SeleccionEquipo {
  equipoId: string;
  cantidad: number;
  recomendado: boolean;
}

export interface BloqueCarga {
  referenciaId: string;
  x: number;
  y: number; // altura desde el piso
  z: number;
  dx: number;
  dy: number;
  dz: number;
  orden: number;
}

export interface OpcionComparativo {
  id: 'LCL_SUELTO' | 'LCL_PALETIZADO' | 'FCL' | 'AEREO' | 'TERRESTRE';
  base: number | null;
  unidad: 'WM' | 'KG' | 'EQUIPO' | null;
  equipoId?: string;
  ocupacion?: number;
}

// ---------- Resultados de costos ----------

export interface LineaCosto {
  id: string;
  codigo: string;
  modulo: Modulo;
  nombre: Texto;
  tramoResultado: TramoResultado;
  valor: number | null; // moneda de la simulación, sin redondear
  valorOriginal: number | null;
  monedaOriginal: string;
  tasa: number;
  estado: EstadoRubro;
  origen: OrigenDato;
  valorEstimado: number | null; // conservado si el usuario lo sobrescribe (RN-COS-03)
  sobrescrito: boolean;
  activo: boolean;
  informativo: boolean;
  suma: boolean;
  pagador: Perspectiva | null;
  fuente?: string;
  vigenteHasta?: string;
  tarifaId?: string;
  alternativas?: string[];
  rango?: [number, number];
  tentativo?: DetalleTentativo;
}

export interface ResumenTramo {
  tramo: TramoResultado;
  valor: number;
  aplica: boolean;
  pendiente: boolean;
  tentativo: boolean;
}

export interface Rentabilidad {
  total: number;
  parcial: boolean;
  faltantes: LineaCosto[];
  costoUnidad: number | null;
  costoKgNeto: number | null;
  costoKgBruto: number | null;
  costoLibra: number | null;
  costoM3: number | null;
  mostrarPrecio: boolean;
  precioSugerido: number | null;
  utilidad: number | null;
  margen: number | null;
}

export type TipoAlerta = 'BLOQUEANTE' | 'REGULATORIA' | 'COSTO' | 'DATOS';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  prioridad: 1 | 2 | 3 | 4;
  impactoUsd: number;
  texto: Texto;
}

export interface ResultadoSimulacion {
  fecha: string;
  moneda: string;
  tasaReferencia: number;
  fuenteTasa: string;
  modalidadEfectiva: Modalidad;
  perspectiva: Perspectiva;
  cubicaje: CalculoCubicaje;
  bases: BasesCobro;
  equipos: EvaluacionEquipo[];
  seleccion: SeleccionEquipo | null;
  noUbicados: NoUbicado[];
  bloques: BloqueCarga[];
  comparativo: OpcionComparativo[];
  lineas: LineaCosto[];
  subtotales: Record<Modulo, number>;
  tramos: ResumenTramo[];
  rentabilidad: Rentabilidad;
  completitud: number;
  alertas: Alerta[];
  vigenciaMinima: string | null;
  versionParametros: string;
  versionAlgoritmo: string;
}
