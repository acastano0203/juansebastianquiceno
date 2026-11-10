import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { formatoNumero } from '../../engine/unidades';
import { Aviso } from './Campos';

// Visor three.js de /cubicaje: se carga solo cuando se abre la vista 3D
const ContainerViewer3D = lazy(() => import('../cubicaje/ContainerViewer3D'));

const hayWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

// Si WebGL falla al montar, se vuelve al dibujo oblicuo en SVG
class SinWebGL extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? this.props.alterno : this.props.children;
  }
}

// El motor trabaja en mm; el visor 3D en cm. Ejes iguales: x largo, y alto, z ancho.
function Vista3D({ equipo, bloques, referencias, colorDe, visibles, alterno }) {
  const { t } = useI18n();
  const apiRef = useRef();
  const resultado = useMemo(
    () => ({
      contenedor: { largo: equipo.largoMm / 10, ancho: equipo.anchoMm / 10, alto: equipo.altoMm / 10 },
      colocadas: [...bloques]
        .sort((a, b) => a.orden - b.orden)
        .map((b) => ({ productoId: b.referenciaId, x: b.x / 10, y: b.y / 10, z: b.z / 10, dx: b.dx / 10, dy: b.dy / 10, dz: b.dz / 10 })),
      noColocadas: [],
    }),
    [equipo, bloques],
  );
  const productos = useMemo(() => referencias.map((r) => ({ id: r.id, nombre: r.nombre, color: colorDe(r.id) })), [referencias, colorDe]);
  const [webgl] = useState(hayWebGL);
  if (!webgl) return alterno;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-[300px] overflow-hidden rounded-xl bg-[#e7eee8] md:h-[420px]" style={{ touchAction: 'none' }}>
        <SinWebGL alterno={alterno}>
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted">{t('sim.visor.cargando3d')}</div>}>
            <ContainerViewer3D resultado={resultado} productos={productos} apiRef={apiRef} mostrarFuera={false} visibles={visibles < bloques.length ? visibles : undefined} />
          </Suspense>
        </SinWebGL>
      </div>
      <p className="no-print m-0 text-xs text-muted">{t('sim.visor.ayuda3d')}</p>
    </div>
  );
}

// Un color por referencia, en orden fijo; paleta validada para daltonismo sobre el fondo del visor.
// De la sexta en adelante comparten gris: la leyenda siempre nombra cada referencia.
const COLORES = ['#B5562B', '#2F7FB5', '#A38A12', '#7A5BB8', '#2E9468'];
const GRIS = '#8A9691';
const RESALTE = '#DDBD62';
const ESCALA = 0.1; // unidades SVG por mm
const DESPLAZA_X = 0.42; // proyección oblicua del ancho
const DESPLAZA_Y = 0.3;

function oscurecer(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.min(255, Math.round(v * f)));
  return `rgb(${c.join(',')})`;
}

const px = ([x, y, z], alto) => {
  const X = (x + z * DESPLAZA_X) * ESCALA;
  const Y = (alto - y - z * DESPLAZA_Y) * ESCALA;
  return `${X.toFixed(1)},${Y.toFixed(1)}`;
};

function CajaOblicua({ b, color, alto, resaltar }) {
  const p = (x, y, z) => px([x, y, z], alto);
  const [x0, y0, z0] = [b.x, b.y, b.z];
  const [x1, y1, z1] = [b.x + b.dx, b.y + b.dy, b.z + b.dz];
  const trazo = resaltar ? { stroke: RESALTE, strokeWidth: 3, strokeLinejoin: 'round' } : { stroke: '#123638', strokeWidth: 0.8, strokeLinejoin: 'round' };
  return (
    <g>
      <polygon points={`${p(x0, y1, z0)} ${p(x1, y1, z0)} ${p(x1, y1, z1)} ${p(x0, y1, z1)}`} fill={oscurecer(color, 1.12)} {...trazo} />
      <polygon points={`${p(x1, y0, z0)} ${p(x1, y0, z1)} ${p(x1, y1, z1)} ${p(x1, y1, z0)}`} fill={oscurecer(color, 0.78)} {...trazo} />
      <polygon points={`${p(x0, y0, z0)} ${p(x1, y0, z0)} ${p(x1, y1, z0)} ${p(x0, y1, z0)}`} fill={color} {...trazo} />
    </g>
  );
}

