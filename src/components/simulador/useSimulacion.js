import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ejemploMadrid } from '../../config/asistente/ejemplo';
import { PARAMS } from '../../config/params';
import { calcularSimulacion, estaVencida, faltantesParaCalcular } from '../../engine/simulacion';
import { origenPorCubrir } from '../../engine/costos';
import { resolverAsistente, respuestasVacias } from '../../engine/asistente/derivar';
import { getTrm } from '../../services/precioCafe';
import { useI18n } from '../../i18n/LanguageContext';
import { ETAPAS, etapasCompletas, etapasVisibles, ultimaEtapaDeEntrada } from './asistente/etapas';

// v3: asistente conversacional. Las respuestas son la fuente de verdad; la Simulacion del motor se deriva.
const KEY = 'ai.simulador.v3';

export const hoyBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());

function estadoInicial() {
  return { respuestas: respuestasVacias(), etapa: ETAPAS[0], estado: 'BORRADOR', codigo: null, snapshot: null, versiones: [], trm: null };
}

function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.respuestas?.destino) return { ...estadoInicial(), ...data, respuestas: { ...respuestasVacias(), ...data.respuestas } };
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

const conTrm = (e) => ({ ...e.respuestas, trm: e.trm });

export function useSimulacion(etapaInicial) {
  const { lang } = useI18n();
  const [estado, setEstado] = useState(() => {
    const e = cargar();
    return ETAPAS.includes(etapaInicial) ? { ...e, etapa: etapaInicial } : e;
  });
  // La imagen de la vista 3D vive solo en memoria: pesa demasiado para el almacenamiento local
  const [captura3D, setCaptura3D] = useState(null);
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

  // Tasa de cambio del día (una vez por día); si el servicio falla se usa la semilla de los parámetros
  useEffect(() => {
    if (estado.trm?.consultada === hoy) return undefined;
    let vivo = true;
    getTrm().then((trm) => {
      if (!vivo || !trm.enVivo) return;
      setEstado((e) => ({ ...e, trm: { valor: trm.copPorUsd, fecha: trm.fecha, fuente: trm.fuente, consultada: hoy } }));
    });
    return () => {
      vivo = false;
    };
  }, [hoy]); // eslint-disable-line react-hooks/exhaustive-deps

  // RN-SIM-06: editar una simulación calculada la devuelve a borrador y conserva el cálculo como versión histórica
  const responder = useCallback((cambio) => {
    setEstado((e) => {
      const respuestas = typeof cambio === 'function' ? cambio(e.respuestas) : { ...e.respuestas, ...cambio };
      if (respuestas === e.respuestas) return e;
      const versiones = e.snapshot && e.estado !== 'BORRADOR' ? [...e.versiones, e.snapshot].slice(-5) : e.versiones;
      return { ...e, respuestas, estado: 'BORRADOR', versiones };
    });
  }, []);

  const irA = useCallback((etapa) => setEstado((e) => ({ ...e, etapa })), []);

  const asistente = useMemo(() => resolverAsistente(conTrm(estado), PARAMS, lang), [estado.respuestas, estado.trm, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const vivo = useMemo(() => calcularSimulacion(asistente.sim, asistente.params, hoy), [asistente, hoy]);

  const calcular = useCallback(() => {
    setEstado((e) => {
      const a = resolverAsistente(conTrm(e), PARAMS, lang);
      if (faltantesParaCalcular(a.sim).length) return e;
      const dia = hoyBogota();
      const resultado = calcularSimulacion(a.sim, a.params, dia);
      if (origenPorCubrir(resultado.lineas).length) return e;
      // RN-SIM-05: el snapshot guarda entradas, resultado y versiones
      const snapshot = {
        entradas: a.sim,
        respuestas: conTrm(e),
        asistente: { via: a.via, incoterm: a.incoterm, cubicaje: { ...a.cubicaje, escenas: undefined }, comparacion: a.comparacion, precioLibraCop: a.precioLibraCop, precioEsReferencia: a.precioEsReferencia },
        resultado,
        calculadoEn: new Date().toISOString(),
        versionParametros: PARAMS.version,
        versionAlgoritmo: PARAMS.algoritmo,
      };
      return { ...e, snapshot, estado: 'CALCULADA', codigo: e.codigo || siguienteCodigo(dia), etapa: 'resultado' };
    });
  }, [lang]);

  const cargarEjemplo = useCallback(() => {
    setCaptura3D(null);
    setEstado((e) => ({ ...estadoInicial(), trm: e.trm, respuestas: ejemploMadrid() }));
  }, []);
  const reiniciar = useCallback(() => {
    setCaptura3D(null);
    setEstado((e) => ({ ...estadoInicial(), trm: e.trm }));
  }, []);

  // Fin de la experiencia: borra del navegador todo lo que el usuario escribió y deja de guardar.
  // El consecutivo de códigos se conserva porque no contiene datos del usuario.
  const terminar = useCallback(() => {
    cerrada.current = true;
    clearTimeout(temporizador.current);
    try {
      ['ai.simulador.v1', 'ai.simulador.v2', KEY].forEach((k) => localStorage.removeItem(k));
    } catch {
      // Sin almacenamiento: no había nada guardado
    }
    setCaptura3D(null);
    setEstado(estadoInicial());
  }, []);

  const vencida = !!estado.snapshot && estaVencida(estado.snapshot.resultado.vigenciaMinima, hoy);
  const faltantes = useMemo(() => {
    const f = faltantesParaCalcular(asistente.sim);
    return origenPorCubrir(vivo.lineas).length ? [...f, 'COSTOS_ORIGEN'] : f;
  }, [asistente, vivo]);
  const visibles = useMemo(() => etapasVisibles(estado.respuestas), [estado.respuestas]);
  const completas = useMemo(() => etapasCompletas(estado.respuestas, asistente, !!estado.snapshot && estado.estado !== 'BORRADOR'), [estado.respuestas, asistente, estado.snapshot, estado.estado]);

  return {
    ...estado,
    hoy,
    asistente,
    sim: asistente.sim,
    vivo,
    vencida,
    faltantes,
    etapas: visibles,
    completas,
    ultimaDeEntrada: ultimaEtapaDeEntrada(estado.respuestas),
    captura3D,
    setCaptura3D,
    responder,
    irA,
    calcular,
    cargarEjemplo,
    reiniciar,
    terminar,
  };
}
