import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { RUTAS_ACADEMIA } from '../../../config/academia';
import { guardarRegistro, registrarOrigen, registroGuardado } from '../../../services/academia';
import AcademiaHeader from '../../../components/academia/AcademiaHeader';
import { Campo, entrada } from '../../../components/academia/ModalAgendar';
import { Curvas, PasosEmbudo, useArriba } from '../../../components/academia/comun';
import { classes } from '../../../components/ui/Button';
import { LoaderCircle } from 'lucide-react';
import { ArrowRight, ChevronLeft } from '../../../components/ui/Icons';

const INDICATIVOS = ['+57', '+1', '+52', '+507', '+51', '+593', '+504', '+502', '+34'];
// El valor que se guarda es el texto en español, sin importar el idioma de la pantalla
const ROLES = ['Productor', 'Cooperativa', 'Tostador', 'Comercializador', 'Consultor', 'Otro'];
const VOLUMENES = ['Menos de 500 kg', '500 kg a 2 t', 'Más de 2 t', 'Aún no produzco'];
const PAISES = ['Colombia', 'Perú', 'Ecuador', 'México', 'Honduras', 'Guatemala', 'Otro'];

const vacio = { nombre: '', indicativo: '+57', whatsapp: '', correo: '', pais: 'Colombia', rol: '', volumen: '', exporto: '' };

function validar(d, t) {
  const e = {};
  if (d.nombre.trim().length < 2) e.nombre = t('aca.mc.err.nombre');
  const dig = d.whatsapp.replace(/\D/g, '');
  if (d.indicativo === '+57' ? dig.length !== 10 : dig.length < 7 || dig.length > 12) e.whatsapp = d.indicativo === '+57' ? t('aca.mc.err.whatsapp') : t('aca.mc.err.whatsappOtro');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.correo.trim())) e.correo = t('aca.mc.err.correo');
  if (!d.rol) e.rol = t('aca.mc.err.rol');
  if (!d.volumen) e.volumen = t('aca.mc.err.volumen');
  return e;
}

