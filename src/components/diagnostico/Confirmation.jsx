import { Link } from 'react-router-dom';
import { getArea, mercadoNombre } from '../../data/catalog';
import { useI18n } from '../../i18n/LanguageContext';
import { cap, fechaLarga, hora } from '../../lib/format';
import Brand from '../ui/Brand';
import { Button } from '../ui/Button';
import { Calendar, Check } from '../ui/Icons';
import LanguageSwitcher from '../ui/LanguageSwitcher';

function googleCalendarUrl(cita, title, tema) {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(cita.getTime() + 30 * 60000);
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: fmt(cita) + '/' + fmt(end), details: tema });
  return 'https://calendar.google.com/calendar/render?' + params.toString();
}

export default function Confirmation({ lead, onReschedule }) {
  const { t, lang } = useI18n();
  const cita = new Date(lead.cita);
  const area = getArea(lead.answers.area, lang);
  const tema = area.servicio + ' · ' + cap(mercadoNombre(lead.answers.mercado, lang).replace(/^the /, ''));
  const first = lead.nombre.split(' ')[0];
  const fecha = fechaLarga(cita, lang) + (lang === 'en' ? ', ' : ' de ') + cita.getFullYear();

  return (
    <div className="flex min-h-screen min-w-0 flex-[1_1_100%] flex-col bg-mist">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-br-[80px] bg-ink px-[22px] pt-7 pb-24 md:rounded-br-[120px] md:px-12">
        <Brand className="inline-flex" />
        <LanguageSwitcher compact />
      </header>
      <div className="mx-auto -mt-16 mb-16 box-border grid w-full max-w-[1040px] items-start gap-6 px-6 lg:grid-cols-2">
        <section className="flex flex-col gap-7 rounded-[36px_36px_36px_6px] bg-white p-7 shadow-[0_20px_50px_rgba(18,54,56,.10)] md:p-11">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-[0_28px_0_28px] bg-gold text-ink">
            <Check size={26} />
          </span>
          <h1 className="m-0 font-serif text-[34px] leading-[1.1] font-semibold tracking-[-0.01em] md:text-[40px]">
            {t('conf.done', { name: first })} <em className="font-normal">{t('conf.doneEm')}</em>
          </h1>
          <dl className="m-0 grid gap-x-7 gap-y-[22px] sm:grid-cols-2">
            {[
              [t('conf.date'), fecha],
              [t('conf.time'), hora(cita, lang) + t('conf.timeSuffix')],
              [t('conf.place'), t('conf.placeVal')],
              [t('conf.with'), 'Juan Sebastián Quiceno'],
            ].map(([dt, dd]) => (
              <div key={dt} className="flex flex-col gap-1">
                <dt className="text-[13px] text-muted">{dt}</dt>
                <dd className="m-0 text-[17px] font-semibold">{dd}</dd>
              </div>
            ))}
            <div className="col-span-full flex flex-col gap-1">
              <dt className="text-[13px] text-muted">{t('conf.topic')}</dt>
              <dd className="m-0 text-[17px] font-semibold">{tema}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <a
              href={googleCalendarUrl(cita, t('conf.calTitle'), tema)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-ink px-6 text-[15px] font-semibold text-white no-underline"
            >
              <Calendar />
              {t('conf.addCal')}
            </a>
            <Button variant="outline" size="lg" className="px-[22px]" onClick={onReschedule}>
              {t('conf.change')}
            </Button>
          </div>
        </section>
        <section className="flex flex-col gap-[22px] rounded-[6px_36px_36px_36px] bg-ink p-7 text-white md:p-10">
          <h2 className="m-0 font-serif text-[28px] font-normal italic">{t('conf.next')}</h2>
          <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
            {t('conf.steps').map((s, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="flex-none font-serif text-xl text-gold italic">{i + 1}</span>
                <span className="text-[15px] leading-[1.55] text-pale-2">{s.replace('{wa}', lead.whatsapp).replace('{prep}', area.preparar)}</span>
              </li>
            ))}
          </ol>
          <Link to="/" className="mt-1.5 inline-flex min-h-11 items-center text-sm text-sage">
            {t('conf.home')}
          </Link>
        </section>
      </div>
    </div>
  );
}
