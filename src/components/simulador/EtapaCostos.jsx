import { useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { formatoDinero, formatoNumero } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { ArrowRight, Check, ChevronLeft, Lock, Plus } from '../ui/Icons';
import { Aviso, Campo, Numero, Opciones, Tarjeta, Texto } from './Campos';
import { nuevoId } from './useSimulacion';
import { origenPorCubrir, porCubrir } from '../../engine/costos';

const MODULOS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Estado de un tramo para el cliente: lo paga la otra parte, le falta algo o ya está cubierto
function estadoTramo(lineas, persp) {
  const visibles = lineas.filter((l) => !l.informativo);
  if (visibles.length && visibles.every((l) => l.estado === 'NO_APLICA' && l.pagador && l.pagador !== persp)) return 'CONTRAPARTE';
  if (visibles.some(porCubrir)) return 'PENDIENTE';
  return 'LISTO';
}

function PasoTramo({ n, m, activo, estado, bloqueado, onClick }) {
  const { t } = useI18n();
  const circulo = estado === 'LISTO' || estado === 'CONTRAPARTE' ? 'bg-[#dbe9dc] text-[#245a30]' : estado === 'PENDIENTE' ? 'bg-[#f4dfd6] text-[#8f3f22]' : 'bg-mist-2 text-ink';
  return (
    <li className="min-w-0">
      <button
        type="button"
        onClick={onClick}
        disabled={bloqueado}
        aria-current={activo ? 'step' : undefined}
        title={bloqueado ? t('sim.cos.bloqueado') : undefined}
        className={
          'flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50 ' +
          (activo ? 'border-ink bg-white shadow-[0_2px_0_rgba(9,28,29,0.08)]' : 'border-transparent bg-white/60 hover:border-line')
        }
      >
        <span className={'grid size-7 flex-none place-items-center rounded-full text-xs font-semibold ' + circulo}>
          {bloqueado ? <Lock size={13} /> : estado === 'LISTO' || estado === 'CONTRAPARTE' ? <Check size={14} /> : n}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] leading-tight font-semibold">{t('sim.cos.pasos.' + m + '.titulo')}</span>
          <span className="truncate text-xs text-muted">{t('sim.cos.estadoTramo.' + estado)}</span>
        </span>
      </button>
    </li>
  );
}

const CLASE_ESTADO = {
  INCLUIDO: 'bg-[#dbe9dc] text-[#245a30]',
  ESTIMADO: 'bg-[#f6e8c8] text-[#5a4509]',
  PENDIENTE: 'bg-[#f4dfd6] text-[#8f3f22]',
  NO_APLICA: 'bg-[#e8ebe8] text-[#4e5a55]',
  VALIDACION: 'bg-[#dde4f2] text-[#2d3e6e]',
};
const COLOR_ORIGEN = { INGRESADO: '#123638', ESTIMACION: '#ddbd62', TARIFA: '#7fa8a3', POR_CONFIRMAR: '#c9774b', TENTATIVA: '#9b7bc4' };

// Explica en una frase con qué se calculó una tentativa: la carga y la ruta
export function useTextoTentativo() {
  const { t, lang } = useI18n();
  return (d, sim) => {
    if (!d) return null;
    const paises = new Intl.DisplayNames([lang], { type: 'region' });
    const carga =
      d.unidad === 'EQUIPO'
        ? t('sim.cos.cargaEquipo', { n: d.cantidad, e: PARAMS.equipos.find((e) => e.id === d.equipoId)?.nombre[lang] ?? d.equipoId })
        : d.unidad === 'WM'
          ? t('sim.cos.cargaWm', { x: formatoNumero(d.cantidad, 2, lang) })
          : t('sim.cos.cargaKg', { x: formatoNumero(d.cantidad, 0, lang) });
    const ruta = `${paises.of(sim.operacion.origen.pais)} → ${paises.of(sim.operacion.destino.pais)}`;
    const base = t('sim.cos.tentativoBase', { c: carga, d: t('sim.cos.distancia.' + d.distancia), r: ruta });
    return d.dias ? `${base} ${t('sim.cos.transito', { a: d.dias[0], b: d.dias[1] })}` : base;
  };
}

