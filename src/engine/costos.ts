// RN-COS: motor de costos por tramos. Cada rubro guarda valor, estado y origen; ningún total oculta lo que falta.
import { reglasRegulatorias } from './alertas';
import { pagadorDe } from './incoterms';
import { buscarTarifaTributaria, calcularSeguro, calcularTributos } from './tributos';
import { normalizarTexto } from './unidades';
import type { BasesCobro, CalculoCubicaje, EstadoRubro, LineaCosto, Modalidad, Modulo, OrigenDato, Parametros, Perspectiva, ResumenTramo, RubroCatalogo, SeleccionEquipo, Simulacion, Tarifa, TramoResultado, DetalleTentativo, DistanciaRuta, TarifaTentativa } from './types';

export interface ContextoCostos {
  sim: Simulacion;
  params: Parametros;
  hoy: string;
  persp: Perspectiva;
  modalidad: Modalidad;
  seleccion: SeleccionEquipo | null;
  cubicaje: CalculoCubicaje;
  bases: BasesCobro;
}

// Tasas del cálculo: la TRM escrita por el usuario reemplaza la semilla
export function tasasDe(sim: Simulacion, params: Parametros): Record<string, number> {
  return { ...params.fx.copPorUnidad, USD: sim.trmUsuario ?? params.fx.copPorUnidad.USD };
}

export function convertir(valor: number, de: string, a: string, tasas: Record<string, number>): number {
  if (de === a) return valor;
  const tasaDe = tasas[de];
  const tasaA = tasas[a];
  if (!tasaDe || !tasaA) throw new Error(`Sin tasa de cambio para ${de} o ${a}`);
  return (valor * tasaDe) / tasaA;
}

const coincideLugar = (regla: { pais: string; ciudad?: string }, lugar: { pais: string; ciudad: string }): boolean =>
  regla.pais === lugar.pais && (!regla.ciudad || normalizarTexto(regla.ciudad) === normalizarTexto(lugar.ciudad));

// RN-COS-02: ruta, modalidad, equipo y vigencia que cubra la fecha de salida (o hoy)
export function tarifasVigentes(rubro: string, ctx: Pick<ContextoCostos, 'sim' | 'params' | 'hoy' | 'modalidad'>, equipoId: string | null): Tarifa[] {
  const { sim, params, hoy, modalidad } = ctx;
  const fecha = sim.operacion.fechaSalida || hoy;
  return params.tarifas.filter(
    (t) =>
      t.rubro === rubro &&
      coincideLugar(t.origen, sim.operacion.origen) &&
      coincideLugar(t.destino, sim.operacion.destino) &&
      t.modalidades.includes(modalidad) &&
      (!t.equipoId || t.equipoId === equipoId) &&
      t.vigenteDesde <= fecha &&
      fecha <= t.vigenteHasta,
  );
}

export function cantidadDeCobro(t: Tarifa, ctx: Pick<ContextoCostos, 'modalidad' | 'seleccion' | 'bases' | 'cubicaje'>): number | null {
  switch (t.unidad) {
    case 'FIJO':
      return 1;
    case 'POR_EQUIPO':
      return ctx.seleccion?.cantidad ?? null;
    case 'POR_WM':
      return ctx.bases.wmCarga;
    case 'POR_KG':
      return ctx.modalidad === 'COURIER' ? ctx.bases.courierCobrableKg : ctx.bases.aereoCobrableKg;
    case 'POR_PALLET':
      return ctx.cubicaje.totalPallets;
    default:
      return null;
  }
}

const ESTADOS_QUE_SUMAN: EstadoRubro[] = ['INCLUIDO', 'ESTIMADO', 'VALIDACION'];

function moduloATramo(modulo: Modulo): TramoResultado {
  const mapa: Record<Modulo, TramoResultado> = { A: 'MERCANCIA', B: 'ORIGEN', C: 'INTERNACIONAL', D: 'DESTINO', E: 'TRIBUTOS', F: 'SERVICIOS' };
  return mapa[modulo];
}

