import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { useCubicaje } from '../../../data/useCubicajes';
import { useLeads } from '../../../data/LeadsContext';
import { cubicajesRepo, totalCajas } from '../../../data/cubicajesRepo';
import { CONTENEDORES } from '../../../cubicaje/config';
import { calcularAsync } from '../../../cubicaje/calcular';
import { fechaConAnio, num } from '../../../lib/format';
import { Button, ButtonLink } from '../../../components/ui/Button';
import { Alert, Check, Copy, Download, Pen } from '../../../components/ui/Icons';
import VisorCubicaje from '../../../components/cubicaje/VisorCubicaje';
import { ResumenPanel, TablaProductos } from '../../../components/cubicaje/ResumenCubicaje';
import { EstadoBadge } from '../../../components/cubicaje/CubicajeUI';


// Siguiente contenedor con más volumen que el actual (para la sugerencia del error)
function contenedorMayor(actual) {
  const lista = Object.values(CONTENEDORES).sort((a, b) => a.largo * a.ancho * a.alto - b.largo * b.ancho * b.alto);
  const i = lista.findIndex((c) => c.id === actual);
  return i >= 0 ? lista[i + 1] || null : null;
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export default function DetalleCubicaje() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { cubicaje: inicial, cargando: leyendo } = useCubicaje(id);
  const { leads } = useLeads();
  const [c, setC] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [errorCalc, setErrorCalc] = useState(false);
  const [recien, setRecien] = useState(false);
  const [toast, setToast] = useState('');
  const [captura, setCaptura] = useState(null);
  const apiRef = useRef(null);
  const enCurso = useRef(null);
  const timer = useRef();

  useEffect(() => setC(inicial), [inicial]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const avisar = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3500);
  };

  // Sin resultado guardado (recién creado o editado): se calcula una vez y se guarda
  const calcular = useCallback(async (cub) => {
    if (enCurso.current === cub.id) return;
    enCurso.current = cub.id;
    setCalculando(true);
    setErrorCalc(false);
    try {
      const [resultado] = await Promise.all([calcularAsync(cub.tipoContenedor, cub.productos), espera(700)]);
      const guardado = await cubicajesRepo.guardar({ ...cub, resultado });
      setC(guardado);
      setRecien(true);
    } catch {
      setErrorCalc(true);
    } finally {
      enCurso.current = null;
      setCalculando(false);
    }
  }, []);

  useEffect(() => {
    if (c && !c.resultado && c.productos.length) calcular(c);
  }, [c, calcular]);

  // La captura del visor se pinta solo al imprimir; después se limpia
  useEffect(() => {
    if (!captura) return undefined;
    const titulo = document.title;
    document.title = 'Cubicaje_' + c.nombre.replace(/[^\p{L}\p{N}]+/gu, '_');
    const id = setTimeout(() => {
      window.print();
      document.title = titulo;
      setCaptura(null);
    }, 50);
    return () => clearTimeout(id);
  }, [captura, c]);

  if (leyendo || (!c && inicial)) return null;
  if (!c) return <p className="m-0 text-muted">{t('cub.detalle.noEncontrado')}</p>;

  const r = c.resultado;
  const procesando = calculando || (!r && !errorCalc);
  const estado = procesando ? 'procesando' : c.estado;
  const fuera = r?.noColocadas || [];
  const mayor = contenedorMayor(c.tipoContenedor);
  const volTotal = c.productos.reduce((s, p) => s + (p.largo * p.ancho * p.alto * p.cantidad) / 1e6, 0);
  const volFuera = fuera.reduce((s, n) => {
    const p = c.productos.find((q) => q.id === n.productoId);
    return s + (p ? (p.largo * p.ancho * p.alto * n.cantidad) / 1e6 : 0);
  }, 0);

  const duplicar = async () => {
    const nombre = t('cub.detalle.copia', { n: c.nombre });
    const copia = await cubicajesRepo.guardar({ ...c, id: undefined, createdAt: undefined, nombre, origen: 'admin', prospectoId: null });
    navigate(`/admin/cubicaje/${copia.id}`);
    avisar(t('cub.detalle.copiaCreada', { n: nombre }));
  };

  const exportar = () => setCaptura({ img: apiRef.current?.capturar() || null });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <nav aria-label="Ruta" className="no-print flex gap-2 text-sm text-muted">
            <Link to="/admin/cubicaje/lista" className="text-muted">
              {t('cub.migas')}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate">{c.nombre}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 font-serif text-[28px] leading-[1.1] font-semibold md:text-[36px]">{c.nombre}</h1>
