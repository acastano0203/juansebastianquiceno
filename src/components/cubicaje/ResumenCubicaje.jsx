import { useI18n } from '../../i18n/LanguageContext';
import { num } from '../../lib/format';
import { restricciones } from './restricciones';

function Barra({ pct, color }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-ink-3">
      <div className="h-full rounded-full" style={{ width: Math.min(100, pct) + '%', background: color }} />
    </div>
  );
}

// Panel lateral oscuro del detalle (artboard 9.4)
export function ResumenPanel({ cubicaje, cargando, className = '' }) {
  const { t, lang } = useI18n();
  const r = cubicaje.resultado;
  const c = r?.contenedor;
  const m = r?.metricas;
  const fuera = r ? r.noColocadas.reduce((s, n) => s + n.cantidad, 0) : 0;
  const cargadasDe = (id) => (r ? r.colocadas.filter((b) => b.productoId === id).length : 0);

  return (
    <section className={'flex min-w-0 flex-col gap-5 rounded-[6px_36px_36px_36px] bg-ink p-[26px] text-white print:bg-white print:text-ink ' + className}>
      <h2 className="m-0 font-serif text-[22px] font-semibold">{t('cub.resumen.titulo')}</h2>
      {c && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-sage print:text-muted">{t('cub.resumen.tipo')}</span>
          <span className="text-base font-semibold">{c.nombre}</span>
          <span className="text-xs text-sage print:text-muted">{t('cub.resumen.interno', { dims: `${c.largo} × ${c.ancho} × ${c.alto}` })}</span>
        </div>
      )}
      {cargando || !m ? (
        <div className="flex flex-col gap-3.5" aria-hidden="true">
          <span className="h-16 animate-pulse rounded-2xl bg-ink-2" />
          <span className="h-16 animate-pulse rounded-2xl bg-ink-2" />
          <span className="h-24 animate-pulse rounded-2xl bg-ink-2" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-sage print:text-muted">{t('cub.resumen.volumen')}</span>
              <span className="font-semibold">
                {num(m.volumenUsado, 1, lang)} / {num(m.volumenContenedor, 1, lang)} m³
              </span>
            </div>
            <Barra pct={m.ocupacion} color="#DDBD62" />
            <span className="font-serif text-[34px] leading-none font-semibold">{num(m.ocupacion, 0, lang)} %</span>
            <span className="text-xs text-sage print:text-muted">{t('cub.resumen.libres', { n: num(m.volumenContenedor - m.volumenUsado, 1, lang) })}</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-sage print:text-muted">{t('cub.resumen.peso')}</span>
              <span className="font-semibold">
                {num(m.pesoTotal, 0, lang)} / {num(m.cargaMax, 0, lang)} kg
              </span>
            </div>
            <Barra pct={m.ocupacionPeso} color="#B8D8B8" />
            <span className="text-xs text-sage print:text-muted">{t('cub.resumen.delMax', { n: num(m.ocupacionPeso, 1, lang) })}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1 rounded-2xl bg-ink-2 p-3.5 print:bg-mist">
              <span className="text-xs text-sage print:text-muted">{t('cub.resumen.cargadas')}</span>
              <span className="font-serif text-[26px] font-semibold">{num(m.cajasColocadas, 0, lang)}</span>
            </div>
            <div className={'flex flex-col gap-1 rounded-2xl p-3.5 ' + (fuera ? 'bg-clay-bg text-clay-dark' : 'bg-ink-2 print:bg-mist')}>
              <span className={'text-xs ' + (fuera ? 'text-clay-dark' : 'text-sage print:text-muted')}>{t('cub.resumen.noCupieron')}</span>
              <span className="font-serif text-[26px] font-semibold">{fuera ? num(fuera, 0, lang) : t('cub.resumen.ninguna')}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-xs text-sage print:text-muted">{t('cub.resumen.porProducto')}</span>
            {cubicaje.productos.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 text-[13px]">
                <span aria-hidden="true" className="size-2.5 flex-none rounded-[3px]" style={{ background: p.color }} />
                <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                <span className="font-semibold tabular-nums">
                  {num(cargadasDe(p.id), 0, lang)} / {num(p.cantidad, 0, lang)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// Tabla "Productos del cubicaje" con sus restricciones
export function TablaProductos({ cubicaje, cargando }) {
  const { t, lang } = useI18n();
  const r = cubicaje.resultado;
  const fueraDe = (id) => r?.noColocadas.find((n) => n.productoId === id)?.cantidad || 0;
  const dec = (n) => num(n, n % 1 ? 1 : 0, lang);

  return (
    <section className="flex flex-col gap-3 rounded-[32px_32px_32px_4px] bg-white px-5 py-6 md:px-7 print:break-inside-avoid">
      <h2 className="m-0 font-serif text-[22px] font-semibold">{t('cub.tabla.titulo')}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-sm print:min-w-0">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th scope="col" className="py-2.5 pr-3 font-semibold">{t('cub.tabla.producto')}</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">{t('cub.tabla.dims')}</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t('cub.tabla.peso')}</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t('cub.tabla.cantidad')}</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t('cub.tabla.cargadas')}</th>
              <th scope="col" className="px-3 py-2.5 font-semibold">{t('cub.tabla.color')}</th>
              <th scope="col" className="py-2.5 pl-3 font-semibold">{t('cub.tabla.restricciones')}</th>
            </tr>
          </thead>
          <tbody>
            {cubicaje.productos.map((p) => {
              const fuera = fueraDe(p.id);
              return (
                <tr key={p.id}>
                  <td className="border-t border-line-2 py-3 pr-3 font-semibold">
                    <span className="inline-flex items-center gap-2.5">
                      <span aria-hidden="true" className="size-7 flex-none rounded-[8px_8px_8px_2px]" style={{ background: p.color }} />
                      {p.nombre}
                    </span>
                  </td>
                  <td className="border-t border-line-2 p-3 tabular-nums">
                    {dec(p.largo)} × {dec(p.ancho)} × {dec(p.alto)}
                  </td>
                  <td className="border-t border-line-2 p-3 text-right tabular-nums">{dec(p.peso)}</td>
                  <td className="border-t border-line-2 p-3 text-right tabular-nums">{num(p.cantidad, 0, lang)}</td>
                  <td className={'border-t border-line-2 p-3 text-right font-semibold tabular-nums ' + (fuera && !cargando ? 'text-clay-dark' : '')}>
                    {cargando || !r ? '—' : num(p.cantidad - fuera, 0, lang)}
                  </td>
                  <td className="border-t border-line-2 p-3 text-xs text-muted tabular-nums">{p.color.toUpperCase()}</td>
                  <td className="border-t border-line-2 py-3 pl-3">
                    <span className="flex flex-wrap gap-1.5">
                      {restricciones(p, t, lang).map((tag) => (
                        <span key={tag} className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium whitespace-nowrap">
                          {tag}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