export function calcularLineas(ctx: ContextoCostos): { lineas: LineaCosto[]; cif: number | null; baseCop: number | null } {
  const { sim, params, persp, modalidad } = ctx;
  const { operacion: op } = sim;
  const moneda = op.moneda;
  const tasas = tasasDe(sim, params);
  const lineas: LineaCosto[] = [];
  const cat = new Map(params.rubros.map((r) => [r.codigo, r]));

  const crear = (rubro: RubroCatalogo, datos: Partial<LineaCosto> & { estado: EstadoRubro; origen: OrigenDato }, id = rubro.codigo): LineaCosto => {
    const base: LineaCosto = {
      id,
      codigo: rubro.codigo,
      modulo: rubro.modulo,
      nombre: rubro.nombre,
      tramoResultado: rubro.tramoResultado,
      valor: null,
      valorOriginal: null,
      monedaOriginal: moneda,
      tasa: 1,
      valorEstimado: null,
      sobrescrito: false,
      activo: true,
      informativo: !!rubro.informativo,
      suma: false,
      pagador: pagadorDe(rubro.tramo, op.incoterm, params),
      ...datos,
    };
    base.valorEstimado = base.valor;
    return aplicarOverride(base);
  };

  const aplicarOverride = (l: LineaCosto): LineaCosto => {
    const o = sim.overrides[l.id];
    let out = { ...l };
    if (o?.activo != null) out.activo = o.activo;
    if (o?.valor != null) {
      out = { ...out, valor: o.valor, valorOriginal: o.valor, monedaOriginal: moneda, tasa: 1, origen: 'INGRESADO', sobrescrito: true, estado: out.estado === 'VALIDACION' ? 'VALIDACION' : 'INCLUIDO' };
    }
    if (o?.validacion) out.estado = 'VALIDACION';
    if (o?.noAplica) out = { ...out, valor: null, estado: 'NO_APLICA', origen: 'INGRESADO' };
    out.suma = out.activo && !out.informativo && out.valor != null && ESTADOS_QUE_SUMAN.includes(out.estado);
    return out;
  };

  const agregar = (l: LineaCosto) => {
    lineas.push(l);
    return l;
  };

  const sumaModulos = (modulos: Modulo[]): number =>
    lineas.filter((l) => modulos.includes(l.modulo) && l.suma).reduce((s, l) => s + (l.valor as number), 0);

  const noAplica = (rubro: RubroCatalogo) => agregar(crear(rubro, { estado: 'NO_APLICA', origen: 'ESTIMACION' }));

  const pendiente = (rubro: RubroCatalogo, id = rubro.codigo, extra: Partial<LineaCosto> = {}) =>
    agregar(crear(rubro, { estado: 'PENDIENTE', origen: 'POR_CONFIRMAR', ...extra }, id));

  const reglasCump = reglasRegulatorias(sim, persp, params).filter((r) => r.cumplimiento);

  const aplicaFiltros = (rubro: RubroCatalogo): boolean => {
    if (rubro.modalidades && !rubro.modalidades.includes(modalidad)) return false;
    if (rubro.perspectiva && rubro.perspectiva !== persp) return false;
    if (rubro.categorias) {
      const cats = new Set([op.tipoProducto, ...sim.productos.map((p) => p.categoria)]);
      if (!rubro.categorias.some((c) => cats.has(c))) return false;
    }
    return true;
  };

  // Tentativa del transporte internacional cuando la ruta no tiene tarifa: usa la carga ya declarada
  // (contenedores, W/M o kg cobrables) y la distancia entre zonas. Siempre en USD y con rango.
  const ft = params.fleteTentativo;
  const rutaTentativa = (): { distancia: DistanciaRuta; tarifa: TarifaTentativa } | null => {
    if (!ft) return null;
    const zo = ft.zonas[op.origen.pais];
    const zd = ft.zonas[op.destino.pais];
    if (!zo || !zd) return null;
    const distancia: DistanciaRuta = zo === zd ? 'CORTA' : ft.rutasMedias.some(([a, b]) => (a === zo && b === zd) || (a === zd && b === zo)) ? 'MEDIA' : 'LARGA';
    return { distancia, tarifa: ft.porDistancia[distancia] };
  };

  const fleteTentativoUsd = (): { usd: number; detalle: DetalleTentativo } | null => {
    const ruta = rutaTentativa();
    if (!ruta || !(ctx.cubicaje.pesoCargaG > 0)) return null;
    const { distancia, tarifa: tt } = ruta;
    const pesoKg = ctx.cubicaje.pesoCargaG / 1000;
    if (['MARITIMA_FCL', 'MULTIMODAL'].includes(modalidad)) {
      const sel = ctx.seleccion;
      const precio = sel ? tt.fcl[sel.equipoId] : undefined;
      if (!sel || precio == null) return null;
      return { usd: precio * sel.cantidad, detalle: { distancia, unidad: 'EQUIPO', cantidad: sel.cantidad, equipoId: sel.equipoId, dias: tt.transitoDias.MAR } };
    }
    if (modalidad === 'MARITIMA_LCL') return { usd: Math.max(tt.lclMin, tt.lclWm * ctx.bases.wmCarga), detalle: { distancia, unidad: 'WM', cantidad: ctx.bases.wmCarga, dias: tt.transitoDias.MAR } };
    if (modalidad === 'AEREA') return { usd: Math.max(tt.aereoMin, tt.aereoKg * ctx.bases.aereoCobrableKg), detalle: { distancia, unidad: 'KG', cantidad: ctx.bases.aereoCobrableKg, dias: tt.transitoDias.AIRE } };
    if (modalidad === 'COURIER') return { usd: Math.max(tt.courierMin, tt.courierKg * ctx.bases.courierCobrableKg), detalle: { distancia, unidad: 'KG', cantidad: ctx.bases.courierCobrableKg, dias: tt.transitoDias.AIRE } };
    if (modalidad === 'TERRESTRE' && tt.terrestreKg != null) return { usd: tt.terrestreKg * pesoKg, detalle: { distancia, unidad: 'KG', cantidad: pesoKg, dias: tt.transitoDias.TIERRA } };
    return null;
  };

  // Solo en rutas sin ninguna tarifa de flete cargada (vigente o no) para esta modalidad: si la ruta tiene
  // tarifas, lo que falte sigue Pendiente y una tarifa vencida hace vencer la simulación (RN-SIM-09).
  const rutaSinTarifas = !params.tarifas.some(
    (t) => t.rubro === 'C01' && coincideLugar(t.origen, op.origen) && coincideLugar(t.destino, op.destino) && t.modalidades.includes(modalidad),
  );

  const tentativa = (rubro: RubroCatalogo): { usd: number; detalle: DetalleTentativo } | null => {
    if (!ft || !rutaSinTarifas) return null;
    const local = ft.locales?.[rubro.codigo];
    if (local && rubro.modulo !== 'C') {
      const ruta = rutaTentativa();
      if (!ruta) return null;
      const kg = ctx.cubicaje.pesoCargaG / 1000;
      const usd = Math.max(local.minimo ?? 0, local.fijo + (local.porKg ?? 0) * kg);
      return { usd, detalle: { distancia: ruta.distancia, unidad: 'KG', cantidad: kg, dias: null } };
    }
    if (rubro.modulo !== 'C') return null;
    const base = fleteTentativoUsd();
    if (!base) return null;
    if (rubro.codigo === 'C01') return base;
    if (rubro.codigo === 'C02') {
      // Recargos sobre el flete que ya quedó (tarifa, tentativa o el valor que escribió el usuario)
      const flete = lineas.find((l) => l.codigo === 'C01' && l.valor != null);
      const fleteUsd = flete ? convertir(flete.valor as number, moneda, 'USD', tasas) : base.usd;
      return { usd: fleteUsd * ft.recargosPct, detalle: base.detalle };
    }
    if (rubro.codigo === 'C07') return { usd: ft.documentos, detalle: base.detalle };
    if (rubro.codigo === 'C08' && base.detalle.unidad === 'EQUIPO') return { usd: ft.fumigacionPorEquipo * base.detalle.cantidad, detalle: base.detalle };
    return null;
  };

  const agregarTentativa = (rubro: RubroCatalogo, est: { usd: number; detalle: DetalleTentativo }, id = rubro.codigo, extra: Partial<LineaCosto> = {}) => {
    const valor = convertir(est.usd, 'USD', moneda, tasas);
    const v = ft?.variacion ?? 0;
    return agregar(crear(rubro, {
      valor,
      valorOriginal: est.usd,
      monedaOriginal: 'USD',
      tasa: convertir(1, 'USD', moneda, tasas),
      estado: 'ESTIMADO',
      origen: 'TENTATIVA',
      fuente: ft?.fuente,
      rango: [valor * (1 - v), valor * (1 + v)],
      tentativo: est.detalle,
      ...extra,
    }, id));
  };

  const porTarifa = (rubro: RubroCatalogo, estadoSinTarifa: 'PENDIENTE' | 'VALIDACION' = 'PENDIENTE'): void => {
    const opciones = tarifasVigentes(rubro.codigo, ctx, ctx.seleccion?.equipoId ?? null)
      .map((t) => {
        const cantidad = cantidadDeCobro(t, ctx);
        const original = t.unidad === 'PORCENTAJE' ? porcentaje(t) : cantidad == null ? null : t.valor * cantidad;
        return { t, original: original == null ? null : Math.max(original, t.minimo ?? 0) };
      })
      .filter((x): x is { t: Tarifa; original: number } => x.original != null)
      .sort((a, b) => convertir(a.original, a.t.moneda, moneda, tasas) - convertir(b.original, b.t.moneda, moneda, tasas));

    if (!opciones.length) {
      const activado = rubro.obligatorio || sim.rubrosActivados.includes(rubro.codigo) || estadoSinTarifa === 'VALIDACION';
      if (!activado) return;
      const est = estadoSinTarifa === 'PENDIENTE' ? tentativa(rubro) : null;
      if (est) {
        agregarTentativa(rubro, est);
        return;
      }
      if (estadoSinTarifa === 'VALIDACION') agregar(crear(rubro, { estado: 'VALIDACION', origen: 'POR_CONFIRMAR' }));
      else pendiente(rubro);
      return;
    }
    const [mejor, ...resto] = opciones;
    agregar(crear(rubro, {
      valor: convertir(mejor.original, mejor.t.moneda, moneda, tasas),
      valorOriginal: mejor.original,
      monedaOriginal: mejor.t.moneda,
      tasa: convertir(1, mejor.t.moneda, moneda, tasas),
      estado: mejor.t.requiereValidacion || estadoSinTarifa === 'VALIDACION' ? 'VALIDACION' : 'ESTIMADO',
      origen: 'TARIFA',
      fuente: mejor.t.fuente,
      vigenteHasta: mejor.t.vigenteHasta,
      tarifaId: mejor.t.id,
      alternativas: resto.map((x) => x.t.id),
    }));
  };

  // RN-COS-06: las tarifas porcentuales indican su base
  const porcentaje = (t: Tarifa): number | null => {
    const exw = sumaModulos(['A']);
    const fob = sumaModulos(['A', 'B']);
    const base = t.base === 'EXW' ? exw : t.base === 'CIF' ? (cif ?? null) : fob;
    return base == null ? null : t.valor * convertir(base, moneda, t.moneda, tasas);
  };

  let cif: number | null = null;
  let baseCop: number | null = null;

  const paga = (rubro: RubroCatalogo) => {
    const p = pagadorDe(rubro.tramo, op.incoterm, params);
    return p == null || p === persp;
  };

  // ---------- A, B y C ----------
  const procesarTarifado = (rubro: RubroCatalogo) => {
    if (rubro.calculo === 'SEGURO' || !aplicaFiltros(rubro)) return;
    if (!paga(rubro)) {
      if (rubro.obligatorio) noAplica(rubro);
      return;
    }
    if (rubro.calculo === 'MERCANCIA') {
      const valor = sim.productos.reduce((s, p) => s + convertir(p.cantidad * p.valorUnitario, p.moneda, moneda, tasas), 0);
      if (valor > 0) agregar(crear(rubro, { valor, valorOriginal: valor, estado: 'INCLUIDO', origen: 'INGRESADO' }));
      else pendiente(rubro);
      return;
    }
    if (rubro.calculo === 'VISTO_BUENO') {
      if (reglasCump.length) porTarifa(rubro, 'VALIDACION');
      return;
    }
    porTarifa(rubro);
  };

  const delModulo = (m: Modulo) => params.rubros.filter((r) => r.modulo === m);
  delModulo('A').forEach(procesarTarifado);
  delModulo('B').forEach(procesarTarifado);
  delModulo('C').forEach(procesarTarifado);

  // ---------- C06 seguro: al final de C porque depende del flete (RN-COS-05) ----------
  const flete = lineas.find((l) => l.codigo === 'C01');
  const fletePendiente = !!flete && flete.estado === 'PENDIENTE';
  const rubroSeguro = cat.get('C06') as RubroCatalogo;
  const matriz = params.matrizIncoterms[op.incoterm];
  const seguroOpcional = !!matriz.seguroOpcional && persp === 'V';
  if (paga(rubroSeguro) || seguroOpcional) {
    const regla = params.reglasSeguro.find(
      (r) => (!r.origenPais || r.origenPais === op.origen.pais) && (!r.destinoPais || r.destinoPais === op.destino.pais),
    );
    const fleteTentativoLinea = flete?.tentativo;
    if (!fletePendiente && !regla && ft && fleteTentativoLinea) {
      // Sin regla de seguro para la ruta: prima tentativa sobre (mercancía + origen + flete) × 110 %
      const { prima } = calcularSeguro(convertir(sumaModulos(['A', 'B', 'C']), moneda, 'USD', tasas), ft.seguro.tasa, ft.seguro.primaMinima);
      agregarTentativa(rubroSeguro, { usd: prima, detalle: fleteTentativoLinea }, 'C06', { activo: !seguroOpcional });
    } else if (fletePendiente || !regla) {
      pendiente(rubroSeguro, 'C06', seguroOpcional ? { activo: false } : {});
    } else {
      const fobMasFlete = sumaModulos(['A', 'B', 'C']);
      const minima = convertir(regla.primaMinima, regla.moneda, moneda, tasas);
      const { prima } = calcularSeguro(fobMasFlete, regla.tasa, minima);
      // RN-OPE-02: opcional recomendado, Estimado y desactivado hasta que el usuario lo active
      agregar(crear(rubroSeguro, { valor: prima, valorOriginal: prima, estado: 'ESTIMADO', origen: 'ESTIMACION', fuente: regla.fuente, activo: !seguroOpcional }));
    }
  } else {
    noAplica(rubroSeguro);
  }

  // ---------- Base CIF: solo hasta el puerto de arribo; nunca incluye gastos locales (módulo D) ----------
  const seguro = lineas.find((l) => l.codigo === 'C06');
  // RN-TRI-02: un flete o seguro tentativo no es un valor conocido; la base aduanera espera la tarifa o la cotización
  const basePendiente =
    fletePendiente || flete?.origen === 'TENTATIVA' || (!!seguro && seguro.activo && (seguro.estado === 'PENDIENTE' || seguro.origen === 'TENTATIVA'));
  if (persp === 'C' && !basePendiente && sumaModulos(['A']) > 0) cif = sumaModulos(['A', 'B', 'C']);

  // ---------- D: semilla de gastos de importación o tarifa ----------
  const semilla = params.gastosImportacion;
  const aplicaSemilla = persp === 'C' && op.destino.pais === semilla.paisDestino && semilla.modalidades.includes(modalidad);
  for (const rubro of delModulo('D')) {
    if (!aplicaFiltros(rubro)) continue;
    if (!paga(rubro)) {
      if (rubro.obligatorio) noAplica(rubro);
      continue;
    }
    const items = aplicaSemilla
      ? semilla.items.filter((i) => i.rubro === rubro.codigo && (!i.ciudades || i.ciudades.some((c) => normalizarTexto(c) === normalizarTexto(op.destino.ciudad))))
      : [];
    for (const item of items) {
      const datos = { ...rubro, nombre: item.nombre };
      if (cif == null) {
        pendiente(datos, item.id);
        continue;
      }
      const minimo = convertir(item.minimo, item.monedaMinimo, moneda, tasas);
      const valor = Math.max(minimo, item.porcentaje * cif);
      const linea = agregar(crear(datos, {
        valor,
        valorOriginal: valor,
        estado: 'ESTIMADO',
        origen: item.porConfirmar ? 'POR_CONFIRMAR' : 'ESTIMACION',
        fuente: 'Documento de Reglas de Negocio',
      }, item.id));
      if (item.ivaServicio && linea.valor != null) {
        const ivaValor = linea.valor * params.iva.ivaServicios;
        agregar(crear({ ...rubro, nombre: { es: `IVA sobre ${item.nombre.es.toLowerCase()}`, en: `VAT on ${item.nombre.en.toLowerCase()}` } }, { valor: ivaValor, valorOriginal: ivaValor, estado: 'ESTIMADO', origen: 'ESTIMACION' }, `${item.id}-IVA`));
      }
    }
    const hayPrincipal = items.some((i) => i.principal !== false);
    if (!hayPrincipal) porTarifa(rubro);
  }

  // ---------- E: tributos y cumplimiento ----------
  const trm = tasas.USD;
  const tasaAduanera = params.fx.aduaneraCopPorUsd ?? trm;
  const tasasAduana = { ...tasas, USD: tasaAduanera };
  const importaColombia = persp === 'C' && op.destino.pais === params.tributosPaisModelado;
  const tarifaTrib = importaColombia ? buscarTarifaTributaria(op.partida, params.reglasTributarias) : ({ tipo: 'SIN_TARIFA' } as const);
  const aMoneda = (cop: number) => convertir(cop, 'COP', moneda, tasasAduana);

  let otrosCop = 0;
  let arancelCop: number | null = null;

  for (const rubro of delModulo('E')) {
    if (!aplicaFiltros(rubro)) continue;
    if (!paga(rubro)) {
      if (rubro.obligatorio) noAplica(rubro);
      continue;
    }
    const sinModelar = !importaColombia;
    switch (rubro.calculo) {
      case 'BASE_GRAVABLE':
        if (sinModelar || cif == null) {
          pendiente(rubro);
        } else {
          // RN-TRI-01: en COP con la tasa para efectos aduaneros
          baseCop = convertir(cif, moneda, 'COP', tasasAduana);
          agregar(crear(rubro, { valor: cif, valorOriginal: baseCop, monedaOriginal: 'COP', tasa: 1 / tasaAduanera, estado: 'VALIDACION', origen: 'ESTIMACION' }));
        }
        break;
      case 'OTROS_TRIBUTOS': {
        const regla = tarifaTrib.tipo === 'EXACTA' || tarifaTrib.tipo === 'UNICA' ? tarifaTrib.regla : null;
        if (!regla?.otros?.length || baseCop == null) break;
        otrosCop = regla.otros.reduce((s, o) => s + (o.tipo === 'PORCENTAJE' ? o.valor * (baseCop as number) : o.valor), 0);
        agregar(crear(rubro, { valor: aMoneda(otrosCop), valorOriginal: otrosCop, monedaOriginal: 'COP', tasa: 1 / tasaAduanera, estado: 'VALIDACION', origen: 'TARIFA' }));
        break;
      }
      case 'ARANCEL': {
        if (sinModelar || baseCop == null) {
          pendiente(rubro);
          break;
        }
        const regla = tarifaTrib.tipo === 'EXACTA' || tarifaTrib.tipo === 'UNICA' ? tarifaTrib.regla : null;
        if (sim.arancelPct != null) {
          arancelCop = baseCop * sim.arancelPct;
          agregar(crear(rubro, { valor: aMoneda(arancelCop), valorOriginal: arancelCop, monedaOriginal: 'COP', tasa: 1 / tasaAduanera, estado: 'VALIDACION', origen: 'INGRESADO' }));
        } else if (regla) {
          arancelCop = calcularTributos({ baseCop, arancelPct: regla.arancel, ivaPct: 0 }).arancelCop;
          agregar(crear(rubro, { valor: aMoneda(arancelCop), valorOriginal: arancelCop, monedaOriginal: 'COP', tasa: 1 / tasaAduanera, estado: 'VALIDACION', origen: 'TARIFA' }));
        } else if (tarifaTrib.tipo === 'RANGO') {
          agregar(crear(rubro, { estado: 'VALIDACION', origen: 'POR_CONFIRMAR', rango: [baseCop * tarifaTrib.minimo, baseCop * tarifaTrib.maximo].map(aMoneda) as [number, number] }));
        } else {
          pendiente(rubro); // RN-OPE-07
        }
        break;
      }
      case 'IVA': {
        if (sinModelar || baseCop == null) {
          pendiente(rubro);
          break;
        }
        const regla = tarifaTrib.tipo === 'EXACTA' || tarifaTrib.tipo === 'UNICA' ? tarifaTrib.regla : null;
        // El arancel puede venir sobrescrito por el usuario
        const lineaArancel = lineas.find((l) => l.codigo === 'E02');
        const arancelFinal = lineaArancel?.sobrescrito && lineaArancel.valor != null ? convertir(lineaArancel.valor, moneda, 'COP', tasasAduana) : arancelCop;
        if (arancelFinal == null) {
          pendiente(rubro);
          break;
        }
        const ivaCop = (baseCop + arancelFinal + otrosCop) * (regla?.iva ?? params.iva.general);
        agregar(crear(rubro, { valor: aMoneda(ivaCop), valorOriginal: ivaCop, monedaOriginal: 'COP', tasa: 1 / tasaAduanera, estado: 'VALIDACION', origen: 'ESTIMACION' }));
        break;
      }
      case 'VISTO_BUENO':
      case 'CUMPLIMIENTO_DESTINO':
        if (reglasCump.length) porTarifa(rubro, 'VALIDACION');
        break;
      default:
        porTarifa(rubro);
    }
  }
  // E04 se procesa después de E02 y E03 en el catálogo; si hay otros tributos, recalcular el IVA con ellos
  if (otrosCop > 0 && baseCop != null) {
    const i = lineas.findIndex((l) => l.codigo === 'E03' && l.valor != null);
    const regla = tarifaTrib.tipo === 'EXACTA' || tarifaTrib.tipo === 'UNICA' ? tarifaTrib.regla : null;
    if (i >= 0 && arancelCop != null) {
      const ivaCop = (baseCop + arancelCop + otrosCop) * (regla?.iva ?? params.iva.general);
      lineas[i] = aplicarOverride({ ...lineas[i], valor: aMoneda(ivaCop), valorOriginal: ivaCop, valorEstimado: aMoneda(ivaCop) });
    }
  }

  // ---------- Rubros "Otros" del usuario (RN-COS-01): antes de F para que cuenten en la contingencia ----------
  for (const o of sim.otros) {
    const base: RubroCatalogo = { codigo: 'OTRO', modulo: o.modulo, nombre: { es: o.nombre, en: o.nombre }, tramo: null, tramoResultado: moduloATramo(o.modulo), calculo: 'MANUAL', obligatorio: false };
    if (o.valor == null) pendiente(base, o.id);
    else agregar(crear(base, { valor: o.valor, valorOriginal: o.valor, estado: 'INCLUIDO', origen: 'INGRESADO' }, o.id));
  }

  // ---------- F: servicios (RN-REN-03, RN-COS-07) ----------
  const be = () => sumaModulos(['B', 'C', 'D', 'E']);
  const f01 = cat.get('F01') as RubroCatalogo;
  if (params.honorarios.tipo === 'FIJO') {
    const valor = convertir(params.honorarios.valor, params.honorarios.moneda, moneda, tasas);
    agregar(crear(f01, { valor, valorOriginal: params.honorarios.valor, monedaOriginal: params.honorarios.moneda, tasa: convertir(1, params.honorarios.moneda, moneda, tasas), estado: 'ESTIMADO', origen: 'TARIFA' }));
  } else {
    const valor = params.honorarios.valor * be();
    agregar(crear(f01, { valor, valorOriginal: valor, estado: 'ESTIMADO', origen: 'ESTIMACION' }));
  }
  if (sim.comisionPct) {
    const valor = sim.comisionPct * sumaModulos(['A']);
    agregar(crear(cat.get('F02') as RubroCatalogo, { valor, valorOriginal: valor, estado: 'ESTIMADO', origen: 'ESTIMACION' }));
  }
  if (sim.contingenciaPct) {
    const valor = sim.contingenciaPct * be();
    agregar(crear(cat.get('F03') as RubroCatalogo, { valor, valorOriginal: valor, estado: 'ESTIMADO', origen: 'ESTIMACION' }));
  }

  // Orden del catálogo para presentar
  const orden = new Map(params.rubros.map((r, i) => [r.codigo, i]));
  const posicion = (l: LineaCosto) => orden.get(l.codigo) ?? (['A', 'B', 'C', 'D', 'E', 'F'].indexOf(l.modulo) + 1) * 100;
  const ordenadas = lineas.map((l, i) => ({ l, i })).sort((a, b) => a.l.modulo.localeCompare(b.l.modulo) || posicion(a.l) - posicion(b.l) || a.i - b.i).map((x) => x.l);
  return { lineas: ordenadas, cif, baseCop };
}

