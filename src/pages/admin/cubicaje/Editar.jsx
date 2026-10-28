import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useI18n } from '../../../i18n/LanguageContext';
import { CONTENEDOR_DEFAULT } from '../../../cubicaje/config';
import { cubicajesRepo } from '../../../data/cubicajesRepo';
import { useCubicaje } from '../../../data/useCubicajes';
import { fechaConAnio } from '../../../lib/format';
import { ButtonLink } from '../../../components/ui/Button';
import { ArrowRight } from '../../../components/ui/Icons';
import CubicajeEditor, { PasosIndicador } from '../../../components/cubicaje/CubicajeEditor';
import { useCubicajeEnVivo } from '../../../components/cubicaje/useCubicajeEnVivo';

// Formulario con cálculo y guardado automáticos: al añadir o cambiar productos se genera el cubicaje y se guarda en la lista
function EditorAutoguardado({ inicial, tipoSugerido }) {
  const { t, lang } = useI18n();
  const [valor, setValor] = useState(() =>
    inicial
      ? { nombre: inicial.nombre, tipoContenedor: tipoSugerido || inicial.tipoContenedor, productos: inicial.productos }
      : { nombre: '', tipoContenedor: CONTENEDOR_DEFAULT, productos: [] },
  );
  const { resultado, calculando, version } = useCubicajeEnVivo(valor.tipoContenedor, valor.productos, inicial?.resultado || null);
  const [guardado, setGuardado] = useState(inicial ? 'guardado' : null);
  const [id, setId] = useState(inicial?.id || null);
  const creado = useRef(inicial?.createdAt);
  const ultimo = useRef(`${version}|${valor.nombre}`);

  useEffect(() => {
    // Espera a que el resultado corresponda a los productos actuales; sin productos no crea nada nuevo
    if (calculando || (!id && !valor.productos.length)) return undefined;
    const clave = `${version}|${valor.nombre}`;
    if (clave === ultimo.current) return undefined;
    const timer = setTimeout(async () => {
      ultimo.current = clave;
      setGuardado('guardando');
      const nombre = valor.nombre.trim() || t('cub.nombreDefault', { f: fechaConAnio(new Date(), lang) });
      if (!valor.nombre.trim()) setValor((v) => ({ ...v, nombre }));
      try {
        const g = await cubicajesRepo.guardar({
          ...(inicial || {}),
          id,
          createdAt: creado.current,
          nombre,
          tipoContenedor: valor.tipoContenedor,
          productos: valor.productos,
          resultado: valor.productos.length ? resultado : null,
        });
        creado.current = g.createdAt;
        setId(g.id);
        setGuardado('guardado');
      } catch {
        setGuardado('error');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [calculando, version, valor, resultado, id, inicial, t, lang]);

  const titulo = inicial ? t('cub.editar') : t('cub.nuevo');
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Ruta" className="flex gap-2 text-sm text-muted">
            <Link to="/admin/cubicaje/lista" className="text-muted">
              {t('cub.migas')}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{inicial ? valor.nombre || titulo : titulo}</span>
          </nav>
          <h1 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold md:text-[40px]">{titulo}</h1>
        </div>
        <PasosIndicador nombreOk={!!valor.nombre.trim()} conProductos={valor.productos.length > 0} conResultado={!!resultado} />
      </div>
      <CubicajeEditor
        valor={valor}
        onChange={setValor}
        resultado={resultado}
        calculando={calculando}
        version={version}
        estadoGuardado={guardado}
        acciones={
          id &&
          resultado && (
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink to={`/admin/cubicaje/${id}`} variant="gold" size="lg" className="flex-1">
                {t('cub.resultado.verDetalle')}
                <ArrowRight />
              </ButtonLink>
              <ButtonLink to="/admin/cubicaje/lista" variant="outline-ink" size="lg">
                {t('cub.resultado.verLista')}
              </ButtonLink>
            </div>
          )
        }
      />
    </>
  );
}

export default function EditarCubicaje() {
  const { id } = useParams();
  const { t } = useI18n();
  const { state } = useLocation();
  const { cubicaje, cargando } = useCubicaje(id);

  if (!id) return <EditorAutoguardado key="nuevo" />;
  if (cargando) return null;
  if (!cubicaje) return <p className="m-0 text-muted">{t('cub.detalle.noEncontrado')}</p>;
  // Desde el error "La carga excede el contenedor" se puede llegar con otro contenedor sugerido
  return <EditorAutoguardado key={cubicaje.id} inicial={cubicaje} tipoSugerido={state?.tipoContenedor} />;
}