function VistaOblicua({ equipo, bloques, colorDe, ultimo }) {
  const { largoMm: L, anchoMm: A, altoMm: H } = equipo;
  const margen = 12;
  const w = (L + A * DESPLAZA_X) * ESCALA + margen * 2;
  const h = (H + A * DESPLAZA_Y) * ESCALA + margen * 2;
  const p = (x, y, z) => px([x, y, z], H);
  const orden = [...bloques].sort((a, b) => b.z - a.z || a.x - b.x || a.y - b.y);
  const linea = { stroke: '#123638', strokeWidth: 1.4, fill: 'none', strokeLinejoin: 'round' };
  return (
    <svg viewBox={`${-margen} ${-margen} ${w} ${h}`} className="block h-auto w-full" role="presentation">
      <g transform={`translate(0 ${(A * DESPLAZA_Y * ESCALA).toFixed(1)})`}>
        <polygon points={`${p(0, 0, A)} ${p(L, 0, A)} ${p(L, H, A)} ${p(0, H, A)}`} {...linea} strokeWidth={0.8} />
        <polyline points={`${p(0, 0, 0)} ${p(0, 0, A)} ${p(0, H, A)}`} {...linea} strokeWidth={0.8} />
        {orden.map((b) => (
          <CajaOblicua key={b.orden} b={b} color={colorDe(b.referenciaId)} alto={H} resaltar={b === ultimo} />
        ))}
        <polygon points={`${p(0, 0, 0)} ${p(L, 0, 0)} ${p(L, H, 0)} ${p(0, H, 0)}`} {...linea} />
        <polyline points={`${p(L, 0, 0)} ${p(L, 0, A)} ${p(L, H, A)} ${p(L, H, 0)}`} {...linea} />
        <polyline points={`${p(0, H, 0)} ${p(0, H, A)} ${p(L, H, A)}`} {...linea} />
      </g>
    </svg>
  );
}

function VistaPlana({ largo, alto, rects, className = '' }) {
  const margen = 10;
  const w = largo * ESCALA + margen * 2;
  const h = alto * ESCALA + margen * 2;
  return (
    <svg viewBox={`${-margen} ${-margen} ${w} ${h}`} className={'mx-auto block h-auto w-full ' + className} role="presentation">
      <rect x="0" y="0" width={largo * ESCALA} height={alto * ESCALA} fill="#ffffff" stroke="#123638" strokeWidth="1.4" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x * ESCALA} y={(alto - r.y - r.h) * ESCALA} width={r.w * ESCALA} height={r.h * ESCALA} fill={r.color} stroke={r.resaltar ? RESALTE : '#123638'} strokeWidth={r.resaltar ? 3 : 0.8} />
      ))}
    </svg>
  );
}

const Play = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const Pausa = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
  </svg>
);

const VISTAS = ['iso', 'frontal', 'lateral', 'superior'];

/**
 * Vista conceptual de la carga dentro de un equipo. Siempre con el aviso de RN-CUB-13.
 * secuencia = true agrega la reproducción de la secuencia de carga.
 */