export function subtotalesPorModulo(lineas: LineaCosto[]): Record<Modulo, number> {
  const s: Record<Modulo, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  for (const l of lineas) if (l.suma) s[l.modulo] += l.valor as number;
  return s;
}

// RN-RES: grandes tramos del resultado gratuito
export function resumenTramos(lineas: LineaCosto[]): ResumenTramo[] {
  const tramos: TramoResultado[] = ['ORIGEN', 'INTERNACIONAL', 'DESTINO', 'TRIBUTOS', 'ENTREGA'];
  return tramos.map((tramo) => {
    const del = lineas.filter((l) => l.tramoResultado === tramo && !l.informativo);
    return {
      tramo,
      valor: del.filter((l) => l.suma).reduce((s, l) => s + (l.valor as number), 0),
      aplica: del.some((l) => l.estado !== 'NO_APLICA'),
      pendiente: del.some((l) => l.estado === 'PENDIENTE' && l.activo),
      tentativo: del.some((l) => l.suma && l.origen === 'TENTATIVA'),
    };
  });
}

// RN-COS-09
export function calcularCompletitud(lineas: LineaCosto[], sim: Simulacion): number {
  const aplicables = lineas.filter((l) => l.estado !== 'NO_APLICA' && l.activo && !l.informativo);
  const conValor = aplicables.filter((l) => l.valor != null).length;
  const claves = [
    !!sim.operacion.partida.trim(),
    sim.productos.length > 0 && sim.productos.every((p) => p.descripcion.trim().length > 0),
    !!sim.operacion.fechaSalida,
  ];
  const total = aplicables.length + claves.length;
  return total ? ((conValor + claves.filter(Boolean).length) / total) * 100 : 0;
}

// Un rubro está cubierto si tiene valor, si se marcó "No aplica", si quedó en validación profesional
// o si por el Incoterm lo paga la contraparte. Solo los pendientes activos quedan sin cubrir.
export const porCubrir = (l: LineaCosto): boolean => l.activo && l.estado === 'PENDIENTE';

// Regla de avance: sin los costos de origen cubiertos no se pasa al siguiente tramo ni se calcula
export const origenPorCubrir = (lineas: LineaCosto[]): LineaCosto[] => lineas.filter((l) => l.modulo === 'B' && porCubrir(l));
