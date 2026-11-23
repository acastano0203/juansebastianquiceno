import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { EXPLICACION_INCOTERM } from '../../config/asistente/asistente.config';
import { EMPAQUES } from '../../config/asistente/cubicaje.config';
import { partidaPorCodigo } from '../../config/asistente/partidas';
import { enlaceWhatsApp } from '../../lib/contacto';
import { formatoDinero, formatoNumero } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { Download, Refresh } from '../ui/Icons';
import { Aviso, Dato, ListaAlertas, Tarjeta } from './Campos';
import BotonWhatsApp from './BotonWhatsApp';
import { primeraPendiente } from './asistente/etapas';

// Una sola serie: barras delgadas con su valor al lado; el tramo se nombra en cada fila
function CostoPorTramo({ r, incoterm }) {
  const { t, lang } = useI18n();
  const maximo = Math.max(...r.tramos.map((x) => x.valor), 1);
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {r.tramos.map((x) => (
        <li key={x.tramo} className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-2 text-sm sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-3">
          <span>{t('sim.res.tramos.' + x.tramo)}</span>
          {x.aplica ? (
            <>
              <span className="block h-3" role="presentation">
                {x.valor > 0 && <span className="block h-full rounded-r bg-ink" style={{ width: `${Math.max(2, (x.valor / maximo) * 100)}%` }} />}
              </span>
              <span className="text-right font-semibold whitespace-nowrap">
                {formatoNumero(x.valor, r.moneda === 'COP' ? 0 : 2, lang)}
                {x.pendiente && <span className="block text-xs font-normal text-[#8f3f22]">{t('sim.res.pendiente')}</span>}
                {!x.pendiente && x.tentativo && <span className="block text-xs font-normal text-[#4b3474]">{t('sim.res.tentativo')}</span>}
              </span>
            </>
          ) : (
            <span className="col-span-2 text-muted italic">{t('sim.res.noAplica', { i: incoterm })}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Lo que el asistente dedujo, explicado en una línea cada cosa. Se usa en el resultado y en el reporte. */
export function ResumenSimple({ snapshot }) {
  const { t, lang } = useI18n();
  const a = snapshot.asistente;
  const resp = snapshot.respuestas;
  const cub = a.cubicaje;
  const n = (v, d = 0) => formatoNumero(v, d, lang);
  const partida = partidaPorCodigo(resp.partida);
  const e = cub ? EMPAQUES[cub.empaque] : null;
  const unidades = cub && e.forma !== 'granel' ? t('asi.emp.unidad.' + cub.empaque, { n: n(cub.unidades) }) : null;
  const contenedores = cub?.fcl?.elegido ? `${cub.fcl.elegido.cantidad} × ${t('asi.contenedor.' + cub.fcl.elegido.contenedorId)}` : null;

  let cobro = null;
  if (cub?.tipoCarga === 'LCL') cobro = t('asi.res.cobroLcl', { m: n(cub.wm.cobrable, 2), t: n(cub.wm.pesoT, 2), v: n(cub.wm.volumenM3, 2), q: t('asi.cub.mandaV.' + cub.wm.manda).toLowerCase() });
  if (cub?.tipoCarga === 'AEREO') cobro = t('asi.res.cobroKg', { k: n(cub.aereo.cobrableKg, 1), r: n(cub.aereo.realKg, 1), v: n(cub.aereo.volumetricoKg, 1), f: cub.aereo.factor });
  if (cub?.tipoCarga === 'COURIER') cobro = t('asi.res.cobroKg', { k: n(cub.courier.cobrableKg, 1), r: n(cub.courier.realKg, 1), v: n(cub.courier.volumetricoKg, 1), f: cub.courier.factor });

  const filas = [
    { k: t('asi.res.modalidad'), v: t('asi.via.nombre.' + a.via), d: t('asi.tipoCarga.' + cub?.tipoCarga) },
    { k: t('asi.res.incoterm'), v: a.incoterm, d: EXPLICACION_INCOTERM[a.incoterm]?.[lang] },
    { k: t('asi.res.partida'), v: partida?.codigo, d: partida?.nombre[lang] },
    unidades && { k: t('asi.res.unidades'), v: unidades, d: cub.plan ? t(cub.pallets.length === 1 ? 'asi.res.enPallet' : 'asi.res.enPallets', { p: n(cub.pallets.length), u: n(cub.plan.unidadesPorPallet), tipo: t('asi.palletNombre.' + cub.palletId) }) : t('asi.res.sinPallet') },
    contenedores && { k: t('asi.res.contenedores'), v: contenedores, d: t('asi.res.contenedoresD') },
    cub && { k: t('asi.res.carga'), v: `${n(cub.volumenM3, 2)} m³ · ${n(cub.pesoBrutoKg)} kg`, d: cobro },
  ].filter(Boolean);

  return (
    <dl className="m-0 grid gap-2.5 sm:grid-cols-2">
      {filas.map((f) => (
        <div key={f.k} className="flex break-inside-avoid flex-col gap-0.5 rounded-2xl bg-mist-2 px-4 py-3">
          <dt className="text-[13px] text-muted">{f.k}</dt>
          <dd className="m-0 font-serif text-[20px] leading-tight font-semibold">{f.v ?? '—'}</dd>
          {f.d && <dd className="m-0 text-[13px] leading-normal text-muted">{f.d}</dd>}
        </div>
      ))}
    </dl>
  );
}

export default function EtapaResultado({ s }) {
  const { t, lang } = useI18n();
  const { snapshot, estado, codigo, vencida, calcular, faltantes, irA, captura3D, respuestas, completas } = s;

  if (!snapshot) {
    const pendiente = primeraPendiente(respuestas, completas);
    return (
      <Tarjeta className="flex flex-col items-start gap-3">
        <h1 className="m-0 font-serif text-[28px] font-semibold">{t('asi.res.sinCalcular')}</h1>
        <p className="m-0 text-sm text-muted">{pendiente ? t('asi.res.sinCalcularD', { p: t('sim.etapas.' + pendiente) }) : t('asi.res.listo')}</p>
        {pendiente ? <Button variant="ink" onClick={() => irA(pendiente)}>{t('asi.res.irA', { p: t('sim.etapas.' + pendiente) })}</Button> : <Button variant="ink" disabled={faltantes.length > 0} onClick={calcular}>{t('asi.res.calcular')}</Button>}
      </Tarjeta>
    );
  }

  const r = snapshot.resultado;
  const ren = r.rentabilidad;
  const op = snapshot.entradas.operacion;
  const conCostos = snapshot.respuestas.necesidad !== 'CUBICAJE';
  const libras = snapshot.entradas.productos.reduce((x, p) => x + p.cantidad, 0) * PARAMS.kgALibra;
  const fecha = new Date(snapshot.calculadoEn).toLocaleString(lang === 'en' ? 'en-US' : 'es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
  const desactualizado = estado === 'BORRADOR';

  return (
    <div className="flex flex-col gap-4">
      {vencida && (
        <Aviso tono="arcilla" className="no-print flex flex-wrap items-center justify-between gap-3">
          <span>{t('sim.res.vencida', { f: r.vigenciaMinima })}</span>
          <Button variant="ink" size="sm" onClick={calcular}><Refresh size={14} />{t('sim.cos.recalcular')}</Button>
        </Aviso>
      )}
      {desactualizado && !vencida && (
        <Aviso tono="oro" className="no-print flex flex-wrap items-center justify-between gap-3">
          <span>{t('sim.res.desactualizado')}</span>
          <Button variant="ink" size="sm" disabled={faltantes.length > 0} onClick={calcular}><Refresh size={14} />{t('sim.cos.recalcular')}</Button>
        </Aviso>
      )}

      <Tarjeta className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('asi.res.titulo')}</h1>
          <p className="m-0 text-[13px] text-muted">
            {codigo} · {fecha} · {op.origen.ciudad} → {op.destino.ciudad}
          </p>
        </header>
        <Aviso tono="oro">{t('asi.res.estimacion')}</Aviso>

        {conCostos && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Dato etiqueta={ren.parcial ? t('sim.cos.totalParcial') : t('asi.res.total')} valor={formatoDinero(ren.total, r.moneda, lang)} nota={t('asi.res.totalNota', { i: op.incoterm })} />
            <Dato etiqueta={t('asi.res.porLibra')} valor={libras > 0 ? formatoDinero(ren.total / libras, r.moneda, lang) : '—'} nota={t('asi.res.porLibraNota')} />
            {ren.precioSugerido != null && <Dato etiqueta={t('asi.res.precioVenta')} valor={libras > 0 ? formatoDinero(ren.precioSugerido / libras, r.moneda, lang) : '—'} nota={t('asi.res.precioVentaNota', { m: formatoNumero((ren.margen ?? 0) * 100, 0, lang) })} />}
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="m-0 font-serif text-xl font-semibold">{t('asi.res.loQueCalculamos')}</h2>
          <ResumenSimple snapshot={snapshot} />
          {snapshot.asistente.precioEsReferencia && conCostos && <p className="m-0 text-xs text-muted">{t('asi.res.precioReferencia', { v: formatoDinero(snapshot.asistente.precioLibraCop, 'COP', lang) })}</p>}
        </section>

        {captura3D && (
          <figure className="m-0 flex flex-col gap-1.5">
            <img src={captura3D} alt={t('asi.res.imagenAlt')} className="w-full rounded-2xl border border-line" />
            <figcaption className="text-xs text-muted">{t('asi.res.imagenPie')}</figcaption>
          </figure>
        )}

        {conCostos && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="flex min-w-0 flex-col gap-3">
              <h2 className="m-0 font-serif text-xl font-semibold">{t('sim.res.costoTramo')} · {r.moneda}</h2>
              <CostoPorTramo r={r} incoterm={op.incoterm} />
            </section>
            <section className="rounded-2xl bg-[#fbf3dc] p-4">
              <h2 className="m-0 mb-3 font-serif text-xl font-semibold">{t('sim.res.alertas')}</h2>
              {r.alertas.length ? <ListaAlertas alertas={r.alertas.slice(0, 3)} lang={lang} /> : <p className="m-0 text-sm text-muted">{t('sim.res.sinAlertas')}</p>}
            </section>
          </div>
        )}

        <div className="no-print flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Button variant="gold" size="lg" onClick={() => irA('reporte')}>
            <Download size={16} />
            {t('sim.res.desbloquear')}
          </Button>
          <BotonWhatsApp mensaje={t('sim.res.msgExperto', { c: codigo })}>{t('sim.res.experto')}</BotonWhatsApp>
          <Button variant="outline-ink" size="lg" onClick={() => irA('empaque')}>{t('asi.res.verCarga')}</Button>
        </div>
        {!enlaceWhatsApp('x') && <p className="no-print m-0 text-xs text-muted">{t('sim.res.asesorInactivo')}</p>}
      </Tarjeta>

      {/* RN-SEG-10: descargos visibles en pantalla e impresión */}
      <div className="flex flex-col gap-2 text-xs leading-[1.5] text-muted">
        <p className="m-0">{PARAMS.textosLegales.resultado[lang]}</p>
        <p className="m-0">{PARAMS.textosLegales.cubicaje[lang]}</p>
      </div>
    </div>
  );
}
