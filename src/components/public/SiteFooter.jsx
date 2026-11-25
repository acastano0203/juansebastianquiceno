import { Link } from 'react-router-dom';
import { faLinkedinIn, faSpotify, faWhatsapp, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { BadgeCheck, BriefcaseBusiness, ChevronRight, GraduationCap, IdCard, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { Check } from '../ui/Icons';
import AgendaDiagnostico from './AgendaDiagnostico';
import logo from '../../assets/logo-juan-sebastian-quiceno.svg';

// Mismos destinos que el pie de juansebastianquiceno.com, ahora como páginas propias
const NAV = ['/', '/sobre-mi', '/casos-de-exito', '/servicios', '/criterios', '/programas', '/videos-podcast', '/sedes'];
const PORTAFOLIO = ['/servicios', '/servicios', '/servicios', '/servicios', '/casos-de-exito', '/casos-de-exito'];
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
        <div className="mx-auto grid max-w-[1240px] gap-12 px-[22px] pt-16 pb-10 md:px-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-10">
          {/* Marca */}
          <div className="flex flex-col gap-6">
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
          </div>

          {/* Navegación */}
          <nav aria-labelledby="pie-nav" className="flex flex-col gap-5">
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
          </nav>

          {/* Portafolio */}
          <div className="flex flex-col gap-5">
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
          </div>

          {/* Credenciales y contacto */}
          <div className="flex flex-col gap-8">
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
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[14.5px]">
                <li>
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-3 text-pale no-underline hover:text-white">
                    <span className="text-[#25D366]">
                      <Marca icono={faWhatsapp} size={18} />
                    </span>
                    +57 301 414 0259
                  </a>
                </li>
                <li>
                  <a href={`mailto:${CORREO}`} className="inline-flex min-h-10 items-center gap-3 break-all text-pale no-underline hover:text-white">
                    <Mail size={18} className="flex-none text-gold" aria-hidden="true" />
                    {CORREO}
                  </a>
                </li>
                <li>
                  <Link to="/sedes" className="inline-flex min-h-10 items-center gap-3 text-pale no-underline hover:text-white">
                    <MapPin size={18} className="flex-none text-gold" aria-hidden="true" />
                    {p.sedes}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

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
