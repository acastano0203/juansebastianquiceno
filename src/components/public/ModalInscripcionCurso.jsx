import { useEffect, useId, useRef, useState } from 'react';
import { CreditCard, LoaderCircle, Lock, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import { CURSO_CAFE } from '../../config/cursoCafe';
import { iniciarPagoCurso } from '../../services/pagoCurso';
import { Campo, entrada } from '../academia/ModalAgendar';
import { classes } from '../ui/Button';
import { ArrowRight, Close } from '../ui/Icons';

// Paso 1 de la compra: datos de la persona (quedan en el panel aunque no termine de pagar).
// Paso 2: Stripe Checkout, en la página segura de Stripe (aquí nunca se escriben datos de tarjeta).

const correoValido = (c) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.trim());
const CAMPOS = ['nombre', 'correo', 'telefono', 'direccion', 'ciudad', 'pais'];

export default function ModalInscripcionCurso({ onCerrar }) {
  const { t, lang } = useI18n();
  const f = t('curso.inscripcion');
  const id = useId();
  const caja = useRef(null);
  const [datos, setDatos] = useState({ nombre: '', correo: '', telefono: '', direccion: '', ciudad: '', pais: lang === 'en' ? '' : 'Colombia' });
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState('editando'); // editando | enviando | error
  const [errorEnvio, setErrorEnvio] = useState('');

  // Escape cierra, el foco entra al diálogo, Tab no se sale y la página de atrás no se desplaza
  useEffect(() => {
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    caja.current?.querySelector('input')?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'Tab' && caja.current) {
        const foc = [...caja.current.querySelectorAll('button:not([disabled]), input')];
        if (!foc.length) return;
        const [primero, ultimo] = [foc[0], foc[foc.length - 1]];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [onCerrar]);

  const cambiar = (k) => (e) => setDatos((d) => ({ ...d, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const err = {};
    if (datos.nombre.trim().length < 2) err.nombre = f.err.nombre;
    if (!correoValido(datos.correo)) err.correo = f.err.correo;
    const dig = datos.telefono.replace(/\D/g, '').length;
    if (dig < 7 || dig > 15) err.telefono = f.err.telefono;
    if (datos.direccion.trim().length < 4) err.direccion = f.err.direccion;
    if (datos.ciudad.trim().length < 2) err.ciudad = f.err.ciudad;
    if (datos.pais.trim().length < 2) err.pais = f.err.pais;
    setErrores(err);
    const primero = CAMPOS.find((k) => err[k]);
    if (primero) {
      document.getElementById(`${id}-${primero}`)?.focus();
      return;
    }
    setEstado('enviando');
    try {
      const url = await iniciarPagoCurso(datos, lang);
      window.location.assign(url); // a Stripe Checkout
    } catch (ex) {
      setErrorEnvio(f.errEnvio[ex.codigo] || f.errEnvio.stripe);
      setEstado('error');
    }
  };

  const input = (k, props = {}) => (
    <input
      id={`${id}-${k}`}
      value={datos[k]}
      onChange={cambiar(k)}
      placeholder={f.ph[k]}
      aria-invalid={!!errores[k]}
      aria-describedby={errores[k] ? `${id}-${k}-e` : undefined}
      className={entrada(errores[k])}
      {...props}
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(12,39,40,0.72)] md:items-center md:p-6" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        ref={caja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        className="relative flex max-h-[94vh] w-full flex-col gap-5 overflow-y-auto rounded-t-3xl bg-white px-5 pt-6 pb-7 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.35)] animate-[aparecer_.25s_ease-out] md:max-w-[600px] md:rounded-2xl md:p-8"
      >
        <button type="button" onClick={onCerrar} aria-label={f.cerrar} className="absolute top-4 right-4 flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-line-2 text-ink">
          <Close size={18} />
        </button>

        <div className="flex flex-col gap-1.5 pr-12">
          <p className="m-0 text-xs font-semibold tracking-[0.16em] text-clay uppercase">{f.paso}</p>
          <h2 id={`${id}-t`} className="m-0 font-serif text-[26px] leading-[1.15] font-semibold">
            {f.titulo}
          </h2>
          <p className="m-0 text-[15px] text-muted">{f.sub}</p>
        </div>

        {/* Resumen de lo que va a pagar */}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3">
          <span className="text-sm font-semibold">{f.producto}</span>
          <strong className="font-serif text-lg whitespace-nowrap">${CURSO_CAFE.precio.toLocaleString('es-CO')} COP</strong>
        </div>

        <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3">
            <Campo id={`${id}-nombre`} label={f.campos.nombre} error={errores.nombre} className="flex-[1_1_100%]">
              {input('nombre', { type: 'text', autoComplete: 'name' })}
            </Campo>
            <Campo id={`${id}-correo`} label={f.campos.correo} error={errores.correo}>
              {input('correo', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
            </Campo>
            <Campo id={`${id}-telefono`} label={f.campos.telefono} error={errores.telefono}>
              {input('telefono', { type: 'tel', autoComplete: 'tel' })}
            </Campo>
            <Campo id={`${id}-direccion`} label={f.campos.direccion} error={errores.direccion} className="flex-[1_1_100%]">
              {input('direccion', { type: 'text', autoComplete: 'street-address' })}
            </Campo>
            <Campo id={`${id}-ciudad`} label={f.campos.ciudad} error={errores.ciudad}>
              {input('ciudad', { type: 'text', autoComplete: 'address-level2' })}
            </Campo>
            <Campo id={`${id}-pais`} label={f.campos.pais} error={errores.pais}>
              {input('pais', { type: 'text', autoComplete: 'country-name' })}
            </Campo>
          </div>

          {estado === 'error' && (
            <p role="alert" className="m-0 rounded-xl border border-[#B3261E]/30 bg-[#FFF7F6] p-3.5 text-sm text-[#8C1D18]">
              {errorEnvio}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <button type="submit" disabled={estado === 'enviando'} aria-busy={estado === 'enviando'} className={classes({ variant: 'gold', size: 'xl', lift: estado !== 'enviando', className: 'w-full' })}>
              {estado === 'enviando' ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <CreditCard size={20} aria-hidden="true" />}
              {estado === 'enviando' ? f.enviando : f.pagar}
              {estado !== 'enviando' && <ArrowRight />}
            </button>
            <p className="m-0 flex items-center justify-center gap-1.5 text-center text-[13px] text-muted">
              <Lock size={14} aria-hidden="true" />
              {f.seguro}
            </p>
            <p className="m-0 flex items-start justify-center gap-1.5 text-center text-xs text-muted">
              <ShieldCheck size={14} className="mt-px flex-none" aria-hidden="true" />
              {f.privacidad}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
