import { useState } from 'react';
import { TIPOS, getStages, tipoNombre } from '../../data/catalog';
import { useLeads, useProximoLead } from '../../data/LeadsContext';
import { DAY_MS, fechaLarga, money, startOfDay } from '../../lib/format';
import { useI18n } from '../../i18n/LanguageContext';
import PageHeader, { Stat } from '../../components/admin/PageHeader';
import LeadCard from '../../components/admin/LeadCard';
import { Search } from '../../components/ui/Icons';

const FILTROS = ['Todos', ...Object.keys(TIPOS)];

function normalizar(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function Pipeline() {
  const { leads, moveLead, resetDemo } = useLeads();
  const { t, lang } = useI18n();
  const proximo = useProximoLead();
  const [filtro, setFiltro] = useState('Todos');
  const [q, setQ] = useState('');
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const now = new Date();
  const lunes = startOfDay(new Date(now.getTime() - ((now.getDay() + 6) % 7) * DAY_MS));
  const domingo = new Date(lunes.getTime() + 7 * DAY_MS);
  const stats = {
    activos: leads.filter((l) => l.stage < 4).length,
    semana: leads.filter((l) => l.cita && new Date(l.cita) >= lunes && new Date(l.cita) < domingo).length,
    propuestas: leads.filter((l) => l.stage === 3).reduce((s, l) => s + (l.valor || 0), 0),
  };

  const visibles = leads.filter(
    (l) => (filtro === 'Todos' || l.answers.perfil === filtro) && (!q.trim() || normalizar(l.nombre + ' ' + l.lugar).includes(normalizar(q.trim()))),
  );

  return (
    <>
      <PageHeader eyebrow={fechaLarga(now, lang)} title={t('pipe.title')}>
        <Stat label={t('pipe.active')} value={stats.activos} />
        <Stat label={t('pipe.callsWeek')} value={stats.semana} />
        <Stat label={t('pipe.inProposals')} value={money(stats.propuestas)} />
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t('pipe.filter')} className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const on = filtro === f;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFiltro(f)}
                className={'min-h-10 cursor-pointer rounded-full border-[1.5px] px-4 text-sm font-medium ' + (on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')}
              >
                {f === 'Todos' ? t('pipe.all') : tipoNombre(f, lang)}
              </button>
            );
          })}
        </div>
        <label className="flex min-h-11 min-w-[240px] items-center gap-2 rounded-full bg-white px-4 text-sm text-muted">
          <Search size={16} />
          <span className="sr-only">{t('pipe.search')}</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pipe.searchPh')}
            className="flex-1 border-0 bg-transparent text-ink outline-none focus-visible:outline-none"
          />
        </label>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-[repeat(5,minmax(232px,1fr))] items-start gap-3.5">
          {getStages(lang).map((st, i) => {
            const items = visibles.filter((l) => l.stage === i);
            const total = items.reduce((s, l) => s + (l.valor || 0), 0);
            const isOver = dragging && over === i;
            return (
              <section
                key={i}
                aria-label={st.name}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(i);
                }}
                onDragLeave={() => setOver((o) => (o === i ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  moveLead(e.dataTransfer.getData('text/plain'), i);
                  setDragging(null);
                  setOver(null);
                }}
                className={
                  'flex min-h-[160px] flex-col gap-2.5 rounded-[24px_24px_24px_4px] p-3.5 outline-2 outline-offset-[-2px] transition-colors ' +
                  (i === 2 ? 'bg-mist-3' : 'bg-mist-2') +
                  (isOver ? ' outline-dashed outline-ink-4' : ' outline-transparent')
                }
              >
                <div className="flex items-center justify-between px-1.5 pt-1 pb-1.5">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2.5 rounded-[0_5px_0_5px]" style={{ background: st.dot }} />
                    <h2 className="m-0 text-sm font-semibold">{st.name}</h2>
                  </span>
                  <span className="box-border flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold">{items.length}</span>
                </div>
                {i >= 3 && total > 0 && <span className="px-1.5 text-xs text-muted">{(i === 4 ? t('pipe.closed') : t('pipe.value')) + money(total)}</span>}
                {items.map((l) => (
                  <LeadCard
                    key={l.id}
                    lead={l}
                    destacado={l.stage === 2 && proximo?.id === l.id}
                    onDragStart={setDragging}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                  />
                ))}
                {items.length === 0 && <span className="px-2 py-[18px] text-center text-[13px] text-muted">{q || filtro !== 'Todos' ? t('pipe.emptyFilter') : t('pipe.empty')}</span>}
              </section>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
        <span>{t('pipe.hint')}</span>
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('pipe.resetConfirm'))) resetDemo();
          }}
          className="min-h-11 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted underline"
        >
          {t('pipe.reset')}
        </button>
      </div>
    </>
  );
}
