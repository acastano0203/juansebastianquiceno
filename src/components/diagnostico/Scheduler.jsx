import { useMemo } from 'react';
import { useLeads } from '../../data/LeadsContext';
import { useI18n } from '../../i18n/LanguageContext';
import { DAY_MS, cap, esFestivo, fechaLarga, horaMin, minutosDe, monthName, sameDay, startOfDay } from '../../lib/format';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight } from '../ui/Icons';

// Horarios en minutos desde medianoche: 8:00, 10:00, 11:30, 14:00, 15:30, 17:00
const BASE_SLOTS = [480, 600, 690, 840, 930, 1020];
const DIAS_VENTANA = 45;

export function useAgenda() {
  const { leads } = useLeads();
  return useMemo(() => {
    const today = startOfDay(new Date());
    const limit = new Date(today.getTime() + DIAS_VENTANA * DAY_MS);
    const ocupadas = leads.filter((l) => l.cita).map((l) => new Date(l.cita));

    const slotsFor = (d) => {
      const r1 = (d.getDate() * 7) % 6;
      const r2 = (d.getDate() * 3) % 6;
      return BASE_SLOTS.filter((m, i) => i !== r1 && i !== r2).filter((m) => !ocupadas.some((o) => sameDay(o, d) && minutosDe(o) === m));
    };
    const disponible = (d) => d > today && d <= limit && d.getDay() !== 0 && d.getDay() !== 6 && !esFestivo(d) && slotsFor(d).length > 0;
    return { today, limit, slotsFor, disponible };
  }, [leads]);
}

function Calendar({ month, setMonth, day, onPickDay, agenda }) {
  const { t, lang } = useI18n();
  const { today, limit, disponible } = agenda;
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const canPrev = y > today.getFullYear() || m > today.getMonth();
  const canNext = new Date(y, m + 1, 1) <= limit;
  const festivos = [];
  for (let d = 1; d <= days; d++) if (esFestivo(new Date(y, m, d))) festivos.push(d);

  return (
    <div className="flex flex-col gap-[18px] rounded-[28px_28px_28px_4px] border border-line p-5 md:p-7">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[22px] font-semibold">
          {cap(monthName(m, lang))} {y}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label={t('sched.prev')}
            disabled={!canPrev}
            onClick={() => setMonth(new Date(y, m - 1, 1))}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink disabled:cursor-default disabled:text-[#A9BAB3]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label={t('sched.next')}
            disabled={!canNext}
            onClick={() => setMonth(new Date(y, m + 1, 1))}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink disabled:cursor-default disabled:text-[#A9BAB3]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted">
        {t('sched.dows').map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: blanks }, (_, i) => (
          <span key={'b' + i} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = new Date(y, m, i + 1);
          const ok = disponible(d);
          const on = day && sameDay(day, d);
          const isToday = sameDay(d, today);
          return (
            <button
              key={i}
              type="button"
              disabled={!ok}
              aria-pressed={on}
              aria-label={fechaLarga(d, lang) + (ok ? '' : t('sched.noSlots'))}
              onClick={() => onPickDay(d)}
              className={
                'h-11 rounded-[14px_14px_14px_4px] border-[1.5px] text-[15px] enabled:cursor-pointer enabled:hover:outline-[1.5px] enabled:hover:outline-ink ' +
                (on ? 'bg-ink text-white' : ok ? 'bg-mist-3 text-ink' : 'bg-transparent text-off') +
                ' ' +
                (isToday ? 'border-gold' : on ? 'border-ink' : 'border-transparent') +
                ' ' +
                (ok ? 'font-semibold' : 'font-normal')
              }
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-mist-3" />
          {t('sched.withSlots')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded border-[1.5px] border-gold" />
          {t('sched.today')}
        </span>
        {festivos.length > 0 && <span>{t('sched.holiday', { days: festivos.join(', '), month: monthName(m, lang) })}</span>}
      </div>
    </div>
  );
}

export default function Scheduler({ value, onChange, onConfirm }) {
  const { t, lang } = useI18n();
  const agenda = useAgenda();
  const { month, day, time, nombre, whatsapp } = value;
  const set = (patch) => onChange({ ...value, ...patch });
  const slots = day ? agenda.slotsFor(day) : [];
  const canConfirm = !!(day && time != null && nombre.trim() && whatsapp.trim());
  const dayTxt = day ? (lang === 'en' ? fechaLarga(day, lang) : fechaLarga(day, lang).toLowerCase()) : '';

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-9 px-[22px] py-10 md:px-[72px] md:py-14">
      <div className="flex flex-col gap-2.5">
        <h2 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.01em] md:text-[40px]">{t('sched.title')}</h2>
        <p className="m-0 text-base text-muted">{t('sched.lead')}</p>
      </div>

      <div className="grid items-start gap-7 xl:grid-cols-2">
        <Calendar month={month} setMonth={(mm) => set({ month: mm })} day={day} onPickDay={(d) => set({ day: d, time: null })} agenda={agenda} />

        <div className="flex flex-col gap-4">
          <span className="text-[15px] font-semibold">{day ? t('sched.slotsFor', { day: dayTxt }) : t('sched.pickDay')}</span>
          {day ? (
            <div className="grid grid-cols-2 gap-2.5">
              {slots.map((min) => {
                const on = time === min;
                return (
                  <button
                    key={min}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ time: min })}
                    className={'min-h-[52px] cursor-pointer rounded-full border-[1.5px] text-[15px] font-semibold hover:border-ink ' + (on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')}
                  >
                    {horaMin(min, lang)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="m-0 rounded-[18px] bg-mist p-5 text-sm leading-[1.5] text-muted">{t('sched.greenDays')}</p>
          )}
          <div className="flex flex-col gap-3.5 pt-2.5">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              {t('sched.name')}
              <input className="field" type="text" autoComplete="name" value={nombre} onChange={(e) => set({ nombre: e.target.value })} placeholder={t('sched.namePh')} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
              {t('sched.whatsapp')}
              <input className="field" type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+57 300 000 0000" />
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 rounded-[24px_24px_24px_4px] bg-mist px-7 py-[22px]">
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] text-muted">{t('sched.yourCall')}</span>
          <span className="text-[17px] font-semibold">{day && time != null ? fechaLarga(day, lang) + ' · ' + horaMin(time, lang) : t('sched.pickDayTime')}</span>
        </span>
        <Button variant="gold" size="xl" disabled={!canConfirm} onClick={onConfirm}>
          {t('sched.confirm')}
        </Button>
      </div>
    </main>
  );
}
