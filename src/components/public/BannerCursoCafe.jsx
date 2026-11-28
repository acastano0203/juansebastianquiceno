import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BookOpenText, ChartLine, Gift, GraduationCap, Package, Play, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { CURSO_CAFE, RUTA_CURSO_CAFE } from '../../config/cursoCafe';
import ReproductorYouTube from './ReproductorYouTube';
import RootLines from '../ui/RootLines';
import { classes } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';
import { Aparecer, AparecerImagen, Elemento, Grupo } from '../ui/Aparecer';
import foto from '../../assets/curso-cafe/video-presentacion.jpg'; // miniatura del Short de presentación

// Banner del curso de café en la portada (sección #curso-cafe-banner del sitio original, mismo color #995837 = clay).
// El botón lleva a la landing del curso, la misma de la tarjeta en Programas; la tarjeta de la derecha
// reproduce aquí mismo el video de presentación del curso (el de la cabecera de la landing).
const ICONOS = [Package, ChartLine, BookOpen];

function Vitrina() {
  const { t } = useI18n();
  const b = t('curso.banner');
  const [activo, setActivo] = useState(false);
  return (
    <AparecerImagen retraso={0.15} className="relative mx-auto flex w-full max-w-[460px] flex-col lg:mr-0 lg:ml-auto">
      {/* El video es un Short de YouTube: marco vertical 9:16 para que no salga con franjas negras */}
      <div className="relative ml-auto aspect-[9/16] w-[72%] max-w-[320px] overflow-hidden rounded-[24px_64px_24px_6px] border-2 border-gold/45 bg-ink shadow-[0_30px_60px_rgba(0,0,0,.35)] sm:w-[68%]">
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
          </button>
        )}
      </div>
      {/* Guía 2026 de regalo: flota sobre la esquina inferior del video; al reproducir baja para no tapar los controles */}
      <Aparecer
        as="figure"
        retraso={0.55}
        y={10}
        className={
          'relative z-10 mx-0 mb-0 flex w-[88%] max-w-[340px] items-stretch self-start overflow-hidden rounded-[18px_18px_18px_4px] border border-gold/50 bg-ink shadow-[0_24px_48px_rgba(0,0,0,.45)] ring-4 ring-clay transition-[margin] duration-300 sm:-ml-4 ' +
          (activo ? 'mt-4' : '-mt-14')
        }
      >
        {/* Ícono de guía: libro abierto con sello PDF, en los colores de la marca */}
        <span role="img" aria-label={b.guiaAlt} className="relative grid w-[34%] flex-none place-items-center bg-gradient-to-br from-gold/25 via-gold/10 to-transparent py-4">
          <span className="relative grid size-[62px] place-items-center rounded-[14px_14px_14px_4px] border border-gold/60 bg-ink shadow-[0_8px_20px_rgba(0,0,0,.35)] sm:size-[68px]">
            <BookOpenText size={30} strokeWidth={1.6} className="text-gold" aria-hidden="true" />
            <span className="absolute -right-2 -bottom-2 rounded-md bg-gold px-1.5 py-0.5 text-[9px] leading-none font-extrabold tracking-[0.08em] text-ink">PDF</span>
          </span>
        </span>
        <figcaption className="flex min-w-0 flex-col gap-1.5 px-3.5 py-3.5 sm:px-4 sm:py-4">
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-ink uppercase">
            <Gift size={12} className="flex-none" aria-hidden="true" />
            {b.guia}
          </span>
          <strong className="font-serif text-[15px] leading-[1.2] font-semibold text-white sm:text-[16px]">{b.guiaTitulo}</strong>
          <span className="text-[12px] leading-[1.35] text-pale">{b.guiaSub}</span>
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
              <GraduationCap size={20} aria-hidden="true" />
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
