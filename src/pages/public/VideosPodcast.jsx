import { useRef, useState } from 'react';
import { ExternalLink, Headphones, Play, Podcast } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import RootLines from '../../components/ui/RootLines';
import ReproductorYouTube from '../../components/public/ReproductorYouTube';
import { Button, classes } from '../../components/ui/Button';
import negociacion from '../../assets/videos/negociacion-internacional.jpg';
import logistica from '../../assets/videos/logistica-portuaria.jpg';
import exportar from '../../assets/videos/exportar-sin-improvisar.jpg';
import finanzas from '../../assets/videos/finanzas-precios.jpg';
import portadaPodcast from '../../assets/videos/podcast-portada.jpg';

// Mismos videos y podcast de juansebastianquiceno.com, en el orden de t('videos.lista').
// Las miniaturas están en el proyecto: YouTube solo se carga cuando alguien pulsa reproducir.
const VIDEOS = [
  { id: 'mY_q427gJJ4', miniatura: negociacion },
  { id: '3F1RzhNapr8', miniatura: logistica },
  { id: 'bcyyK8KCdMA', miniatura: exportar },
  { id: '9hCaUpSBEe0', miniatura: finanzas },
];
const SPOTIFY_SHOW = '7qlMXU8NBJolfG7qhL7Hsa';

function Etiqueta({ children, oscura = false }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.1em] uppercase ' +
        (oscura ? 'bg-ink/85 text-gold backdrop-blur-sm' : 'bg-gold/15 text-clay')
      }
    >
      {children}
    </span>
  );
}

// Portada propia del video: antes de reproducir y en pausa/fin. En pausa va sin título (abajo están los controles).
function Portada({ video, info, onClick, conTitulo = true }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('videos.reproducir', { titulo: info.titulo })}
      className="group absolute inset-0 size-full cursor-pointer border-0 bg-transparent p-0 text-left"
    >
      <img src={video.miniatura} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" aria-hidden="true" />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="relative -mt-8 flex size-[60px] items-center justify-center rounded-full bg-gold text-ink shadow-[0_12px_30px_rgba(0,0,0,.35)] transition-transform duration-300 group-hover:scale-110 sm:mt-0 sm:size-[76px] md:size-[92px]">
          <span className="absolute inset-0 animate-ping rounded-full bg-gold/40 [animation-duration:2.4s]" />
          <Play size={30} className="relative ml-1" fill="currentColor" strokeWidth={0} />
        </span>
      </span>
      {conTitulo && (
        // En celular la etiqueta se oculta y el botón sube un poco: si no, el título tapa el botón
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5 md:p-8">
          <span className="hidden sm:contents">
            <Etiqueta oscura>
              <Play size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              {info.meta}
            </Etiqueta>
          </span>
          <span className="font-serif text-[17px] leading-[1.15] font-semibold text-white sm:text-[22px] md:text-[32px]">{info.titulo}</span>
        </span>
      )}
    </button>
  );
}

// Pantalla principal: la portada hasta que se pulsa reproducir; luego el reproductor con controles propios
function Reproductor({ video, info, reproduciendo, onReproducir }) {
  const { t } = useI18n();
  return (
    <div className="relative aspect-video overflow-clip rounded-[28px_28px_28px_6px] border-2 border-gold/30 bg-ink shadow-[0_30px_60px_rgba(4,20,21,.28)]">
      {reproduciendo ? (
        <ReproductorYouTube
          videoId={video.id}
          titulo={info.titulo}
          miniatura={video.miniatura}
          textos={t('videos.controles')}
          portadaPausa={(reanudar) => <Portada video={video} info={info} onClick={reanudar} conTitulo={false} />}
        />
      ) : (
        <Portada video={video} info={info} onClick={onReproducir} />
      )}
    </div>
  );
}

