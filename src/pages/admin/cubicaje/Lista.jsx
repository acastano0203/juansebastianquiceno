import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { useCubicajes } from '../../../data/useCubicajes';
import { cubicajesRepo, totalCajas } from '../../../data/cubicajesRepo';
import { getContenedor } from '../../../cubicaje/config';
import { filtrar, ocupacionDe, paginas } from '../../../cubicaje/estadisticas';
import { cap, monthName, num } from '../../../lib/format';
import { ButtonLink } from '../../../components/ui/Button';
import { ChevronDown, ChevronLeft, ChevronRight, Pen, Plus, Search, Trash } from '../../../components/ui/Icons';
import { ConfirmarEliminar, EstadoBadge, OrigenBadge, Toast, useToast, VacioCubicajes } from '../../../components/cubicaje/CubicajeUI';

const POR_PAGINA = 10;
const FILTROS = { q: '', fecha: 'todas', origen: 'todos', estado: 'todos' };

export function fechaCub(iso, lang) {
  const d = new Date(iso);
  const m = monthName(d.getMonth(), lang).slice(0, 3);
  return lang === 'en' ? `${cap(m)} ${d.getDate()}, ${d.getFullYear()}` : `${d.getDate()} ${m} ${d.getFullYear()}`;
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="relative flex flex-[1_1_170px]">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="min-h-12 w-full cursor-pointer appearance-none rounded-full border-0 bg-white py-0 pr-10 pl-4 text-sm font-medium text-ink">
        {children}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted">
        <ChevronDown size={16} />
      </span>
    </label>
  );
}

function Ocupacion({ c, lang }) {
  const o = ocupacionDe(c);
  if (o == null) return <span className="text-muted">—</span>;
  return (
    <span className="flex items-center gap-2 font-semibold tabular-nums">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-mist-2">
        <span className="block h-full rounded-full" style={{ width: Math.min(100, o) + '%', background: c.estado === 'excede' ? '#995837' : '#123638' }} />
      </span>
      {num(o, 0, lang)} %
    </span>
  );
}

const iconBtn = 'flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink no-underline hover:bg-mist';

