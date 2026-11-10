import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { camposPorModalidad, distribuirCarga } from '../../engine/cubicaje';
import { formatoKg, formatoM3, formatoNumero, formatoPct } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { Aviso, Tarjeta } from './Campos';
import VisorCarga from './VisorCarga';

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink-3 py-2 text-sm last:border-0">
      <span className="text-pale">{etiqueta}</span>
      <span className="text-right font-semibold">{valor}</span>
    </div>
  );
}

function Cifra({ etiqueta, valor, nota }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-white px-4 py-3">
      <span className="text-[13px] text-muted">{etiqueta}</span>
      <span className="font-serif text-[24px] leading-tight font-semibold">{valor}</span>
      {nota && <span className="text-xs text-muted">{nota}</span>}
    </div>
  );
}

// Pantalla 10 del deck: "Cubicaje · resultado". El usuario cambia de equipo y compara al instante.
export default function ResultadoCubicaje({ s }) {
  const { t, lang } = useI18n();
  const { sim, vivo, actualizar, actualizarOperacion, irA } = s;
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const modalidad = sim.operacion.modalidad;
  const porEvaluar = modalidad === 'POR_EVALUAR';
  const campos = camposPorModalidad(modalidad);
  const c = vivo.cubicaje;
  const b = vivo.bases;

  // RN-OPE-05: las pestañas siguen la modalidad; con POR_EVALUAR se comparan todas (RN-CUB-12)
  const tabs = [];
  if (campos.equipo) {
    for (const e of PARAMS.equipos) tabs.push({ id: e.id, tipo: 'EQUIPO', label: e.nombre[lang], disabled: !e.habilitado, ev: vivo.equipos.find((x) => x.equipoId === e.id) });
  }
  if (porEvaluar || modalidad === 'MARITIMA_LCL') tabs.push({ id: 'LCL', tipo: 'LCL', label: t('sim.cub.tab.LCL') });
  if (porEvaluar || modalidad === 'AEREA') tabs.push({ id: 'AEREO', tipo: 'AEREO', label: t('sim.cub.tab.AEREO') });
  if (modalidad === 'COURIER') tabs.push({ id: 'COURIER', tipo: 'AEREO', label: t('sim.modalidad.COURIER') });
  if (porEvaluar || modalidad === 'TERRESTRE') tabs.push({ id: 'TERRESTRE', tipo: 'TERRESTRE', label: t('sim.cub.tab.TERRESTRE'), disabled: porEvaluar });

  const primerEquipo = PARAMS.equipos.find((e) => e.habilitado)?.id;
  const defecto = campos.equipo ? (sim.equipoId ?? vivo.seleccion?.equipoId ?? primerEquipo) : tabs[0]?.id;
  const activo = tabs.some((x) => x.id === vistaPrevia && !x.disabled) ? vistaPrevia : defecto;
  const tab = tabs.find((x) => x.id === activo) ?? tabs[0];
  const equipo = tab?.tipo === 'EQUIPO' ? PARAMS.equipos.find((e) => e.id === tab.id) : null;
  const ev = equipo ? vivo.equipos.find((x) => x.equipoId === equipo.id) : null;
  const bloques = useMemo(() => (equipo ? distribuirCarga(equipo, sim.referencias, c) : []), [equipo, sim.referencias, c]);

  if (!c.referencias.length) {
    return (
      <Tarjeta className="flex flex-col items-start gap-3">
        <h1 className="m-0 font-serif text-[28px] font-semibold">{t('sim.cub.resultado')}</h1>
        <p className="m-0 text-sm text-muted">{t('sim.cub.sinCarga')}</p>
        <Button variant="ink" onClick={() => irA('cubicaje')}>{t('sim.cub.volverReferencias')}</Button>
      </Tarjeta>
    );
  }

  const n0 = (v) => formatoNumero(v, 0, lang);
  const cantidad = equipo && vivo.seleccion?.equipoId === equipo.id ? vivo.seleccion.cantidad : 1;
  const noUbicados = ev && cantidad === 1 ? ev.noUbicados : [];
  const esRecomendado = !!equipo && !!vivo.seleccion?.recomendado && vivo.seleccion.equipoId === equipo.id;
  const courier = tab.id === 'COURIER';

  const filas = [];
  if (equipo) {
    if (cantidad > 1) filas.push([t('sim.cub.unidadesEquipo'), n0(cantidad)]);
    if (c.totalPallets) filas.push([t('sim.cub.pallets'), n0(c.totalPallets)]);
    filas.push([t('sim.cub.volSuelto'), formatoM3(c.volumenSueltoCm3, lang)]);
    if (c.hayPaletizacion) filas.push([t('sim.cub.volPaletizado'), formatoM3(c.volumenCargaCm3, lang)]);
    filas.push([t('sim.cub.pesoBrutoTotal'), formatoKg(c.pesoCargaG, lang)]);
    if (c.totalPallets && ev?.posicionesPiso) filas.push([t('sim.cub.posiciones'), t('sim.cub.posicionesValor', { u: n0(ev.posicionesUsadas), t: n0(ev.posicionesPiso * cantidad) })]);
    if (ev) filas.push([t('sim.cub.ocupPeso'), formatoPct(ev.ocupacionPeso, lang)]);
  } else {
    filas.push([t('sim.cub.bultosTotal'), n0(c.totalBultos)]);
    if (tab.tipo !== 'AEREO' && c.totalPallets) filas.push([t('sim.cub.pallets'), n0(c.totalPallets)]);
    filas.push([t('sim.cub.volSuelto'), formatoM3(c.volumenSueltoCm3, lang)]);
    if (tab.tipo !== 'AEREO' && c.hayPaletizacion) filas.push([t('sim.cub.volPaletizado'), formatoM3(c.volumenCargaCm3, lang)]);
    if (tab.tipo === 'AEREO') {
      filas.push([t('sim.cub.pesoReal'), formatoKg(c.pesoBrutoG, lang)]);
      filas.push([t('sim.cub.volumetrico'), `${formatoNumero(courier ? b.courierVolumetricoKg : b.aereoVolumetricoKg, 2, lang)} kg`]);
      filas.push([t('sim.cub.cobrable'), `${formatoNumero(courier ? b.courierCobrableKg : b.aereoCobrableKg, 2, lang)} kg`]);
    } else {
      filas.push([t('sim.cub.pesoBrutoTotal'), formatoKg(c.pesoCargaG, lang)]);
      if (tab.tipo === 'LCL') filas.push([t('sim.cub.wm'), `${formatoNumero(b.wmCarga, 2, lang)} W/M`]);
    }
  }

  const alertaPaletizacion = vivo.alertas.find((a) => a.id === 'paletizacion-lcl');
  const usarModalidad = (m) => {
    actualizarOperacion({ modalidad: m });
    setVistaPrevia(null);
  };

  const base = (o) => {
    if (o.unidad === 'WM') return `${formatoNumero(o.base, 2, lang)} W/M`;
    if (o.unidad === 'KG') return `${formatoNumero(o.base, 2, lang)} kg`;
    if (o.unidad === 'EQUIPO') return t('sim.cub.equipos', { n: o.base });
    return '—';
  };

  return (
    <div className="flex flex-col gap-4">
      <Tarjeta className="flex flex-col gap-4">
        <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.cub.resultado')}</h1>

        <div role="group" aria-label={t('sim.cub.equipoLabel')} className="flex flex-wrap gap-2">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === activo}
              disabled={x.disabled}
              title={x.disabled ? t('sim.cub.noDisponible') : undefined}
              onClick={() => {
                if (x.tipo === 'EQUIPO') {
                  setVistaPrevia(null);
                  actualizar({ equipoId: x.id });
                } else setVistaPrevia(x.id);
              }}
              className={'min-h-10 cursor-pointer rounded-full border-[1.5px] px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45 ' + (x.id === activo ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')}
            >
              {x.label}
              {x.disabled && ` · ${t('sim.cub.noDisponible')}`}
              {x.ev && !x.ev.factible && ` · ${t('sim.cub.noFactible')}`}
            </button>
          ))}
          {campos.equipo && sim.equipoId && (
            <button type="button" onClick={() => actualizar({ equipoId: null })} className="min-h-10 cursor-pointer border-0 bg-transparent px-2 text-sm font-medium text-ink underline">
              {t('sim.cub.usarRecomendado')}
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          {equipo ? (
            <VisorCarga equipo={equipo} bloques={bloques} cubicaje={c} referencias={sim.referencias} secuencia />
          ) : (
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-col gap-3 rounded-2xl bg-[#e7eee8] p-3 md:p-4">
                {tab.tipo === 'LCL' && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Cifra etiqueta={t('sim.cub.wmSuelto')} valor={`${formatoNumero(b.wmSuelto, 2, lang)} W/M`} />
                      {c.hayPaletizacion && <Cifra etiqueta={t('sim.cub.wmPaletizado')} valor={`${formatoNumero(b.wmCarga, 2, lang)} W/M`} />}
                    </div>
                    {alertaPaletizacion && <Aviso tono="arcilla">{alertaPaletizacion.texto[lang]}</Aviso>}
                  </>
                )}
                {tab.tipo === 'AEREO' && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Cifra etiqueta={t('sim.cub.pesoReal')} valor={formatoKg(c.pesoBrutoG, lang)} />
                    <Cifra
                      etiqueta={t('sim.cub.volumetrico')}
                      valor={`${formatoNumero(courier ? b.courierVolumetricoKg : b.aereoVolumetricoKg, 2, lang)} kg`}
                      nota={t('sim.cub.factor', { f: formatoNumero(courier ? PARAMS.factorCourierCm3Kg : PARAMS.factorAereoCm3Kg, 0, lang) })}
                    />
                    <Cifra etiqueta={t('sim.cub.cobrable')} valor={`${formatoNumero(courier ? b.courierCobrableKg : b.aereoCobrableKg, 2, lang)} kg`} />
                  </div>
                )}
                {tab.tipo === 'TERRESTRE' && <p className="m-0 text-sm">{t('sim.cub.terrestreSinDatos')}</p>}
                {porEvaluar && tab.tipo !== 'TERRESTRE' && (
                  <Button variant="outline-ink" className="self-start bg-white" onClick={() => usarModalidad(tab.tipo === 'LCL' ? 'MARITIMA_LCL' : 'AEREA')}>
                    {t('sim.cub.usarModalidad')}
                  </Button>
                )}
              </div>
              <Aviso tono="oro">{PARAMS.textosLegales.cubicaje[lang]}</Aviso>
            </div>
          )}

          <div className="flex min-w-0 flex-col self-start rounded-2xl bg-ink p-4 text-white md:p-5">
            <span className="text-sm text-pale">{equipo ? (esRecomendado ? t('sim.cub.recomendado') : t('sim.cub.seleccionado')) : t('sim.res.modalidad')}</span>
            <span className="mb-2 font-serif text-[26px] font-semibold">{equipo ? equipo.nombre[lang] : tab.label}</span>
            {filas.map(([k, v]) => (
              <Fila key={k} etiqueta={k} valor={v} />
            ))}
            {ev && (
              <div className="mt-3 flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-gold">
                  {t('sim.cub.ocupVol')}: {formatoPct(ev.ocupacionVolumen / cantidad, lang)}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-ink-3" role="presentation">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (ev.ocupacionVolumen / cantidad) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {noUbicados.length > 0 && (
          <Aviso tono="arcilla" titulo={`${t('sim.cub.noUbicados')}:`}>
            <ul className="m-0 mt-1 list-disc pl-5">
              {noUbicados.map((n) => (
                <li key={n.referenciaId + n.motivo}>{t('sim.cub.noUbicadosFila', { n: n.nombre, c: n0(n.cantidad), m: t('sim.cub.motivo.' + n.motivo) })}</li>
              ))}
            </ul>
          </Aviso>
        )}
      </Tarjeta>

      {porEvaluar && (
        <Tarjeta className="flex flex-col gap-2">
          <h2 className="m-0 font-serif text-xl font-semibold">{t('sim.cub.comparativo')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="bg-mist-2 text-left">
                  <th className="px-3 py-2 font-semibold">{t('sim.cub.compOpcion')}</th>
                  <th className="px-3 py-2 font-semibold">{t('sim.cub.compBase')}</th>
                  <th className="px-3 py-2 font-semibold">{t('sim.cub.compLectura')}</th>
                </tr>
              </thead>
              <tbody>
                {vivo.comparativo.map((o) => (
                  <tr key={o.id} className="border-b border-line-2">
                    <td className="px-3 py-2 font-medium">
                      {t('sim.cub.opcion.' + o.id)}
                      {o.equipoId && ` ${PARAMS.equipos.find((e) => e.id === o.equipoId)?.nombre[lang]}`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{base(o)}</td>
                    <td className="px-3 py-2 text-muted">{t('sim.cub.lectura.' + o.id, { o: o.ocupacion != null ? formatoPct(o.ocupacion, lang) : '—' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {alertaPaletizacion && <p className="m-0 text-sm text-clay italic">{alertaPaletizacion.texto[lang]}</p>}
        </Tarjeta>
      )}
    </div>
  );
}