function ItemLista({ video, info, activo, onElegir }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-current={activo}
      aria-label={t('videos.seleccionar', { titulo: info.titulo })}
      className={
        'group flex w-full cursor-pointer items-center gap-3.5 rounded-[18px] border bg-white p-2.5 text-left transition-all ' +
        (activo ? 'border-gold shadow-[0_12px_30px_rgba(221,189,98,.2)]' : 'border-line hover:-translate-y-0.5 hover:border-ink/30')
      }
    >
      <span className="relative aspect-video w-[132px] flex-none overflow-hidden rounded-xl bg-ink">
        <img src={video.miniatura} alt="" className="size-full object-cover" />
        <span className={'absolute inset-0 flex items-center justify-center transition-colors ' + (activo ? 'bg-ink/55' : 'bg-ink/30 group-hover:bg-ink/45')}>
          <span className="flex size-8 items-center justify-center rounded-full bg-gold text-ink">
            <Play size={14} className="ml-0.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="font-serif text-[15px] leading-[1.25] font-semibold text-ink">{info.titulo}</span>
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-clay">
          <span className={'size-1.5 rounded-full ' + (activo ? 'bg-gold' : 'bg-clay/50')} aria-hidden="true" />
          {activo ? t('videos.enPantalla') : info.meta}
        </span>
      </span>
    </button>
  );
}

function Videos() {
  const { t } = useI18n();
  const lista = t('videos.lista');
  const [actual, setActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const pantalla = useRef(null);

  const elegir = (i) => {
    setActual(i);
    setReproduciendo(true);
    // En móvil la lista queda debajo: se sube a la pantalla para ver el video que se eligió
    if (window.matchMedia('(max-width: 1023px)').matches) pantalla.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
      <div ref={pantalla}>
        <Reproductor video={VIDEOS[actual]} info={lista[actual]} reproduciendo={reproduciendo} onReproducir={() => setReproduciendo(true)} />
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-1">
        {VIDEOS.map((v, i) => (
          <li key={v.id}>
            <ItemLista video={v} info={lista[i]} activo={i === actual} onElegir={() => elegir(i)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Podcast: tarjeta propia; el reproductor de Spotify (tema oscuro) aparece dentro del marco al pulsar "Escuchar"
function PodcastOficial() {
  const { t } = useI18n();
  const [escuchando, setEscuchando] = useState(false);
  const p = t('videos.podcast');
  return (
    // overflow-clip y no overflow-hidden: hidden deja desplazar el contenido por código (scrollIntoView, foco) y lo descuadra
    <section className="relative overflow-clip rounded-[32px_32px_32px_6px] bg-ink p-6 text-white md:p-10">
      <RootLines variant="side" opacity={0.16} className="-right-16 -bottom-16" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10">
        <div className="relative mx-auto w-[180px] md:w-[220px]">
          <div className="absolute -inset-3 rotate-6 rounded-[28px] bg-gold/20" aria-hidden="true" />
          <img src={portadaPodcast} alt={p.portadaAlt} className="relative block aspect-square w-full rounded-[24px] border-2 border-gold/40 object-cover shadow-[0_24px_50px_rgba(0,0,0,.45)]" />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-gold/40 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-gold uppercase">
            <Podcast size={14} aria-hidden="true" />
            {p.badge}
          </span>
          <h2 className="m-0 font-serif text-[26px] leading-[1.15] font-semibold text-balance md:text-[34px]">{p.titulo}</h2>
          <p className="m-0 max-w-[640px] text-[15px] leading-[1.6] text-pale md:text-base">{p.desc}</p>
          {escuchando ? (
            <div className="mt-1 overflow-hidden rounded-[18px] border border-gold/30 bg-black/20">
              <iframe
                title={p.titulo}
                src={`https://open.spotify.com/embed/show/${SPOTIFY_SHOW}?utm_source=generator&theme=0`}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="block border-0"
              />
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button variant="gold" size="lg" lift onClick={() => setEscuchando(true)}>
                <Headphones size={18} aria-hidden="true" />
                {p.escuchar}
              </Button>
              <a href={`https://open.spotify.com/show/${SPOTIFY_SHOW}`} target="_blank" rel="noopener noreferrer" className={classes({ variant: 'outline-white', size: 'lg' })}>
                {p.abrir}
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function VideosPodcast() {
  const { t } = useI18n();
  return (
    <PaginaSeccion>
      <section className="mx-auto flex max-w-[1240px] flex-col gap-10 px-[22px] py-12 md:px-10 md:py-20">
        <header className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('videos.badge')}</span>
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('videos.titulo')}</h1>
          <p className="m-0 text-base leading-[1.6] text-muted md:text-[17px]">{t('videos.intro')}</p>
        </header>
        <Videos />
        <PodcastOficial />
      </section>
    </PaginaSeccion>
  );
}