export default function ListaCubicajes() {
  const { t, lang } = useI18n();
  const { lista, cargando, recargar } = useCubicajes();
  const [params, setParams] = useSearchParams();
  const [borrar, setBorrar] = useState(null);
  const [borrarTodos, setBorrarTodos] = useState(false);
  const [toast, avisar] = useToast();

  const f = Object.fromEntries(Object.entries(FILTROS).map(([k, d]) => [k, params.get(k) || d]));
  const pagina = Math.max(1, Number(params.get('p')) || 1);
  const setFiltro = (k, v) => {
    const next = new URLSearchParams(params);
    if (v === FILTROS[k]) next.delete(k);
    else next.set(k, v);
    next.delete('p');
    setParams(next, { replace: true });
  };
  const irPagina = (p) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set('p', p);
    else next.delete('p');
    setParams(next);
  };

  const anios = useMemo(() => [...new Set(lista.map((c) => new Date(c.createdAt).getFullYear()))].sort((a, b) => b - a), [lista]);
  const filtrados = useMemo(() => filtrar(lista, f), [lista, f.q, f.fecha, f.origen, f.estado]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = filtrados.length;
  const nPag = Math.max(1, Math.ceil(total / POR_PAGINA));
  const actual = Math.min(pagina, nPag);
  const filas = filtrados.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const cerrarBorrar = useCallback(() => setBorrar(null), []);
  const cerrarBorrarTodos = useCallback(() => setBorrarTodos(false), []);

  const eliminar = async () => {
    await cubicajesRepo.eliminar(borrar.id);
    avisar(t('cub.lista.eliminado', { n: borrar.nombre }));
    recargar();
  };

  const eliminarTodos = async () => {
    await cubicajesRepo.eliminarTodos();
    avisar(t('cub.lista.eliminadosTodos'));
    setParams({}, { replace: true });
    recargar();
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Ruta" className="flex gap-2 text-sm text-muted">
            <Link to="/admin/cubicaje" className="text-muted">
              {t('cub.menu')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{t('cub.lista.titulo')}</span>
          </nav>
          <h1 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold md:text-[40px]">{t('cub.lista.titulo')}</h1>
        </div>
        <ButtonLink to="/admin/cubicaje/nuevo" variant="gold" size="lg">
          <Plus size={18} />
          {t('cub.nuevo')}
        </ButtonLink>
      </div>

      {!cargando && !lista.length && <VacioCubicajes onCargado={recargar} />}

      {lista.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex min-h-12 flex-[999_1_280px] items-center gap-2 rounded-full bg-white px-4 text-muted">
              <Search />
              <span className="sr-only">{t('cub.lista.buscar')}</span>
              <input
                type="search"
                value={f.q}
                onChange={(e) => setFiltro('q', e.target.value)}
                placeholder={t('cub.lista.buscarPh')}
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
              />
            </label>
            <Select label={t('cub.lista.fecha')} value={f.fecha} onChange={(v) => setFiltro('fecha', v)}>
              {['todas', 'mes', '90'].map((k) => (
                <option key={k} value={k}>
                  {t('cub.lista.fechas.' + k)}
                </option>
              ))}
              {anios.map((a) => (
                <option key={a} value={String(a)}>
                  {a}
                </option>
              ))}
            </Select>
            <Select label={t('cub.lista.origen')} value={f.origen} onChange={(v) => setFiltro('origen', v)}>
              {['todos', 'admin', 'diagnostico', 'landing'].map((k) => (
                <option key={k} value={k}>
                  {t('cub.lista.origenes.' + k)}
                </option>
              ))}
            </Select>
            <Select label={t('cub.lista.estado')} value={f.estado} onChange={(v) => setFiltro('estado', v)}>
              <option value="todos">{t('cub.lista.estadosTodos')}</option>
              {['listo', 'borrador', 'excede'].map((k) => (
                <option key={k} value={k}>
                  {t('cub.estados.' + k)}
                </option>
              ))}
            </Select>
          </div>

          {total === 0 ? (
            <section className="flex flex-col items-center gap-3 rounded-[28px_28px_28px_4px] bg-white px-6 py-14 text-center">
              <h2 className="m-0 font-serif text-2xl font-semibold">{t('cub.lista.sinResultadosT')}</h2>
              <p className="m-0 text-[15px] text-muted">{t('cub.lista.sinResultadosD')}</p>
              <button type="button" onClick={() => setParams({}, { replace: true })} className="min-h-11 cursor-pointer rounded-full border-[1.5px] border-ink bg-mist px-5 text-sm font-semibold text-ink">
                {t('cub.lista.limpiar')}
              </button>
            </section>
          ) : (
            <>
              <section className="hidden overflow-x-auto rounded-[28px_28px_28px_4px] bg-white md:block">
                <table className="w-full min-w-[1060px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      {['nombre', 'fecha', 'contenedor', 'productos', 'cajas', 'peso', 'ocupacion', 'estado', 'origen', 'acciones'].map((k, i) => (
                        <th
                          key={k}
                          scope="col"
                          className={
                            'pt-[18px] pb-3.5 font-semibold ' +
                            (i === 0 ? 'pr-3 pl-6' : i === 9 ? 'pr-6 pl-3 text-right' : 'px-3') +
                            (['productos', 'cajas', 'peso'].includes(k) ? ' text-right' : '')
                          }
                        >
                          {t('cub.lista.cols.' + k)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((c) => {
                      const m = c.resultado?.metricas;
                      return (
                        <tr key={c.id} className="transition-colors hover:bg-[#F7FAF7]">
                          <td className="border-t border-line-2 py-3 pr-3 pl-6">
                            <Link to={`/admin/cubicaje/${c.id}`} className="font-semibold text-ink no-underline hover:underline">
                              {c.nombre}
                            </Link>
                          </td>
                          <td className="border-t border-line-2 p-3 whitespace-nowrap">{fechaCub(c.createdAt, lang)}</td>
                          <td className="border-t border-line-2 p-3 whitespace-nowrap">{getContenedor(c.tipoContenedor)?.nombre}</td>
                          <td className="border-t border-line-2 p-3 text-right tabular-nums">{c.productos.length}</td>
                          <td className="border-t border-line-2 p-3 text-right tabular-nums">{num(totalCajas(c), 0, lang)}</td>
                          <td className="border-t border-line-2 p-3 text-right tabular-nums">{m ? num(m.pesoTotal, 0, lang) : '—'}</td>
                          <td className="border-t border-line-2 p-3">
                            <Ocupacion c={c} lang={lang} />
                          </td>
                          <td className="border-t border-line-2 p-3">
                            <EstadoBadge estado={c.estado} />
                          </td>
                          <td className="border-t border-line-2 p-3">
                            <OrigenBadge origen={c.origen} />
                          </td>
                          <td className="border-t border-line-2 py-2 pr-6 pl-3">
                            <span className="flex justify-end gap-1">
                              <Link to={`/admin/cubicaje/${c.id}`} aria-label={t('cub.lista.ver', { n: c.nombre })} title={t('cub.lista.verDetalle')} className={iconBtn}>
                                <ChevronRight />
                              </Link>
                              <Link to={`/admin/cubicaje/${c.id}/editar`} aria-label={t('cub.lista.editar', { n: c.nombre })} title={t('cub.detalle.editar')} className={iconBtn}>
                                <Pen />
                              </Link>
                              <button type="button" onClick={() => setBorrar(c)} aria-label={t('cub.lista.eliminar', { n: c.nombre })} title={t('cub.lista.eliminarBtn')} className={iconBtn + ' text-clay-dark hover:bg-clay-bg'}>
                                <Trash />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              <div className="flex flex-col gap-2.5 md:hidden">
                {filas.map((c) => {
                  const m = c.resultado?.metricas;
                  const o = ocupacionDe(c);
                  return (
                    <article key={c.id} className="flex flex-col gap-3 rounded-[22px_22px_22px_4px] bg-white p-[18px]">
                      <div className="flex items-start justify-between gap-2.5">
                        <Link to={`/admin/cubicaje/${c.id}`} className="flex min-w-0 flex-col gap-0.5 text-ink no-underline">
                          <span className="text-[15px] leading-[1.35] font-semibold">{c.nombre}</span>
                          <span className="text-xs text-muted">
                            {fechaCub(c.createdAt, lang)} · {getContenedor(c.tipoContenedor)?.nombre}
                          </span>
                        </Link>
                        <EstadoBadge estado={c.estado} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted">
                        <span className="flex flex-col gap-0.5">
                          {t('cub.lista.cols.cajas')}
                          <strong className="text-sm font-semibold text-ink">{num(totalCajas(c), 0, lang)}</strong>
                        </span>
                        <span className="flex flex-col gap-0.5">
                          {t('cub.lista.cols.peso')}
                          <strong className="text-sm font-semibold text-ink">{m ? num(m.pesoTotal, 0, lang) : '—'}</strong>
                        </span>
                        <span className="flex flex-col gap-0.5">
                          {t('cub.lista.cols.ocupacion')}
                          <strong className="text-sm font-semibold text-ink">{o == null ? '—' : num(o, 0, lang) + ' %'}</strong>
                        </span>
                      </div>
                      {c.origen === 'diagnostico' && (
                        <span>
                          <OrigenBadge origen={c.origen} />
                        </span>
                      )}
                      <div className="flex gap-2 border-t border-line-2 pt-2.5">
                        <Link to={`/admin/cubicaje/${c.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white no-underline">
                          {t('cub.lista.verDetalle')}
                        </Link>
                        <Link to={`/admin/cubicaje/${c.id}/editar`} aria-label={t('cub.lista.editar', { n: c.nombre })} className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-line text-ink">
                          <Pen />
                        </Link>
                        <button type="button" onClick={() => setBorrar(c)} aria-label={t('cub.lista.eliminar', { n: c.nombre })} className="flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line bg-white text-clay-dark">
                          <Trash />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <nav aria-label={t('cub.lista.paginacion')} className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted">
                  {t('cub.lista.mostrando', { desde: (actual - 1) * POR_PAGINA + 1, hasta: Math.min(actual * POR_PAGINA, total), total })}
                </span>
                <span className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => irPagina(actual - 1)} disabled={actual <= 1} aria-label={t('cub.lista.anterior')} className="flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line bg-white text-ink disabled:cursor-default disabled:opacity-40">
                    <ChevronLeft />
                  </button>
                  {paginas(actual, nPag).map((p, i) =>
                    p === '…' ? (
                      <span key={'g' + i} className="flex h-11 w-7 items-center justify-center text-muted">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => irPagina(p)}
                        aria-current={p === actual ? 'page' : undefined}
                        className={'h-11 min-w-11 cursor-pointer rounded-full border-[1.5px] px-1.5 text-sm font-semibold ' + (p === actual ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button type="button" onClick={() => irPagina(actual + 1)} disabled={actual >= nPag} aria-label={t('cub.lista.siguiente')} className="flex size-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line bg-white text-ink disabled:cursor-default disabled:opacity-40">
                    <ChevronRight />
                  </button>
                </span>
              </nav>
            </>
          )}
        </>
      )}

      {lista.length > 0 && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setBorrarTodos(true)} className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent px-2 text-[13px] font-medium text-clay-dark underline">
            <Trash size={16} />
            {t('cub.lista.eliminarTodos')}
          </button>
        </div>
      )}

      {borrar && <ConfirmarEliminar nombre={borrar.nombre} onConfirmar={eliminar} onCerrar={cerrarBorrar} />}
      {borrarTodos && (
        <ConfirmarEliminar
          titulo={t('cub.lista.eliminarTodosT')}
          texto={t('cub.lista.eliminarTodosD', { n: lista.length })}
          onConfirmar={eliminarTodos}
          onCerrar={cerrarBorrarTodos}
        />
      )}
      <Toast>{toast}</Toast>
    </>
  );
}