<EstadoBadge estado={estado} />
          </div>
          <span className="text-[13px] text-muted">
            {t('cub.detalle.creado', { f: fechaConAnio(c.createdAt, lang), cont: CONTENEDORES[c.tipoContenedor]?.nombre, n: c.productos.length })} · {t('cub.origen.' + c.origen)}
          </span>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <ButtonLink to={`/admin/cubicaje/${c.id}/editar`} variant="outline-ink" size="md">
            <Pen size={16} />
            {t('cub.detalle.editar')}
          </ButtonLink>
          <Button variant="outline-ink" size="md" onClick={duplicar}>
            <Copy size={16} />
            {t('cub.detalle.duplicar')}
          </Button>
          <Button variant="gold" size="md" onClick={exportar} disabled={procesando}>
            <Download size={16} />
            {t('cub.detalle.exportar')}
          </Button>
        </div>
      </div>

      {c.contacto && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[24px_24px_24px_4px] bg-white px-6 py-4 text-sm">
          <span className="font-semibold">{t('cub.marca.generadoPor', { n: c.contacto.nombre })}</span>
          <a href={`https://wa.me/${c.contacto.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-ink">
            {c.contacto.whatsapp}
          </a>
          {c.contacto.correo && (
            <a href={`mailto:${c.contacto.correo}`} className="text-ink">
              {c.contacto.correo}
            </a>
          )}
          {leads.some((l) => l.id === c.prospectoId) && (
            <Link to={`/admin/prospectos/${c.prospectoId}`} className="no-print ml-auto font-semibold">
              {t('cub.marca.verProspecto')}
            </Link>
          )}
        </div>
      )}

      {toast && (
        <div role="status" className="no-print flex items-center gap-3 rounded-2xl bg-ink px-[18px] py-3.5 text-sm text-white">
          <Check size={16} />
          {toast}
        </div>
      )}

      {recien && (
        <div role="status" className="no-print flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-[#DCEBDC] px-[18px] py-3.5 text-sm text-[#1E4D2B]">
          <Check size={16} />
          <span className="flex-1">{t('cub.detalle.guardado')}</span>
          <Link to="/admin/cubicaje/lista" className="font-semibold text-[#1E4D2B]">
            {t('cub.detalle.verLista')}
          </Link>
        </div>
      )}

      {errorCalc && (
        <div role="alert" className="no-print flex flex-wrap items-center gap-4 rounded-[24px_24px_24px_4px] bg-clay-bg px-6 py-5 text-clay-ink">
          <span className="flex-1 text-sm">{t('cub.detalle.errorCalculo')}</span>
          <Button variant="outline-ink" size="md" onClick={() => calcular(c)}>
            {t('cub.detalle.reintentar')}
          </Button>
        </div>
      )}

      {!procesando && fuera.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[24px_24px_24px_4px] bg-clay-bg px-6 py-5">
          <span aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-[0_24px_0_24px] bg-clay-dark text-white">
            <Alert size={22} />
          </span>
          <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-1 text-clay-ink">
            <strong className="text-[17px] font-semibold">{t('cub.detalle.errorT')}</strong>
            <span className="text-sm leading-normal">
              {t('cub.detalle.errorResumen', {
                lista: fuera.map((n) => t('cub.detalle.errorLinea', { n: num(n.cantidad, 0, lang), p: n.nombre }) + ` (${t('cub.detalle.motivos.' + n.motivo)})`).join(', '),
                vol: num(volFuera, 2, lang),
                total: num(volTotal, 1, lang),
                cont: r.contenedor.nombre,
                cap: num(r.metricas.volumenContenedor, 1, lang),
              })}
            </span>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            {mayor && (
              <ButtonLink to={`/admin/cubicaje/${c.id}/editar`} state={{ tipoContenedor: mayor.id }} variant="ink" size="md">
                {t('cub.detalle.cambiarA', { c: mayor.nombre })}
              </ButtonLink>
            )}
            <ButtonLink to={`/admin/cubicaje/${c.id}/editar`} variant="outline-ink" size="md">
              {t('cub.detalle.ajustar')}
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-stretch gap-5">
        <VisorCubicaje
          className="min-w-0 flex-[999_1_560px]"
          resultado={procesando ? null : r}
          productos={c.productos}
          cargando={procesando}
          animar={recien}
          apiRef={apiRef}
          cargandoInfo={{ nProductos: c.productos.length, nCajas: totalCajas(c), contenedor: CONTENEDORES[c.tipoContenedor]?.nombre }}
        />
        {captura?.img && <img src={captura.img} alt="" className="hidden w-full rounded-2xl print:block" />}
        <ResumenPanel cubicaje={c} cargando={procesando} className="flex-[1_1_300px]" />
      </div>

      <TablaProductos cubicaje={c} cargando={procesando} />
    </>
  );
}
