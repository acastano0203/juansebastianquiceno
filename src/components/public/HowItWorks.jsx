import { useI18n } from '../../i18n/LanguageContext';

export default function HowItWorks() {
  const { t } = useI18n();
  return (
    <section id="como" className="mx-auto max-w-[1240px] px-[22px] py-16 md:px-10 md:py-[120px]">
      <div className="mb-8 grid items-end gap-[22px] md:mb-14 md:grid-cols-2 md:gap-14">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase md:text-[13px]">{t('how.eyebrow')}</span>
          <h2 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold md:text-5xl md:leading-[1.08] md:tracking-[-0.015em]">
            {t('how.title1')}
            <em className="font-normal">{t('how.titleEm')}</em>
          </h2>
        </div>
        <p className="m-0 hidden max-w-[480px] text-lg leading-[1.6] text-muted md:block">{t('how.lead')}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3 md:gap-6">
        {t('how.steps').map((s, i) => (
          <div key={i} className="flex gap-4 rounded-[24px_24px_24px_4px] bg-mist p-[22px] md:flex-col md:gap-3.5 md:rounded-[28px_28px_28px_4px] md:p-8">
            <span className="font-serif text-[28px] leading-none text-clay italic md:text-[40px]">{String(i + 1).padStart(2, '0')}</span>
            <div className="flex flex-col gap-1.5 md:gap-3.5">
              <h3 className="m-0 text-[17px] font-semibold md:text-xl">{s.t}</h3>
              <p className="m-0 text-[15px] leading-[1.5] text-muted md:text-base md:leading-[1.6]">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
