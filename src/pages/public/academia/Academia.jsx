import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { ENLACES_ACADEMIA, RUTAS_ACADEMIA, TESTIMONIOS } from '../../../config/academia';
import { registrarOrigen } from '../../../services/academia';
import AcademiaHeader from '../../../components/academia/AcademiaHeader';
import { useAgendar } from '../../../components/academia/ModalAgendar';
import { Curvas, EnlaceWhatsApp, PasosEmbudo, Revelar, Titulo, useArriba } from '../../../components/academia/comun';
import { Calculadora, Errores, Faq, QuizPlan, Ruta, TarjetaRuta } from '../../../components/academia/interactivos';
import { classes } from '../../../components/ui/Button';
import { ArrowRight, Check } from '../../../components/ui/Icons';

const ICONOS_PILARES = [
  <>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </>,
  <>
    <path d="M3 20h18" />
    <path d="m5 20 5-9 3 5 2-3 4 7" />
  </>,
  <>
    <path d="M14 3H6v18h12V7l-4-4Z" />
    <path d="M14 3v4h4" />
    <path d="M9 17v-3M12 17v-6M15 17v-2" />
  </>,
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
  </>,
];

function BotonMasterclass({ className = '', size = 'lg' }) {
  const { t } = useI18n();
  return (
    <Link to={RUTAS_ACADEMIA.masterclass} className={classes({ variant: 'gold', size, lift: true, className })}>
      {t('aca.cta.masterclass')}
      <ArrowRight />
    </Link>
  );
}

function Hero({ onAgendar }) {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden rounded-br-[96px] bg-ink pb-[120px] md:rounded-br-[240px] md:pb-[168px]">
      <Curvas />
      <div className="relative mx-auto max-w-[1280px] px-5 md:px-20">
        <AcademiaHeader onAgendar={() => onAgendar('pro')} />
        <div className="pt-2 pb-2">
          <PasosEmbudo actual={0} />
        </div>
        <div className="flex flex-wrap items-center gap-14 pt-6 md:pt-12">
          <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-6 animate-[aparecer_.5s_ease-out]">
            <p className="m-0 text-xs font-semibold tracking-[0.18em] text-gold uppercase">{t('aca.hero.eyebrow')}</p>
            <h1 className="m-0 font-serif text-[38px] leading-[1.06] font-semibold tracking-[-0.01em] text-balance text-white md:text-[60px]">
              {t('aca.hero.t1')}
              <em className="text-gold italic">{t('aca.hero.tEm')}</em>
              {t('aca.hero.t2')}
            </h1>
            <p className="m-0 max-w-[540px] text-[17px] text-pale">{t('aca.hero.lead')}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
              <BotonMasterclass />
              <Link to={RUTAS_ACADEMIA.inscripcion} className={classes({ variant: 'outline-white', size: 'lg' })}>
                {t('aca.cta.planes')}
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_340px] justify-center lg:justify-end">
            <TarjetaRuta />
          </div>
        </div>
      </div>
    </section>
  );
}

function Pilares() {
  const { t } = useI18n();
  return (
    <div className="relative mx-auto -mt-16 max-w-[1280px] px-5 md:px-20">
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {t('aca.pilares').map((p, i) => (
          <Revelar as="li" key={p} retraso={i * 80} className="flex items-center gap-3.5 rounded-2xl bg-white p-[22px] shadow-[0_12px_32px_rgba(18,54,56,0.12)]">
            <span className="grid size-11 flex-none place-items-center rounded-xl bg-line-2 text-clay">
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                {ICONOS_PILARES[i]}
              </svg>
            </span>
            <span className="text-[15px] leading-[1.3] font-semibold">{p}</span>
          </Revelar>
        ))}
      </ul>
    </div>
  );
}

