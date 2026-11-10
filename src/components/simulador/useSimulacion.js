import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { casoCafe } from '../../config/casoCafe';
import { PARAMS } from '../../config/params';
import { calcularSimulacion, estaVencida, faltantesParaCalcular, ETAPAS } from '../../engine/simulacion';
import { origenPorCubrir } from '../../engine/costos';

const KEY = 'ai.simulador.v2'; // v2: el formulario arranca en blanco

export const hoyBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

export const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

export function nuevoProducto(n, nombre = '') {
  return { id: nuevoId(), nombre, descripcion: '', categoria: '', marca: '', paisOrigen: '', uso: '', cantidad: 0, unidad: '', valorUnitario: 0, moneda: '', empaque: '', requisitos: [], certificaciones: '' };
}

export function nuevaReferencia(productoId, nombre, empaque = '') {
  return {
    id: nuevoId(),
    nombre,
    productoId,
    empaque,
    bultos: 0,
    unidadesPorBulto: null,
    largoMm: 0,
    anchoMm: 0,
    altoMm: 0,
    unidadMedida: '',
    pesoNetoG: null,
    pesoBrutoG: 0,
    apilable: true,
    niveles: null, // apilable hasta el techo salvo que el usuario fije un límite
    rotacion: '',
    manejo: { fragil: false, peligroso: false, claseOnu: '', refrigerado: false, tempMin: null, tempMax: null },
    paletizar: false,
    pallet: { ...PARAMS.palletEstandar },
  };
}

function simulacionVacia() {
  return {
    operacion: {
      tipo: '',
      origen: { pais: '', ciudad: '', tipo: '' },
      destino: { pais: '', ciudad: '', tipo: '' },
      modalidad: '',
      incoterm: '',
      lugarConvenido: '',
      moneda: '',
      valorEstimado: null,
      fechaSalida: null,
      tipoProducto: '',
      partida: '',
      necesidad: '',
    },
    productos: [],
    referencias: [],
    equipoId: null,
    overrides: {},
    otros: [],
    rubrosActivados: [],
    arancelPct: null,
    trmUsuario: null,
    comisionPct: null,
    contingenciaPct: null,
    margenObjetivo: null,
  };
}

function estadoInicial() {
  return { sim: simulacionVacia(), etapa: 'operacion', cubVista: 'referencias', estado: 'BORRADOR', codigo: null, snapshot: null, versiones: [], historial: [], escenarios: [], avisoValor: null };
}

function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.sim?.operacion && Array.isArray(data.sim.productos)) return { ...estadoInicial(), ...data };
    }
  } catch {
    // Sin almacenamiento o dato dañado: se empieza de cero
  }
  return estadoInicial();
}

// RN-SIM-01: SIM-AAAA-MM-NNNNNN. Sin servidor, el consecutivo es local a este navegador.
function siguienteCodigo(hoy) {
  const [a, m] = hoy.split('-');
  let n = 1;
  try {
    const clave = `${KEY}.consecutivo.${a}-${m}`;
    n = Number(localStorage.getItem(clave) || 0) + 1;
    localStorage.setItem(clave, String(n));
  } catch {
    n = Math.floor(Math.random() * 900000) + 1;
  }
  return `SIM-${a}-${m}-${String(n).padStart(6, '0')}`;
}

export function useSimulacion(etapaInicial, vistaInicial) {
  const [estado, setEstado] = useState(() => {
    const e = cargar();
    return ETAPAS.includes(etapaInicial) ? { ...e, etapa: etapaInicial, cubVista: vistaInicial === 'resultado' ? 'resultado' : 'referencias' } : e;
  });
  const hoy = hoyBogota();
  const temporizador = useRef();
  const cerrada = useRef(false);

  // RN-SIM-02: guardado automático con cada cambio
  useEffect(() => {
    clearTimeout(temporizador.current);
    if (cerrada.current) return undefined;
    temporizador.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(estado));
      } catch {
        // El borrador dura mientras la pestaña esté abierta
      }
    }, 300);
    return () => clearTimeout(temporizador.current);
  }, [estado]);

  // RN-SIM-06: editar una simulación calculada la devuelve a borrador y conserva el cálculo como versión histórica
  const actualizar = useCallback((cambio) => {
    setEstado((e) => {
      const sim = typeof cambio === 'function' ? cambio(e.sim) : { ...e.sim, ...cambio };
      if (sim === e.sim) return e;
      const versiones = e.snapshot && e.estado !== 'BORRADOR' ? [...e.versiones, e.snapshot].slice(-5) : e.versiones;
      return { ...e, sim, estado: 'BORRADOR', versiones };
    });
  }, []);

  const actualizarOperacion = useCallback((cambios) => actualizar((s) => ({ ...s, operacion: { ...s.operacion, ...cambios } })), [actualizar]);

  const irA = useCallback((etapa, cubVista = 'referencias') => setEstado((e) => ({ ...e, etapa, cubVista })), []);
  const setCubVista = useCallback((cubVista) => setEstado((e) => ({ ...e, cubVista })), []);

  const registrar = useCallback((entrada) => {
    setEstado((e) => ({ ...e, historial: [{ fecha: new Date().toISOString(), ...entrada }, ...e.historial].slice(0, 100) }));
  }, []);

  const calcular = useCallback(() => {
    setEstado((e) => {
      if (faltantesParaCalcular(e.sim).length) return e;
      const dia = hoyBogota();
      const resultado = calcularSimulacion(e.sim, PARAMS, dia);
      if (origenPorCubrir(resultado.lineas).length) return e;
      // RN-SIM-05: el snapshot guarda entradas, resultado y versiones
      const snapshot = {
        entradas: e.sim,
        resultado,
        calculadoEn: new Date().toISOString(),
        versionParametros: PARAMS.version,
        versionAlgoritmo: PARAMS.algoritmo,
      };
      return { ...e, snapshot, estado: 'CALCULADA', codigo: e.codigo || siguienteCodigo(dia), etapa: 'resultado' };
    });
  }, []);

  const cargarEjemplo = useCallback(() => setEstado({ ...estadoInicial(), sim: casoCafe(), etapa: 'operacion' }), []);
  const reiniciar = useCallback(() => setEstado(estadoInicial()), []);

  // Fin de la experiencia: borra del navegador todo lo que el usuario escribió y deja de guardar.
  // El consecutivo de códigos se conserva porque no contiene datos del usuario.
  const terminar = useCallback(() => {
    cerrada.current = true;
    clearTimeout(temporizador.current);
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem('ai.simulador.v1');
    } catch {
      // Sin almacenamiento: no había nada guardado
    }
    setEstado(estadoInicial());
  }, []);
  const setEscenarios = useCallback((f) => setEstado((e) => ({ ...e, escenarios: f(e.escenarios) })), []);
  const setAvisoValor = useCallback((avisoValor) => setEstado((e) => ({ ...e, avisoValor })), []);

  const vivo = useMemo(() => calcularSimulacion(estado.sim, PARAMS, hoy), [estado.sim, hoy]);
  const vencida = !!estado.snapshot && estaVencida(estado.snapshot.resultado.vigenciaMinima, hoy);
  const faltantes = useMemo(() => {
    const f = faltantesParaCalcular(estado.sim);
    return origenPorCubrir(vivo.lineas).length ? [...f, 'COSTOS_ORIGEN'] : f;
  }, [estado.sim, vivo]);

  return { ...estado, hoy, vivo, vencida, faltantes, actualizar, actualizarOperacion, irA, setCubVista, registrar, calcular, cargarEjemplo, reiniciar, terminar, setEscenarios, setAvisoValor };
}
