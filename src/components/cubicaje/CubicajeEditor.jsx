import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { CONTENEDORES, COLORES, LIMITES, getContenedor } from '../../cubicaje/config';
import { num } from '../../lib/format';
import { Button } from '../ui/Button';
import { Alert, Check, Pen, Plus, Trash } from '../ui/Icons';
import ProductoModal from './ProductoModal';
import PaqueteIcono from './PaqueteIcono';
import VisorCubicaje from './VisorCubicaje';
import { ResumenPanel } from './ResumenCubicaje';
import { restricciones } from './restricciones';

export function totales(productos) {
  return productos.reduce(
    (a, p) => ({
      cajas: a.cajas + p.cantidad,
      kg: a.kg + p.peso * p.cantidad,
      vol: a.vol + (p.largo * p.ancho * p.alto * p.cantidad) / 1e6,
    }),
    { cajas: 0, kg: 0, vol: 0 },
  );
}

export function volumenContenedor(c) {
  return (c.largo * c.ancho * c.alto) / 1e6;
}

function NumSection({ n, title, children, aside }) {
  return (
    <section className="flex flex-col gap-5 rounded-[32px_32px_32px_4px] bg-white px-5 py-6 md:px-[30px] md:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-xl text-clay italic">{n}</span>
          <h2 className="m-0 font-serif text-2xl font-semibold">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

// Silueta del contenedor en la tarjeta de selección (más largo para 40', más alto para HC)
function SiluetaContenedor({ id, on }) {
  const len = id === '20' ? 30 : 52;
  const hh = id === '40HC' ? 16 : 13;
  const y = 34 - hh - 8;
  const f = on ? ['#2C5E60', '#1C4A4C', '#2C5E60'] : ['#EAF2EA', '#B8D8B8', '#DCEBDC'];
  return (
    <svg aria-hidden="true" width={len + 14} height="34" viewBox={`0 0 ${len + 14} 34`}>
      <path d={`M1 ${y + 1} L${len} ${y + 1} L${len + 12} ${y - 6} L13 ${y - 6} Z`} fill={f[0]} />
      <path d={`M1 ${y} L${len} ${y} L${len} 33 L1 33 Z`} fill={f[1]} />
      <path d={`M${len} ${y} L${len + 12} ${y - 7} L${len + 12} 26 L${len} 33 Z`} fill={f[2]} />
    </svg>
  );
}

export function PasosIndicador({ nombreOk, conProductos, conResultado = false }) {
  const { t } = useI18n();
  const pasos = [
    ['datos', nombreOk],
    ['productos', conProductos],
    ['generar', conResultado],
  ];
  return (
    <ol aria-label="Pasos" className="m-0 flex list-none flex-wrap gap-2 p-0">
      {pasos.map(([k, done], i) => {
        const current = !done && (i === 0 || pasos[i - 1][1]);
        return (
          <li
            key={k}
            aria-current={current ? 'step' : undefined}
            className={'flex min-h-10 items-center gap-2 rounded-full py-0 pr-3.5 pl-1.5 text-[13px] font-semibold ' + (done ? 'bg-[#DCEBDC] text-ink' : current ? 'bg-ink text-white' : 'bg-white text-ink')}
          >
            <span className={'flex size-7 items-center justify-center rounded-full text-xs ' + (done ? 'bg-ink text-white' : current ? 'bg-gold text-ink' : 'bg-mist-2 text-ink')}>
              {done ? <Check size={14} /> : i + 1}
            </span>
            {t('cub.pasos.' + k)}
          </li>
        );
      })}
    </ol>
  );
}

function ProductoFila({ p, onEditar, onQuitar }) {
  const { t, lang } = useI18n();
  const tags = restricciones(p, t, lang);
  const dec = (n) => num(n, n % 1 ? 1 : 0, lang);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line-2 py-3.5">
      <span className="flex min-w-0 flex-[999_1_240px] items-center gap-3.5">
        <span aria-hidden="true" className="size-10 flex-none rounded-[12px_12px_12px_3px] shadow-[inset_0_-6px_0_rgba(0,0,0,0.12)]" style={{ background: p.color }} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold">{p.nombre}</span>
          <span className="text-xs text-muted">
            {t('cub.productos.linea', { tipo: t('cub.paquetes.' + (p.tipoPaquete || 'box')), dims: `${dec(p.largo)} × ${dec(p.ancho)} × ${dec(p.alto)}`, peso: dec(p.peso) })}
          </span>
        </span>
      </span>
      <span className="flex flex-[1_1_200px] flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium">
            {tag}
          </span>
        ))}
      </span>
      <span className="flex min-w-[90px] flex-none flex-col items-end gap-0.5">
        <span className="text-[15px] font-semibold tabular-nums">{t('cub.productos.cajas', { n: num(p.cantidad, 0, lang) })}</span>
        <span className="text-xs text-muted">{num((p.largo * p.ancho * p.alto * p.cantidad) / 1e6, 2, lang)} m³</span>
      </span>
      <span className="flex flex-none gap-1">
        <button type="button" onClick={onEditar} aria-label={t('cub.productos.editar', { n: p.nombre })} className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink hover:bg-mist">
          <Pen />
        </button>
        <button type="button" onClick={onQuitar} aria-label={t('cub.productos.quitar', { n: p.nombre })} className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-clay-dark hover:bg-clay-bg">
          <Trash />
        </button>
      </span>
    </div>
  );
}