function Chips({ legend, opciones, etiquetas, valor, onCambio, error, columnas = '', opcional = false }) {
  const id = useId();
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" aria-describedby={error ? id + '-e' : undefined}>
      <legend className="pb-2 text-sm font-semibold">{legend}</legend>
      <div className={columnas || 'flex flex-wrap gap-2'}>
        {opciones.map((o, i) => {
          const on = valor === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onCambio(on && opcional ? '' : o)}
              className={
                'min-h-11 cursor-pointer rounded-full px-4 text-sm transition-colors ' +
                (on ? 'border-[1.5px] border-ink bg-ink font-semibold text-white' : 'border border-[#B8CFC0] bg-white font-medium text-ink hover:border-ink')
              }
            >
              {etiquetas[i]}
            </button>
          );
        })}
      </div>
      {error && (
        <p id={id + '-e'} className="m-0 text-[13px] font-medium text-[#B3261E]">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default function Masterclass() {
  useArriba();
  const { t, lang } = useI18n();
  const id = useId();
  const navigate = useNavigate();
  const [d, setD] = useState(() => {
    const p = registroGuardado();
    return p ? { ...vacio, nombre: p.nombre, indicativo: p.indicativo, whatsapp: p.whatsapp, correo: p.correo, pais: p.pais, rol: p.perfil, volumen: p.volumen, exporto: p.exporto || '' } : vacio;
  });
  const [tocados, setTocados] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [estado, setEstado] = useState('listo'); // listo | enviando | error
  useEffect(() => registrarOrigen(), []);

  const errores = validar(d, t);
  const ver = (k) => (enviado || tocados[k] ? errores[k] : undefined);
  const campo = (k) => (v) => setD((x) => ({ ...x, [k]: v }));
  const tocar = (k) => () => setTocados((x) => ({ ...x, [k]: true }));
  const listos = ['nombre', 'whatsapp', 'correo', 'pais', 'rol', 'volumen'].filter((k) => !errores[k]).length;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviado(true);
    if (Object.keys(errores).length) {
      const primero = ['nombre', 'whatsapp', 'correo'].find((k) => errores[k]);
      if (primero) document.getElementById(`${id}-${primero}`)?.focus();
      return;
    }
    setEstado('enviando');
    try {
      await guardarRegistro(d, lang);
      navigate(RUTAS_ACADEMIA.gracias, { state: { nombre: d.nombre.trim().split(/\s+/)[0] } });
    } catch {
      setEstado('error');
    }
  };

  return (
    <div className="relative min-h-screen min-w-0 overflow-hidden bg-ink text-white">
      <Curvas />
      <div className="relative mx-auto max-w-[1200px] px-5 md:px-20">
        <AcademiaHeader />
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <Link to={RUTAS_ACADEMIA.inicio} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-sage no-underline hover:text-white">
            <ChevronLeft size={16} />
            {t('aca.mc.volver')}
          </Link>
          <PasosEmbudo actual={1} />
        </div>

        <div className="flex flex-wrap items-start gap-14 pt-4 pb-16 md:pb-20">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6 animate-[aparecer_.4s_ease-out] md:pt-12">
            <p className="m-0 text-xs font-semibold tracking-[0.18em] text-gold uppercase">{t('aca.mc.eyebrow')}</p>
            <h1 className="m-0 font-serif text-[34px] leading-[1.08] font-semibold text-balance md:text-[52px]">
              {t('aca.mc.t1')}
              <em className="text-gold italic">{t('aca.mc.tEm')}</em>
            </h1>
            <p className="m-0 text-[17px] text-pale">{t('aca.mc.lead')}</p>
            <ol className="m-0 flex list-none flex-col gap-4 p-0 pt-2">
              {t('aca.mc.puntos').map((p, i) => (
                <li key={p} className="flex gap-3.5 text-[15px]">
                  <span className="grid size-7 flex-none place-items-center rounded-full bg-ink-2 text-[13px] font-semibold text-gold">{i + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>

          <form noValidate onSubmit={enviar} className="flex w-full max-w-[520px] min-w-0 flex-[1_1_440px] flex-col gap-[18px] rounded-2xl bg-white p-[22px] text-ink shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-8">
            <div className="flex flex-col gap-2" aria-live="polite">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold">{t('aca.embudo.pasos.1')}</span>
                <span className="text-muted">{t('aca.mc.completo', { n: listos })}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line-2">
                <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${(listos / 6) * 100}%` }} />
              </div>
            </div>

            <Campo id={`${id}-nombre`} label={t('aca.mc.nombre')} error={ver('nombre')} className="">
              <input id={`${id}-nombre`} type="text" autoComplete="name" value={d.nombre} onChange={(e) => campo('nombre')(e.target.value)} onBlur={tocar('nombre')} placeholder={t('aca.mc.nombrePh')} aria-invalid={!!ver('nombre')} aria-describedby={ver('nombre') ? `${id}-nombre-e` : undefined} className={entrada(ver('nombre'))} />
            </Campo>

            <Campo id={`${id}-whatsapp`} label={t('aca.mc.whatsapp')} error={ver('whatsapp')} className="">
              <div className="flex gap-2">
                <select aria-label={t('aca.mc.indicativo')} value={d.indicativo} onChange={(e) => campo('indicativo')(e.target.value)} className="h-12 w-[96px] flex-none rounded-xl border border-[#B8CFC0] bg-white px-2.5 text-[15px] font-medium text-ink">
                  {INDICATIVOS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <input id={`${id}-whatsapp`} type="tel" inputMode="tel" autoComplete="tel-national" value={d.whatsapp} onChange={(e) => campo('whatsapp')(e.target.value)} onBlur={tocar('whatsapp')} placeholder={t('aca.mc.whatsappPh')} aria-invalid={!!ver('whatsapp')} aria-describedby={ver('whatsapp') ? `${id}-whatsapp-e` : undefined} className={entrada(ver('whatsapp')) + ' flex-1'} />
              </div>
            </Campo>

            <div className="flex flex-wrap gap-3">
              <Campo id={`${id}-correo`} label={t('aca.mc.correo')} error={ver('correo')} className="flex-[1_1_200px]">
                <input id={`${id}-correo`} type="email" autoComplete="email" value={d.correo} onChange={(e) => campo('correo')(e.target.value)} onBlur={tocar('correo')} placeholder={t('aca.mc.correoPh')} aria-invalid={!!ver('correo')} aria-describedby={ver('correo') ? `${id}-correo-e` : undefined} className={entrada(ver('correo'))} />
              </Campo>
              <Campo id={`${id}-pais`} label={t('aca.mc.pais')} className="flex-[1_1_160px]">
                <select id={`${id}-pais`} value={d.pais} onChange={(e) => campo('pais')(e.target.value)} className={entrada()}>
                  {PAISES.map((p, i) => (
                    <option key={p} value={p}>{t('aca.mc.paises')[i]}</option>
                  ))}
                </select>
              </Campo>
            </div>

            <Chips legend={t('aca.mc.rol')} opciones={ROLES} etiquetas={t('aca.mc.roles')} valor={d.rol} onCambio={campo('rol')} error={enviado ? errores.rol : undefined} />
            <Chips legend={t('aca.mc.volumen')} opciones={VOLUMENES} etiquetas={t('aca.mc.volumenes')} valor={d.volumen} onCambio={campo('volumen')} error={enviado ? errores.volumen : undefined} />
            <Chips
              legend={`${t('aca.mc.exporto')} (${t('aca.mc.opcional')})`}
              opciones={['Sí', 'No']}
              etiquetas={t('aca.mc.exportoOpc')}
              valor={d.exporto}
              onCambio={campo('exporto')}
              columnas="grid grid-cols-2 gap-2"
              opcional
            />

            <button type="submit" disabled={estado === 'enviando'} aria-busy={estado === 'enviando'} className={classes({ variant: 'gold', size: 'xl', lift: estado !== 'enviando', className: 'mt-1.5 w-full disabled:!opacity-100 disabled:bg-[#E9D395]' })}>
              {estado === 'enviando' ? (
                <>
                  <LoaderCircle size={20} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
                  {t('aca.mc.enviando')}
                </>
              ) : (
                <>
                  {t('aca.mc.enviar')}
                  <ArrowRight />
                </>
              )}
            </button>
            {estado === 'error' && (
              <p role="alert" className="m-0 text-center text-[13px] font-medium text-[#B3261E]">
                {t('aca.mc.err.red')}
              </p>
            )}
            <p className="m-0 text-center text-[13px] text-muted">{t('aca.mc.nota')}</p>
          </form>
        </div>
      </div>
    </div>
  );
}
