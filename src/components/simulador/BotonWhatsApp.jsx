import { useI18n } from '../../i18n/LanguageContext';
import { enlaceWhatsApp } from '../../lib/contacto';
import { Button, classes } from '../ui/Button';

// Abre WhatsApp si VITE_WHATSAPP_ASESOR está configurado; si no, queda inactivo y lo dice en su título
export default function BotonWhatsApp({ mensaje, variant = 'outline-ink', size = 'lg', children, className = '' }) {
  const { t } = useI18n();
  const href = enlaceWhatsApp(mensaje);
  if (!href) {
    return (
      <Button variant={variant} size={size} disabled title={t('sim.res.asesorInactivo')} className={className}>
        {children}
      </Button>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={classes({ variant, size, className })}>
      {children}
    </a>
  );
}
