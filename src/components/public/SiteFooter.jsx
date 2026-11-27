import { Link } from 'react-router-dom';
import { faLinkedinIn, faSpotify, faWhatsapp, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { ArrowUpRight, BadgeCheck, BriefcaseBusiness, ChevronRight, Clock, GraduationCap, IdCard, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { ATENCION } from '../../config/agenda';
import { Check } from '../ui/Icons';
import AgendaDiagnostico from './AgendaDiagnostico';
import { Elemento, Grupo } from '../ui/Aparecer';
import logo from '../../assets/logo-juan-sebastian-quiceno.svg';

// Mismos destinos que el pie de juansebastianquiceno.com, ahora como páginas propias
const NAV = ['/', '/sobre-mi', '/casos-de-exito', '/servicios', '/criterios', '/programas', '/videos-podcast', '/sedes'];
// Cada ítem del portafolio abre su servicio o su caso concreto, no la página en general
const PORTAFOLIO = [
  '/servicios#servicio-1', // Potencialización Comercial
  '/servicios#servicio-2', // Dirección Financiera Estratégica
  '/servicios#servicio-3', // Estrategia Logística Global
  '/servicios#servicio-4', // Go to Market
  '/casos-de-exito?caso=4#casos-lista', // Exportación de Café & Frutas
  '/casos-de-exito?caso=5#casos-lista', // Optimización de Costos Portuarios
];
const ICONOS_CRED = [BadgeCheck, GraduationCap, BriefcaseBusiness];

const WHATSAPP = '573014140259';
const CORREO = 'juan.q@accesointernacional.com';
const REDES = [
  { nombre: 'LinkedIn', href: 'https://www.linkedin.com/in/juan-sebastian-quiceno-calderon', icono: faLinkedinIn },
  { nombre: 'WhatsApp', href: `https://wa.me/${WHATSAPP}`, icono: faWhatsapp },
  { nombre: 'YouTube', href: 'https://www.youtube.com/@juansebastianquicenocalder4511', icono: faYoutube },
  { nombre: 'Spotify', href: 'https://open.spotify.com/show/7qlMXU8NBJolfG7qhL7Hsa', icono: faSpotify },
];

// Íconos de marca de Font Awesome Free (CC BY 4.0): Lucide no incluye logos de marcas
function Marca({ icono, size = 17 }) {
  const [ancho, alto, , , path] = icono.icon;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${ancho} ${alto}`} width={size} height={size} fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const claseRed =
  'flex size-11 items-center justify-center rounded-full border border-ink-3 text-pale no-underline transition-colors hover:border-gold hover:bg-gold hover:text-ink';

const horaTexto = (h, lang) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h));

const claseCanal =
  'group flex items-center gap-3 rounded-2xl border border-ink-3 bg-ink/60 px-3 py-2.5 no-underline transition-colors duration-200 hover:border-gold/60 hover:bg-ink';

/** Una fila de "Canales de atención": enlace externo, mailto o ruta interna */
function Canal({ href, to, externo = false, etiqueta, valor, icono, tono = 'text-gold' }) {
  const contenido = (
    <>
      <span className={'grid size-10 flex-none place-items-center rounded-xl bg-ink-2 transition-colors group-hover:bg-ink-3 ' + tono}>{icono}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10.5px] font-semibold tracking-[0.12em] text-sage uppercase">{etiqueta}</span>
        <span className="text-[14px] leading-[1.35] text-pale transition-colors group-hover:text-white">{valor}</span>
      </span>
      <ArrowUpRight size={16} className="flex-none text-ink-4 transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" aria-hidden="true" />
    </>
  );
  if (to) {
    return (
      <Link to={to} className={claseCanal}>
        {contenido}
      </Link>
    );
  }
  return (
    <a href={href} {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={claseCanal}>
      {contenido}
    </a>
  );
}

function Titulo({ children }) {
  return (
    <h2 className="m-0 flex flex-col gap-2.5 font-serif text-[18px] font-semibold text-white">
      {children}
      <span className="h-0.5 w-8 rounded-full bg-gold" aria-hidden="true" />
    </h2>
  );
}

/** Pie de todas las páginas públicas. conAgenda: muestra encima la sección "Agenda una sesión". */
export default function SiteFooter({ conAgenda = true }) {
  const { t, lang } = useI18n();
  const p = t('pie');
  return (
    <>
      {conAgenda && <AgendaDiagnostico />}
      <footer className="bg-[#0B2526] text-pale">
        <Grupo pausa={0.1} className="mx-auto grid max-w-[1240px] gap-12 px-[22px] pt-16 pb-10 md:px-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-10">
          {/* Marca */}
          <Elemento className="flex flex-col gap-6">
            <Link to="/" className="self-start" aria-label="Juan Sebastián Quiceno — Inicio">
              <img src={logo} alt="" width="190" height="108" className="h-auto w-[180px]" />
            </Link>
            <p className="m-0 max-w-[380px] text-[14.5px] leading-[1.7]">{p.desc}</p>
            <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
              {REDES.map((r) => (
                <li key={r.nombre}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.nombre} title={r.nombre} className={claseRed}>
                    <Marca icono={r.icono} />
                  </a>
                </li>
              ))}
              <li>
                <a href="/juan-sebastian-quiceno.vcf" type="text/vcard" aria-label={p.vcard} title={p.vcard} className={claseRed}>
                  <IdCard size={18} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </Elemento>

          {/* Navegación */}
          <Elemento as="nav" aria-labelledby="pie-nav" className="flex flex-col gap-5">
            <span id="pie-nav">
              <Titulo>{p.navTitulo}</Titulo>
            </span>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {p.nav.map((texto, i) => (
                <li key={texto}>
                  <Link to={NAV[i]} className="group inline-flex min-h-9 items-center gap-2 text-[14.5px] text-pale no-underline hover:text-white">
                    <ChevronRight size={15} className="text-gold transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    {texto}
                  </Link>
                </li>
              ))}
            </ul>
          </Elemento>

          {/* Portafolio */}
          <Elemento className="flex flex-col gap-5">
            <Titulo>{p.portTitulo}</Titulo>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {p.port.map((texto, i) => (
                <li key={texto}>
                  <Link to={PORTAFOLIO[i]} className="inline-flex min-h-9 items-center gap-2 text-[14.5px] text-pale no-underline hover:text-white">
                    <Check size={14} className="flex-none text-gold" />
                    {texto}
                  </Link>
                </li>
              ))}
            </ul>
          </Elemento>

          {/* Credenciales y contacto */}
          <Elemento className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <Titulo>{p.credTitulo}</Titulo>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {p.cred.map((c, i) => {
                  const Icono = ICONOS_CRED[i];
                  return (
                    <li key={c.b} className="flex items-center gap-3 rounded-2xl border border-ink-3 bg-ink/60 px-4 py-3 text-[13.5px] leading-[1.4]">
                      <Icono size={19} className="flex-none text-gold" aria-hidden="true" />
                      <span>
                        <strong className="text-white">{c.b}</strong>
                        {c.t}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <Titulo>{p.contactoTitulo}</Titulo>
              {/* Cada canal como una fila: ícono en su casilla, qué es (etiqueta) y el dato; al pasar el mouse se resalta en dorado */}
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                <li>
                  <Canal href={`https://wa.me/${WHATSAPP}`} externo etiqueta={p.canal.whatsapp} valor="+57 301 414 0259" icono={<Marca icono={faWhatsapp} size={18} />} tono="text-[#25D366]" />
                </li>
                <li>
                  <Canal href={`mailto:${CORREO}`} etiqueta={p.canal.correo} valor={
                      // Si no cabe en una línea, parte antes de la "@" y no a mitad de palabra
                      <>
                        {CORREO.split('@')[0]}
                        <wbr />@{CORREO.split('@')[1]}
                      </>
                    }
                    icono={<Mail size={18} aria-hidden="true" />} />
                </li>
                <li>
                  <Canal to="/sedes" etiqueta={p.canal.sedes} valor={p.sedes} icono={<MapPin size={18} aria-hidden="true" />} />
                </li>
              </ul>
              <p className="m-0 flex items-center gap-2 text-[12.5px] text-sage">
                <Clock size={14} className="flex-none text-gold" aria-hidden="true" />
                {t('pie.horario', { desde: horaTexto(ATENCION.desde, lang), hasta: horaTexto(ATENCION.hasta, lang) })}
              </p>
            </div>
          </Elemento>
        </Grupo>

        <div className="border-t border-ink-3">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-[22px] py-6 text-[13px] text-sage md:flex-row md:items-center md:justify-between md:px-10">
            <div className="flex flex-col gap-1">
              <span>{p.derechos}</span>
              <span className="text-[12px] text-faint">{PARAMS.textosLegales.resultado[lang]}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link to="/admin" className="inline-flex min-h-11 items-center text-sage no-underline hover:text-white">
                {p.admin}
              </Link>
              <span className="inline-flex items-center gap-1.5 text-sage-2">
                <ShieldCheck size={15} aria-hidden="true" />
                {p.seguro}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
