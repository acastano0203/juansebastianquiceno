import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { classes } from '../../components/ui/Button';
import { ArrowRight, Check } from '../../components/ui/Icons';
import { ENLACE_AGENDA } from '../../lib/contacto';
import foto from '../../assets/juan-sebastian-quiceno-escritorio.jpg';

// vCard propia (public/). El enlace anterior en mitarjetavirtual.com murió: el dominio expiró.
const VCARD = '/juan-sebastian-quiceno.vcf';

function Foto() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto w-full max-w-[400px] pb-6 lg:mx-0">
      <div className="overflow-hidden rounded-[32px_32px_32px_6px] border-2 border-clay shadow-[0_30px_60px_rgba(4,20,21,.25)]">
        <img src={foto} alt={t('sobre.fotoAlt')} className="block aspect-[4/5] w-full object-cover object-top" />
      </div>
      <div className="absolute right-4 bottom-0 flex flex-col items-center rounded-[16px] border-2 border-clay bg-ink px-5 py-3 text-center shadow-[0_15px_35px_rgba(18,54,56,.3)]">
        <span className="font-serif text-[36px] leading-none font-semibold text-gold">15+</span>
        <span className="mt-1 text-[11px] font-bold tracking-[0.08em] text-white uppercase">{t('sobre.badgeFoto')}</span>
      </div>
    </div>
  );
}

export default function SobreMi() {
  const { t } = useI18n();
  return (
    <PaginaSeccion>
      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-[22px] py-12 md:px-10 md:py-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <Foto />
        <div className="flex min-w-0 flex-col gap-5">
          <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('sobre.badge')}</span>
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('sobre.titulo')}</h1>
          <p className="m-0 text-[18px] font-semibold text-clay">{t('sobre.lead')}</p>
          <p className="m-0 text-base leading-[1.7] text-muted">{t('sobre.bio')}</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {t('sobre.items').map((partes, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-[1.5]">
                <Check size={18} className="mt-0.5 shrink-0 text-gold" />
                <span>{partes.map((p, j) => (p.b ? <strong key={j}>{p.t}</strong> : <span key={j}>{p.t}</span>))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href={ENLACE_AGENDA} target="_blank" rel="noopener noreferrer" className={classes({ variant: 'gold', size: 'lg', lift: true })}>
              {t('sobre.ctaTalk')}
              <ArrowRight />
            </a>
            <a href={VCARD} type="text/vcard" className={classes({ variant: 'outline-ink', size: 'lg' })}>
              {t('sobre.ctaVcard')}
            </a>
          </div>
        </div>
      </section>
    </PaginaSeccion>
  );
}
