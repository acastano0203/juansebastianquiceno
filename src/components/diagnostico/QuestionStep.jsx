import { Link } from 'react-router-dom';
import { getQuestions } from '../../data/catalog';
import { useI18n } from '../../i18n/LanguageContext';
import { Button } from '../ui/Button';
import { ArrowRight, Check } from '../ui/Icons';

export default function QuestionStep({ step, answers, onChoose, onBack, onNext }) {
  const { t, lang } = useI18n();
  const questions = getQuestions(lang);
  const q = questions[step];
  const sel = answers[q.key];
  const last = step === questions.length - 1;

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-12 px-[22px] pt-10 pb-14 md:px-[72px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="font-semibold">{t('diag.step', { n: step + 1 })}</span>
          <Link to="/" className="inline-flex min-h-11 items-center text-muted no-underline">
            {t('diag.exit')}
          </Link>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} aria-label={t('diag.progress')}>
          {questions.map((qq, i) => (
            <span key={qq.key} className={'h-1.5 flex-1 rounded-full transition-colors duration-300 ' + (i <= step ? 'bg-gold' : 'bg-line-2')} />
          ))}
        </div>
      </div>

      <div className="flex max-w-[760px] flex-col gap-3.5">
        <span className="font-serif text-[22px] text-clay italic">{t('diag.question', { n: String(step + 1).padStart(2, '0') })}</span>
        <h1 className="m-0 font-serif text-[36px] leading-[1.08] font-semibold tracking-[-0.015em] md:text-5xl">{q.q}</h1>
        <p className="m-0 text-[17px] leading-[1.6] text-muted">{q.help}</p>
      </div>

      <div className="grid max-w-[920px] gap-3.5 sm:grid-cols-2">
        {q.opts.map((o) => {
          const on = sel === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChoose(q.key, o.id)}
              className={
                'flex min-h-24 cursor-pointer items-start justify-between gap-4 rounded-[22px_22px_22px_4px] border-[1.5px] px-6 py-[22px] text-left transition hover:-translate-y-px hover:border-ink ' +
                (on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')
              }
            >
              <span className="flex flex-col gap-1.5">
                <span className="text-[17px] font-semibold">{o.t}</span>
                {o.d && <span className={'text-sm leading-[1.5] ' + (on ? 'text-sage' : 'text-muted')}>{o.d}</span>}
              </span>
              <span
                aria-hidden="true"
                className={'flex size-[26px] flex-none items-center justify-center rounded-full border-[1.5px] text-ink ' + (on ? 'border-gold bg-gold' : 'border-[#C5D6CA]')}
              >
                {on && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex max-w-[920px] flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 0}
          className="min-h-12 cursor-pointer border-0 bg-transparent px-2 text-[15px] font-medium text-ink disabled:cursor-default disabled:opacity-35"
        >
          {t('diag.back')}
        </button>
        <Button variant="gold" size="xl" onClick={onNext} disabled={!sel}>
          {last ? t('diag.seeResult') : t('diag.next')}
          <ArrowRight />
        </Button>
      </div>
    </main>
  );
}
