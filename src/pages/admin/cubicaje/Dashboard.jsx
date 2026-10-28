import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { useCubicajes } from '../../../data/useCubicajes';
import { totalCajas } from '../../../data/cubicajesRepo';
import { getContenedor } from '../../../cubicaje/config';
import { kpis, ocupacionDe, porMes, ultimos } from '../../../cubicaje/estadisticas';
import { cap, fechaLarga, monthName, num } from '../../../lib/format';
import { ButtonLink } from '../../../components/ui/Button';
import { ChevronRight, Plus } from '../../../components/ui/Icons';
import { EstadoBadge, VacioCubicajes } from '../../../components/cubicaje/CubicajeUI';
import { fechaCub } from './Lista';

function Kpi({ label, children, nota, oscuro }) {
  return (
    <div className={'flex flex-col gap-2 rounded-[24px_24px_24px_4px] px-6 py-[22px] ' + (oscuro ? 'bg-ink text-white' : 'bg-white')}>
      <span className={'text-[13px] ' + (oscuro ? 'text-sage' : 'text-muted')}>{label}</span>
      <span className="font-serif text-[34px] leading-none font-semibold md:text-[38px]">{children}</span>
      {nota}
    </div>
  );
}

const mesCorto = (m, lang) => cap(monthName(m, lang).slice(0, 3));

// Escala "redonda" para el eje: 5, 10, 20, 50…
function techo(v) {
  for (const s of [5, 10, 20, 25, 50, 100, 200, 500]) if (v <= s) return s;
  return Math.ceil(v / 500) * 500;
}