function ParaQuien() {
  const { t } = useI18n();
  return (
    <section className="px-5 pt-2 pb-16 md:px-20 md:pt-6 md:pb-[104px]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-start gap-8">
        <Revelar className="flex-[1_1_320px]">
          <Titulo eyebrow={t('aca.quien.eyebrow')} t1={t('aca.quien.t1')} em={t('aca.quien.tEm')} />
        </Revelar>
        <ul className="m-0 flex flex-[1_1_520px] list-none flex-wrap gap-2.5 p-0">
          {t('aca.quien.perfiles').map((p, i) => (
            <Revelar as="li" key={p} retraso={i * 60} className="rounded-full border border-sage bg-white px-5 py-3 text-[15px] font-medium">
              {p}
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Banda() {
  const { t } = useI18n();
  return (
    <section className="bg-ink px-5 py-16 md:px-20 md:py-[104px]">
      <Revelar className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-7">
        <div className="flex flex-[1_1_520px] flex-col gap-3">
          <h2 className="m-0 font-serif text-[30px] leading-[1.12] font-semibold text-white md:text-[44px]">
            {t('aca.banda.t1')}
            <em className="text-gold italic">{t('aca.banda.tEm')}</em>
            {t('aca.banda.t2')}
          </h2>
          <p className="m-0 text-base text-pale">{t('aca.banda.lead')}</p>
        </div>
        <BotonMasterclass />
      </Revelar>
    </section>
  );
}

function VideoOMuestra({ src, titulo, etiqueta }) {
  if (src) {
    return <iframe src={src} title={titulo} className="aspect-[16/10] w-full rounded-2xl border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" />;
  }
  return (
    <div role="img" aria-label={titulo} className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-ink-2">
      <Curvas variante="cierre" />
      <span className="relative grid size-[72px] place-items-center rounded-full bg-gold transition-transform duration-300 hover:scale-105">
        <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="#123638">
          <path d="M8 5v14l11-7L8 5Z" />
        </svg>
      </span>
      <span className="absolute bottom-4 left-5 text-[13px] text-pale">{etiqueta}</span>
    </div>
  );
}

function Extras() {
  const { t } = useI18n();
  const items = t('aca.extra.items');
  return (
    <section className="px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-10">
        <Revelar className="max-w-[720px]">
          <Titulo eyebrow={t('aca.extra.eyebrow')} t1={t('aca.extra.t1')} em={t('aca.extra.tEm')} />
        </Revelar>
        <div className="flex flex-wrap gap-5">
          <Revelar className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
            <VideoOMuestra src={ENLACES_ACADEMIA.videoInmersion} titulo={t('aca.extra.inmersionT')} etiqueta={t('aca.extra.video')} />
            <h3 className="m-0 text-xl font-semibold">{t('aca.extra.inmersionT')}</h3>
            <p className="m-0 text-[15px] text-muted">{t('aca.extra.inmersionD')}</p>
          </Revelar>
          <div className="grid min-w-0 flex-[1_1_360px] content-start gap-4 sm:grid-cols-2">
            <Revelar retraso={80} className="col-span-full flex flex-col gap-2 rounded-2xl bg-ink p-6">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-sage uppercase">{t('aca.extra.soloPro')}</span>
              <span className="font-serif text-[40px] leading-none font-semibold text-gold">{t('aca.extra.proKg')}</span>
              <span className="text-[15px] text-white">{t('aca.extra.proD')}</span>
            </Revelar>
            {items.map((x, i) => (
              <Revelar key={x.t} retraso={140 + i * 60} className={'flex flex-col gap-2 rounded-2xl bg-line-2 p-[22px] ' + (i === 2 ? 'col-span-full' : '')}>
                <h3 className="m-0 text-base font-semibold">{x.t}</h3>
                <p className="m-0 text-sm text-muted">{x.d}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Profe() {
  const { t } = useI18n();
  return (
    <section className="bg-line-2 px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-12">
        <Revelar className="flex aspect-[4/5] max-w-[460px] flex-[1_1_340px] items-end rounded-2xl bg-sage p-5" >
          <span role="img" aria-label={t('aca.profe.foto')} className="text-[13px] text-ink">{t('aca.profe.foto')}</span>
        </Revelar>
        <Revelar retraso={100} className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
          <p className="m-0 text-xs font-semibold tracking-[0.18em] text-muted uppercase">{t('aca.profe.eyebrow')}</p>
          <h2 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold md:text-[44px]">
            {t('aca.profe.nombre')}
            <em className="italic">{t('aca.profe.nombreEm')}</em>
          </h2>
          <p className="m-0 text-base text-muted">{t('aca.profe.rol')}</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
            {t('aca.profe.logros').map((l) => (
              <li key={l} className="flex gap-3">
                <Check size={18} className="mt-0.5 flex-none text-clay" />
                {l}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2.5 pt-1">
            <span className="text-[13px] font-semibold text-muted">{t('aca.profe.oficinas')}</span>
            <div className="flex flex-wrap gap-2">
              {t('aca.profe.ciudades').map((c) => (
                <span key={c} className="rounded-full bg-white px-4 py-2 text-sm font-medium">{c}</span>
              ))}
            </div>
          </div>
        </Revelar>
      </div>
    </section>
  );
}

/** Solo aparece cuando haya testimonios reales con números (config/academia.js) */
function Testimonios() {
  const { t } = useI18n();
  if (!TESTIMONIOS.length) return null;
  return (
    <section className="px-5 py-16 md:px-20 md:py-[104px]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-10">
        <Titulo eyebrow={t('aca.testimonios.eyebrow')} t1={t('aca.testimonios.t1')} em={t('aca.testimonios.tEm')} />
        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIOS.map((x) => (
            <figure key={x.nombre} className="m-0 flex flex-col gap-5 rounded-2xl bg-white p-7 shadow-[0_12px_32px_rgba(18,54,56,0.10)]">
              <div className="flex flex-col gap-1 border-b border-line-2 pb-4">
                <span className="font-serif text-[30px] leading-tight font-semibold">{x.dato}</span>
                <span className="text-[13px] text-muted">{x.detalle}</span>
              </div>
              <blockquote className="m-0 text-[15px]">“{x.texto}”</blockquote>
              <figcaption className="flex flex-col">
                <span className="text-[15px] font-semibold">{x.nombre}</span>
                <span className="text-[13px] text-muted">{x.empresa}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cierre() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden rounded-tl-[96px] bg-ink px-5 py-20 md:rounded-tl-[240px] md:px-20 md:py-[120px]">
      <Curvas variante="cierre" />
      <Revelar className="relative mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
        <h2 className="m-0 font-serif text-[30px] leading-[1.12] font-semibold text-white md:text-[44px]">
          {t('aca.cierre.t1')}
          <em className="text-gold italic">{t('aca.cierre.tEm')}</em>
          {t('aca.cierre.t2')}
        </h2>
        <p className="m-0 text-base text-pale">{t('aca.cierre.lead')}</p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row sm:flex-wrap">
          <BotonMasterclass />
          <EnlaceWhatsApp>{t('aca.cta.whatsapp')}</EnlaceWhatsApp>
        </div>
      </Revelar>
    </section>
  );
}

export function PieAcademia() {
  const { t } = useI18n();
  return (
    <footer className="flex flex-wrap justify-between gap-3 px-5 py-7 text-[13px] text-muted md:px-20">
      <span>{t('aca.footer.derechos')}</span>
      <span>{t('aca.footer.ciudades')}</span>
    </footer>
  );
}

/** Botón dorado fijo abajo en móvil, después de pasar la portada */
function BarraMovil() {
  const { t } = useI18n();
  const [ver, setVer] = useState(false);
  useEffect(() => {
    const f = () => setVer(window.scrollY > 640);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <div
      aria-hidden={!ver}
      className={'fixed inset-x-0 bottom-0 z-40 bg-white/95 px-4 pt-3 pb-4 shadow-[0_-8px_24px_rgba(18,54,56,0.12)] backdrop-blur transition-transform duration-300 md:hidden ' + (ver ? 'translate-y-0' : 'translate-y-full')}
    >
      <Link to={RUTAS_ACADEMIA.masterclass} tabIndex={ver ? 0 : -1} className={classes({ variant: 'gold', size: 'lg', className: 'w-full' })}>
        {t('aca.cta.masterclass')}
        <ArrowRight />
      </Link>
    </div>
  );
}

export default function Academia() {
  useArriba();
  const agendar = useAgendar();
  useEffect(() => registrarOrigen(), []);
  return (
    <div className="min-w-0 overflow-x-clip bg-white text-ink">
      <Hero onAgendar={agendar.abrir} />
      <Pilares />
      <Errores />
      <ParaQuien />
      <Calculadora />
      <Ruta />
      <Banda />
      <Extras />
      <Profe />
      <Testimonios />
      <QuizPlan />
      <Faq />
      <Cierre />
      <PieAcademia />
      <div className="h-20 md:hidden" aria-hidden="true" />
      <BarraMovil />
      {agendar.modal}
    </div>
  );
}
