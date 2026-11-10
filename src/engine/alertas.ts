// RN-PRO-04 a 06 y RN-RES-02: alertas regulatorias, de carga, de costo y de datos.
import { advertenciaIncoterm } from './incoterms';
import { formatoNumero } from './unidades';
import type { Alerta, BasesCobro, CalculoCubicaje, EvaluacionEquipo, LineaCosto, Modalidad, NoUbicado, Parametros, Perspectiva, ReglaAlerta, SeleccionEquipo, Simulacion, Texto } from './types';

const PRIORIDAD = { BLOQUEANTE: 1, REGULATORIA: 2, COSTO: 3, DATOS: 4 } as const;

function alerta(id: string, tipo: Alerta['tipo'], texto: Texto, impactoUsd = 0): Alerta {
  return { id, tipo, prioridad: PRIORIDAD[tipo], impactoUsd, texto };
}

export function reglasRegulatorias(sim: Simulacion, persp: Perspectiva, params: Parametros): ReglaAlerta[] {
  const categorias = new Set([sim.operacion.tipoProducto, ...sim.productos.map((p) => p.categoria)]);
  const requisitos = new Set(sim.productos.flatMap((p) => p.requisitos));
  for (const r of sim.referencias) {
    if (r.manejo?.peligroso) requisitos.add('PELIGROSO');
    if (r.manejo?.refrigerado) requisitos.add('REFRIGERADO');
  }
  return params.reglasAlerta.filter((regla) => {
    if (regla.perspectiva && regla.perspectiva !== persp) return false;
    if (regla.paisDestino && regla.paisDestino !== sim.operacion.destino.pais) return false;
    if (!regla.categorias && !regla.requisitos) return true;
    return !!regla.categorias?.some((c) => categorias.has(c)) || !!regla.requisitos?.some((c) => requisitos.has(c));
  });
}

// RN-PRO-04: plantilla obligatoria
export const textoRegulatorio = (regla: ReglaAlerta): Texto => ({
  es: `${regla.categoriaTexto.es} podría requerir ${regla.requisito.es} ante ${regla.entidad}. Requiere validación profesional.`,
  en: `${regla.categoriaTexto.en} may require ${regla.requisito.en} from ${regla.entidad}. Professional validation required.`,
});

const MOTIVOS: Record<NoUbicado['motivo'], Texto> = {
  ESPACIO: { es: 'no hay espacio', en: 'no space left' },
  PESO: { es: 'supera la carga máxima', en: 'exceeds the maximum load' },
  DIMENSION: { es: 'una dimensión supera la interna del equipo', en: 'a dimension exceeds the equipment interior' },
  PALLET: { es: 'no cabe en el pallet declarado', en: 'does not fit the declared pallet' },
  REEFER: { es: 'la carga refrigerada exige reefer o aéreo', en: 'refrigerated cargo requires reefer or air' },
};

interface EntradaAlertas {
  sim: Simulacion;
  persp: Perspectiva;
  params: Parametros;
  modalidad: Modalidad;
  cubicaje: CalculoCubicaje;
  bases: BasesCobro;
  seleccion: SeleccionEquipo | null;
  evaluacion: EvaluacionEquipo | null;
  noUbicados: NoUbicado[];
  lineas: LineaCosto[];
  aUsd: (valor: number) => number;
}

