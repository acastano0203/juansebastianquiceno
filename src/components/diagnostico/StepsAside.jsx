import { getQuestions } from '../../data/catalog';
import { useI18n } from '../../i18n/LanguageContext';
import Brand from '../ui/Brand';
import RootLines from '../ui/RootLines';
import { Check } from '../ui/Icons';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export function AsideShell({ children }) {
  return (
    <aside className="relative box-border flex max-w-full min-w-0 flex-[1_1_360px] flex-col gap-10 overflow-hidden rounded-br-[96px] bg-ink px-[22px] pt-8 pb-14 text-white md:rounded-br-[160px] md:px-12 md:pt-10 md:pb-[72px]">
      <RootLines variant="side" opacity={0.16} className="-right-20 -bottom-10" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <Brand />
        <LanguageSwitcher compact />
      </div>
      {children}
    </aside>
  );
}

export default function StepsAside({ step, answers, reached, onGoto, cubicaje }) {
  const { t, lang } = useI18n();
  return (
    <AsideShell>
      <div className="relative flex flex-col gap-3.5">
        <h2 className="m-0 font-serif text-[44px] leading-[1.05] font-normal italic">{t('diag.title')}</h2>
        <p className="m-0 max-w-[340px] text-base leading-[1.6] text-pale">{t('diag.lead')}</p>
      </div>
      <ol className="relative m-0 hidden list-none flex-col gap-1.5 p-0 md:flex">
        {getQuestions(lang).map((q, i) => {
          const opt = q.opts.find((o) => o.id === answers[q.key]);
          const current = i === step;
          const done = !!opt && !current;
          const locked = i > reached;
          return (
            <li key={q.key}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onGoto(i)}
                className="group flex w-full items-center gap-4 border-0 bg-transparent py-2.5 text-left text-inherit enabled:cursor-pointer"
              >
                <span
                  className={
                    'flex size-[34px] flex-none items-center justify-center rounded-full border-[1.5px] text-xs font-semibold ' +
                    (done ? 'border-gold bg-gold text-ink' : current ? 'border-white text-white' : 'border-ink-4 text-faint')
                  }
                >
                  {done ? <Check size={16} /> : String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className={'text-[15px] font-semibold group-enabled:group-hover:underline ' + (current || done ? 'text-white' : 'text-faint')}>{q.label}</span>
                  <span className={'truncate text-[13px] ' + (opt ? 'text-sage' : 'text-faint')}>{opt ? opt.t : current ? t('diag.inProgress') : t('diag.pending')}</span>
                </span>
              </button>
            </li>
          );
        })}
        {cubicaje && (
          <li>
            <button
              type="button"
              disabled={reached < 6}
              onClick={() => onGoto(6)}
              className="group flex w-full items-center gap-4 border-0 bg-transparent py-2.5 text-left text-inherit enabled:cursor-pointer"
            >
              <span
                className={
                  'flex size-[34px] flex-none items-center justify-center rounded-full border-[1.5px] text-xs font-semibold ' +
                  (cubicaje.estado === 'listo' && step !== 6 ? 'border-gold bg-gold text-ink' : step === 6 ? 'border-white text-white' : 'border-ink-4 text-faint')
                }
              >
                {cubicaje.estado === 'listo' && step !== 6 ? <Check size={16} /> : '07'}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={'text-[15px] font-semibold group-enabled:group-hover:underline ' + (step === 6 || cubicaje.estado !== 'pendiente' ? 'text-white' : 'text-faint')}>
                  {t('cub.diag.label')}
                </span>
                <span className={'truncate text-[13px] ' + (cubicaje.estado === 'listo' ? 'text-sage' : 'text-faint')}>{cubicaje.texto}</span>
              </span>
            </button>
          </li>
        )}
      </ol>
      <p className="relative m-0 mt-auto text-[13px] leading-[1.5] text-faint">{t('diag.privacy')}</p>
    </AsideShell>
  );
}
