import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { num } from '../../lib/format';
import { Plus } from '../ui/Icons';

const ContainerViewer3D = lazy(() => import('./ContainerViewer3D'));

const Trazo = ({ children, size = 20 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const RotIzq = () => (
  <Trazo>
    <path d="M4 12a8 8 0 1 0 2.3-5.6" />
    <path d="M4 4v4h4" />
  </Trazo>
);
const RotDer = () => (
  <Trazo>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v4h-4" />
  </Trazo>
);
const Menos = () => (
  <Trazo>
    <path d="M5 12h14" />
  </Trazo>
);
const Reiniciar = () => (
  <Trazo>
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M12 3v3" />
    <path d="M12 18v3" />
    <circle cx="12" cy="12" r="4" />
  </Trazo>
);
const Expandir = ({ salir }) => (
  <Trazo>
    {salir ? (
      <>
        <path d="M9 4v5H4" />
        <path d="M15 4v5h5" />
        <path d="M9 20v-5H4" />
        <path d="M15 20v-5h5" />
      </>
    ) : (
      <>
        <path d="M4 9V4h5" />
        <path d="M20 9V4h-5" />
        <path d="M4 15v5h5" />
        <path d="M20 15v5h-5" />
      </>
    )}
  </Trazo>
);

const Reproducir = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 4.5v15l12-7.5z" />
  </svg>
);
const Pausa = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4.5" width="4" height="15" rx="1" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" />
  </svg>
);

