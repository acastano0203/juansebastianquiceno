import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { Apple, Coffee, Shirt, Tractor } from 'lucide-react';
import { ArrowRight } from '../../components/ui/Icons';
import { RUTA_CURSO_CAFE } from '../../config/cursoCafe';
import { ANCLA_AGENDA } from '../../lib/contacto';

// Los íconos del original (taza, tractor, chaleco, manzana) y adónde lleva cada programa.
// El de café va a su landing de venta; los demás no tienen página: se agenda una sesión.
const PROGRAMAS = [{ Icono: Coffee, ruta: RUTA_CURSO_CAFE }, { Icono: Tractor }, { Icono: Shirt }, { Icono: Apple }];

// El ::after del enlace cubre toda la tarjeta: se hace clic en cualquier parte, no solo en el texto
const claseEnlace =
  "inline-flex min-h-11 items-center gap-2 font-semibold text-clay no-underline group-hover:text-clay-dark after:absolute after:inset-0 after:content-['']";

function Tarjeta({ programa, i }) {
  const { t } = useI18n();
  const { Icono, ruta } = PROGRAMAS[i];
  return (
    <article className="group relative flex cursor-pointer flex-col justify-between gap-6 rounded-[24px_24px_24px_6px] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(4,20,21,.07)] transition-[transform,box-shadow] duration-200 focus-within:ring-2 focus-within:ring-clay hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(4,20,21,.12)] md:p-7">
      <div className="flex flex-col gap-4">
        <span className="flex size-[52px] items-center justify-center rounded-xl bg-ink text-gold">
          <Icono size={24} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h2 className="m-0 font-serif text-[20px] leading-[1.22] font-semibold text-balance">{programa.titulo}</h2>
        <p className="m-0 text-[14.5px] leading-[1.65] text-muted">{programa.desc}</p>
      </div>
      <div className="border-t border-line pt-4">
        {ruta ? (
          <Link to={ruta} className={claseEnlace}>
            {t('programas.verPrograma')}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <a href={ANCLA_AGENDA} className={claseEnlace}>
            {t('programas.agendar')}
            <ArrowRight size={16} />
          </a>
        )}
      </div>
    </article>
  );
}

export default function Programas() {
  const { t } = useI18n();
  return (
    <PaginaSeccion>
      <section className="bg-clay-bg/60">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-10 px-[22px] py-12 md:px-10 md:py-20">
          <header className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
            <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('programas.badge')}</span>
            <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('programas.titulo')}</h1>
            <p className="m-0 text-base leading-[1.6] text-muted md:text-[17px]">{t('programas.intro')}</p>
          </header>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t('programas.lista').map((p, i) => (
              <Tarjeta key={p.titulo} programa={p} i={i} />
            ))}
          </div>
        </div>
      </section>
    </PaginaSeccion>
  );
}