export function construirAlertas(e: EntradaAlertas): Alerta[] {
  const { sim, persp, params, modalidad, cubicaje, bases, seleccion, evaluacion, noUbicados, lineas, aUsd } = e;
  const salida: Alerta[] = [];
  const refrigerada = sim.referencias.some((r) => r.manejo?.refrigerado);
  const peligrosa = sim.referencias.filter((r) => r.manejo?.peligroso);

  // 1. Bloqueantes
  for (const n of noUbicados) {
    salida.push(alerta(`no-ubicado-${n.referenciaId}-${n.motivo}`, 'BLOQUEANTE', {
      es: `${formatoNumero(n.cantidad, 0, 'es')} empaques de «${n.nombre}» no caben: ${MOTIVOS[n.motivo].es}.`,
      en: `${formatoNumero(n.cantidad, 0, 'en')} packages of ${n.nombre} not placed: ${MOTIVOS[n.motivo].en}.`,
    }));
  }
  if (refrigerada && !noUbicados.some((n) => n.motivo === 'REEFER') && !['AEREA', 'COURIER'].includes(modalidad)) {
    salida.push(alerta('refrigerada-sin-reefer', 'BLOQUEANTE', {
      es: 'La carga refrigerada solo admite reefer o aéreo.',
      en: 'Refrigerated cargo only allows reefer or air.',
    }));
  }
  if (peligrosa.some((r) => !r.manejo.claseOnu.trim())) {
    salida.push(alerta('peligrosa-sin-onu', 'BLOQUEANTE', {
      es: 'La carga peligrosa exige declarar su clase ONU.',
      en: 'Dangerous goods require a declared UN class.',
    }));
  }

  // 2. Regulatorias
  for (const regla of reglasRegulatorias(sim, persp, params)) {
    salida.push(alerta(`regulatoria-${regla.id}`, 'REGULATORIA', textoRegulatorio(regla)));
  }
  if (peligrosa.length && ['MARITIMA_LCL', 'AEREA', 'POR_EVALUAR'].includes(sim.operacion.modalidad)) {
    salida.push(alerta('peligrosa-compatibilidad', 'REGULATORIA', {
      es: 'Carga peligrosa en consolidado o aéreo podría requerir revisión de compatibilidad ante el transportador. Requiere validación profesional.',
      en: 'Dangerous goods in LCL or air may require a compatibility review from the carrier. Professional validation required.',
    }));
  }

  // 3. Costo
  if (bases.wmSuelto > 0 && cubicaje.hayPaletizacion) {
    const aumento = bases.wmCarga / bases.wmSuelto - 1;
    if (aumento > params.umbralPaletizacionLcl) {
      salida.push(alerta('paletizacion-lcl', 'COSTO', {
        es: `La paletización eleva la base LCL; compare contra FCL (+${formatoNumero(aumento * 100, 0, 'es')} %).`,
        en: `Palletizing raises the LCL base; compare against FCL (+${formatoNumero(aumento * 100, 0, 'en')}%).`,
      }));
    }
  }
  if (params.umbralLcl != null && evaluacion && evaluacion.ocupacionVolumen < params.umbralLcl) {
    salida.push(alerta('umbral-lcl', 'COSTO', {
      es: 'El volumen calculado puede requerir carga consolidada.',
      en: 'The calculated volume may call for consolidated cargo.',
    }));
  }
  if (seleccion && seleccion.cantidad > 1) {
    salida.push(alerta('varios-equipos', 'COSTO', {
      es: `La carga no cabe en un solo equipo: se estiman ${seleccion.cantidad} unidades.`,
      en: `The cargo does not fit in a single unit: ${seleccion.cantidad} units are estimated.`,
    }));
  }

  // 4. Datos
  const pendientes = lineas.filter((l) => l.estado === 'PENDIENTE' && l.activo);
  if (pendientes.length) {
    salida.push(alerta('rubros-pendientes', 'DATOS', {
      es: `Total parcial: ${pendientes.length} rubros pendientes de cotización (${pendientes.slice(0, 3).map((l) => l.nombre.es).join(', ')}${pendientes.length > 3 ? '…' : ''}).`,
      en: `Partial total: ${pendientes.length} items pending a quote (${pendientes.slice(0, 3).map((l) => l.nombre.en).join(', ')}${pendientes.length > 3 ? '…' : ''}).`,
    }));
  }
  // Los honorarios propios (F) no se validan con un proveedor logístico
  const referenciales = lineas.filter((l) => l.origen === 'TARIFA' && l.suma && l.modulo !== 'F');
  if (referenciales.length) {
    salida.push(alerta('tarifas-referenciales', 'DATOS', {
      es: 'Tarifas referenciales: valide con su proveedor logístico antes de decidir.',
      en: 'Reference rates: validate with your logistics provider before deciding.',
    }, aUsd(referenciales.reduce((s, l) => s + (l.valor ?? 0), 0))));
  }
  const tentativas = lineas.filter((l) => l.origen === 'TENTATIVA' && l.suma);
  if (tentativas.length) {
    salida.push(alerta('transporte-tentativo', 'DATOS', {
      es: 'El transporte internacional es una tentativa calculada con tu carga y la ruta: puede cambiar según la naviera o aerolínea, la temporada y los recargos. Pide una cotización antes de cerrar el precio.',
      en: 'International transport is an estimate based on your cargo and route: it may change with the carrier, season and surcharges. Get a quote before setting your price.',
    }, aUsd(tentativas.reduce((s, l) => s + (l.valor ?? 0), 0))));
  }
  if (persp === 'C' && !sim.operacion.partida.trim()) {
    salida.push(alerta('sin-partida', 'DATOS', {
      es: 'Sin partida arancelaria: el arancel queda pendiente y el resultado lo declara como supuesto.',
      en: 'No tariff code: the duty stays pending and the result states it as an assumption.',
    }));
  }
  if (advertenciaIncoterm(sim.operacion.incoterm, sim.operacion.modalidad, params)) {
    salida.push(alerta('incoterm-modalidad', 'DATOS', {
      es: `${sim.operacion.incoterm} es propio del transporte marítimo o fluvial; considere FCA, CPT o CIP.`,
      en: `${sim.operacion.incoterm} is meant for sea or inland waterway transport; consider FCA, CPT or CIP.`,
    }));
  }

  // RN-RES-02: por prioridad; empate, mayor impacto en USD
  return salida.sort((a, b) => a.prioridad - b.prioridad || b.impactoUsd - a.impactoUsd);
}