// Secuencia de carga: muestra las cajas una a una en el orden en que se acomodan
function useSecuencia(total, animar, clave, maxSeg) {
  const [visibles, setVisibles] = useState(total);
  const [reproduciendo, setReproduciendo] = useState(false);
  const pos = useRef(total);

  useEffect(() => {
    const inicio = animar && total > 1 ? 0 : total;
    pos.current = inicio;
    setVisibles(inicio);
    setReproduciendo(animar && total > 1);
  }, [total, animar, clave]);

  useEffect(() => {
    if (!reproduciendo) return undefined;
    // Toda la carga en 3 a 12 segundos, según la cantidad de cajas
    const porSegundo = total / Math.min(maxSeg, Math.max(2, total * 0.06));
    let ultimo = performance.now();
    let raf;
    const paso = (ahora) => {
      pos.current = Math.min(total, pos.current + ((ahora - ultimo) / 1000) * porSegundo);
      ultimo = ahora;
      setVisibles(Math.floor(pos.current));
      if (pos.current >= total) setReproduciendo(false);
      else raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [reproduciendo, total, maxSeg]);

  return {
    visibles,
    reproduciendo,
    alternar: () => {
      if (!reproduciendo && pos.current >= total) pos.current = 0;
      setReproduciendo((r) => !r);
    },
    ir: (n) => {
      setReproduciendo(false);
      pos.current = n;
      setVisibles(n);
    },
  };
}

function BarraSecuencia({ total, sec }) {
  const { t, lang } = useI18n();
  const fin = sec.visibles >= total && !sec.reproduciendo;
  return (
    <div className="absolute right-[76px] bottom-[68px] left-4 flex items-center gap-3 rounded-[20px] bg-white p-1.5 pr-4 shadow-[0_8px_24px_rgba(18,54,56,0.12)] sm:right-auto sm:w-[400px]">
      <button
        type="button"
        onClick={sec.alternar}
        aria-label={sec.reproduciendo ? t('cub.visor.pausar') : fin ? t('cub.visor.repetir') : t('cub.visor.reproducir')}
        title={sec.reproduciendo ? t('cub.visor.pausar') : fin ? t('cub.visor.repetir') : t('cub.visor.reproducir')}
        className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-2xl border-0 bg-ink text-white"
      >
        {sec.reproduciendo ? <Pausa /> : <Reproducir />}
      </button>
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex justify-between gap-2 text-xs">
          <span className="font-semibold">{t('cub.visor.secuencia')}</span>
          <span className="text-muted tabular-nums">{t('cub.visor.cajaDe', { n: num(sec.visibles, 0, lang), total: num(total, 0, lang) })}</span>
        </span>
        <input type="range" min="0" max={total} step="1" value={sec.visibles} onChange={(e) => sec.ir(Number(e.target.value))} className="w-full cursor-pointer accent-ink" />
      </label>
    </div>
  );
}

function BotonBarra({ label, onClick, children, activo, expanded }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      className={'flex size-11 cursor-pointer items-center justify-center rounded-2xl border-0 text-ink hover:bg-mist ' + (activo ? 'bg-sage' : 'bg-white')}
    >
      {children}
    </button>
  );
}

export function CargandoSimulacion({ nProductos, nCajas, contenedor }) {
  const { t, lang } = useI18n();
  return (
    <div role="status" aria-live="polite" className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(231,238,232,0.72)] p-4">
      <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-[28px_28px_28px_4px] bg-white p-7 shadow-[0_20px_50px_rgba(18,54,56,0.18)]">
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="size-7 flex-none animate-spin rounded-full border-[3px] border-mist-2 border-t-ink" />
          <strong className="font-serif text-[22px] font-semibold">{t('cub.visor.cargandoT')}</strong>
        </span>
        <div className="h-2 overflow-hidden rounded-full bg-mist-2">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gold" />
        </div>
        <ol className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] text-muted">
          <li>{t('cub.visor.cargando1', { n: nProductos })}</li>
          <li>{t('cub.visor.cargando2')}</li>
          <li>{t('cub.visor.cargando3', { n: num(nCajas, 0, lang), cont: contenedor })}</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Visor con controles. Mientras `cargando` (o sin resultado) muestra el estado "Cargando simulación".
 * apiRef se comparte con la página para capturar la imagen del PDF.
 */
export default function VisorCubicaje({ resultado, productos, cargando, apiRef, cargandoInfo, animar = false, clave, duracionMax = 12, compacto = false, className = '' }) {
  const { t, lang } = useI18n();
  const [vista, setVista] = useState('iso');
  const [ayuda, setAyuda] = useState(false);
  const [completa, setCompleta] = useState(false);
  const fuera = resultado ? resultado.noColocadas.reduce((s, n) => s + n.cantidad, 0) : 0;
  const total = resultado ? resultado.colocadas.length : 0;
  const sec = useSecuencia(total, animar, clave, duracionMax);

  useEffect(() => {
    if (!completa) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setCompleta(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [completa]);

  const api = (fn, ...args) => apiRef.current?.[fn]?.(...args);
  const ir = (v) => {
    setVista(v);
    api('vista', v);
  };

  return (
    <section
      aria-label={t('cub.visor.region')}
      className={
        (completa ? 'fixed inset-0 z-40 h-dvh rounded-none ' : 'relative rounded-[32px_32px_32px_4px] ' + (compacto ? 'h-[420px] md:h-[480px] ' : 'h-[460px] md:h-[640px] ')) + 'overflow-hidden bg-[#E7EEE8] print:hidden ' + className
      }
    >
      {resultado && (
        <div
          className="absolute inset-0"
          role="img"
          aria-label={t('cub.visor.aria', { cont: resultado.contenedor.nombre, n: num(resultado.colocadas.length, 0, lang), fuera: fuera ? t('cub.visor.ariaFuera', { n: fuera }) : '' })}
          onPointerDown={() => setVista('libre')}
        >
          <Suspense fallback={null}>
            <ContainerViewer3D resultado={resultado} productos={productos} apiRef={apiRef} visibles={total > 1 ? sec.visibles : undefined} />
          </Suspense>
        </div>
      )}

      {resultado && (
        <div className="pointer-events-none absolute top-4 left-4 flex max-w-[calc(100%-96px)] flex-wrap gap-1.5">
          {productos.map((p) => (
            <span key={p.id} className="inline-flex min-h-[30px] items-center gap-2 rounded-full bg-white/90 px-3 text-xs font-semibold">
              <span aria-hidden="true" className="size-3 rounded-[3px]" style={{ background: p.color }} />
              {p.nombre}
            </span>
          ))}
          {fuera > 0 && (
            <span className="inline-flex min-h-[30px] items-center gap-2 rounded-full bg-white/90 px-3 text-xs font-semibold text-clay-dark">
              <span aria-hidden="true" className="size-3 rounded-[3px] border-[1.5px] border-dashed border-clay-dark" />
              {t('cub.visor.fuera')}
            </span>
          )}
        </div>
      )}

      <div role="toolbar" aria-label={t('cub.visor.controles')} className="absolute top-4 right-4 flex flex-col gap-1 rounded-[20px] bg-white p-1.5 shadow-[0_8px_24px_rgba(18,54,56,0.12)]">
        <BotonBarra label={t('cub.visor.rotIzq')} onClick={() => api('rotar', -20)}>
          <RotIzq />
        </BotonBarra>
        <BotonBarra label={t('cub.visor.rotDer')} onClick={() => api('rotar', 20)}>
          <RotDer />
        </BotonBarra>
        <span aria-hidden="true" className="mx-2 my-0.5 h-px bg-line-2" />
        <BotonBarra label={t('cub.visor.acercar')} onClick={() => api('zoom', 0.8)}>
          <Plus size={20} />
        </BotonBarra>
        <BotonBarra label={t('cub.visor.alejar')} onClick={() => api('zoom', 1.25)}>
          <Menos />
        </BotonBarra>
        <span aria-hidden="true" className="mx-2 my-0.5 h-px bg-line-2" />
        <BotonBarra
          label={t('cub.visor.reiniciar')}
          onClick={() => {
            setVista('iso');
            api('reiniciar');
          }}
        >
          <Reiniciar />
        </BotonBarra>
        <BotonBarra label={completa ? t('cub.visor.salir') : t('cub.visor.completa')} onClick={() => setCompleta((x) => !x)}>
          <Expandir salir={completa} />
        </BotonBarra>
        <BotonBarra label={t('cub.visor.ayuda')} onClick={() => setAyuda((x) => !x)} activo={ayuda} expanded={ayuda}>
          <span className="text-base font-semibold">?</span>
        </BotonBarra>
      </div>

      {ayuda && (
        <div role="dialog" aria-label={t('cub.visor.ayudaT')} className="absolute top-4 right-20 z-10 flex w-[min(280px,calc(100%-100px))] flex-col gap-2 rounded-[20px_20px_4px_20px] bg-ink px-5 py-[18px] text-[13px] leading-normal text-white">
          <strong className="text-sm font-semibold">{t('cub.visor.ayudaT')}</strong>
          {['ayuda1', 'ayuda2'].map((k) => (
            <span key={k}>
              <strong className="font-semibold text-gold">{t('cub.visor.' + k)[0]}</strong>
              {t('cub.visor.' + k)[1]}
            </span>
          ))}
          <span>
            <strong className="font-semibold text-gold">{t('cub.visor.ayuda3')[0]}</strong>
            {t('cub.visor.ayuda3')[1]}
            <strong className="font-semibold text-gold">{t('cub.visor.ayuda3')[2]}</strong>
            {t('cub.visor.ayuda3')[3]}
          </span>
          <span>{t('cub.visor.ayuda4')}</span>
        </div>
      )}

      <div role="group" aria-label={t('cub.visor.vistas')} className="absolute bottom-4 left-4 flex max-w-[calc(100%-32px)] gap-1 overflow-x-auto rounded-full bg-white p-[5px] shadow-[0_8px_24px_rgba(18,54,56,0.12)]">
        {['iso', 'frontal', 'lateral', 'superior'].map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={vista === v}
            onClick={() => ir(v)}
            className={'min-h-[38px] flex-none cursor-pointer rounded-full border-0 px-3.5 text-[13px] font-semibold ' + (vista === v ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-mist')}
          >
            {t('cub.visor.vista.' + v)}
          </button>
        ))}
      </div>

      {resultado && total > 1 && <BarraSecuencia total={total} sec={sec} />}

      {(cargando || !resultado) && cargandoInfo && <CargandoSimulacion {...cargandoInfo} />}
    </section>
  );
}
