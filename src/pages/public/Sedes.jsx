import { MapPinned } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { ArrowRight } from '../../components/ui/Icons';
import pinUsa from '../../assets/sedes/pin-usa.png';
import pinColombia from '../../assets/sedes/pin-colombia.png';

// Mismo orden que t('sedes.lista'). La búsqueda en Maps usa la dirección completa: el original buscaba solo
// "Torre Nucleo Pereira" y "848 Brickell Ave Miami FL", que pueden caer en otro edificio o piso.
const SEDES = [
  { pin: pinUsa, ciudad: 'Miami', mapa: '848 Brickell Ave Ste 950, Miami, FL 33131' },
  { pin: pinColombia, ciudad: 'Pereira', mapa: 'Torre Núcleo, Carrera 15 #12-37, Pereira, Risaralda, Colombia' },
];

const urlMapa = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function Tarjeta({ sede, i }) {
  const { t } = useI18n();
  const { pin, ciudad, mapa } = SEDES[i];
  return (
    <article className="relative flex flex-col gap-6 overflow-clip rounded-[28px_28px_28px_6px] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(4,20,21,.07)] transition-transform duration-200 hover:-translate-y-1 sm:flex-row sm:items-center md:p-8">
      {/* Nombre de la ciudad de fondo, como marca de agua */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-2 -bottom-10 font-serif text-[88px] leading-none font-semibold text-mist select-none">
        {ciudad}
      </span>
      <div className="relative flex size-[92px] flex-none items-center justify-center rounded-[22px] bg-mist">
        <img src={pin} alt={sede.alt} width="200" height="200" className="size-[72px] object-contain drop-shadow-[0_8px_12px_rgba(4,20,21,.18)]" />
      </div>
      <div className="relative flex min-w-0 flex-col gap-3">
        <h2 className="m-0 font-serif text-[21px] leading-[1.22] font-semibold text-balance md:text-[23px]">{sede.titulo}</h2>
        <address className="flex flex-col text-[15px] leading-[1.55] text-muted not-italic">
          {sede.direccion.map((linea) => (
            <span key={linea}>{linea}</span>
          ))}
        </address>
        <a
          href={urlMapa(mapa)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 self-start text-[13px] font-bold tracking-[0.06em] text-clay uppercase no-underline hover:text-clay-dark"
        >
          <MapPinned size={17} aria-hidden="true" />
          {t('sedes.mapa')}
          <ArrowRight size={15} />
        </a>
      </div>
    </article>
  );
}

export default function Sedes() {
  const { t } = useI18n();
  return (
    <PaginaSeccion>
      <section className="mx-auto flex max-w-[1240px] flex-col gap-10 px-[22px] py-12 md:px-10 md:py-20">
        <header className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('sedes.badge')}</span>
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('sedes.titulo')}</h1>
          <p className="m-0 text-base leading-[1.6] text-muted md:text-[17px]">{t('sedes.intro')}</p>
        </header>
        <div className="mx-auto grid w-full max-w-[1120px] gap-6 lg:grid-cols-2">
          {t('sedes.lista').map((s, i) => (
            <Tarjeta key={s.titulo} sede={s} i={i} />
          ))}
        </div>
      </section>
    </PaginaSeccion>
  );
}