export default function VisorCarga({ equipo, bloques, cubicaje, referencias, secuencia = false }) {
  const { t, lang } = useI18n();
  const [vista, setVista] = useState('iso');
  const total = bloques.length;
  const [visibles, setVisibles] = useState(total);
  const [jugando, setJugando] = useState(false);

  useEffect(() => {
    setVisibles(total);
    setJugando(false);
  }, [bloques, total]);

  useEffect(() => {
    if (!jugando) return undefined;
    if (visibles >= total) {
      setJugando(false);
      return undefined;
    }
    const id = setTimeout(() => setVisibles((v) => v + 1), Math.max(40, Math.min(450, 4000 / Math.max(total, 1))));
    return () => clearTimeout(id);
  }, [jugando, visibles, total]);

  const reproducir = () => {
    if (jugando) return setJugando(false);
    if (visibles >= total) setVisibles(0);
    setJugando(true);
  };

  const colorDe = useMemo(() => {
    const mapa = new Map(referencias.map((r, i) => [r.id, COLORES[i] ?? GRIS]));
    return (id) => mapa.get(id) ?? GRIS;
  }, [referencias]);

  const mostrados = secuencia ? bloques.filter((b) => b.orden < visibles) : bloques;
  const ultimo = secuencia && visibles > 0 && visibles < total ? bloques.find((b) => b.orden === visibles - 1) : null;
  const plano = (b, x, y, w, h) => ({ x, y, w, h, color: colorDe(b.referenciaId), resaltar: b === ultimo });

  return (
    <figure className="m-0 flex min-w-0 flex-col gap-3">
      {equipo && total > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#e7eee8] p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {cubicaje.referencias.map((c) => (
                <li key={c.referenciaId} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium">
                  <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: colorDe(c.referenciaId) }} />
                  {c.nombre} ·{' '}
                  {c.paletizada
                    ? t('sim.visor.pallets', { n: formatoNumero(c.numPallets, 0, lang) })
                    : t('sim.visor.bultosDe', { n: formatoNumero(bloques.filter((b) => b.referenciaId === c.referenciaId).length, 0, lang), t: formatoNumero(referencias.find((r) => r.id === c.referenciaId)?.bultos ?? 0, 0, lang) })}
                </li>
              ))}
            </ul>
            <div role="group" aria-label={t('sim.visor.titulo')} className="no-print flex gap-1 rounded-full bg-white p-1">
              {VISTAS.map((v) => (
                <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)} className={'min-h-8 cursor-pointer rounded-full border-0 px-3 text-xs font-semibold ' + (vista === v ? 'bg-ink text-white' : 'bg-transparent text-ink')}>
                  {t('sim.visor.' + v)}
                </button>
              ))}
            </div>
          </div>
          <div role="img" aria-label={t('sim.visor.aria', { n: formatoNumero(total, 0, lang), e: equipo.nombre[lang] })}>
            {vista === 'iso' && (
              <Vista3D
                equipo={equipo}
                bloques={bloques}
                referencias={referencias}
                colorDe={colorDe}
                visibles={secuencia ? visibles : total}
                alterno={<VistaOblicua equipo={equipo} bloques={mostrados} colorDe={colorDe} ultimo={ultimo} />}
              />
            )}
            {vista === 'frontal' && (
              <VistaPlana className="max-h-[380px]" largo={equipo.anchoMm} alto={equipo.altoMm} rects={[...mostrados].sort((a, b) => a.x - b.x).map((b) => plano(b, b.z, b.y, b.dz, b.dy))} />
            )}
            {vista === 'lateral' && <VistaPlana largo={equipo.largoMm} alto={equipo.altoMm} rects={[...mostrados].sort((a, b) => b.z - a.z).map((b) => plano(b, b.x, b.y, b.dx, b.dy))} />}
            {vista === 'superior' && <VistaPlana largo={equipo.largoMm} alto={equipo.anchoMm} rects={[...mostrados].sort((a, b) => a.y - b.y).map((b) => plano(b, b.x, b.z, b.dx, b.dz))} />}
          </div>
          {secuencia && (
            <div className="no-print flex items-center gap-3 rounded-full bg-white px-2 py-1.5">
              <button
                type="button"
                onClick={reproducir}
                aria-label={jugando ? t('sim.visor.pausar') : t('sim.visor.reproducir')}
                className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-ink text-white"
              >
                {jugando ? <Pausa /> : <Play />}
              </button>
              <input
                type="range"
                min={0}
                max={total}
                step={1}
                value={visibles}
                aria-label={t('sim.visor.secuencia')}
                onChange={(e) => {
                  setJugando(false);
                  setVisibles(Number(e.target.value));
                }}
                className="min-w-0 flex-1 cursor-pointer accent-[#ddbd62]"
              />
              <span className="flex-none pr-2 text-sm font-semibold">{t('sim.visor.paso', { n: formatoNumero(visibles, 0, lang), t: formatoNumero(total, 0, lang) })}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="m-0 rounded-2xl bg-[#e7eee8] p-4 text-sm text-muted">{referencias.length ? t('sim.cub.sinEquipo') : t('sim.visor.vacia')}</p>
      )}
      <figcaption>
        <Aviso tono="oro">
          <strong className="font-semibold">{PARAMS.textosLegales.cubicaje[lang].split('.')[0]}.</strong>
          {PARAMS.textosLegales.cubicaje[lang].slice(PARAMS.textosLegales.cubicaje[lang].indexOf('.') + 1)}
        </Aviso>
      </figcaption>
    </figure>
  );
}
