import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/LanguageContext';
import { EMPAQUES } from '../../../config/asistente/cubicaje.config';
import { formatoNumero, formatoPct } from '../../../engine/unidades';
import { Download, Refresh } from '../../ui/Icons';
import { Aviso } from '../Campos';

const Visor3D = lazy(() => import('./Visor3D'));

const hayWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

// En móvil o con equipo modesto: menos detalle y sin sombras
const esLigero = () => {
  try {
    return window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  } catch {
    return false;
  }
};

class SinWebGL extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.alterno : this.props.children;
  }
}

function Barra({ etiqueta, valor, alerta }) {
  const { lang } = useI18n();
  const pct = Math.max(0, Math.min(1, valor ?? 0));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="text-muted">{etiqueta}</span>
        <span className={'font-semibold ' + (alerta ? 'text-[#B3261E]' : '')}>{valor == null ? '—' : formatoPct(valor, lang)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line-2" role="presentation">
        <div className={'h-full rounded-full ' + (alerta ? 'bg-[#B3261E]' : 'bg-ink')} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function Fila({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line-2 py-1.5 text-[13px] last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="m-0 text-right font-semibold">{v}</dd>
    </div>
  );
}

/** Indicadores numéricos: se leen sin depender del 3D */
export function Indicadores({ cub, escena }) {
  const { t, lang } = useI18n();
  const n = (v, d = 0) => formatoNumero(v, d, lang);
  const ind = escena.indicadores;
  const e = EMPAQUES[cub.empaque];
  const unidad = t('asi.emp.unidad.' + cub.empaque, { n: '' }).trim();
  return (
    <div className="flex flex-col gap-3">
      {escena.tipo === 'FCL' && (
        <>
          <Barra etiqueta={t('asi.cub.ocupVol')} valor={ind.ocupacionVolumen} />
          <Barra etiqueta={t('asi.cub.ocupPeso')} valor={ind.ocupacionPeso} alerta={escena.alertas.includes('SOBREPESO')} />
        </>
      )}
      <dl className="m-0">
        {e.forma !== 'granel' && <Fila k={t('asi.cub.unidades')} v={`${n(ind.unidades)} ${unidad}`} />}
        {ind.pallets > 0 && <Fila k={t('asi.cub.pallets')} v={n(ind.pallets)} />}
        {cub.plan && <Fila k={t('asi.cub.porPallet')} v={t('asi.cub.porPalletV', { u: n(cub.plan.unidadesPorPallet), c: n(cub.plan.capas) })} />}
        <Fila k={t('asi.cub.peso')} v={`${n(ind.pesoKg)} kg`} />
        <Fila k={t('asi.cub.volumen')} v={`${n(ind.volumenM3, 2)} m³`} />
        {ind.espacioLibreM3 != null && <Fila k={t('asi.cub.libre')} v={`${n(ind.espacioLibreM3, 2)} m³`} />}
        {ind.limiteKg != null && <Fila k={t('asi.cub.limite')} v={`${n(ind.limiteKg)} kg`} />}
        {ind.manda && <Fila k={t('asi.cub.manda')} v={t('asi.cub.mandaV.' + ind.manda)} />}
        {escena.tipo === 'LCL' && <Fila k={t('asi.cub.cobrableWm')} v={`${n(cub.wm.cobrable, 2)} m³`} />}
        {escena.tipo === 'SUELTA' && cub.tipoCarga === 'AEREO' && <Fila k={t('asi.cub.cobrableKg')} v={`${n(cub.aereo.cobrableKg, 1)} kg`} />}
        {escena.tipo === 'SUELTA' && cub.tipoCarga === 'COURIER' && <Fila k={t('asi.cub.cobrableKg')} v={`${n(cub.courier.cobrableKg, 1)} kg`} />}
      </dl>
    </div>
  );
}

export default function PanelCubicaje({ cub, onCaptura }) {
  const { t, lang } = useI18n();
  const [indice, setIndice] = useState(0);
  const escena = cub.escenas[Math.min(indice, cub.escenas.length - 1)];
  const [visibles, setVisibles] = useState(Infinity);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [hover, setHover] = useState(null);
  const [listo, setListo] = useState(0);
  const apiRef = useRef(null);
  const webgl = useMemo(hayWebGL, []);
  const ligero = useMemo(esLigero, []);
  const pasos = escena?.pasos ?? 0;
  const firma = escena ? `${escena.id}|${escena.piezas.length}|${pasos}|${cub.empaque}|${cub.palletId}` : '';

  // Cambia la escena: se muestra completa y se detiene la animación
  useEffect(() => {
    setVisibles(Infinity);
    setReproduciendo(false);
    setHover(null);
  }, [firma]);

  useEffect(() => {
    if (indice >= cub.escenas.length) setIndice(0);
  }, [cub.escenas.length, indice]);

  // Animación de carga: de adentro hacia la puerta
  useEffect(() => {
    if (!reproduciendo) return undefined;
    const paso = Math.max(1, Math.ceil(pasos / 90));
    const id = setInterval(() => {
      setVisibles((v) => {
        const siguiente = (v === Infinity ? 0 : v) + paso;
        if (siguiente >= pasos) {
          setReproduciendo(false);
          return Infinity;
        }
        return siguiente;
      });
    }, 45);
    return () => clearInterval(id);
  }, [reproduciendo, pasos]);

  // Captura automática para el reporte cuando la carga está completa y la escena quieta
  useEffect(() => {
    if (!webgl || !onCaptura || visibles !== Infinity || indice !== 0) return undefined;
    const id = setTimeout(() => {
      try {
        const url = apiRef.current?.capturar();
        if (url && url.length > 2000) onCaptura(url);
      } catch {
        // sin captura: el reporte sale sin imagen
      }
    }, 900);
    return () => clearTimeout(id);
  }, [firma, visibles, listo, webgl, onCaptura, indice]);

  if (!escena) return null;
  const metros = (m) => `${formatoNumero(m, 2, lang)} m`;
  const enAnimacion = visibles !== Infinity;
  const avance = enAnimacion ? visibles / Math.max(1, pasos) : 1;
  const sobrepeso = escena.alertas.includes('SOBREPESO');
  const cgOk = !escena.alertas.includes('CENTRO_GRAVEDAD');
  const resumen = t('asi.cub.resumenAria', { u: formatoNumero(escena.indicadores.unidades, 0, lang), kg: formatoNumero(escena.indicadores.pesoKg, 0, lang), m3: formatoNumero(escena.indicadores.volumenM3, 2, lang) });

  const descargar = () => {
    const url = apiRef.current?.capturar();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `cubicaje-${escena.id}.png`;
    a.click();
  };

  const tooltip = hover?.pieza && (
    <div className="pointer-events-none absolute z-10 rounded-xl bg-ink px-3 py-2 text-xs leading-normal text-white shadow-lg" style={{ left: Math.min(hover.x + 14, 9999), top: hover.y + 14 }}>
      <strong className="block font-semibold">{t('asi.cub.forma.' + hover.pieza.forma)} #{hover.pieza.n}</strong>
      <span className="block">{formatoNumero(hover.pieza.pesoKg, 0, lang)} kg</span>
      <span className="block text-sage">
        {t('asi.cub.posicion', { x: formatoNumero(hover.pieza.x / 1000, 2, lang), y: formatoNumero(hover.pieza.y / 1000, 2, lang), z: formatoNumero(hover.pieza.z / 1000, 2, lang) })}
      </span>
    </div>
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {cub.escenas.length > 1 && (
        <div role="tablist" aria-label={t('asi.cub.contenedores')} className="flex flex-wrap gap-1.5">
          {cub.escenas.map((e, i) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={i === indice}
              onClick={() => setIndice(i)}
              className={'min-h-9 cursor-pointer rounded-full border-[1.5px] px-3.5 text-[13px] font-medium ' + (i === indice ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')}
            >
              {t('asi.cub.contenedorN', { i: i + 1, n: cub.escenas.length })}
            </button>
          ))}
        </div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-2">
          {webgl ? (
            <div role="img" aria-label={resumen} className="relative h-[300px] min-w-0 overflow-hidden rounded-2xl border border-line bg-[#E7EEE8] sm:h-[400px]">
              <SinWebGL alterno={<p className="m-0 p-4 text-sm text-muted">{t('asi.cub.sin3d')}</p>}>
                <Suspense fallback={<p className="m-0 p-4 text-sm text-muted">{t('asi.cub.cargando3d')}</p>}>
                  <Visor3D
                    escena={escena}
                    visibles={visibles}
                    apiRef={apiRef}
                    onHover={setHover}
                    hover={hover?.pieza}
                    ligero={ligero}
                    metros={metros}
                    sobrepeso={sobrepeso}
                    cgOk={cgOk}
                    textoTuEspacio={t('asi.cub.tuEspacio', { m: formatoNumero(cub.wm.cobrable, 2, lang) })}
                    onListo={() => setListo((x) => (x ? x : 1))}
                  />
                </Suspense>
              </SinWebGL>
              {tooltip}
              {escena.tipo === 'LCL' && (
                <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1 text-[11px] font-medium">
                  <span className="rounded-full bg-gold px-2.5 py-1 text-ink">{t('asi.cub.leyendaTuya')}</span>
                  <span className="rounded-full bg-white/85 px-2.5 py-1 text-muted">{t('asi.cub.leyendaOtros')}</span>
                </div>
              )}
            </div>
          ) : (
            <Aviso tono="menta">{t('asi.cub.sin3d')}</Aviso>
          )}

          {webgl && (
            <div className="flex flex-wrap items-center gap-1.5">
              {['iso', 'frontal', 'superior', 'lateral'].map((v) => (
                <button key={v} type="button" onClick={() => apiRef.current?.vista(v)} className="min-h-9 cursor-pointer rounded-full border-[1.5px] border-line bg-white px-3 text-[13px] font-medium text-ink">
                  {t('asi.cub.vista.' + v)}
                </button>
              ))}
              <button type="button" onClick={() => apiRef.current?.reiniciar()} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line bg-white px-3 text-[13px] font-medium text-ink">
                <Refresh size={13} />
                {t('asi.cub.reiniciarCamara')}
              </button>
              <button type="button" onClick={descargar} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line bg-white px-3 text-[13px] font-medium text-ink">
                <Download size={13} />
                PNG
              </button>
            </div>
          )}

          {webgl && pasos > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!reproduciendo && !enAnimacion) setVisibles(0);
                  setReproduciendo((r) => !r);
                }}
                className="min-h-9 min-w-[110px] cursor-pointer rounded-full border-0 bg-ink px-3.5 text-[13px] font-semibold text-white"
              >
                {reproduciendo ? t('asi.cub.pausar') : enAnimacion ? t('asi.cub.continuar') : t('asi.cub.reproducir')}
              </button>
              <input
                type="range"
                min={0}
                max={pasos}
                value={enAnimacion ? visibles : pasos}
                onChange={(e) => {
                  setReproduciendo(false);
                  const v = Number(e.target.value);
                  setVisibles(v >= pasos ? Infinity : v);
                }}
                aria-label={t('asi.cub.progreso')}
                aria-valuetext={formatoPct(avance, lang)}
                className="h-2 flex-1 cursor-pointer accent-[#123638]"
              />
              <span className="w-12 text-right text-xs text-muted">{formatoNumero(avance * 100, 0, lang)} %</span>
            </div>
          )}
          <p className="m-0 text-xs text-muted">{webgl ? t('asi.cub.ayuda3d') : ''}</p>
        </div>

        <aside className="flex flex-col gap-3 rounded-2xl bg-mist-2 p-4" aria-label={t('asi.cub.indicadores')}>
          <h3 className="m-0 text-[15px] font-semibold first-letter:uppercase">{escena.tipo === 'FCL' ? t('asi.contenedor.' + escena.contenedor.id) : t('asi.tipoCarga.' + cub.tipoCarga)}</h3>
          <Indicadores cub={cub} escena={escena} />
          {escena.alertas.includes('SOBREPESO') && <Aviso tono="arcilla">{t('asi.alerta.SOBREPESO')}</Aviso>}
          {escena.alertas.includes('ALTURA') && <Aviso tono="arcilla">{t('asi.alerta.ALTURA')}</Aviso>}
          {escena.alertas.includes('CENTRO_GRAVEDAD') && <Aviso tono="oro">{t('asi.alerta.CENTRO_GRAVEDAD')}</Aviso>}
          {escena.centroGravedad && !escena.alertas.includes('CENTRO_GRAVEDAD') && <p className="m-0 text-xs text-muted">{t('asi.cub.cgOk')}</p>}
        </aside>
      </div>
    </div>
  );
}