/**
 * Formulario de cubicaje (pasos 1 a 3). Controlado: valor = { nombre, tipoContenedor, productos }.
 * variante 'diagnostico' usa los límites públicos.
 */
export default function CubicajeEditor({ valor, onChange, resultado, calculando = false, version = 0, estadoGuardado, acciones, variante = 'admin', apiRef: apiExterno }) {
  const { t, lang } = useI18n();
  const limites = LIMITES[variante] || LIMITES.admin;
  const [modal, setModal] = useState(null); // null | { producto | null }
  const [toast, setToast] = useState('');
  const timer = useRef();
  const resultadoRef = useRef();
  const apiInterno = useRef(null);
  const apiRef = apiExterno || apiInterno;
  useEffect(() => () => clearTimeout(timer.current), []);

  const avisar = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3000);
  };

  const cont = getContenedor(valor.tipoContenedor);
  const tot = totales(valor.productos);
  const conProductos = valor.productos.length > 0;
  const fuera = resultado?.noColocadas || [];

  const usados = new Set(valor.productos.map((p) => p.color));
  const colorSugerido = COLORES.find((c) => !usados.has(c)) || COLORES[valor.productos.length % COLORES.length];
  const cerrarModal = useCallback(() => setModal(null), []);

  const guardarProducto = (p) => {
    const existe = p.id && valor.productos.some((x) => x.id === p.id);
    const productos = existe ? valor.productos.map((x) => (x.id === p.id ? p : x)) : [...valor.productos, { ...p, id: 'p' + Date.now().toString(36) }];
    onChange({ ...valor, productos });
    avisar(t(existe ? 'cub.productos.actualizado' : 'cub.productos.anadido', { n: p.nombre }));
    // En pantallas angostas el resultado queda debajo del formulario: se lleva a la vista
    if (window.matchMedia('(max-width: 1023px)').matches) setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
  };

  return (
    <div className="flex flex-wrap items-start gap-[22px]">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[22px]">
        <NumSection n="01" title={t('cub.datos.titulo')}>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            <span>
              {t('cub.datos.nombre')} <span className="font-normal text-muted">· {t('cub.datos.nombreAyuda')}</span>
            </span>
            <input className="field" type="text" maxLength={120} value={valor.nombre} onChange={(e) => onChange({ ...valor, nombre: e.target.value })} placeholder={t('cub.datos.nombrePh')} />
          </label>
          <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold" id="contenedor-label">
              {t('cub.datos.contenedor')}
            </span>
            <div role="radiogroup" aria-labelledby="contenedor-label" className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
              {Object.values(CONTENEDORES).map((c) => {
                const on = c.id === valor.tipoContenedor;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange({ ...valor, tipoContenedor: c.id })}
                    className={
                      'flex cursor-pointer flex-col gap-3 rounded-[22px_22px_22px_4px] border-[1.5px] px-5 py-[18px] text-left transition hover:border-ink ' +
                      (on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')
                    }
                  >
                    <span className="flex w-full items-center justify-between">
                      <SiluetaContenedor id={c.id} on={on} />
                      <span aria-hidden="true" className={'flex size-[22px] items-center justify-center rounded-full border-[1.5px] text-ink ' + (on ? 'border-gold bg-gold' : 'border-[#C5D6CA]')}>
                        {on && <Check size={12} strokeWidth={3} />}
                      </span>
                    </span>
                    <span className="text-[17px] font-semibold">{c.nombre}</span>
                    <span className={'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs ' + (on ? 'text-sage' : 'text-muted')}>
                      <span>{t('cub.datos.medidas')}</span>
                      <strong className={'font-semibold ' + (on ? 'text-white' : 'text-ink')}>
                        {c.largo} × {c.ancho} × {c.alto} cm
                      </strong>
                      <span>{t('cub.datos.volumen')}</span>
                      <strong className={'font-semibold ' + (on ? 'text-white' : 'text-ink')}>{num(volumenContenedor(c), 1, lang)} m³</strong>
                      <span>{t('cub.datos.cargaMax')}</span>
                      <strong className={'font-semibold ' + (on ? 'text-white' : 'text-ink')}>{num(c.cargaMax, 0, lang)} kg</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </NumSection>

        <NumSection
          n="02"
          title={t('cub.productos.titulo')}
          aside={
            <Button variant="outline-ink" size="md" onClick={() => setModal({ producto: null })} disabled={valor.productos.length >= limites.productos}>
              <Plus size={16} />
              {t('cub.productos.anadir')}
            </Button>
          }
        >
          {conProductos ? (
            <div className="flex flex-col">
              {valor.productos.map((p) => (
                <ProductoFila
                  key={p.id}
                  p={p}
                  onEditar={() => setModal({ producto: p })}
                  onQuitar={() => {
                    onChange({ ...valor, productos: valor.productos.filter((x) => x.id !== p.id) });
                    avisar(t('cub.productos.quitado', { n: p.nombre }));
                  }}
                />
              ))}
              <div className="mt-1 flex flex-wrap justify-between gap-2.5 rounded-2xl bg-mist px-4 py-3.5 text-sm">
                <span className="font-semibold">{t('cub.productos.total', { n: valor.productos.length })}</span>
                <span className="text-muted">{t('cub.productos.totalD', { cajas: num(tot.cajas, 0, lang), kg: num(tot.kg, 0, lang), vol: num(tot.vol, 1, lang) })}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 rounded-[22px] border-[1.5px] border-dashed border-line px-5 py-10 text-center">
              <span className="text-muted">
                <PaqueteIcono tipo="box" size={36} />
              </span>
              <span className="text-base font-semibold">{t('cub.productos.vacioT')}</span>
              <span className="max-w-[380px] text-sm leading-normal text-muted">{t('cub.productos.vacioD')}</span>
            </div>
          )}
        </NumSection>
      </div>

      <aside ref={resultadoRef} className="flex min-w-0 flex-[1_1_440px] scroll-mt-4 flex-col gap-4 lg:sticky lg:top-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl text-clay italic">03</span>
            <h2 className="m-0 font-serif text-2xl font-semibold">{t('cub.resultado.titulo')}</h2>
          </div>
          <span className="text-[13px] text-muted" aria-live="polite">
            {calculando ? t('cub.resultado.calculando') : estadoGuardado ? t('cub.resultado.' + estadoGuardado) : ''}
          </span>
        </div>

        {conProductos ? (
          <VisorCubicaje
            compacto
            resultado={resultado}
            productos={valor.productos}
            cargando={calculando && !resultado}
            apiRef={apiRef}
            animar
            clave={version}
            duracionMax={6}
            cargandoInfo={{ nProductos: valor.productos.length, nCajas: tot.cajas, contenedor: cont.nombre }}
          />
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-[32px_32px_32px_4px] border-[1.5px] border-dashed border-line bg-white px-8 text-center">
            <span className="text-muted">
              <PaqueteIcono tipo="box" size={40} />
            </span>
            <span className="text-base font-semibold">{t('cub.resultado.vacioT')}</span>
            <span className="max-w-[300px] text-sm leading-normal text-muted">{t('cub.resultado.vacioD')}</span>
          </div>
        )}

        {fuera.length > 0 && (
          <div role="alert" className="flex gap-3 rounded-[20px_20px_20px_4px] bg-clay-bg px-4 py-3.5 text-[13px] leading-normal text-clay-ink">
            <span className="flex-none text-clay-dark">
              <Alert size={18} />
            </span>
            <span className="flex flex-col gap-0.5">
              <strong className="font-semibold">{t('cub.detalle.errorT')}</strong>
              {fuera.map((n) => (
                <span key={n.productoId}>
                  {t('cub.detalle.errorLinea', { n: num(n.cantidad, 0, lang), p: n.nombre })} · {t('cub.detalle.motivos.' + n.motivo)}
                </span>
              ))}
            </span>
          </div>
        )}

        {conProductos && <ResumenPanel cubicaje={{ productos: valor.productos, resultado }} cargando={!resultado} />}
        {acciones}
      </aside>

      {toast && (
        <div role="status" className="fixed right-4 bottom-4 left-4 z-20 flex items-center gap-3 rounded-2xl bg-ink px-[18px] py-3.5 text-sm text-white shadow-lg sm:left-auto">
          <Check size={16} />
          {toast}
        </div>
      )}

      {modal && (
        <ProductoModal inicial={modal.producto} contenedor={cont} colorSugerido={colorSugerido} limites={limites} onGuardar={guardarProducto} onCerrar={cerrarModal} />
      )}
    </div>
  );
}
