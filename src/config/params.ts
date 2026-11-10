// Parámetros de cálculo. Todo valor que cambia con el mercado o la política comercial vive aquí, nunca en el motor.
// RN-ADM: en esta fase (solo frontend) es un archivo versionado; luego será parameter_versions con vigencias.
//
// ⚠ Este archivo termina en el JS público del sitio: cualquiera puede leer estos valores.
// Valores marcados DEMO son de prueba (sección 16 y decisión 11 de las reglas), no tarifas reales.

import type { Parametros, RubroCatalogo, Modalidad } from '../engine/types';

const MARITIMAS: Modalidad[] = ['MARITIMA_FCL', 'MARITIMA_LCL', 'MULTIMODAL'];
const FCL: Modalidad[] = ['MARITIMA_FCL', 'MULTIMODAL'];

function r(codigo: string, modulo: RubroCatalogo['modulo'], es: string, en: string, tramo: RubroCatalogo['tramo'], tramoResultado: RubroCatalogo['tramoResultado'], extra: Partial<RubroCatalogo> = {}): RubroCatalogo {
  return { codigo, modulo, nombre: { es, en }, tramo, tramoResultado, calculo: 'TARIFA', obligatorio: false, ...extra };
}

const rubros: RubroCatalogo[] = [
  // A. Mercancía
  r('A01', 'A', 'Valor de la mercancía según Incoterm', 'Goods value per Incoterm', null, 'MERCANCIA', { calculo: 'MERCANCIA', obligatorio: true }),
  r('A02', 'A', 'Empaque y preparación', 'Packing and preparation', null, 'MERCANCIA'),
  r('A03', 'A', 'Inspección o acondicionamiento', 'Inspection or conditioning', null, 'MERCANCIA'),
  // B. Origen
  r('B01', 'B', 'Recogida', 'Pickup', 'ORIGEN', 'ORIGEN'),
  r('B02', 'B', 'Transporte interno', 'Inland transport', 'ORIGEN', 'ORIGEN', { obligatorio: true }),
  r('B03', 'B', 'Cargue', 'Loading', 'ORIGEN', 'ORIGEN', { obligatorio: true }),
  r('B04', 'B', 'Almacenamiento', 'Storage', 'ORIGEN', 'ORIGEN'),
  r('B05', 'B', 'Manejo', 'Handling', 'ORIGEN', 'ORIGEN'),
  r('B06', 'B', 'Documentación', 'Documentation', 'ADUANA_EXPO', 'ORIGEN', { obligatorio: true }),
  r('B07', 'B', 'Agencia de carga', 'Freight forwarder', 'ORIGEN', 'ORIGEN'),
  r('B08', 'B', 'Certificados', 'Certificates', 'ADUANA_EXPO', 'ORIGEN'),
  r('B09', 'B', 'Vistos buenos', 'Permits and approvals', 'ADUANA_EXPO', 'ORIGEN', { calculo: 'VISTO_BUENO', perspectiva: 'V' }),
  r('B10', 'B', 'Aduana de exportación', 'Export customs', 'ADUANA_EXPO', 'ORIGEN', { obligatorio: true }),
  r('B11', 'B', 'Seguro local', 'Local insurance', 'ORIGEN', 'ORIGEN'),
  r('B12', 'B', 'Otros en origen', 'Other origin charges', 'ORIGEN', 'ORIGEN'),
  // C. Internacional
  r('C01', 'C', 'Flete internacional', 'International freight', 'FLETE', 'INTERNACIONAL', { obligatorio: true }),
  r('C02', 'C', 'Recargos', 'Surcharges', 'FLETE', 'INTERNACIONAL', { obligatorio: true }),
  r('C03', 'C', 'Combustible', 'Fuel', 'FLETE', 'INTERNACIONAL'),
  r('C04', 'C', 'Seguridad', 'Security', 'FLETE', 'INTERNACIONAL'),
  r('C05', 'C', 'Manejo naviera o aerolínea', 'Carrier handling', 'FLETE', 'INTERNACIONAL'),
  r('C06', 'C', 'Seguro internacional (110 % del CIF)', 'International insurance (110% of CIF)', 'SEGURO', 'INTERNACIONAL', { calculo: 'SEGURO', obligatorio: true }),
  r('C07', 'C', 'Documentos', 'Documents', 'FLETE', 'INTERNACIONAL', { obligatorio: true }),
  r('C08', 'C', 'Servicios especiales: fumigación de contenedor', 'Special services: container fumigation', 'FLETE', 'INTERNACIONAL', { obligatorio: true, modalidades: FCL, categorias: ['ALIMENTOS', 'VEGETAL_ANIMAL'] }),
  // D. Destino
  r('D01', 'D', 'Gastos portuarios o aeroportuarios', 'Port or airport charges', 'DESTINO', 'DESTINO', { obligatorio: true }),
  r('D02', 'D', 'Desconsolidación', 'Deconsolidation', 'DESTINO', 'DESTINO', { modalidades: ['MARITIMA_LCL'], obligatorio: true }),
  r('D03', 'D', 'Manejo', 'Handling', 'DESTINO', 'DESTINO'),
  r('D04', 'D', 'Almacenamiento', 'Storage', 'DESTINO', 'DESTINO'),
  r('D05', 'D', 'Liberación documental', 'Document release', 'DESTINO', 'DESTINO', { obligatorio: true }),
  r('D06', 'D', 'Agencia de aduanas', 'Customs broker', 'ADUANA_IMPO', 'DESTINO', { obligatorio: true }),
  r('D07', 'D', 'Transporte interno', 'Inland transport', 'ENTREGA', 'ENTREGA', { obligatorio: true }),
  r('D08', 'D', 'Última milla', 'Last mile', 'ENTREGA', 'ENTREGA'),
  r('D09', 'D', 'Inspecciones', 'Inspections', 'ADUANA_IMPO', 'DESTINO'),
  r('D10', 'D', 'Demoras o contingencias', 'Delays or contingencies', 'DESTINO', 'DESTINO'),
  r('D11', 'D', 'Costos financieros y cambiarios', 'Financial and FX costs', 'ADUANA_IMPO', 'DESTINO'),
  // E. Tributos y cumplimiento
  r('E01', 'E', 'Base gravable (informativa)', 'Customs value (informative)', 'ADUANA_IMPO', 'TRIBUTOS', { calculo: 'BASE_GRAVABLE', obligatorio: true, informativo: true }),
  r('E02', 'E', 'Arancel', 'Import duty', 'ADUANA_IMPO', 'TRIBUTOS', { calculo: 'ARANCEL', obligatorio: true }),
  r('E03', 'E', 'IVA de importación', 'Import VAT', 'ADUANA_IMPO', 'TRIBUTOS', { calculo: 'IVA', obligatorio: true }),
  r('E04', 'E', 'Otros tributos', 'Other taxes', 'ADUANA_IMPO', 'TRIBUTOS', { calculo: 'OTROS_TRIBUTOS', perspectiva: 'C' }),
  r('E05', 'E', 'Vistos buenos de importación', 'Import permits', 'ADUANA_IMPO', 'TRIBUTOS', { calculo: 'VISTO_BUENO', perspectiva: 'C' }),
  r('E06', 'E', 'Certificaciones o ensayos', 'Certifications or testing', 'ADUANA_EXPO', 'TRIBUTOS'),
  r('E07', 'E', 'Derechos y trámites de exportación', 'Export duties and procedures', 'ADUANA_EXPO', 'TRIBUTOS', { perspectiva: 'V' }),
  r('E08', 'E', 'Adecuación de producto o empaque', 'Product or packaging adaptation', 'ADUANA_EXPO', 'TRIBUTOS', { perspectiva: 'V' }),
  r('E09', 'E', 'Documentos de cumplimiento en destino', 'Destination compliance documents', 'ADUANA_EXPO', 'TRIBUTOS', { calculo: 'CUMPLIMIENTO_DESTINO', perspectiva: 'V' }),
  // F. Servicios
  r('F01', 'F', 'Honorarios Acceso Internacional', 'Acceso Internacional fees', null, 'SERVICIOS', { calculo: 'HONORARIOS', obligatorio: true }),
  r('F02', 'F', 'Comisión comercial', 'Sales commission', null, 'SERVICIOS', { calculo: 'COMISION' }),
  r('F03', 'F', 'Contingencia', 'Contingency', null, 'SERVICIOS', { calculo: 'CONTINGENCIA' }),
];

