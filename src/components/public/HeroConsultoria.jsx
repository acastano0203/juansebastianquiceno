import { useI18n } from '../../i18n/LanguageContext';
import { ANCLA_AGENDA } from '../../lib/contacto';
import RootLines from '../ui/RootLines';
import { ButtonLink, classes } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';
import SiteHeader from './SiteHeader';
import foto from '../../assets/juan-sebastian-quiceno-hero-cafe.jpg';

// Hero principal migrado de juansebastianquiceno.com: la consultoría de Juan Sebastián.
// Las herramientas (simulador y cubicaje) se presentan justo debajo, en HerramientasSimulacion.
function Foto() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-full max-w-[380px] pb-8 lg:mr-0">
      <div className="absolute -top-6 -right-4 size-[260px] rounded-[0_140px_0_140px] bg-ink-2" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[32px_120px_32px_6px] border-2 border-gold/40 shadow-[0_30px_60px_rgba(4,20,21,.35)]">
        <img src={foto} alt={t('inicio.fotoAlt')} className="block aspect-[3/4] w-full object-cover" />
      </div>
      <div className="absolute bottom-0 -left-3 flex max-w-[calc(100%+12px)] items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-ink shadow-[0_15px_35px_rgba(4,20,21,.3)] md:-left-10">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-1.5 rounded-full bg-gold" />
          ))}
        </span>
        {t('inicio.frase')}
      </div>
    </div>
  );
}

export default function HeroConsultoria() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden rounded-br-[96px] bg-ink md:rounded-br-[200px]">
      <RootLines variant="hero" opacity={0.22} className="-bottom-10 -left-10 hidden md:block" />
      <RootLines variant="small" opacity={0.18} className="-right-[90px] -bottom-10 md:hidden" />

      <div className="relative mx-auto max-w-[1240px] px-[22px] md:px-10">
        <SiteHeader />

        <div className="grid items-center gap-[56px] pt-6 pb-14 md:pt-12 md:pb-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="flex min-w-0 flex-col gap-[22px] md:gap-7">
            <span className="text-[11px] font-medium tracking-[0.12em] text-gold uppercase md:text-[13px] md:tracking-[0.14em]">{t('inicio.badge')}</span>
            <h1 className="m-0 font-serif text-[36px] leading-[1.06] font-semibold tracking-[-0.015em] text-balance text-white md:text-[56px] md:leading-[1.04] md:tracking-[-0.02em]">
              {t('inicio.t1')}
              <em className="font-normal text-gold italic">{t('inicio.tEm')}</em>
              {t('inicio.t2')}
            </h1>
            <p className="m-0 max-w-[600px] text-base leading-[1.55] text-pale md:text-[19px]">{t('inicio.lead')}</p>
            <div className="mt-1 flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center">
              <a href={ANCLA_AGENDA} className={classes({ variant: 'gold', size: 'lg', lift: true })}>
                {t('inicio.ctaDiag')}
                <ArrowRight />
              </a>
              <ButtonLink to="/casos-de-exito" variant="outline-white" size="lg">
                {t('inicio.ctaCasos')}
              </ButtonLink>
            </div>
            <ul className="m-0 grid list-none grid-cols-1 gap-5 border-t border-ink-3 p-0 pt-6 sm:grid-cols-3">
              {t('inicio.metricas').map((m) => (
                <li key={m.valor} className="flex flex-col gap-1">
                  <span className="font-serif text-[34px] leading-none font-semibold text-sage">{m.valor}</span>
                  <span className="text-[13px] leading-[1.35] font-semibold text-pale">{m.texto}</span>
                </li>
              ))}
            </ul>
          </div>
          <Foto />
        </div>
      </div>
    </section>
  );
}
