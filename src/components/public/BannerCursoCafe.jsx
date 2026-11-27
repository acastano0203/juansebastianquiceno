import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChartLine, CirclePlay, Gift, Package, Play, Quote, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { CURSO_CAFE, RUTA_CURSO_CAFE } from '../../config/cursoCafe';
import ReproductorYouTube from './ReproductorYouTube';
import RootLines from '../ui/RootLines';
import { classes } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';
import { Aparecer, AparecerImagen, Elemento, Grupo } from '../ui/Aparecer';
import foto from '../../assets/curso-cafe/juan-sebastian-trilladora.jpg';
import guia from '../../assets/curso-cafe/guia-mockup.jpg';

// Banner del curso de café en la portada (sección #curso-cafe-banner del sitio original, mismo color #995837 = clay).
// El botón lleva a la landing del curso, la misma de la tarjeta en Programas; la tarjeta de la derecha
// reproduce aquí mismo el video de presentación del curso (el de la cabecera de la landing).
const ICONOS = [Package, ChartLine, BookOpen];

function Vitrina() {
  const { t } = useI18n();
  const b = t('curso.banner');
  const [activo, setActivo] = useState(false);
  return (
    <AparecerImagen retraso={0.15} className="relative mx-auto w-full max-w-[520px] pb-16 sm:pb-12 lg:mr-0 lg:ml-auto">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px_72px_24px_6px] border-2 border-gold/45 bg-ink shadow-[0_30px_60px_rgba(0,0,0,.35)]">
        {activo ? (
          <ReproductorYouTube
            videoId={CURSO_CAFE.videoVenta}
            titulo={b.reproducir}
            miniatura={foto}
            textos={t('videos.controles')}
            portadaPausa={(reanudar) => (
              <button type="button" onClick={reanudar} aria-label={t('videos.controles.reproducir')} className="absolute inset-0 grid cursor-pointer place-items-center border-0 bg-ink/40 p-0">
                <span className="grid size-16 place-items-center rounded-full bg-gold text-ink">
                  <Play size={26} fill="currentColor" aria-hidden="true" />
                </span>
              </button>
            )}
          />
        ) : (
          <button type="button" onClick={() => setActivo(true)} aria-label={b.reproducir} className="group absolute inset-0 cursor-pointer border-0 bg-transparent p-0 text-left">
            <img src={foto} alt={b.fotoAlt} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" aria-hidden="true" />
            <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-ink/80 px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] text-gold uppercase">
              <span className="size-2 animate-pulse rounded-full bg-[#2E9E5B]" aria-hidden="true" />
              {b.tag}
            </span>
            <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
              <span className="grid size-16 place-items-center rounded-full bg-gold text-ink shadow-[0_10px_30px_rgba(0,0,0,.35)] transition-transform group-hover:scale-110 md:size-[72px]">
                <Play size={26} fill="currentColor" />
              </span>
            </span>
            <span className="absolute right-3 bottom-3 left-[45%] flex items-center gap-2 rounded-xl bg-ink/85 px-3 py-2 text-[12px] leading-[1.3] font-semibold text-white sm:right-4 sm:bottom-4 sm:left-[38%] sm:px-3.5 sm:py-2.5 sm:text-[13px]">
              <Quote size={15} className="flex-none text-gold" aria-hidden="true" />
              {b.cita}
            </span>
          </button>
        )}
      </div>
      {/* Guía 2026 flotando sobre la esquina, como en el original */}
      <Aparecer as="figure" retraso={0.55} y={10} className="absolute bottom-0 -left-2 m-0 w-[42%] max-w-[200px] overflow-hidden rounded-2xl border-2 border-gold/50 bg-ink shadow-[0_20px_40px_rgba(0,0,0,.4)] sm:-left-6">
        <img src={guia} alt={b.guiaAlt} loading="lazy" className="block aspect-[4/3] w-full object-cover" />
        <figcaption className="flex items-center justify-center gap-1.5 px-2 py-2 text-center text-[10.5px] font-bold tracking-[0.06em] text-gold uppercase">
          <Gift size={13} className="flex-none" aria-hidden="true" />
          {b.guia}
        </figcaption>
      </Aparecer>
    </AparecerImagen>
  );
}

export default function BannerCursoCafe() {
  const { t } = useI18n();
  const b = t('curso.banner');
  return (
    <section id="curso-cafe" aria-labelledby="curso-cafe-titulo" className="relative overflow-hidden bg-clay px-[22px] py-16 text-white md:px-10 md:py-24">
      <RootLines variant="hero" opacity={0.12} className="-top-24 -right-24 hidden md:block" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
        <Grupo className="flex min-w-0 flex-col gap-6">
          <Elemento as="span" className="inline-flex items-center gap-2 self-start rounded-full border border-gold/50 bg-clay-ink/50 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.12em] text-gold uppercase">
            <ShieldCheck size={14} aria-hidden="true" />
            {b.badge}
          </Elemento>
          <Elemento as="h2" id="curso-cafe-titulo" className="m-0 font-serif text-[32px] leading-[1.1] font-semibold text-balance md:text-[46px]">
            {b.titulo}
            <em className="text-gold italic">{b.tituloEm}</em>
          </Elemento>
          <Elemento as="p" className="m-0 max-w-[600px] text-base leading-[1.6] text-clay-pale md:text-[17px]">
            {b.lead1}
            <strong className="text-white">{b.leadNombre}</strong>
            {b.lead2}
          </Elemento>
          <Elemento as="ul" className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
            {b.beneficios.map((x, i) => {
              const Icono = ICONOS[i];
              return (
                <li key={x.t} className="flex gap-3 rounded-[16px_16px_16px_4px] bg-clay-ink/45 p-4 sm:flex-col sm:gap-2.5">
                  <span className="grid size-9 flex-none place-items-center rounded-lg bg-gold/20 text-gold">
                    <Icono size={18} aria-hidden="true" />
                  </span>
                  <span className="flex flex-col gap-1">
                    <strong className="text-[14.5px] leading-[1.25]">{x.t}</strong>
                    <span className="text-[13px] leading-[1.45] text-clay-pale/90">{x.d}</span>
                  </span>
                </li>
              );
            })}
          </Elemento>
          <Elemento className="flex flex-col gap-3">
            <Link to={RUTA_CURSO_CAFE} className={classes({ variant: 'gold', size: 'xl', lift: true, className: 'self-stretch sm:self-start' })}>
              <CirclePlay size={20} aria-hidden="true" />
              {b.cta}
              <ArrowRight />
            </Link>
            <p className="m-0 flex items-start gap-2 text-[13px] leading-[1.45] text-clay-pale/90">
              <ShieldCheck size={15} className="mt-px flex-none text-gold" aria-hidden="true" />
              {b.micro}
            </p>
          </Elemento>
        </Grupo>
        <Vitrina />
      </div>
    </section>
  );
}