function BarrasPorMes({ meses }) {
  const { t, lang } = useI18n();
  const max = techo(Math.max(1, ...meses.map((m) => m.cantidad)));
  const BY = (v) => 230 - (v / max) * 200;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  return (
    <svg
      role="img"
      aria-label={t('cub.dash.porMesAria', {
        desde: `${monthName(meses[0].mes, lang)} ${meses[0].anio}`,
        hasta: `${monthName(meses[11].mes, lang)} ${meses[11].anio}`,
        valores: meses.map((m) => `${mesCorto(m.mes, lang)} ${m.cantidad}`).join(', '),
      })}
      viewBox="0 0 720 260"
      className="block h-auto w-full font-sans"
    >
      {grid.map((v) => (
        <g key={v}>
          <line x1="36" x2="712" y1={BY(v)} y2={BY(v)} stroke="#E3EEE4" strokeWidth="1" />
          <text x="28" y={BY(v) + 4} textAnchor="end" fontSize="11" fill="#4A6364">
            {v}
          </text>
        </g>
      ))}
      {meses.map((m, i) => {
        const x = 52 + i * 55;
        return (
          <g key={i}>
            <rect x={x} y={BY(m.cantidad)} width="34" height={230 - BY(m.cantidad)} rx="6" fill={i === 11 ? '#DDBD62' : '#123638'}>
              <title>{`${monthName(m.mes, lang)} ${m.anio}: ${m.cantidad}`}</title>
            </rect>
            {m.cantidad > 0 && (
              <text x={x + 17} y={BY(m.cantidad) - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#123638">
                {m.cantidad}
              </text>
            )}
            <text x={x + 17} y="252" textAnchor="middle" fontSize="11" fill="#4A6364">
              {mesCorto(m.mes, lang)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function OcupacionPorMes({ meses }) {
  const { t, lang } = useI18n();
  const vals = meses.map((m) => m.ocupacion).filter((v) => v != null);
  const min = vals.length ? Math.max(0, Math.floor((Math.min(...vals) - 5) / 10) * 10) : 0;
  const LY = (v) => 230 - ((v - min) / (100 - min)) * 200;
  const grid = [];
  for (let v = min; v <= 100; v += (100 - min) / 4) grid.push(Math.round(v));
  const pts = meses.map((m, i) => ({ ...m, x: 56 + i * 37 })).filter((m) => m.ocupacion != null);
  const primero = pts[0];
  const ultimo = pts[pts.length - 1];

  return (
    <svg
      role="img"
      aria-label={t('cub.dash.ocupMesAria', {
        valores: meses.map((m) => `${mesCorto(m.mes, lang)} ${m.ocupacion == null ? t('cub.dash.sinDato') : num(m.ocupacion, 0, lang) + ' %'}`).join(', '),
      })}
      viewBox="0 0 480 260"
      className="block h-auto w-full font-sans"
    >
      {grid.map((v) => (
        <g key={v}>
          <line x1="40" x2="470" y1={LY(v)} y2={LY(v)} stroke="#E3EEE4" strokeWidth="1" />
          <text x="32" y={LY(v) + 4} textAnchor="end" fontSize="11" fill="#4A6364">
            {v} %
          </text>
        </g>
      ))}
      {pts.length > 1 && <polyline points={pts.map((p) => `${p.x},${LY(p.ocupacion)}`).join(' ')} fill="none" stroke="#995837" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
      {pts.map((p) => (
        <circle key={p.x} cx={p.x} cy={LY(p.ocupacion)} r="4" fill="#FFFFFF" stroke="#995837" strokeWidth="2.5">
          <title>{`${monthName(p.mes, lang)} ${p.anio}: ${num(p.ocupacion, 0, lang)} %`}</title>
        </circle>
      ))}
      {meses.map((m, i) => (
        <text key={i} x={56 + i * 37} y="252" textAnchor="middle" fontSize="10" fill="#4A6364">
          {mesCorto(m.mes, lang)}
        </text>
      ))}
      {primero && (
        <text x={primero.x + 4} y={Math.min(222, LY(primero.ocupacion) + 22)} fontSize="12" fontWeight="600" fill="#995837">
          {num(primero.ocupacion, 0, lang)} %
        </text>
      )}
      {ultimo && ultimo !== primero && (
        <text x={ultimo.x + 2} y={Math.max(14, LY(ultimo.ocupacion) - 12)} textAnchor="end" fontSize="12" fontWeight="600" fill="#995837">
          {num(ultimo.ocupacion, 0, lang)} %
        </text>
      )}
    </svg>
  );
}

export default function DashboardCubicaje() {
  const { t, lang } = useI18n();
  const { lista, cargando, recargar } = useCubicajes();
  const ahora = new Date();
  const k = kpis(lista, ahora);
  const meses = porMes(lista, ahora);
  const anterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">
            {t('cub.menu')} · {fechaLarga(ahora, lang)}
          </span>
          <h1 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold md:text-[40px]">
            {t('cub.dash.titulo')} <em className="font-normal text-clay">{t('cub.dash.tituloEm')}</em>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink to="/admin/cubicaje/lista" variant="outline-ink" size="lg" className="hidden md:inline-flex">
            {t('cub.dash.verTodos')}
          </ButtonLink>
          <ButtonLink to="/admin/cubicaje/nuevo" variant="gold" size="lg">
            <Plus size={18} />
            {t('cub.nuevo')}
          </ButtonLink>
        </div>
      </div>

      {!cargando && !lista.length ? (
        <VacioCubicajes onCargado={recargar} />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
            <Kpi label={t('cub.dash.total')} nota={k.desde && <span className="text-xs text-muted">{t('cub.dash.desde', { f: `${monthName(k.desde.getMonth(), lang)} ${k.desde.getFullYear()}` })}</span>}>
              {num(k.total, 0, lang)}
            </Kpi>
            <Kpi
              label={t('cub.dash.delMes')}
              nota={<span className="text-xs text-muted">{t('cub.dash.delMesD', { mes: cap(monthName(ahora.getMonth(), lang)), n: k.mesAnterior, anterior: monthName(anterior.getMonth(), lang) })}</span>}
            >
              {num(k.delMes, 0, lang)}
            </Kpi>
            <Kpi
              oscuro
              label={t('cub.dash.ocupacion')}
              nota={
                <span className="h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <span className="block h-full rounded-full bg-gold" style={{ width: (k.ocupacionPromedio || 0) + '%' }} />
                </span>
              }
            >
              {k.ocupacionPromedio == null ? '—' : num(k.ocupacionPromedio, 1, lang) + ' %'}
            </Kpi>
            <Kpi label={t('cub.dash.peso')} nota={<span className="text-xs text-muted">{t('cub.dash.pesoD')}</span>}>
              {num(k.pesoTotal12m, 0, lang)} <span className="font-sans text-base font-medium text-muted">kg</span>
            </Kpi>
          </div>

          <div className="flex flex-wrap items-stretch gap-[22px]">
            <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-4 rounded-[32px_32px_32px_4px] bg-white px-5 py-6 md:px-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2.5">
                <h2 className="m-0 font-serif text-[22px] font-semibold">{t('cub.dash.porMes')}</h2>
                <span className="flex gap-3.5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-ink" />
                    {t('cub.dash.cerrado')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-gold" />
                    {t('cub.dash.enCurso')}
                  </span>
                </span>
              </div>
              <BarrasPorMes meses={meses} />
            </section>
            <section className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[32px_32px_32px_4px] bg-white px-5 py-6 md:px-7">
              <div className="flex flex-col gap-1">
                <h2 className="m-0 font-serif text-[22px] font-semibold">{t('cub.dash.ocupMes')}</h2>
                <span className="text-[13px] text-muted">{t('cub.dash.ocupMesD')}</span>
              </div>
              <OcupacionPorMes meses={meses} />
            </section>
          </div>

          <section className="flex flex-col gap-2.5 rounded-[32px_32px_32px_4px] bg-white px-5 py-6 md:px-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="m-0 font-serif text-[22px] font-semibold">{t('cub.dash.ultimos')}</h2>
              <Link to="/admin/cubicaje/lista" className="inline-flex min-h-11 items-center text-sm font-semibold">
                {t('cub.dash.verN', { n: k.total })}
              </Link>
            </div>
            {ultimos(lista, 5).map((c) => {
              const o = ocupacionDe(c);
              return (
                <Link key={c.id} to={`/admin/cubicaje/${c.id}`} className="-mx-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border-t border-line-2 px-3 py-3.5 text-ink no-underline transition-colors hover:bg-[#F7FAF7]">
                  <span className="flex min-w-0 flex-[999_1_240px] flex-col gap-0.5">
                    <span className="text-[15px] font-semibold">{c.nombre}</span>
                    <span className="text-xs text-muted">
                      {getContenedor(c.tipoContenedor)?.nombre} · {fechaCub(c.createdAt, lang)} · {t('cub.dash.cajas', { n: num(totalCajas(c), 0, lang) })}
                    </span>
                  </span>
                  <span className="flex flex-[1_1_140px] items-center gap-2.5 text-[13px] font-semibold tabular-nums">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist-2">
                      <span className="block h-full rounded-full" style={{ width: (o || 0) + '%', background: c.estado === 'excede' ? '#995837' : '#123638' }} />
                    </span>
                    {o == null ? '—' : num(o, 0, lang) + ' %'}
                  </span>
                  <EstadoBadge estado={c.estado} />
                  <span aria-hidden="true" className="flex-none text-muted">
                    <ChevronRight />
                  </span>
                </Link>
              );
            })}
          </section>
        </>
      )}
    </>
  );
}
