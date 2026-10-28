import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { useLeads } from '../../data/LeadsContext';
import { cubicajesRepo, usaSupabase } from '../../data/cubicajesRepo';
import { CONTENEDOR_DEFAULT } from '../../cubicaje/config';
import { fechaConAnio } from '../../lib/format';
import SiteHeader from '../../components/public/SiteHeader';
import SiteFooter from '../../components/public/SiteFooter';
import { Button, ButtonLink } from '../../components/ui/Button';
import { ArrowRight, Check, Download } from '../../components/ui/Icons';
import CubicajeEditor from '../../components/cubicaje/CubicajeEditor';
import { ResumenPanel, TablaProductos } from '../../components/cubicaje/ResumenCubicaje';
import { useCubicajeEnVivo } from '../../components/cubicaje/useCubicajeEnVivo';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactoDialog({ inicial, onEnviar, onCerrar, enviando, error }) {
  const { t } = useI18n();
  const ref = useRef();
  const [f, setF] = useState({ nombre: '', whatsapp: '', correo: '', acepto: false, ...inicial });
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const close = () => onCerrar();
    d.addEventListener('close', close);
    return () => d.removeEventListener('close', close);
  }, [onCerrar]);

  const err = {
    nombre: f.nombre.trim().length < 2 && t('cub.pub.errNombre'),
    whatsapp: !/^\+?[\d\s().-]{7,20}$/.test(f.whatsapp.trim()) || f.whatsapp.replace(/\D/g, '').length < 7 ? t('cub.pub.errWhatsapp') : null,
    correo: f.correo.trim() && !CORREO.test(f.correo.trim()) ? t('cub.pub.errCorreo') : null,
    acepto: !f.acepto && t('cub.pub.errAcepto'),
  };
  const valido = !Object.values(err).some(Boolean);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const campo = (k, label, props = {}) => (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
      {label}
      <input className="field" value={f[k]} onChange={set(k)} aria-invalid={tocado && !!err[k]} {...props} />
      {tocado && err[k] && <span className="text-xs font-normal text-clay-dark">{err[k]}</span>}
    </label>
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby="contacto-titulo"
      className="m-auto w-[min(480px,calc(100%-24px))] rounded-[32px_32px_32px_6px] border-0 bg-white p-0 text-ink backdrop:bg-[rgba(9,28,29,0.55)]"
      onClick={(e) => {
        if (e.target === ref.current) ref.current.close();
      }}
    >
      <form
        noValidate
        className="flex flex-col gap-4 p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          setTocado(true);
          if (valido && !enviando) onEnviar({ nombre: f.nombre.trim(), whatsapp: f.whatsapp.trim(), correo: f.correo.trim() });
        }}
      >
        <div className="flex flex-col gap-1.5">
          <h2 id="contacto-titulo" className="m-0 font-serif text-[26px] leading-[1.15] font-semibold">
            {t('cub.pub.contactoT')}
          </h2>
          <p className="m-0 text-sm leading-normal text-muted">{t('cub.pub.contactoD')}</p>
        </div>
        {campo('nombre', t('cub.pub.nombre'), { autoComplete: 'name', maxLength: 80, autoFocus: true })}
        {campo('whatsapp', t('cub.pub.whatsapp'), { type: 'tel', autoComplete: 'tel', inputMode: 'tel', maxLength: 20, placeholder: t('cub.pub.whatsappPh') })}
        {campo('correo', t('cub.pub.correo'), { type: 'email', autoComplete: 'email', maxLength: 120 })}
        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-normal">
          <input type="checkbox" checked={f.acepto} onChange={set('acepto')} className="m-0 mt-0.5 size-5 flex-none accent-ink" />
          <span>
            {t('cub.pub.acepto')}
            {tocado && err.acepto && <span className="block text-xs text-clay-dark">{err.acepto}</span>}
          </span>
        </label>
        {error && (
          <p role="alert" className="m-0 rounded-2xl bg-clay-bg px-4 py-3 text-[13px] text-clay-ink">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2.5 pt-1">
          <Button variant="outline" size="md" className="min-h-12" onClick={() => ref.current.close()}>
            {t('cub.modal.cancelar')}
          </Button>
          <Button type="submit" variant="gold" size="md" className="min-h-12" disabled={enviando}>
            <Download size={16} />
            {enviando ? t('cub.pub.guardando') : t('cub.pub.generarPdf')}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

// Lo que sale en el PDF (solo visible al imprimir)
function VistaImpresion({ cubicaje, contacto, imagen }) {
  const { t, lang } = useI18n();
  const c = cubicaje.resultado.contenedor;
  return (
    <div className="hidden flex-col gap-5 p-2 text-ink print:flex">
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="text-xs font-semibold tracking-[0.2em]">JUAN SEBASTIÁN QUICENO</span>
        <span className="text-xs text-muted">{t('brand.sub')}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-clay">{t('cub.pub.pdfTitulo')}</span>
        <h1 className="m-0 font-serif text-[30px] font-semibold">{cubicaje.nombre}</h1>
        <span className="text-sm text-muted">
          {t('cub.pub.pdfPara', { n: contacto.nombre })} · {t('cub.pub.pdfFecha', { f: fechaConAnio(new Date(), lang) })} · {c.nombre} ({c.largo} × {c.ancho} × {c.alto} cm)
        </span>
      </div>
      {imagen && (
        <figure className="m-0 flex flex-col gap-1.5">
          <img src={imagen} alt={t('cub.pub.pdfVista')} className="w-full rounded-2xl border border-line" />
        </figure>
      )}
      <ResumenPanel cubicaje={cubicaje} />
      <TablaProductos cubicaje={cubicaje} />
      <p className="m-0 text-xs text-muted">{t('cub.pub.pdfPie')}</p>
    </div>
  );
}

export default function CubicajePublico() {
  const { t, lang } = useI18n();
  const { leads, registrarCubicaje } = useLeads();
  const [params] = useSearchParams();
  // Desde la confirmación del diagnóstico llega el id del prospecto para no volver a pedir los datos
  const leadDiag = leads.find((l) => l.id === params.get('p')) || null;

  const [valor, setValor] = useState({ nombre: '', tipoContenedor: CONTENEDOR_DEFAULT, productos: [] });
  const { resultado, calculando, version } = useCubicajeEnVivo(valor.tipoContenedor, valor.productos);
  const apiRef = useRef(null);
  const [dialogo, setDialogo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [guardado, setGuardado] = useState(null); // { id, clave, contacto, cubicaje }
  const [imprimir, setImprimir] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const clave = JSON.stringify([valor.tipoContenedor, valor.productos, valor.nombre.trim()]);
  const cerrarDialogo = useCallback(() => setDialogo(false), []);

  // Imprime cuando la vista del PDF ya está en pantalla
  useEffect(() => {
    if (!imprimir) return undefined;
    const titulo = document.title;
    document.title = 'Cubicaje_' + imprimir.cubicaje.nombre.replace(/[^\p{L}\p{N}]+/gu, '_');
    const id = setTimeout(() => {
      window.print();
      document.title = titulo;
    }, 80);
    return () => clearTimeout(id);
  }, [imprimir]);

  const descargar = () => {
    // Sin cambios desde el último guardado: solo vuelve a abrir el PDF
    if (guardado && guardado.clave === clave) {
      setImprimir({ ...guardado, imagen: apiRef.current?.capturar() || null, n: Date.now() });
      return;
    }
    setError(null);
    setDialogo(true);
  };

  const enviar = async (contacto) => {
    setEnviando(true);
    setError(null);
    const nombre = valor.nombre.trim() || t('cub.nombreDefault', { f: fechaConAnio(new Date(), lang) });
    try {
      const g = await cubicajesRepo.crearPublico({
        id: !usaSupabase ? guardado?.id : undefined,
        nombre,
        tipoContenedor: valor.tipoContenedor,
        productos: valor.productos,
        resultado,
        contacto,
        prospectoId: leadDiag?.id || null,
      });
      const leadId = registrarCubicaje({ leadId: leadDiag?.id, ...contacto });
      // En modo local el prospecto vive en este navegador: se enlaza directo
      if (!usaSupabase && g.prospectoId !== leadId) await cubicajesRepo.guardar({ ...g, prospectoId: leadId });
      const cubicaje = { nombre, productos: valor.productos, resultado: g.resultado || resultado };
      const nuevo = { id: g.id, clave, contacto, cubicaje };
      setGuardado(nuevo);
      setDialogo(false);
      setImprimir({ ...nuevo, imagen: apiRef.current?.capturar() || null, n: Date.now() });
    } catch (e) {
      setError(e.status === 429 ? t('cub.pub.errLimite') : t('cub.pub.errGuardar'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <div className="min-w-0 bg-mist text-ink print:hidden">
        <div className="rounded-br-[80px] bg-ink text-white md:rounded-br-[140px]">
          <div className="mx-auto max-w-[1240px] px-[22px] pb-14 md:px-10 md:pb-20">
            <SiteHeader />
            <div className="flex max-w-[760px] flex-col gap-4 pt-6 md:pt-10">
              <span className="text-sm font-semibold tracking-[0.08em] text-gold uppercase">{t('cub.pub.eyebrow')}</span>
              <h1 className="m-0 font-serif text-[40px] leading-[1.05] font-semibold tracking-[-0.015em] md:text-[56px]">
                {t('cub.pub.titulo')}
                <em className="font-normal text-gold">{t('cub.pub.tituloEm')}</em>
              </h1>
              <p className="m-0 text-[17px] leading-[1.6] text-pale">{t('cub.pub.lead')}</p>
            </div>
          </div>
        </div>

        <main className="mx-auto box-border flex max-w-[1240px] flex-col gap-[22px] px-[22px] py-10 md:px-10 md:py-14">
          {guardado && guardado.clave === clave && (
            <div role="status" className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[24px_24px_24px_4px] bg-[#DCEBDC] px-6 py-5 text-[#1E4D2B]">
              <Check size={22} />
              <div className="flex min-w-0 flex-[999_1_320px] flex-col gap-1">
                <strong className="text-[17px] font-semibold">{t('cub.pub.guardadoT')}</strong>
                <span className="text-sm leading-normal">{t('cub.pub.guardadoD')}</span>
              </div>
              <ButtonLink to="/diagnostico" variant="ink" size="md">
                {t('cub.pub.agendar')}
                <ArrowRight />
              </ButtonLink>
            </div>
          )}

          <CubicajeEditor
            variante="diagnostico"
            valor={valor}
            onChange={setValor}
            resultado={resultado}
            calculando={calculando}
            version={version}
            apiRef={apiRef}
            acciones={
              resultado && (
                <div className="flex flex-col gap-2">
                  <Button variant="gold" size="xl" className="w-full" onClick={descargar} disabled={calculando}>
                    <Download />
                    {guardado && guardado.clave === clave ? t('cub.pub.otraVez') : t('cub.pub.descargar')}
                  </Button>
                  <span className="text-center text-xs leading-normal text-muted">{t('cub.pub.descargarNota')}</span>
                </div>
              )
            }
          />

          <p className="m-0 text-sm text-muted">
            <Link to="/diagnostico">{t('cub.pub.agendar')}</Link>
          </p>
        </main>
        <SiteFooter />
      </div>

      {imprimir && <VistaImpresion key={imprimir.n} cubicaje={imprimir.cubicaje} contacto={imprimir.contacto} imagen={imprimir.imagen} />}

      {dialogo && (
        <ContactoDialog
          inicial={leadDiag ? { nombre: leadDiag.nombre, whatsapp: leadDiag.whatsapp || '', correo: leadDiag.correo || '' } : undefined}
          onEnviar={enviar}
          onCerrar={cerrarDialogo}
          enviando={enviando}
          error={error}
        />
      )}
    </>
  );
}
