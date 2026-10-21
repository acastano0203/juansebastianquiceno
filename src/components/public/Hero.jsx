import { useI18n } from '../../i18n/LanguageContext';
import { getQuestions } from '../../data/catalog';
import RootLines from '../ui/RootLines';
import { ButtonLink } from '../ui/Button';
import { ArrowRight, Check } from '../ui/Icons';
import SiteHeader from './SiteHeader';

function PreviewCard() {
  const { t, lang } = useI18n();
  const [first, ...rest] = getQuestions(lang)[0].opts;
  return (
    <div className="relative hidden justify-center lg:flex" aria-hidden="true">
      <div className="absolute -top-7 -right-2.5 size-[300px] rounded-[0_160px_0_160px] bg-ink-2" />
      <div className="relative flex w-full max-w-[440px] flex-col gap-5 rounded-[32px_32px_32px_6px] bg-white p-8 shadow-[0_30px_60px_rgba(4,20,21,.35)]">
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span className="font-semibold text-ink">{t('hero.cardTitle')}</span>
          <span>{t('hero.cardStep')}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line-2">
          <div className="h-full w-[17%] rounded-full bg-gold" />
        </div>
        <div className="font-serif text-[28px] leading-[1.15] font-semibold">{t('hero.cardQ')}</div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between rounded-2xl bg-ink px-[18px] py-3.5 text-white">
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{first.t}</span>
              <span className="text-[13px] text-sage">{t('hero.cardOptDesc')}</span>
            </span>
            <Check size={22} strokeWidth={2.4} className="text-gold" />
          </div>
          {rest.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line px-[18px] py-3.5 text-[15px] font-medium">
              {o.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden rounded-br-[96px] bg-ink md:rounded-br-[200px]">
      <RootLines variant="hero" opacity={0.22} className="-bottom-10 -left-10 hidden md:block" />
      <RootLines variant="small" opacity={0.18} className="-right-[90px] -bottom-10 md:hidden" />

      <div className="relative mx-auto max-w-[1240px] px-[22px] md:px-10">
        <SiteHeader />

        <div className="grid items-center gap-[72px] pt-6 pb-[72px] md:pt-16 md:pb-[140px] lg:grid-cols-2">
          <div className="flex flex-col gap-[22px] md:gap-7">
            <span className="text-[11px] font-medium tracking-[0.12em] text-sage uppercase md:text-[13px] md:tracking-[0.14em]">{t('hero.eyebrow')}</span>
            <h1 className="m-0 font-serif text-[42px] leading-[1.06] font-semibold tracking-[-0.015em] text-balance text-white md:text-[70px] md:leading-[1.04] md:tracking-[-0.02em]">
              {t('hero.title1')}
              <em className="font-normal text-gold italic">{t('hero.titleEm')}</em>
              {t('hero.title2')}
            </h1>
            <p className="m-0 max-w-[520px] text-base leading-[1.55] text-pale md:text-[19px]">
              {t('hero.lead')}
              <span className="hidden md:inline">{t('hero.leadMore')}</span>.
            </p>
            <div className="mt-2 flex flex-col items-stretch gap-5 md:flex-row md:flex-wrap md:items-center">
              <ButtonLink to="/diagnostico" variant="gold" size="hero" lift className="min-h-14 md:min-h-[60px]">
                {t('nav.cta')}
                <ArrowRight />
              </ButtonLink>
              <span className="text-center text-[13px] text-sage md:text-left md:text-sm">{t('hero.meta')}</span>
            </div>
          </div>
          <PreviewCard />
        </div>
      </div>
    </section>
  );
}
