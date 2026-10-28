import { useI18n } from '../../i18n/LanguageContext';
import { ButtonLink } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';
import PaqueteIcono from '../cubicaje/PaqueteIcono';

// Acceso a la calculadora pública de cubicaje
export default function CubicajeBand() {
  const { t } = useI18n();
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-[1240px] px-[22px] pb-10 md:px-10 md:pb-14">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-[32px_32px_32px_6px] bg-white px-7 py-9 md:px-12 md:py-11">
          <span aria-hidden="true" className="flex size-20 flex-none items-center justify-center rounded-[0_40px_0_40px] bg-ink text-gold">
            <PaqueteIcono tipo="box" size={36} />
          </span>
          <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-2">
            <span className="text-sm font-semibold text-clay">{t('cub.pub.banda.eyebrow')}</span>
            <h2 className="m-0 font-serif text-[28px] leading-[1.15] font-semibold md:text-[34px]">{t('cub.pub.banda.titulo')}</h2>
            <p className="m-0 text-[15px] leading-[1.6] text-muted md:text-[17px]">{t('cub.pub.banda.lead')}</p>
          </div>
          <ButtonLink to="/cubicaje" variant="ink" size="lg">
            {t('cub.pub.banda.cta')}
            <ArrowRight />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
