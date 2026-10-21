import { useI18n } from '../../i18n/LanguageContext';
import { ButtonLink } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';

export default function CtaBand() {
  const { t } = useI18n();
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-[1240px] px-[22px] pb-16 md:px-10 md:pb-[120px]">
        <div className="grid items-center gap-5 rounded-[0_80px_0_24px] bg-clay px-7 py-9 text-white md:gap-10 md:rounded-[0_180px_0_32px] md:p-16 lg:grid-cols-2">
          <h2 className="m-0 font-serif text-[28px] leading-[1.15] font-semibold md:text-[42px] md:leading-[1.12] md:tracking-[-0.01em]">
            {t('cta.title1')}
            <em className="font-normal">{t('cta.titleEm')}</em>
          </h2>
          <div className="flex flex-col items-stretch gap-4 md:items-start">
            <p className="m-0 text-[15px] leading-[1.55] text-clay-pale md:text-[17px] md:leading-[1.6]">{t('cta.lead')}</p>
            <ButtonLink to="/diagnostico" variant="gold" size="hero" lift className="min-h-14 md:min-h-[60px]">
              {t('nav.cta')}
              <ArrowRight className="hidden md:block" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