export function EstadoRubro({ estado }) {
  const { t } = useI18n();
  return <span className={'inline-block rounded-full px-2.5 py-1 text-xs font-medium ' + CLASE_ESTADO[estado]}>{t('sim.cos.estados.' + estado)}</span>;
}

function OrigenDato({ origen }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span aria-hidden="true" className="size-2.5 flex-none rounded-[3px]" style={{ background: COLOR_ORIGEN[origen] }} />
      {t('sim.cos.origenes.' + origen)}
    </span>
  );
}

function FilaRubro({ l, s }) {
  const { t, lang } = useI18n();
  const { sim, actualizar, registrar } = s;
  const moneda = sim.operacion.moneda;
  const o = sim.overrides[l.id] ?? {};
  const textoTentativo = useTextoTentativo();
  const nombre = l.nombre[lang];
  const esOtro = l.codigo === 'OTRO';
  const contraparte = l.estado === 'NO_APLICA' && !o.noAplica;
  const opcional = l.codigo === 'C06' && (!l.activo || o.activo != null) && !contraparte;

  const fijar = (cambios) =>
    actualizar((sm) => {
      const siguiente = { ...(sm.overrides[l.id] ?? {}), ...cambios };
      Object.keys(siguiente).forEach((k) => siguiente[k] == null && delete siguiente[k]);
      const overrides = { ...sm.overrides };
      if (Object.keys(siguiente).length) overrides[l.id] = siguiente;
      else delete overrides[l.id];
      return { ...sm, overrides };
    });

  const cambiarValor = (valor) => {
    if (esOtro) actualizar((sm) => ({ ...sm, otros: sm.otros.map((x) => (x.id === l.id ? { ...x, valor } : x)) }));
    else fijar({ valor });
  };

  const puedeEditar = !l.informativo && l.estado !== 'NO_APLICA' && l.codigo !== 'A01';

  return (
    <li className={'flex flex-col gap-2 border-b border-line-2 py-3 last:border-0 md:grid md:grid-cols-[minmax(0,1fr)_150px_170px_150px] md:items-start md:gap-3 ' + (porCubrir(l) ? '-mx-2 rounded-xl border-l-4 border-l-[#c9774b] bg-[#fbf1ec] px-2' : '')}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium">{nombre}</span>
        {l.informativo && <span className="text-xs text-muted">{formatoDinero(l.valorOriginal ?? 0, l.monedaOriginal, lang)}</span>}
        {contraparte && <span className="text-xs text-muted">{t('sim.cos.noAplicaContraparte')}</span>}
        {porCubrir(l) && <span className="text-xs font-medium text-[#8f3f22]">{t('sim.cos.pendienteAyuda')}</span>}
        {l.origen === 'TENTATIVA' && (
          <span className="inline-flex w-fit items-center rounded-full bg-[#ece4f6] px-2 py-0.5 text-xs font-medium text-[#4b3474]">{t('sim.cos.tentativoBadge')}</span>
        )}
        {opcional && <span className="text-xs text-muted">{t('sim.cos.opcional')}</span>}
        {l.rango && <span className="text-xs text-muted">{t(l.origen === 'TENTATIVA' ? 'sim.cos.rangoTentativo' : 'sim.cos.rango', { a: formatoDinero(l.rango[0], moneda, lang), b: formatoDinero(l.rango[1], moneda, lang) })}</span>}
        {l.origen === 'TENTATIVA' && l.codigo === 'C01' && <span className="text-xs text-muted">{textoTentativo(l.tentativo, sim)}</span>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {l.sobrescrito && l.valorEstimado != null && (
            <button type="button" className="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-ink underline" onClick={() => { fijar({ valor: null }); registrar({ rubro: nombre, anterior: l.valor, nuevo: l.valorEstimado }); }}>
              {t('sim.cos.volverEstimado', { v: formatoDinero(l.valorEstimado, moneda, lang) })}
            </button>
          )}
          {opcional && (
            <button type="button" className="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-ink underline" onClick={() => fijar({ activo: l.activo ? null : true })}>
              {l.activo ? t('sim.cos.desactivarOpcional') : t('sim.cos.activarOpcional')}
            </button>
          )}
          {!esOtro && !contraparte && !opcional && !l.informativo && l.codigo !== 'A01' && (
            <button type="button" className="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-muted underline" onClick={() => { fijar({ noAplica: o.noAplica ? null : true }); registrar({ rubro: nombre, anterior: t('sim.cos.estados.' + l.estado), nuevo: o.noAplica ? t('sim.cos.restaurar') : t('sim.cos.estados.NO_APLICA') }); }}>
              {o.noAplica ? t('sim.cos.restaurar') : t('sim.cos.marcarNoAplica')}
            </button>
          )}
          {!esOtro && puedeEditar && (
            <button type="button" className="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-muted underline" onClick={() => fijar({ validacion: o.validacion ? null : true })}>
              {o.validacion ? t('sim.cos.quitarValidacion') : t('sim.cos.marcarValidacion')}
            </button>
          )}
          {esOtro && (
            <button type="button" className="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-muted underline" onClick={() => actualizar((sm) => ({ ...sm, otros: sm.otros.filter((x) => x.id !== l.id) }))}>
              {t('sim.cos.eliminarOtro')}
            </button>
          )}
        </div>
      </div>
      <div>
        {puedeEditar ? (
          <Numero
            aria-label={`${nombre} · ${moneda}`}
            className="min-h-10 text-right"
            valor={l.valor != null ? Number(formatoNumero(l.valor, 2, 'en').replace(/,/g, '')) : null}
            onCambio={(v) => cambiarValor(v)}
            onConfirmar={(anterior, nuevo) => registrar({ rubro: nombre, anterior, nuevo })}
          />
        ) : (
          <span className="block py-1 text-sm font-medium md:text-right">{l.valor != null ? formatoDinero(l.valor, moneda, lang) : '—'}</span>
        )}
      </div>
      <div><EstadoRubro estado={l.estado} /></div>
      <div><OrigenDato origen={l.origen} /></div>
    </li>
  );
}

export default function EtapaCostos({ s }) {
  const { t, lang } = useI18n();
  const { sim, vivo, actualizar, calcular, faltantes, historial, estado } = s;
  const [modulo, setModulo] = useState('A');
  const [nombreOtro, setNombreOtro] = useState('');
  const moneda = sim.operacion.moneda;
  const r = vivo.rentabilidad;
  const lineas = vivo.lineas.filter((l) => l.modulo === modulo);
  const presentes = new Set(vivo.lineas.map((l) => l.codigo));
  const opcionales = PARAMS.rubros.filter((c) => c.modulo === modulo && !c.obligatorio && c.calculo === 'TARIFA' && !presentes.has(c.codigo) && (!c.perspectiva || c.perspectiva === vivo.perspectiva));
  const pct = (v) => (v == null ? null : Number((v * 100).toPrecision(10)));
  const fraccion = (v) => (v == null ? null : v / 100);
  const margenMal = sim.margenObjetivo != null && (sim.margenObjetivo < 0 || sim.margenObjetivo >= 1);
  const indice = MODULOS.indexOf(modulo);
  const estados = Object.fromEntries(MODULOS.map((m) => [m, estadoTramo(vivo.lineas.filter((l) => l.modulo === m), vivo.perspectiva)]));
  const origenPendiente = origenPorCubrir(vivo.lineas);
  // Regla: sin los costos de origen cubiertos no se pasa de ese tramo
  const bloqueadoDesde = (i) => i > MODULOS.indexOf('B') && origenPendiente.length > 0;
  const ir = (m) => {
    setModulo(m);
    document.getElementById('tramo-actual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const contraparte = t('sim.cos.contraparte.' + vivo.perspectiva);
  const incoterm = sim.operacion.incoterm || 'FOB';

  const anadirOtro = () => {
    if (!nombreOtro.trim()) return;
    actualizar((sm) => ({ ...sm, otros: [...sm.otros, { id: nuevoId(), modulo, nombre: nombreOtro.trim(), valor: null }] }));
    setNombreOtro('');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.cos.titulo')}</h1>
        <p className="m-0 max-w-[680px] text-sm leading-[1.5] text-muted">{t('sim.cos.ayuda')}</p>
      </div>

      <nav aria-label={t('sim.cos.ruta')}>
        <ol className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-6">
          {MODULOS.map((m, i) => (
            <PasoTramo key={m} n={i + 1} m={m} activo={modulo === m} estado={estados[m]} bloqueado={bloqueadoDesde(i)} onClick={() => ir(m)} />
          ))}
        </ol>
      </nav>

      <Tarjeta className="flex flex-col gap-3">
        <div id="tramo-actual" className="flex scroll-mt-4 flex-col gap-1">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">{t('sim.cos.tramoDe', { n: indice + 1, t: MODULOS.length })}</span>
          <h2 className="m-0 font-serif text-[24px] leading-tight font-semibold">{t('sim.cos.pasos.' + modulo + '.titulo')}</h2>
          <p className="m-0 text-sm leading-normal text-muted">{t('sim.cos.pasos.' + modulo + '.desc')}</p>
        </div>

        {lineas.some((l) => l.origen === 'TENTATIVA' && l.suma) && (
          <Aviso tono="azul" titulo={t('sim.cos.avisoTentativoT')}>
            {t('sim.cos.avisoTentativo')}
          </Aviso>
        )}
        {estados[modulo] === 'CONTRAPARTE' && <Aviso tono="menta">{t('sim.cos.avisoContraparte', { i: incoterm, c: contraparte })}</Aviso>}
        {estados[modulo] === 'PENDIENTE' && (
          <Aviso tono="arcilla">
            {modulo === 'B' ? t('sim.cos.avisoOrigen') : t('sim.cos.avisoPendiente')}
          </Aviso>
        )}

        <div className="hidden grid-cols-[minmax(0,1fr)_150px_170px_150px] gap-3 border-b border-line pb-2 text-xs font-semibold text-muted md:grid">
          <span>{t('sim.cos.rubro')}</span>
          <span className="text-right">{t('sim.cos.valor')} ({moneda})</span>
          <span>{t('sim.cos.estado')}</span>
          <span>{t('sim.cos.origen')}</span>
        </div>
        {lineas.length ? (
          <ul className="m-0 list-none p-0">
            {lineas.map((l) => (
              <FilaRubro key={l.id} l={l} s={s} />
            ))}
          </ul>
        ) : (
          <p className="m-0 py-3 text-sm text-muted">{t('sim.cos.sinRubros')}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-end gap-2">
            <Campo label={t('sim.cos.anadirOtro')} className="flex-1">
              <Texto valor={nombreOtro} placeholder={t('sim.cos.otroEjemplo.' + modulo)} onCambio={setNombreOtro} onKeyDown={(e) => e.key === 'Enter' && anadirOtro()} />
            </Campo>
            <Button variant="outline-ink" aria-label={t('sim.cos.anadirOtro')} className="min-h-[50px]" onClick={anadirOtro} disabled={!nombreOtro.trim()}>
              <Plus size={16} />
            </Button>
          </div>
          {opcionales.length > 0 && (
            <Campo label={t('sim.cos.activarRubro')}>
              <Opciones
                valor=""
                vacio={t('sim.cos.elegirRubro')}
                opciones={opcionales.map((c) => ({ id: c.codigo, label: c.nombre[lang] }))}
                onCambio={(codigo) => codigo && actualizar((sm) => ({ ...sm, rubrosActivados: [...sm.rubrosActivados, codigo] }))}
              />
            </Campo>
          )}
        </div>

        {modulo === 'E' && (
          <>
            {vivo.perspectiva === 'C' && (
              <Campo label={t('sim.cos.arancel')} ayuda={t('sim.cos.arancelAyuda')} className="max-w-[320px]">
                <Numero valor={pct(sim.arancelPct)} onCambio={(v) => actualizar({ arancelPct: fraccion(v) })} />
              </Campo>
            )}
            <Aviso tono="oro">{PARAMS.textosLegales.tributos[lang]}</Aviso>
          </>
        )}
        {modulo === 'F' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label={t('sim.cos.comision')}>
              <Numero valor={pct(sim.comisionPct)} onCambio={(v) => actualizar({ comisionPct: fraccion(v) })} />
            </Campo>
            <Campo label={t('sim.cos.contingencia')}>
              <Numero valor={pct(sim.contingenciaPct)} onCambio={(v) => actualizar({ contingenciaPct: fraccion(v) })} />
            </Campo>
            <Campo label={t('sim.cos.margen')} ayuda={t('sim.cos.margenAyuda')} error={margenMal ? t('sim.cos.margenError') : null}>
              <Numero valor={pct(sim.margenObjetivo)} onCambio={(v) => actualizar({ margenObjetivo: fraccion(v) })} />
            </Campo>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mist-2 px-4 py-3">
          <span className="text-sm">{t('sim.cos.subtotal', { m: t('sim.cos.pasos.' + modulo + '.titulo') })}</span>
          <span className="font-serif text-xl font-semibold">{formatoDinero(vivo.subtotales[modulo], moneda, lang)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {indice > 0 ? (
            <Button variant="outline" size="sm" onClick={() => ir(MODULOS[indice - 1])}>
              <ChevronLeft size={14} />
              {t('sim.cos.pasos.' + MODULOS[indice - 1] + '.titulo')}
            </Button>
          ) : (
            <span />
          )}
          {indice < MODULOS.length - 1 ? (
            <Button variant="ink" onClick={() => ir(MODULOS[indice + 1])} disabled={bloqueadoDesde(indice + 1)}>
              {t('sim.cos.siguienteTramo', { p: t('sim.cos.pasos.' + MODULOS[indice + 1] + '.titulo') })}
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="gold" onClick={calcular} disabled={faltantes.length > 0}>
              {t('sim.cos.calcular')}
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
        {bloqueadoDesde(indice + 1) && <p className="m-0 text-right text-xs text-[#8f3f22]">{t('sim.cos.bloqueado')}</p>}
      </Tarjeta>

      <Tarjeta className="flex flex-col gap-4">
        <Campo label={t('sim.cos.trm')} ayuda={t('sim.cos.trmAyuda')} className="max-w-[320px]">
          <Numero valor={sim.trmUsuario ?? PARAMS.fx.copPorUnidad.USD} onCambio={(v) => actualizar({ trmUsuario: v && v > 0 ? v : null })} />
        </Campo>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-4 text-white md:px-5">
          <div className="flex flex-col">
            <span className="text-sm text-pale">{r.parcial ? t('sim.cos.totalParcial') : t('sim.cos.total')}</span>
            <span className="font-serif text-[28px] leading-tight font-semibold">{formatoDinero(r.total, moneda, lang)}</span>
          </div>
          <Button variant="gold" size="lg" lift disabled={faltantes.length > 0} onClick={calcular}>
            {estado === 'BORRADOR' && !s.snapshot ? t('sim.cos.calcular') : t('sim.cos.recalcular')}
            <ArrowRight />
          </Button>
        </div>
        {r.faltantes.length > 0 && <p className="m-0 text-sm text-muted">{t('sim.res.faltantes', { l: r.faltantes.map((f) => f.nombre[lang]).join(', ') })}</p>}
        {faltantes.length > 0 && <Aviso tono="arcilla">{t('sim.cos.faltan', { f: faltantes.map((f) => t('sim.faltante.' + f)).join(', ') })}</Aviso>}

        <details className="text-sm">
          <summary className="min-h-7 cursor-pointer font-semibold">{t('sim.cos.historial')} ({historial.length})</summary>
          {historial.length === 0 ? (
            <p className="mt-2 mb-0 text-muted">{t('sim.cos.historialVacio')}</p>
          ) : (
            <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-muted">
              {historial.slice(0, 30).map((h, i) => (
                <li key={i}>
                  {new Date(h.fecha).toLocaleString(lang === 'en' ? 'en-US' : 'es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' })} ·{' '}
                  {t('sim.cos.historialFila', { r: h.rubro, a: typeof h.anterior === 'number' ? formatoDinero(h.anterior, moneda, lang) : (h.anterior ?? '—'), b: typeof h.nuevo === 'number' ? formatoDinero(h.nuevo, moneda, lang) : (h.nuevo ?? '—') })}
                </li>
              ))}
            </ul>
          )}
        </details>
      </Tarjeta>
    </div>
  );
}

