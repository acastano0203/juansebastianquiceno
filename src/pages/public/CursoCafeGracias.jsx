import { Link } from 'react-router-dom';
import { CircleCheck, MessageCircle } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { CURSO_CAFE } from '../../config/cursoCafe';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { classes } from '../../components/ui/Button';

// A esta página vuelve Stripe después del pago (success_url). No marca nada como pagado:
// eso lo hace el webhook de Stripe en el servidor, que es lo único confiable.
export default function CursoCafeGracias() {
  const { t } = useI18n();
  const g = t('curso.gracias');
  const wa = `https://wa.me/${CURSO_CAFE.whatsapp}?text=${encodeURIComponent(t('curso.msgWhatsApp'))}`;
  return (
    <PaginaSeccion>
      <section className="px-[22px] py-16 md:px-10 md:py-24">
        <div className="mx-auto flex max-w-[640px] flex-col items-center gap-5 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-gold/25 text-ink">
            <CircleCheck size={30} aria-hidden="true" />
          </span>
          <p className="m-0 text-xs font-semibold tracking-[0.18em] text-clay uppercase">{g.eyebrow}</p>
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold md:text-[44px]">{g.titulo}</h1>
          <p className="m-0 text-base leading-[1.65] text-muted md:text-[17px]">{g.texto}</p>
          <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row">
            <a href={wa} target="_blank" rel="noopener noreferrer" className={classes({ variant: 'gold', size: 'lg', lift: true })}>
              <MessageCircle size={18} aria-hidden="true" />
              {g.ayuda}
            </a>
            <Link to="/" className={classes({ variant: 'outline-ink', size: 'lg' })}>
              {g.volver}
            </Link>
          </div>
        </div>
      </section>
    </PaginaSeccion>
  );
}
