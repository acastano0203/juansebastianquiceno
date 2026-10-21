import { useI18n } from '../../i18n/LanguageContext';

const SHAPES = ['rounded-[0_22px_0_22px] bg-sage', 'rounded-[22px_0_22px_0] bg-ink', 'rounded-[0_22px_0_22px] bg-clay', 'rounded-[22px_0_22px_0] bg-gold'];

export default function Areas() {
  const { t } = useI18n();
  return (
    <section id="areas" className="rounded-tl-[96px] bg-mist md:rounded-tl-[200px]">
      <div className="mx-auto max-w-[1240px] px-[22px] py-16 md:px-10 md:py-[120px]">
        <div className="mb-8 flex max-w-[720px] flex-col gap-4 md:mb-14">
          <span className="text-xs font-semibold tracking-[0.14em] text-clay uppercase md:text-[13px]">{t('areas.eyebrow')}</span>
          <h2 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold md:text-5xl md:leading-[1.08] md:tracking-[-0.015em]">{t('areas.title')}</h2>
        </div>
        <div className="grid gap-3 md:gap-6 lg:grid-cols-2">
          {t('areas.items').map((a, i) => (
            <article key={i} className="flex flex-col gap-2.5 rounded-[26px_26px_26px_4px] bg-white p-[26px] md:gap-[18px] md:rounded-[32px_32px_32px_4px] md:p-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-clay md:text-[13px]">{String(i + 1).padStart(2, '0')}</span>
                <span aria-hidden="true" className={'size-8 md:size-11 ' + SHAPES[i]} />
              </div>
              <h3 className="m-0 font-serif text-[22px] leading-[1.2] font-semibold md:text-[28px] md:leading-[1.15]">{a.t}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-muted md:text-base md:leading-[1.6]">{a.d}</p>
              <div className="hidden flex-wrap gap-2 pt-1.5 md:flex">
                {a.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-mist px-3.5 py-[7px] text-[13px]">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