// Tarifas de prueba de la ruta del caso de aceptación. DEMO: ilustrativas según la sección 16.
const demo = (id: string, rubro: string, valor: number, extra: Partial<Parametros['tarifas'][number]> = {}): Parametros['tarifas'][number] => ({
  id,
  rubro,
  origen: { pais: 'CO' },
  destino: { pais: 'US', ciudad: 'Miami' },
  modalidades: ['MARITIMA_FCL'],
  equipoId: '20',
  unidad: 'FIJO',
  valor,
  moneda: 'USD',
  proveedor: 'Tarifa de prueba',
  fuente: 'Caso ilustrativo (reglas de negocio, sección 16)',
  vigenteDesde: '2026-11-01',
  vigenteHasta: '2027-06-30',
  ...extra,
});

export const PARAMS: Parametros = {
  version: 'semilla-2026-11-09',
  algoritmo: 'analitico-1',

  equipos: [
    { id: '20', nombre: { es: "20' estándar", en: "20' standard" }, modalidad: 'MARITIMA_FCL', largoMm: 5890, anchoMm: 2350, altoMm: 2390, volumenCm3: 33_100_000, cargaMaxG: 28_200_000, reefer: false, habilitado: true },
    { id: '40', nombre: { es: "40' estándar", en: "40' standard" }, modalidad: 'MARITIMA_FCL', largoMm: 12030, anchoMm: 2350, altoMm: 2390, volumenCm3: 67_600_000, cargaMaxG: 26_700_000, reefer: false, habilitado: true },
    { id: '40HC', nombre: { es: "40' High Cube", en: "40' High Cube" }, modalidad: 'MARITIMA_FCL', largoMm: 12030, anchoMm: 2350, altoMm: 2690, volumenCm3: 76_000_000, cargaMaxG: 26_500_000, reefer: false, habilitado: true },
    // Decisión 10: deshabilitados hasta cargar datos
    { id: 'REEFER', nombre: { es: 'Reefer', en: 'Reefer' }, modalidad: 'MARITIMA_FCL', largoMm: 0, anchoMm: 0, altoMm: 0, volumenCm3: 0, cargaMaxG: 0, reefer: true, habilitado: false },
  ],

  palletEstandar: { largoMm: 1200, anchoMm: 1000, altoMm: 150, pesoG: 25_000, alturaMaxMm: 1600 },
  pesoMaxCargaPalletG: 1_500_000, // Supuesto: las reglas no fijan valor (RN-CUB-04)
  factorAereoCm3Kg: 6000,
  factorCourierCm3Kg: 5000,
  factorEstiba: 1.0, // Decisión 4
  umbralLcl: null, // Decisión 4: alerta desactivada hasta definir
  umbralPaletizacionLcl: 0.2, // Supuesto: las reglas no fijan valor (RN-CUB-11)
  kgALibra: 2.20462,

  perspectivas: {
    IMPORTACION: 'C',
    COMPRA_INTERNACIONAL: 'C',
    EXPORTACION: 'V',
    VENTA_INTERNACIONAL: 'V',
    ANALISIS_LOGISTICO: 'C', // Supuesto: las reglas no definen la perspectiva del análisis
  },

  // RN-OPE-01: quién paga cada tramo. V = vendedor, C = comprador.
  // CIF y CIP cubren el seguro principal; en CFR, CPT y DAP es opcional para el vendedor (RN-OPE-02).
  matrizIncoterms: {
    EXW: { ORIGEN: 'C', ADUANA_EXPO: 'C', FLETE: 'C', SEGURO: 'C', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', ayuda: { es: 'El comprador contrata el transporte y el seguro. El riesgo pasa cuando la carga queda disponible en origen.', en: 'The buyer arranges transport and insurance. Risk passes when the cargo is made available at origin.' } },
    FCA: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'C', SEGURO: 'C', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', ayuda: { es: 'El comprador contrata el transporte principal y el seguro. El riesgo pasa en el lugar convenido.', en: 'The buyer arranges main carriage and insurance. Risk passes at the named place.' } },
    FOB: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'C', SEGURO: 'C', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', soloMaritimo: true, ayuda: { es: 'El comprador contrata el flete y el seguro. El riesgo pasa a bordo en el puerto de embarque.', en: 'The buyer arranges freight and insurance. Risk passes on board at the port of shipment.' } },
    CFR: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'C', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', seguroOpcional: true, soloMaritimo: true, ayuda: { es: 'El vendedor contrata el flete; el comprador asegura. El riesgo pasa a bordo en el puerto de embarque.', en: 'The seller arranges freight; the buyer insures. Risk passes on board at the port of shipment.' } },
    CIF: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'V', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', soloMaritimo: true, ayuda: { es: 'El vendedor paga flete y seguro (mínimo ICC C, 110 %) hasta el puerto de destino. El riesgo pasa a bordo en el puerto de embarque.', en: 'The seller pays freight and insurance (minimum ICC C, 110%) to the destination port. Risk passes on board at the port of shipment.' } },
    CPT: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'C', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', seguroOpcional: true, ayuda: { es: 'El vendedor contrata el transporte; el comprador asegura. El riesgo pasa al entregar al primer transportador.', en: 'The seller arranges carriage; the buyer insures. Risk passes on handover to the first carrier.' } },
    CIP: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'V', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'C', ayuda: { es: 'El vendedor paga transporte y seguro (mínimo ICC A, 110 %). El riesgo pasa al entregar al primer transportador.', en: 'The seller pays carriage and insurance (minimum ICC A, 110%). Risk passes on handover to the first carrier.' } },
    DAP: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'V', DESTINO: 'C', ADUANA_IMPO: 'C', ENTREGA: 'V', seguroOpcional: true, ayuda: { es: 'El vendedor contrata el transporte y asume el riesgo hasta el lugar convenido, sin descargar.', en: 'The seller arranges transport and bears the risk to the named place, not unloaded.' } },
    DPU: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'V', DESTINO: 'V', ADUANA_IMPO: 'C', ENTREGA: 'V', ayuda: { es: 'El vendedor contrata el transporte, asume el riesgo y descarga en el lugar convenido.', en: 'The seller arranges transport, bears the risk and unloads at the named place.' } },
    DDP: { ORIGEN: 'V', ADUANA_EXPO: 'V', FLETE: 'V', SEGURO: 'V', DESTINO: 'V', ADUANA_IMPO: 'V', ENTREGA: 'V', ayuda: { es: 'El vendedor asume transporte, riesgo, aduana y tributos de importación hasta el lugar convenido.', en: 'The seller bears transport, risk, customs and import taxes to the named place.' } },
  },

  rubros,

  tarifas: [
    // DEMO: B suma 1.850; C suma 2.250 + seguro 175 = 2.425; E09 = 320 (sección 16)
    demo('demo-b02', 'B02', 900),
    demo('demo-b03', 'B03', 150),
    demo('demo-b05', 'B05', 200),
    demo('demo-b06', 'B06', 100),
    demo('demo-b07', 'B07', 200),
    demo('demo-b10', 'B10', 300),
    demo('demo-c01', 'C01', 1900, { unidad: 'POR_EQUIPO' }),
    demo('demo-c02', 'C02', 260, { unidad: 'POR_EQUIPO' }),
    demo('demo-c07', 'C07', 90),
    demo('demo-e09', 'E09', 320, { equipoId: undefined, modalidades: ['MARITIMA_FCL', 'MARITIMA_LCL', 'AEREA', 'COURIER', 'MULTIMODAL'], requiereValidacion: true }),
  ],

  reglasSeguro: [
    // Semilla del Documento de Reglas de Negocio (0,4549 %, mínimo USD 190), aplicada con la fórmula RN-COS-05
    { id: 'importacion-co', destinoPais: 'CO', tasa: 0.004549, primaMinima: 190, moneda: 'USD', fuente: 'Documento de Reglas de Negocio · 2.1' },
    // DEMO: tasa y mínimo para que la ruta del caso dé los USD 175 de la sección 16
    { id: 'demo-co-us', origenPais: 'CO', destinoPais: 'US', tasa: 0.002, primaMinima: 175, moneda: 'USD', fuente: 'Caso ilustrativo (reglas de negocio, sección 16)' },
  ],

  // Documento de Reglas de Negocio, secciones 2.3 a 2.5: máx(mínimo, % × CIF)
  gastosImportacion: {
    paisDestino: 'CO',
    modalidades: MARITIMAS,
    items: [
      { id: 'D01-INST', rubro: 'D01', nombre: { es: 'Uso de instalaciones portuarias', en: 'Port facilities' }, minimo: 78.69, monedaMinimo: 'USD', porcentaje: 0.001549 },
      { id: 'D01-PLAN', rubro: 'D01', nombre: { es: 'Planilla de recepción en terminal', en: 'Terminal receipt form' }, minimo: 23.55, monedaMinimo: 'USD', porcentaje: 0.001449 },
      { id: 'D03-PESO', rubro: 'D03', nombre: { es: 'Pesaje y repesaje', en: 'Weighing and reweighing' }, minimo: 100.73, monedaMinimo: 'USD', porcentaje: 0.001449 },
      { id: 'D03-ACI', rubro: 'D03', nombre: { es: 'Coordinación y manejo del agente de carga', en: 'Forwarder coordination and handling' }, minimo: 60, monedaMinimo: 'USD', porcentaje: 0.001049 },
      { id: 'D04-BOD', rubro: 'D04', nombre: { es: 'Bodegaje portuario', en: 'Port storage' }, minimo: 402.9, monedaMinimo: 'USD', porcentaje: 0.006449 },
      { id: 'D05-ACI', rubro: 'D05', nombre: { es: 'Liberación en destino (agente de carga)', en: 'Release at destination (forwarder)' }, minimo: 380, monedaMinimo: 'USD', porcentaje: 0.004449 },
      { id: 'D06-DEC', rubro: 'D06', nombre: { es: 'Transmisión de declaración de importación y DAV', en: 'Import declaration and DAV filing' }, minimo: 82.69, monedaMinimo: 'USD', porcentaje: 0.001349 },
      { id: 'D06-OPE', rubro: 'D06', nombre: { es: 'Servicios operativos de agencia en destino', en: 'Agency operating services at destination' }, minimo: 206.73, monedaMinimo: 'USD', porcentaje: 0.001849 },
      // El documento fuente da "USD 5.730,61" como referencia de COP 1.850.000; es inconsistente, prevalece el valor en COP
      { id: 'D06-COM', rubro: 'D06', nombre: { es: 'Comisión de agencia de aduanas', en: 'Customs broker commission' }, minimo: 1_850_000, monedaMinimo: 'COP', porcentaje: 0.005, ivaServicio: true },
      { id: 'D07-CTG', rubro: 'D07', nombre: { es: 'Transporte local puerto → zona de entrega (Cartagena)', en: 'Local transport port → delivery zone (Cartagena)' }, minimo: 1854.18, monedaMinimo: 'USD', porcentaje: 0.001849, ciudades: ['Cartagena'] },
      { id: 'D07-POL', rubro: 'D07', nombre: { es: 'Póliza de mercancía nacionalizada (tramo local)', en: 'Cleared goods policy (local leg)' }, minimo: 689.09, monedaMinimo: 'USD', porcentaje: 0.001849, principal: false },
      { id: 'D09-MOV', rubro: 'D09', nombre: { es: 'Movimiento de inspección antinarcóticos', en: 'Anti-narcotics inspection handling' }, minimo: 237.41, monedaMinimo: 'USD', porcentaje: 0.007449 },
      { id: 'D09-AFO', rubro: 'D09', nombre: { es: 'Aforo físico PONAL / DIAN', en: 'Physical inspection PONAL / DIAN' }, minimo: 56.03, monedaMinimo: 'USD', porcentaje: 0.003449 },
      { id: 'D11-FIN', rubro: 'D11', nombre: { es: 'Costo financiero y cambiario (IMC y GMF)', en: 'Financial and FX cost' }, minimo: 0, monedaMinimo: 'USD', porcentaje: 0.004, porConfirmar: true },
    ],
  },

  fx: {
    // TRM semilla implícita en el documento fuente (COP 1.850.000 ÷ USD 573,06). EUR: placeholder de demostración.
    copPorUnidad: { COP: 1, USD: 3228.3, EUR: 3500 },
    aduaneraCopPorUsd: null, // RN-TRI-01: por defecto toma la TRM
    fecha: '2026-11-09',
    fuente: 'Valor semilla · pendiente de validar',
  },

  iva: { general: 0.19, ivaServicios: 0.19 },
  // Fase 2: arancel por subpartida. Sin tabla, el arancel queda Pendiente o lo escribe el usuario (RN-OPE-07, RN-TRI-03).
  reglasTributarias: [],
  tributosPaisModelado: 'CO',

  honorarios: { tipo: 'FIJO', valor: 900, moneda: 'USD' }, // DEMO: sección 16

  // RN-PRO-06: tabla de la sección 5 de las reglas
  reglasAlerta: [
    { id: 'alimentos-import-co', categorias: ['ALIMENTOS', 'BEBIDAS'], requisitos: ['ALIMENTOS'], perspectiva: 'C', paisDestino: 'CO', entidad: 'INVIMA', categoriaTexto: { es: 'Carga de alimentos o bebidas', en: 'Food or beverage cargo' }, requisito: { es: 'registro, permiso o notificación sanitaria', en: 'a sanitary registration, permit or notification' }, cumplimiento: true },
    { id: 'alimentos-export-us', categorias: ['ALIMENTOS', 'BEBIDAS'], requisitos: ['ALIMENTOS'], perspectiva: 'V', paisDestino: 'US', entidad: 'FDA', categoriaTexto: { es: 'Carga de alimentos', en: 'Food cargo' }, requisito: { es: 'registro de instalación y aviso previo', en: 'facility registration and prior notice' }, cumplimiento: true },
    { id: 'vegetal-animal', categorias: ['VEGETAL_ANIMAL'], entidad: 'ICA', categoriaTexto: { es: 'Producto de origen vegetal o animal', en: 'A plant or animal product' }, requisito: { es: 'certificado fito o zoosanitario', en: 'a phytosanitary or zoosanitary certificate' }, cumplimiento: true },
    { id: 'cosmeticos-import', categorias: ['COSMETICOS'], requisitos: ['COSMETICOS'], perspectiva: 'C', entidad: 'INVIMA', categoriaTexto: { es: 'Producto cosmético', en: 'A cosmetic product' }, requisito: { es: 'notificación sanitaria obligatoria', en: 'a mandatory sanitary notification' }, cumplimiento: true },
    { id: 'electrico-import', categorias: ['ELECTRICO'], requisitos: ['ELECTRICO'], perspectiva: 'C', entidad: 'RETIE, SIC', categoriaTexto: { es: 'Producto eléctrico', en: 'An electrical product' }, requisito: { es: 'reglamento técnico y certificado de conformidad', en: 'a technical regulation and certificate of conformity' }, cumplimiento: true },
    { id: 'maquinaria-import', categorias: ['MAQUINARIA', 'USADOS'], requisitos: ['MAQUINARIA'], perspectiva: 'C', entidad: 'VUCE / MinCIT', categoriaTexto: { es: 'Maquinaria o bien usado', en: 'Machinery or used goods' }, requisito: { es: 'registro o licencia de importación', en: 'an import registration or license' }, cumplimiento: true },
    { id: 'peligroso', requisitos: ['PELIGROSO'], entidad: 'MinTransporte y transportador', categoriaTexto: { es: 'Carga peligrosa', en: 'Dangerous goods' }, requisito: { es: 'clase ONU, embalaje homologado y declaración de mercancía peligrosa', en: 'a UN class, approved packaging and a dangerous goods declaration' }, cumplimiento: true },
    { id: 'refrigerado', requisitos: ['REFRIGERADO', 'PERECEDERO'], entidad: 'transportador', categoriaTexto: { es: 'Carga refrigerada o perecedera', en: 'Refrigerated or perishable cargo' }, requisito: { es: 'equipo reefer o aéreo', en: 'reefer or air equipment' }, cumplimiento: false },
    { id: 'alto-valor', requisitos: ['ALTO_VALOR'], entidad: 'aseguradora', categoriaTexto: { es: 'Carga de alto valor', en: 'High-value cargo' }, requisito: { es: 'seguro de carga aunque el Incoterm no lo exija', en: 'cargo insurance even if the Incoterm does not call for it' }, cumplimiento: false },
    { id: 'dian-clasificacion', perspectiva: 'C', paisDestino: 'CO', entidad: 'DIAN', categoriaTexto: { es: 'Toda importación', en: 'Any import' }, requisito: { es: 'validar la subpartida, que determina arancel e IVA,', en: 'validation of the tariff code, which determines duty and VAT,' }, cumplimiento: false },
  ],

  // SUPUESTO SEMILLA: valores aproximados de mercado para dar una tentativa cuando la ruta no tiene
  // tarifa cargada. No son cotizaciones: deben calibrarse con cotizaciones reales del agente de carga.
  fleteTentativo: {
    fuente: 'Tentativa del simulador (supuesto semilla por calibrar)',
    variacion: 0.3,
    zonas: {
      AR: 'SUR', BO: 'SUR', BR: 'SUR', CL: 'SUR', CO: 'SUR', EC: 'SUR', PE: 'SUR', PY: 'SUR', UY: 'SUR', VE: 'SUR',
      CR: 'CENTRO', DO: 'CENTRO', GT: 'CENTRO', HN: 'CENTRO', MX: 'CENTRO', PA: 'CENTRO', SV: 'CENTRO',
      US: 'NORTE', CA: 'NORTE',
      AT: 'EUROPA', BE: 'EUROPA', CH: 'EUROPA', CZ: 'EUROPA', DE: 'EUROPA', DK: 'EUROPA', ES: 'EUROPA', FI: 'EUROPA', FR: 'EUROPA', GB: 'EUROPA', GR: 'EUROPA', IE: 'EUROPA', IT: 'EUROPA', NL: 'EUROPA', NO: 'EUROPA', PL: 'EUROPA', PT: 'EUROPA', RO: 'EUROPA', SE: 'EUROPA', TR: 'EUROPA',
      AE: 'MEDIO', EG: 'MEDIO', IL: 'MEDIO', MA: 'MEDIO', SA: 'MEDIO', ZA: 'MEDIO',
      CN: 'ASIA', HK: 'ASIA', ID: 'ASIA', IN: 'ASIA', JP: 'ASIA', KR: 'ASIA', MY: 'ASIA', PH: 'ASIA', SG: 'ASIA', TH: 'ASIA', TW: 'ASIA', VN: 'ASIA',
      AU: 'OCEANIA', NZ: 'OCEANIA',
    },
    rutasMedias: [['SUR', 'CENTRO'], ['SUR', 'NORTE'], ['CENTRO', 'NORTE'], ['NORTE', 'EUROPA'], ['EUROPA', 'MEDIO'], ['ASIA', 'MEDIO'], ['ASIA', 'OCEANIA']],
    porDistancia: {
      CORTA: { fcl: { '20': 1200, '40': 1800, '40HC': 1900 }, lclWm: 60, lclMin: 100, aereoKg: 2.5, aereoMin: 120, courierKg: 7, courierMin: 45, terrestreKg: 0.25, transitoDias: { MAR: [3, 10], AIRE: [1, 3], TIERRA: [2, 7] } },
      MEDIA: { fcl: { '20': 2000, '40': 2900, '40HC': 3000 }, lclWm: 85, lclMin: 130, aereoKg: 3.5, aereoMin: 150, courierKg: 9, courierMin: 60, terrestreKg: 0.4, transitoDias: { MAR: [7, 18], AIRE: [2, 4], TIERRA: [5, 12] } },
      LARGA: { fcl: { '20': 3200, '40': 4500, '40HC': 4700 }, lclWm: 110, lclMin: 160, aereoKg: 5, aereoMin: 200, courierKg: 12, courierMin: 80, terrestreKg: null, transitoDias: { MAR: [20, 40], AIRE: [3, 7], TIERRA: [10, 20] } },
    },
    recargosPct: 0.15,
    documentos: 90,
    fumigacionPorEquipo: 150,
    seguro: { tasa: 0.0035, primaMinima: 50 },
  },

  fronterasTerrestres: [
    ['CO', 'VE'], ['CO', 'EC'], ['CO', 'PE'], ['CO', 'BR'], ['CO', 'PA'],
    ['US', 'CA'], ['US', 'MX'], ['MX', 'GT'], ['EC', 'PE'], ['PE', 'CL'], ['CL', 'AR'], ['AR', 'BR'],
  ],

  textosLegales: {
    cubicaje: {
      es: 'Aproximación de planeación. No reemplaza el plan de estiba definitivo ni las instrucciones del transportador.',
      en: 'Planning approximation. It does not replace the final stowage plan or the carrier’s instructions.',
    },
    tributos: {
      es: 'Estimación preliminar de tributos con base en la información suministrada y tarifas parametrizadas a la fecha. No constituye liquidación oficial ni clasificación arancelaria vinculante.',
      en: 'Preliminary tax estimate based on the information provided and the rates configured to date. It is not an official assessment or a binding tariff classification.',
    },
    resultado: {
      es: 'Estimación preliminar, no cotización vinculante.',
      en: 'Preliminary estimate, not a binding quote.',
    },
    datos: {
      es: 'La calidad del resultado depende de la precisión de los datos ingresados.',
      en: 'The quality of the result depends on the accuracy of the data entered.',
    },
  },
};
