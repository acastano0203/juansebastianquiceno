import { useState } from 'react';
import { useLeads } from '../../data/LeadsContext';
import { mesEnCurso, pct, septiembre } from '../../data/metrics';
import { useI18n } from '../../i18n/LanguageContext';
import { money } from '../../lib/format';
import PageHeader from '../../components/admin/PageHeader';
import TrendChart from '../../components/admin/TrendChart';

function Kpi({ label, value, note, dark, good }) {
  return (
    <div className={'flex flex-col gap-2 rounded-[24px_24px_24px_4px] px-[22px] py-5 ' + (dark ? 'bg-ink text-white' : 'bg-white')}>
      <span className={'text-[13px] ' + (dark ? 'text-sage' : 'text-muted')}>{label}</span>
      <span className={'font-serif leading-none font-semibold ' + (dark ? 'text-[30px] leading-[1.1]' : 'text-4xl')}>{value}</span>
      {note && <span className={'text-xs ' + (dark ? 'text-sage' : good ? 'font-medium text-good' : 'text-muted')}>{note}</span>}
    </div>
  );
}

function Legend({ color, bar, children }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={bar ? 'size-2.5 rounded-[3px]' : 'h-[3px] w-[18px] rounded-sm'} style={{ background: color }} />
      {children}
    </span>
  );
}

export default function Resultados() {
  const { leads } = useLeads();
  const { t, lang } = useI18n();
  const [periodo, setPeriodo] = useState('cerrado');
  const cerrado = septiembre(lang);
  const curso = mesEnCurso(leads, lang);
  const d = periodo === 'cerrado' ? cerrado : curso;
  const embudo = [
    [t('res.leads'), d.leads, '#B8D8B8'],
    [t('res.qualified'), d.calificados, '#7FB07F'],
    [t('res.calls'), d.llamadas, '#2C6B6E'],
    [t('res.proposals'), d.propuestas, '#995837'],
    [t('res.closes'), d.cierres, '#123638'],
  ];

  return (
    <>
      <PageHeader
        eyebrow={d.cerrado ? t('res.closedMonth') : t('res.liveMonth')}
        title={
          <>
            {t('res.title')}
            <em className="font-normal text-clay">{d.titulo}</em>
          </>
        }
      >
        <label className="sr-only" htmlFor="periodo">
          {t('res.period')}
        </label>
        <select
          id="periodo"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="min-h-11 cursor-pointer rounded-full border-[1.5px] border-line bg-white px-[18px] text-sm font-medium text-ink"
        >
          <option value="cerrado">{cerrado.etiqueta}</option>
          <option value="curso">{curso.etiqueta}</option>
        </select>
      </PageHeader>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3.5">
        <Kpi label={t('res.leads')} value={d.leads} note={d.delta ? t('res.delta') : t('res.leadsNote')} good={d.delta} />
        <Kpi label={t('res.qualified')} value={pct(d.calificados, d.leads)} note={t('res.qualifiedNote', { a: d.calificados, b: d.leads })} />
        <Kpi label={t('res.calls')} value={d.llamadas} note={t('res.callsNote', { p: pct(d.llamadas, d.calificados) })} />
        <Kpi label={t('res.proposals')} value={d.propuestas} note={t('res.proposalsNote', { p: pct(d.propuestas, d.llamadas) })} />
        <Kpi label={t('res.closes')} value={d.cierres} note={t('res.closesNote', { p: pct(d.cierres, d.propuestas) })} />
        <Kpi dark label={t('res.value')} value={money(d.valor)} note={t('res.valueNote')} />
        <Kpi label={t('res.response')} value={d.respuesta || '—'} note={d.respuesta ? t('res.responseNote') : t('res.responsePending')} />
      </div>

      <div className="flex flex-wrap items-stretch gap-[22px]">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px] rounded-[32px_32px_32px_4px] bg-white px-[30px] py-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="m-0 font-serif text-2xl font-semibold">{t('res.trend')}</h2>
            <div className="flex flex-wrap gap-[18px] text-[13px]">
              <Legend color="#123638">Leads</Legend>
              <Legend color="#995837">{t('res.calls')}</Legend>
              <Legend color="#DDBD62" bar>
                {t('res.closes')}
              </Legend>
            </div>
          </div>
          <TrendChart />
        </section>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-[22px]">
          <section className="flex flex-col gap-3.5 rounded-[32px_32px_32px_4px] bg-white px-7 py-[26px]">
            <h2 className="m-0 text-base font-semibold">
              {t('res.funnel')}
              {d.titulo}
            </h2>
            {embudo.map(([n, v, c]) => (
              <div key={n} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px]">
                  <span>{n}</span>
                  <span className="font-semibold">{v}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-mist-2">
                  <div className="h-full rounded-full transition-[width] duration-500" style={{ width: (d.leads ? Math.round((v / d.leads) * 100) : 0) + '%', background: c }} />
                </div>
              </div>
            ))}
          </section>
          <section className="flex flex-col gap-1 rounded-[32px_32px_32px_4px] bg-white px-7 py-[26px]">
            <h2 className="m-0 mb-2 text-base font-semibold">{t('res.closesList')}</h2>
            {d.listaCierres.length === 0 && <p className="m-0 border-t border-line-2 py-2.5 text-sm text-muted">{t('res.noCloses')}</p>}
            {d.listaCierres.map((c) => (
              <div key={c.n} className="flex items-center justify-between gap-3 border-t border-line-2 py-2.5">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{c.n}</span>
                  <span className="text-xs text-muted">{c.d}</span>
                </span>
                <span className="text-sm font-semibold whitespace-nowrap tabular-nums">{money(c.v)}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
