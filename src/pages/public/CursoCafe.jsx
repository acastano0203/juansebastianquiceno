import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BookOpen, CircleAlert, Clock, Coffee, Gift, Lock, MessageCircle, Play, Scale, ShieldCheck, Store, Users } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { CURSO_CAFE } from '../../config/cursoCafe';
import { registrarOrigen } from '../../services/academia';
import { Curvas, Revelar, useArriba } from '../../components/academia/comun';
import ReproductorYouTube from '../../components/public/ReproductorYouTube';
import SiteHeader from '../../components/public/SiteHeader';
import { classes } from '../../components/ui/Button';
import { ArrowRight, Check } from '../../components/ui/Icons';
import fotoTrilladora from '../../assets/curso-cafe/juan-sebastian-trilladora.jpg';
import caso1 from '../../assets/curso-cafe/caso-1.jpg';
import caso2 from '../../assets/curso-cafe/caso-2.jpg';
import caso3 from '../../assets/curso-cafe/caso-3.jpg';
import caso4 from '../../assets/curso-cafe/caso-4.jpg';

// Landing de campaña (anuncios) del curso pregrabado. Lleva el menú del sitio para que nadie quede
// sin salida; los llamados a comprar se repiten a lo largo de la página y en la barra fija del celular.

// Videos de los casos, en el orden de t('curso.evidencia.casos') (los mismos de la página anterior)
const CASOS = [
  { id: 'O-pb-PaJLHg', img: caso1 },
  { id: 'WkOULNobMjc', img: caso2 },
  { id: 'dniROcVlIbQ', img: caso3 },
  { id: 'rMyKAaA8OnM', img: caso4 },
];
const ICONOS_PROBLEMA = [Scale, CircleAlert, CircleAlert];
const ICONOS_PERFIL = [Coffee, Store, Users];

const precioTexto = (n) => (n ? `$${n.toLocaleString('es-CO')} COP` : '');
const wa = (mensaje) => `https://wa.me/${CURSO_CAFE.whatsapp}?text=${encodeURIComponent(mensaje)}`;

function useFecha(iso) {
  const { lang } = useI18n();
  if (!iso) return null;
  const [a, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', { day: 'numeric', month: 'long' }).format(new Date(a, m - 1, d));
}

/** Botón de compra: Hotmart si ya hay enlace; si no, WhatsApp con el mensaje de inscripción. */
function BotonComprar({ children, variant = 'gold', size = 'lg', className = '' }) {
  const { t } = useI18n();
  const href = CURSO_CAFE.checkout || wa(t('curso.msgInscripcion'));
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes({ variant, size, lift: true, className })}>
      {children}
      <ArrowRight />
    </a>
  );
}

function Eyebrow({ children, claro = false }) {
  return <p className={'m-0 text-xs font-semibold tracking-[0.18em] uppercase ' + (claro ? 'text-gold' : 'text-clay')}>{children}</p>;
}

function H2({ t1, em, claro = false, className = '' }) {
  return (
    <h2 className={'m-0 font-serif text-[30px] leading-[1.1] font-semibold tracking-[-0.01em] text-balance md:text-[44px] ' + (claro ? 'text-white ' : 'text-ink ') + className}>
      {t1}
      {em && <em className={claro ? 'text-gold italic' : 'text-clay italic'}>{em}</em>}
    </h2>
  );
}

