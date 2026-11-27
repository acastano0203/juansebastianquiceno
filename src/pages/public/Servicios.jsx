import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { ButtonLink } from '../../components/ui/Button';
import { Boxes, Globe, SquareArrowOutUpRight, TrendingUp } from 'lucide-react';
import { ArrowRight } from '../../components/ui/Icons';
import { ANCLA_AGENDA } from '../../lib/contacto';

// Los mismos 4 íconos del sitio original (expansión, finanzas, logística global, GTM), con su color de fondo
const ICONOS = [
  { fondo: 'bg-gold/15 text-gold', Icono: SquareArrowOutUpRight },
  { fondo: 'bg-clay/15 text-clay', Icono: TrendingUp },
  { fondo: 'bg-ink/10 text-ink', Icono: Globe },
  { fondo: 'bg-sage/40 text-ink', Icono: Boxes },
];

function Tarjeta({ servicio, i }) {
  const { t } = useI18n();
  const { fondo, Icono } = ICONOS[i];
  const destacado = i === ICONOS.length - 1;
  return (
    <article
      id={`servicio-${i + 1}`}
      className={
        'flex scroll-mt-6 flex-col justify-between gap-6 rounded-[24px_24px_24px_6px] border bg-white p-6 transition-transform duration-200 hover:-translate-y-1 md:p-7 ' +
        (destacado ? 'border-gold/50 shadow-[0_18px_40px_rgba(221,189,98,.18)]' : 'border-line shadow-[0_18px_40px_rgba(4,20,21,.08)]')
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-serif text-[40px] leading-none font-semibold text-line">{String(i + 1).padStart(2, '0')}.</span>
          <span className={'flex size-11 items-center justify-center rounded-xl ' + fondo}>
            <Icono size={22} strokeWidth={1.9} aria-hidden="true" />
          </span>
        </div>
        <h2 className="m-0 font-serif text-[21px] leading-[1.2] font-semibold text-balance">{servicio.titulo}</h2>
        {Array.isArray(servicio.desc) ? (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[14.5px] leading-[1.6] text-muted">
            {servicio.desc.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-[14.5px] leading-[1.6] text-muted">{servicio.desc}</p>
        )}
      </div>
      <div className="border-t border-line pt-4">
        <a
          href={ANCLA_AGENDA}
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-clay no-underline hover:text-clay-dark"
        >
          {t('servicios.agendar')}
          <ArrowRight size={16} />
        </a>
      </div>
    </article>
  );
}

export default function Servicios() {
  const { t } = useI18n();
  return (
    <PaginaSeccion>
      <section className="bg-mist">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-[22px] py-12 md:px-10 md:py-20">
          <header className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
            <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('servicios.badge')}</span>
            <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('servicios.titulo')}</h1>
            <p className="m-0 text-base leading-[1.6] text-muted md:text-[17px]">{t('servicios.intro')}</p>
          </header>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t('servicios.lista').map((s, i) => (
              <Tarjeta key={s.titulo} servicio={s} i={i} />
            ))}
          </div>

          <div className="flex flex-col items-start gap-4 rounded-[24px_24px_24px_6px] bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex flex-col gap-1.5">
              <p className="m-0 font-serif text-[22px] font-semibold">{t('servicios.simularTitulo')}</p>
              <p className="m-0 text-[15px] text-pale">{t('servicios.simularTexto')}</p>
            </div>
            <ButtonLink to="/simulador" variant="gold" size="lg" lift className="shrink-0">
              {t('servicios.simular')}
              <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>
    </PaginaSeccion>
  );
}
