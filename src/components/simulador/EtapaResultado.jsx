import { useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { enlaceWhatsApp } from '../../lib/contacto';
import { formatoDinero, formatoKg, formatoM3, formatoNumero, formatoPct } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { Download, Refresh } from '../ui/Icons';
import { Aviso, Dato, ListaAlertas, Tarjeta } from './Campos';
import BotonWhatsApp from './BotonWhatsApp';
import Escenarios from './Escenarios';
import VisorCarga from './VisorCarga';

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

export default function EtapaResultado({ s }) {
  const { t, lang } = useI18n();
  const { snapshot, estado, codigo, vencida, calcular, faltantes, irA } = s;
  const [verEscenarios, setVerEscenarios] = useState(false);
  const refEscenarios = useRef();

  if (!snapshot) {
    return (
      <Tarjeta className="flex flex-col items-start gap-3">
        <h1 className="m-0 font-serif text-[28px] font-semibold">{t('sim.res.sinCalcular')}</h1>
        <p className="m-0 text-sm text-muted">{t('sim.res.sinCalcularD')}</p>
        {faltantes.length > 0 && <Aviso tono="arcilla">{t('sim.cos.faltan', { f: faltantes.map((f) => t('sim.faltante.' + f)).join(', ') })}</Aviso>}
        <Button variant="ink" onClick={() => irA('costos')}>{t('sim.res.irACostos')}</Button>
      </Tarjeta>
    );
  }

  const r = snapshot.resultado;
  const entradas = snapshot.entradas;
  const ren = r.rentabilidad;
  const op = entradas.operacion;
  const ev = r.seleccion ? r.equipos.find((e) => e.equipoId === r.seleccion.equipoId) : null;
  const equipo = r.seleccion ? PARAMS.equipos.find((e) => e.id === r.seleccion.equipoId) : null;
  const fecha = new Date(snapshot.calculadoEn).toLocaleString(lang === 'en' ? 'en-US' : 'es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' });
  const tresAlertas = r.alertas.slice(0, 3); // RN-RES-02
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
          <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.res.titulo')}</h1>
          {/* RN-RES-01 */}
          <p className="m-0 text-[13px] text-muted">
            {codigo} · {t('sim.res.metaFecha')} {fecha} · {r.moneda} · {t('sim.res.metaTasa', { v: formatoNumero(r.tasaReferencia, 2, lang) })} · {r.vigenciaMinima ? t('sim.res.metaVigencia', { f: r.vigenciaMinima }) : t('sim.res.metaSinVigencia')}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Dato etiqueta={t('sim.res.modalidad')} valor={t('sim.modalidad.' + r.modalidadEfectiva)} nota={`${op.origen.ciudad} → ${op.destino.ciudad}`} />
          <Dato etiqueta={t('sim.res.equipo')} valor={equipo ? equipo.nombre[lang] : t('sim.res.sinEquipo')} nota={r.cubicaje.totalPallets ? t('sim.res.nPallets', { n: formatoNumero(r.cubicaje.totalPallets, 0, lang) }) : null} />
          <Dato etiqueta={t('sim.res.carga')} valor={formatoM3(r.cubicaje.volumenCargaCm3, lang)} nota={t('sim.res.kgBrutos', { k: formatoKg(r.cubicaje.pesoCargaG, lang) })} />
          <Dato etiqueta={t('sim.res.ocupacion')} valor={ev ? formatoPct(ev.ocupacionVolumen, lang) : '—'} nota={`${ev ? `${formatoPct(ev.ocupacionPeso, lang)} ${t('sim.res.peso')} · ` : ''}${t('sim.res.completitud')} ${formatoNumero(r.completitud, 0, lang)} %`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="flex min-w-0 flex-col gap-3">
            <h2 className="m-0 font-serif text-xl font-semibold">{t('sim.res.costoTramo')} · {r.moneda}</h2>
            <CostoPorTramo r={r} incoterm={op.incoterm} />
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3">
              <span className="text-sm font-semibold">{ren.parcial ? t('sim.cos.totalParcial') : t('sim.res.totalNota')}</span>
              <span className="font-serif text-[26px] font-semibold">{formatoDinero(ren.total, r.moneda, lang)}</span>
            </div>
            {ren.parcial && <span className="text-xs text-muted">{t('sim.res.totalNota')}. {t('sim.res.faltantes', { l: ren.faltantes.map((f) => f.nombre[lang]).join(', ') })}</span>}
            {ren.costoKgNeto != null && (
              <span className="text-sm text-muted">
                {ren.parcial ? t('sim.res.unitarioParcial', { v: formatoDinero(ren.costoKgNeto, r.moneda, lang) }) : t('sim.res.unitario', { v: formatoDinero(ren.costoKgNeto, r.moneda, lang) })}
              </span>
            )}
            {ren.precioSugerido != null && (
              <div className="rounded-2xl bg-mist-2 px-4 py-3">
                <span className="block text-sm">{t('sim.res.precio', { i: op.incoterm })}{ren.parcial ? ` · ${t('sim.esc.parcial')}` : ''}</span>
                <span className="block font-serif text-2xl font-semibold">{formatoDinero(ren.precioSugerido, r.moneda, lang)}</span>
                <span className="block text-xs text-muted">{t('sim.res.utilidad', { v: formatoDinero(ren.utilidad, r.moneda, lang), m: formatoPct(ren.margen, lang) })}</span>
              </div>
            )}
          </section>
          <section className="rounded-2xl bg-[#fbf3dc] p-4">
            <h2 className="m-0 mb-3 font-serif text-xl font-semibold">{t('sim.res.alertas')}</h2>
            {tresAlertas.length ? <ListaAlertas alertas={tresAlertas} lang={lang} /> : <p className="m-0 text-sm text-muted">{t('sim.res.sinAlertas')}</p>}
          </section>
        </div>

        {/* RN-RES-09 */}
        <div className="no-print flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <Button variant="gold" size="lg" onClick={() => irA('reporte')}>
            <Download size={16} />
            {t('sim.res.desbloquear')}
          </Button>
          <BotonWhatsApp mensaje={t('sim.res.msgExperto', { c: codigo })}>{t('sim.res.experto')}</BotonWhatsApp>
          <Button
            variant="outline-ink"
            size="lg"
            onClick={() => {
              setVerEscenarios(true);
              setTimeout(() => refEscenarios.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
            }}
          >
            {t('sim.res.comparar')}
          </Button>
        </div>
        {!enlaceWhatsApp('x') && <p className="no-print m-0 text-xs text-muted">{t('sim.res.asesorInactivo')}</p>}
      </Tarjeta>

      {(verEscenarios || s.escenarios.length > 0) && (
        <div ref={refEscenarios} className="no-print min-w-0 scroll-mt-4">
          <Tarjeta>
            <Escenarios s={s} entradas={entradas} />
          </Tarjeta>
        </div>
      )}

      <Tarjeta>
        <VisorCarga equipo={equipo} bloques={r.bloques} cubicaje={r.cubicaje} referencias={entradas.referencias} />
      </Tarjeta>

      {/* RN-SEG-10: descargos visibles en pantalla e impresión */}
      <div className="flex flex-col gap-2 text-xs leading-[1.5] text-muted">
        <p className="m-0">{PARAMS.textosLegales.resultado[lang]}</p>
        <p className="m-0">{PARAMS.textosLegales.tributos[lang]}</p>
      </div>
    </div>
  );
}
