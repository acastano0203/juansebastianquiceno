import { useI18n } from '../../i18n/LanguageContext';
import { formatoDinero } from '../../engine/unidades';
import { Button } from '../ui/Button';
import { Copy, Plus, Trash } from '../ui/Icons';
import { Aviso, Campo, Chips, Numero, Opciones, Tarjeta, Texto, usarPaises } from './Campos';
import { CATEGORIAS, MONEDAS } from './EtapaOperacion';
import { nuevoId, nuevoProducto } from './useSimulacion';

const UNIDADES = ['unidad', 'kg', 'litro', 'm', 'm2', 'par', 'docena', 'caja'];
export const EMPAQUES = ['CAJA', 'SACO', 'PALLET', 'ESTIBA', 'BIG_BAG', 'TAMBOR', 'PIEZA', 'OTRO'];
const REQUISITOS = ['ALIMENTOS', 'PERECEDERO', 'REFRIGERADO', 'PELIGROSO', 'FRAGIL', 'SOBREDIMENSIONADO', 'ALTO_VALOR', 'SANITARIO', 'ELECTRICO', 'COSMETICOS', 'MAQUINARIA', 'OTRO'];

export default function EtapaProducto({ s }) {
  const { t, lang } = useI18n();
  const { sim, actualizar, vivo, setAvisoValor } = s;
  const paises = usarPaises(lang);
  const lista = (ids, ns) => ids.map((id) => ({ id, label: t(`sim.${ns}.${id}`) }));

  // RN-PRO-03: si el usuario escribió otro valor en la Etapa 1, se reemplaza y se le avisa
  const cambiar = (id, cambios) => {
    const productos = sim.productos.map((p) => (p.id === id ? { ...p, ...cambios } : p));
    const anterior = sim.operacion.valorEstimado;
    const reemplaza = anterior != null && productos.some((p) => p.cantidad > 0 && p.valorUnitario > 0);
    if (reemplaza) setAvisoValor(anterior);
    actualizar((sm) => ({
      ...sm,
      productos: sm.productos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
      operacion: reemplaza ? { ...sm.operacion, valorEstimado: null } : sm.operacion,
    }));
  };

  const eliminar = (p) => {
    const asociadas = sim.referencias.filter((r) => r.productoId === p.id).length;
    if (asociadas && !window.confirm(t('sim.prod.confirmarEliminar', { n: asociadas }))) return;
    actualizar((sm) => ({ ...sm, productos: sm.productos.filter((x) => x.id !== p.id), referencias: sm.referencias.filter((r) => r.productoId !== p.id) }));
  };

  const regulatorias = vivo.alertas.filter((a) => a.tipo === 'REGULATORIA');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.prod.titulo')}</h1>
        <Button variant="outline-ink" onClick={() => actualizar((sm) => ({ ...sm, productos: [...sm.productos, nuevoProducto(sm.productos.length + 1)] }))}>
          <Plus size={16} />
          {t('sim.prod.anadir')}
        </Button>
      </div>

      {sim.productos.length === 0 && <Aviso tono="menta">{t('sim.prod.vacio')}</Aviso>}

      {sim.productos.map((p, i) => (
        <Tarjeta key={p.id} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label={t('sim.prod.nombre')}>
              <Texto valor={p.nombre} maxLength={120} placeholder={t('sim.prod.nombreDefecto', { n: i + 1 })} onCambio={(nombre) => cambiar(p.id, { nombre })} />
            </Campo>
            <Campo label={t('sim.prod.categoria')}>
              <Opciones valor={p.categoria} vacio={t('sim.elegir')} opciones={lista(CATEGORIAS, 'categoria')} onCambio={(categoria) => cambiar(p.id, { categoria })} />
            </Campo>
            <Campo label={t('sim.prod.paisOrigen')}>
              <Opciones valor={p.paisOrigen} vacio={t('sim.op.elegirPais')} opciones={paises} onCambio={(paisOrigen) => cambiar(p.id, { paisOrigen })} />
            </Campo>
            <Campo label={t('sim.prod.empaque')}>
              <Opciones valor={p.empaque} vacio={t('sim.elegir')} opciones={lista(EMPAQUES, 'empaque')} onCambio={(empaque) => cambiar(p.id, { empaque })} />
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label={t('sim.prod.cantidad')}>
                <Numero valor={p.cantidad || null} onCambio={(cantidad) => cambiar(p.id, { cantidad: cantidad ?? 0 })} />
              </Campo>
              <Campo label={t('sim.prod.unidad')}>
                <Opciones valor={p.unidad} vacio={t('sim.elegir')} opciones={lista(UNIDADES, 'unidad')} onCambio={(unidad) => cambiar(p.id, { unidad })} />
              </Campo>
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-3">
              <Campo label={t('sim.prod.valorUnitario')}>
                <Numero valor={p.valorUnitario || null} onCambio={(valorUnitario) => cambiar(p.id, { valorUnitario: valorUnitario ?? 0 })} />
              </Campo>
              <Campo label={t('sim.prod.moneda')}>
                <Opciones valor={p.moneda} vacio={t('sim.elegir')} opciones={MONEDAS.map((id) => ({ id, label: id }))} onCambio={(moneda) => cambiar(p.id, { moneda })} />
              </Campo>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">{t('sim.prod.requisitos')}</span>
            <Chips label={t('sim.prod.requisitos')} opciones={lista(REQUISITOS, 'requisito')} seleccion={p.requisitos} onCambio={(requisitos) => cambiar(p.id, { requisitos })} />
          </div>

          <details className="rounded-2xl border border-line px-4 py-3 text-sm">
            <summary className="min-h-7 cursor-pointer font-semibold">
              {t('sim.prod.descripcion')} · {t('sim.prod.marca')} · {t('sim.prod.uso')}
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Campo label={t('sim.prod.descripcion')} className="sm:col-span-2">
                <textarea className="field w-full bg-white py-3" rows={2} maxLength={1000} value={p.descripcion} onChange={(e) => cambiar(p.id, { descripcion: e.target.value })} />
              </Campo>
              <Campo label={t('sim.prod.marca')}>
                <Texto valor={p.marca} onCambio={(marca) => cambiar(p.id, { marca })} />
              </Campo>
              <Campo label={t('sim.prod.uso')}>
                <Texto valor={p.uso} onCambio={(uso) => cambiar(p.id, { uso })} />
              </Campo>
              <Campo label={t('sim.prod.certificaciones')} className="sm:col-span-2">
                <Texto valor={p.certificaciones} onCambio={(certificaciones) => cambiar(p.id, { certificaciones })} />
              </Campo>
            </div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-3">
            <span className="text-sm">
              {t('sim.prod.total')}: <strong className="font-semibold">{formatoDinero(p.cantidad * p.valorUnitario, p.moneda, lang)}</strong>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => actualizar((sm) => ({ ...sm, productos: [...sm.productos, { ...p, id: nuevoId() }] }))}>
                <Copy size={14} />
                {t('sim.prod.duplicar')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => eliminar(p)}>
                <Trash size={14} />
                {t('sim.prod.eliminar')}
              </Button>
            </div>
          </div>
        </Tarjeta>
      ))}

      {regulatorias.length > 0 && (
        <Aviso tono="azul" titulo={`${t('sim.prod.revision')}:`}>
          <ul className="m-0 mt-1 flex list-disc flex-col gap-1 pl-5">
            {regulatorias.map((a) => (
              <li key={a.id}>{a.texto[lang]}</li>
            ))}
          </ul>
        </Aviso>
      )}
    </div>
  );
}