/** Video con portada propia: YouTube solo se carga al pulsar reproducir */
function Video({ id, img, titulo, etiqueta, children, className = '' }) {
  const { t } = useI18n();
  const [activo, setActivo] = useState(false);
  return (
    <div className={'relative overflow-hidden bg-ink ' + className}>
      {activo ? (
        <ReproductorYouTube
          videoId={id}
          titulo={titulo}
          miniatura={img}
          textos={t('videos.controles')}
          portadaPausa={(reanudar) => (
            <button type="button" onClick={reanudar} aria-label={t('videos.controles.reproducir')} className="absolute inset-0 grid cursor-pointer place-items-center border-0 bg-ink/40 p-0">
              <span className="grid size-16 place-items-center rounded-full bg-gold text-ink shadow-[0_10px_30px_rgba(0,0,0,.35)]">
                <Play size={26} fill="currentColor" aria-hidden="true" />
              </span>
            </button>
          )}
        />
      ) : (
        <button type="button" onClick={() => setActivo(true)} aria-label={etiqueta} className="group absolute inset-0 cursor-pointer border-0 bg-transparent p-0 text-left">
          <img src={img} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
          {children && <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />}
          <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid size-16 place-items-center rounded-full bg-gold text-ink shadow-[0_10px_30px_rgba(0,0,0,.35)] transition-transform group-hover:scale-110 md:size-[72px]">
              <Play size={26} fill="currentColor" />
            </span>
          </span>
          {children}
        </button>
      )}
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  const h = t('curso.hero');
  return (
    <section className="relative overflow-hidden rounded-br-[96px] bg-ink px-[22px] pb-16 md:rounded-br-[220px] md:px-10 md:pb-28">
      <Curvas />
      <div className="relative mx-auto max-w-[1240px]">
        <SiteHeader />
        <div className="grid items-center gap-10 pt-6 md:pt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="flex min-w-0 flex-col gap-6 animate-[aparecer_.5s_ease-out]">
            <Eyebrow claro>{h.eyebrow}</Eyebrow>
            <h1 className="m-0 font-serif text-[36px] leading-[1.06] font-semibold tracking-[-0.01em] text-balance text-white md:text-[56px]">
              {h.titulo}
              <em className="text-gold italic">{h.tituloEm}</em>
              {h.titulo2}
            </h1>
            <p className="m-0 max-w-[560px] text-base leading-[1.6] text-pale md:text-[18px]">{h.lead}</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {h.puntos.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-[1.45] text-white">
                  <span className="mt-0.5 grid size-6 flex-none place-items-center rounded-full bg-gold text-ink">
                    <Check size={14} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-5">
              <BotonComprar size="xl" className="whitespace-nowrap">{h.cta}</BotonComprar>
              <p className="m-0 flex items-center gap-2 text-[13px] text-sage">
                <Lock size={14} aria-hidden="true" />
                {h.garantias}
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <Video
              id={CURSO_CAFE.videoVenta}
              img={fotoTrilladora}
              titulo={h.videoTitulo}
              etiqueta={h.video}
              className="aspect-video rounded-[24px_72px_24px_6px] border-2 border-gold/40 shadow-[0_30px_60px_rgba(0,0,0,.35)]"
            >
              <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3.5 py-2 text-[13px] font-semibold text-ink">{h.video}</span>
            </Video>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cifras() {
  const { t } = useI18n();
  return (
    <section className="px-[22px] py-12 md:px-10 md:py-16">
      <ul className="mx-auto m-0 grid max-w-[1100px] list-none grid-cols-2 gap-x-6 gap-y-8 p-0 md:grid-cols-4">
        {t('curso.cifras').map((c) => (
          <li key={c.valor} className="flex flex-col items-center gap-1 text-center">
            <span className="font-serif text-[36px] leading-none font-semibold text-ink md:text-[44px]">{c.valor}</span>
            <span className="max-w-[200px] text-[13px] leading-[1.4] text-muted md:text-sm">{c.texto}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Problema() {
  const { t } = useI18n();
  const p = t('curso.problema');
  return (
    <section className="bg-clay-bg/60 px-[22px] py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <Revelar className="flex max-w-[780px] flex-col gap-4">
          <Eyebrow>{p.eyebrow}</Eyebrow>
          <H2 t1={p.titulo} em={p.tituloEm} />
        </Revelar>
        <div className="grid gap-4 md:grid-cols-3">
          {p.items.map((x, i) => {
            const Icono = ICONOS_PROBLEMA[i];
            return (
              <Revelar key={x.t} retraso={i * 90} className="flex flex-col gap-3 rounded-[22px_22px_22px_6px] bg-white p-6 shadow-[0_18px_40px_rgba(4,20,21,.06)]">
                <span className="grid size-11 place-items-center rounded-xl bg-clay-pale text-clay">
                  <Icono size={20} aria-hidden="true" />
                </span>
                <h3 className="m-0 font-serif text-[20px] font-semibold">{x.t}</h3>
                <p className="m-0 text-[15px] leading-[1.6] text-muted">{x.d}</p>
              </Revelar>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Evidencia() {
  const { t } = useI18n();
  const e = t('curso.evidencia');
  return (
    <section id="casos" className="scroll-mt-4 bg-ink px-[22px] py-16 text-white md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <Revelar className="flex max-w-[760px] flex-col gap-4">
          <Eyebrow claro>{e.eyebrow}</Eyebrow>
          <H2 t1={e.titulo} claro />
          <p className="m-0 text-base leading-[1.6] text-pale md:text-[17px]">{e.intro}</p>
        </Revelar>
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:gap-4 lg:grid-cols-4">
          {CASOS.map((c, i) => {
            const caso = e.casos[i];
            return (
              // Las imágenes traen su propio texto abajo: el título va debajo de la tarjeta, no encima
              <figure key={c.id} className="m-0 flex flex-col gap-3">
                <Video
                  id={c.id}
                  img={c.img}
                  titulo={caso.titulo}
                  etiqueta={t('curso.evidencia.reproducir', { titulo: caso.titulo })}
                  className="aspect-square rounded-[22px_22px_22px_6px]"
                />
                <figcaption className="flex flex-col gap-1.5">
                  <span className="self-start rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] text-ink uppercase">{caso.badge}</span>
                  <span className="font-serif text-[15px] leading-[1.25] font-semibold text-white md:text-[17px]">{caso.titulo}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Modulos() {
  const { t } = useI18n();
  const m = t('curso.modulos');
  const { lecciones, horas, acceso } = CURSO_CAFE;
  const detalles = [
    lecciones && t('curso.modulos.lecciones', { n: lecciones }),
    horas && t('curso.modulos.horas', { n: horas }),
    acceso === 'vida' ? m.accesoVida : acceso ? t('curso.modulos.accesoMeses', { n: acceso }) : null,
  ].filter(Boolean);
  return (
    <section className="px-[22px] py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <Revelar className="flex max-w-[780px] flex-col gap-4">
          <Eyebrow>{m.eyebrow}</Eyebrow>
          <H2 t1={m.titulo} em={m.tituloEm} />
          {detalles.length > 0 && (
            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-muted">
              {detalles.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5">
                  <Clock size={15} aria-hidden="true" />
                  {d}
                </span>
              ))}
            </p>
          )}
        </Revelar>
        <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
          {m.items.map((x, i) => (
            <Revelar as="li" key={x.t} retraso={(i % 3) * 80} className="flex gap-4 rounded-[22px_22px_22px_6px] border border-line bg-white p-6 transition-transform duration-200 hover:-translate-y-1">
              <span className="font-serif text-[32px] leading-none font-semibold text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex flex-col gap-2">
                <h3 className="m-0 font-serif text-[19px] leading-[1.25] font-semibold">{x.t}</h3>
                <p className="m-0 text-[14.5px] leading-[1.6] text-muted">{x.d}</p>
              </span>
            </Revelar>
          ))}
        </ol>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <BotonComprar>{m.cta}</BotonComprar>
          <p className="m-0 text-sm font-medium text-muted">{t('curso.modulos.precio', { precio: precioTexto(CURSO_CAFE.precio) })}</p>
        </div>
      </div>
    </section>
  );
}

function ParaTi() {
  const { t } = useI18n();
  const p = t('curso.paraTi');
  return (
    <section className="bg-mist px-[22px] py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <Revelar>
          <H2 t1={p.titulo} />
        </Revelar>
        <div className="grid gap-4 md:grid-cols-3">
          {p.items.map((x, i) => {
            const Icono = ICONOS_PERFIL[i];
            return (
              <Revelar key={x.t} retraso={i * 90} className="flex flex-col gap-3 rounded-[22px_22px_22px_6px] bg-white p-6 shadow-[0_18px_40px_rgba(4,20,21,.06)]">
                <span className="grid size-11 place-items-center rounded-xl bg-ink text-gold">
                  <Icono size={20} aria-hidden="true" />
                </span>
                <h3 className="m-0 font-serif text-[20px] font-semibold">{x.t}</h3>
                <p className="m-0 text-[15px] leading-[1.6] text-muted">{x.d}</p>
              </Revelar>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Instructor() {
  const { t } = useI18n();
  const p = t('curso.instructor');
  return (
    <section className="relative overflow-hidden bg-ink px-[22px] py-16 text-white md:px-10 md:py-24">
      <Curvas variante="seccion" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <Revelar as="figure" className="m-0 flex flex-col gap-3">
          <img src={fotoTrilladora} alt={t('curso.hero.fotoAlt')} loading="lazy" className="block aspect-[4/3] w-full rounded-[32px_96px_32px_6px] border-2 border-gold/40 object-cover shadow-[0_30px_60px_rgba(0,0,0,.35)]" />
          <figcaption className="text-[13px] text-sage">{p.fotoPie}</figcaption>
        </Revelar>
        <Revelar className="flex flex-col gap-5">
          <Eyebrow claro>{p.eyebrow}</Eyebrow>
          <h2 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold text-balance md:text-[44px]">{p.nombre}</h2>
          <p className="m-0 font-serif text-[18px] text-gold italic">{p.sub}</p>
          <p className="m-0 text-base leading-[1.65] text-pale md:text-[17px]">{p.bio}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {p.credenciales.map((c) => (
              <li key={c} className="inline-flex items-center gap-1.5 rounded-full border border-ink-3 bg-ink-2 px-3 py-1.5 text-[13px] text-pale">
                <BadgeCheck size={15} className="text-gold" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
          <blockquote className="m-0 border-l-2 border-gold pl-4 font-serif text-[18px] leading-[1.5] text-white italic">{p.cita}</blockquote>
        </Revelar>
      </div>
    </section>
  );
}

function Testimonios({ onVideo }) {
  const { t } = useI18n();
  const p = t('curso.testimonios');
  return (
    <section className="px-[22px] py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10">
        <Revelar>
          <H2 t1={p.titulo} em={p.tituloEm} />
        </Revelar>
        <div className="grid gap-4 lg:grid-cols-3">
          {p.items.map((x, i) => (
            <Revelar as="figure" key={x.quien} retraso={i * 90} className="m-0 flex flex-col justify-between gap-5 rounded-[22px_22px_22px_6px] border border-line bg-white p-6">
              <blockquote className="m-0 text-[15px] leading-[1.65] text-ink">{x.texto}</blockquote>
              <figcaption className="flex flex-col gap-3">
                {x.video && (
                  <button type="button" onClick={onVideo} className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0 text-sm font-semibold text-clay hover:text-clay-dark">
                    <Play size={16} aria-hidden="true" />
                    {p.verVideo}
                  </button>
                )}
                <span className="flex flex-col">
                  <strong className="text-[15px]">{x.quien}</strong>
                  <span className="text-[13px] text-muted">{x.donde}</span>
                </span>
              </figcaption>
            </Revelar>
          ))}
        </div>
        <div className="flex justify-center">
          <BotonComprar variant="ink">{p.cta}</BotonComprar>
        </div>
      </div>
    </section>
  );
}

function Oferta() {
  const { t } = useI18n();
  const o = t('curso.oferta');
  const fecha = useFecha(CURSO_CAFE.validoHasta);
  return (
    <section id="oferta" className="scroll-mt-4 bg-ink-2 px-[22px] py-16 md:px-10 md:py-24">
      <Revelar className="mx-auto flex max-w-[620px] flex-col gap-6 rounded-[32px_32px_32px_8px] bg-white p-6 text-center text-ink shadow-[0_30px_70px_rgba(0,0,0,.3)] md:p-10">
        <div className="flex flex-col gap-2">
          <Eyebrow>{fecha ? t('curso.oferta.eyebrowHasta', { fecha }) : o.eyebrow}</Eyebrow>
          <h2 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold md:text-[38px]">{o.titulo}</h2>
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-left">
          <li className="flex gap-3 rounded-2xl bg-mist p-4">
            <BookOpen size={20} className="mt-0.5 flex-none text-ink" aria-hidden="true" />
            <span className="flex flex-col gap-0.5">
              <strong className="text-[15px]">{o.curso}</strong>
              <span className="text-[13.5px] text-muted">{o.cursoSub}</span>
            </span>
          </li>
          <li className="flex gap-3 rounded-2xl border-[1.5px] border-dashed border-gold bg-[#FFF8E6] p-4">
            <Gift size={20} className="mt-0.5 flex-none text-clay" aria-hidden="true" />
            <span className="flex flex-col gap-0.5">
              <strong className="text-[15px]">{o.bono}</strong>
              <span className="text-[13.5px] text-muted">{o.bonoSub}</span>
            </span>
          </li>
        </ul>
        <div className="flex flex-col items-center gap-1.5">
          {CURSO_CAFE.precioRegular && <span className="text-sm text-muted line-through">{t('curso.oferta.regular', { precio: precioTexto(CURSO_CAFE.precioRegular) })}</span>}
          <span className="font-serif text-[44px] leading-none font-semibold md:text-[56px]">
            ${CURSO_CAFE.precio.toLocaleString('es-CO')} <span className="text-lg font-semibold">COP</span>
          </span>
          {CURSO_CAFE.cuotas && <span className="text-sm text-muted">{t('curso.oferta.cuotas', { n: CURSO_CAFE.cuotas })}</span>}
          {fecha && <span className="text-[13px] font-semibold text-clay">{t('curso.oferta.despues', { fecha })}</span>}
        </div>
        <BotonComprar size="xl" className="w-full">
          {o.cta}
        </BotonComprar>
        <ul className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-[13px] text-muted">
          {o.confianza.map((c) => (
            <li key={c} className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-good" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
      </Revelar>
    </section>
  );
}

function Garantia() {
  const { t } = useI18n();
  const g = t('curso.garantia');
  return (
    <section className="px-[22px] py-14 md:px-10 md:py-20">
      <Revelar className="mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <span className="flex size-[104px] flex-none flex-col items-center justify-center rounded-full border-[3px] border-gold text-ink">
          <span className="font-serif text-[40px] leading-none font-semibold">7</span>
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase">{g.dias}</span>
        </span>
        <span className="flex flex-col gap-2">
          <h2 className="m-0 font-serif text-[24px] font-semibold md:text-[28px]">{g.titulo}</h2>
          <p className="m-0 text-[15px] leading-[1.65] text-muted">{g.texto}</p>
        </span>
      </Revelar>
    </section>
  );
}

function Preguntas() {
  const { t } = useI18n();
  const f = t('curso.faq');
  const items = f.items.filter((x) => x.a);
  const [abierta, setAbierta] = useState(0);
  return (
    <section className="bg-line-2 px-[22px] py-16 md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[820px] flex-col gap-8">
        <H2 t1={f.titulo} em={f.tituloEm} />
        <div className="flex flex-col gap-2.5">
          {items.map((x, i) => {
            const on = abierta === i;
            return (
              <div key={x.q} className="rounded-2xl bg-white">
                <h3 className="m-0">
                  <button
                    type="button"
                    id={`faq-q${i}`}
                    aria-expanded={on}
                    aria-controls={`faq-a${i}`}
                    onClick={() => setAbierta(on ? -1 : i)}
                    className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-[22px] py-[18px] text-left text-base font-semibold text-ink"
                  >
                    {x.q}
                    <span aria-hidden="true" className={'grid size-8 flex-none place-items-center rounded-full bg-line-2 text-lg transition-transform duration-300 ' + (on ? 'rotate-45' : '')}>
                      +
                    </span>
                  </button>
                </h3>
                <div id={`faq-a${i}`} role="region" aria-labelledby={`faq-q${i}`} hidden={!on}>
                  <p className="m-0 px-[22px] pb-5 text-[15px] leading-[1.6] text-muted">{x.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Cierre() {
  const { t } = useI18n();
  const c = t('curso.cierre');
  return (
    <section className="relative overflow-hidden bg-ink px-[22px] py-16 text-center text-white md:px-10 md:py-24">
      <Curvas variante="seccion" />
      <Revelar className="relative mx-auto flex max-w-[760px] flex-col items-center gap-5">
        <H2 t1={c.titulo} em={c.tituloEm} claro />
        <p className="m-0 text-base text-pale md:text-[18px]">{c.texto}</p>
        <BotonComprar size="xl">{t('curso.cierre.cta', { precio: precioTexto(CURSO_CAFE.precio) })}</BotonComprar>
        <a href={wa(t('curso.msgWhatsApp'))} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-gold underline-offset-4 hover:underline">
          <MessageCircle size={18} aria-hidden="true" />
          {c.whatsapp}
        </a>
      </Revelar>
    </section>
  );
}

function Pie() {
  const { t } = useI18n();
  return (
    <footer className="bg-[#0B2526] px-[22px] pt-6 pb-24 text-[13px] text-sage md:px-10 md:pb-6">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
        <span>{t('curso.pie.derechos')}</span>
        <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href="mailto:juan.q@accesointernacional.com" className="text-sage hover:text-white">
            juan.q@accesointernacional.com
          </a>
          <Link to="/" className="text-sage hover:text-white">
            {t('curso.pie.sitio')}
          </Link>
        </span>
      </div>
    </footer>
  );
}

/** Barra fija en celular: precio y botón de compra siempre a mano después de la cabecera */
function BarraMovil() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const ver = () => setVisible(window.scrollY > 640);
    ver();
    window.addEventListener('scroll', ver, { passive: true });
    return () => window.removeEventListener('scroll', ver);
  }, []);
  return (
    <div
      aria-hidden={!visible}
      className={
        'fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-ink-3 bg-ink px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,.25)] transition-transform duration-300 md:hidden ' +
        (visible ? 'translate-y-0' : 'pointer-events-none translate-y-full')
      }
    >
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] tracking-[0.08em] text-sage uppercase">{t('curso.barra')}</span>
        <strong className="font-serif text-lg text-white">{precioTexto(CURSO_CAFE.precio)}</strong>
      </span>
      <a href="#oferta" tabIndex={visible ? 0 : -1} className={classes({ variant: 'gold', size: 'md', className: 'whitespace-nowrap' })}>
        {t('curso.ctaHeader')}
      </a>
    </div>
  );
}

export default function CursoCafe() {
  useArriba();
  useEffect(() => {
    registrarOrigen();
  }, []);
  // "Ver testimonio en video" baja a los casos y reproduce el primero (Café Folklord), como en la página anterior
  const verTestimonio = () => {
    const seccion = document.getElementById('casos');
    seccion?.scrollIntoView({ block: 'start' });
    seccion?.querySelector('button')?.click();
  };
  return (
    <div className="min-w-0 bg-white text-ink">
      <Hero />
      <Cifras />
      <Problema />
      <Evidencia />
      <Modulos />
      <ParaTi />
      <Instructor />
      <Testimonios onVideo={verTestimonio} />
      <Oferta />
      <Garantia />
      <Preguntas />
      <Cierre />
      <Pie />
      <BarraMovil />
    </div>
  );
}
