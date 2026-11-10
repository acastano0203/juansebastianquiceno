import { useI18n } from '../../i18n/LanguageContext';
import { PARAMS } from '../../config/params';
import { advertenciaIncoterm } from '../../engine/incoterms';
import { valorComercial } from '../../engine/rentabilidad';
import { tasasDe } from '../../engine/costos';
import { conDefectos } from '../../engine/simulacion';
import { formatoDinero } from '../../engine/unidades';
import { Aviso, Campo, Numero, Opciones, Tarjeta, Texto, usarPaises } from './Campos';

const TIPOS = ['IMPORTACION', 'EXPORTACION', 'COMPRA_INTERNACIONAL', 'VENTA_INTERNACIONAL', 'ANALISIS_LOGISTICO'];
const MODALIDADES = ['POR_EVALUAR', 'MARITIMA_FCL', 'MARITIMA_LCL', 'AEREA', 'TERRESTRE', 'COURIER', 'MULTIMODAL'];
const NECESIDADES = ['CONOCER_COSTO', 'PRECIO_VENTA', 'VALIDAR_IMPORTACION', 'EXPORTAR', 'CALCULAR_CARGA', 'COMPARAR_ESCENARIOS'];
const LUGARES = ['planta', 'bodega', 'puerto', 'aeropuerto', 'zona_franca'];
export const CATEGORIAS = ['GENERAL', 'ALIMENTOS', 'BEBIDAS', 'VEGETAL_ANIMAL', 'COSMETICOS', 'ELECTRICO', 'MAQUINARIA', 'USADOS', 'TEXTIL', 'QUIMICO', 'OTRO'];
export const MONEDAS = ['USD', 'COP', 'EUR'];

function BloqueLugar({ titulo, lugar, onCambio, paises }) {
  const { t } = useI18n();
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-2xl border border-line p-3.5">
      <legend className="px-1.5 text-[13px] font-semibold">{titulo}</legend>
      <Campo label={t('sim.op.pais')}>
        <Opciones valor={lugar.pais} vacio={t('sim.op.elegirPais')} opciones={paises} onCambio={(pais) => onCambio({ ...lugar, pais })} />
      </Campo>
      <Campo label={t('sim.op.ciudad')}>
        <Texto valor={lugar.ciudad} onCambio={(ciudad) => onCambio({ ...lugar, ciudad })} />
      </Campo>
      <Campo label={t('sim.op.tipoLugar')}>
        <Opciones valor={lugar.tipo} vacio={t('sim.elegir')} opciones={LUGARES.map((id) => ({ id, label: t('sim.lugar.' + id) }))} onCambio={(tipo) => onCambio({ ...lugar, tipo })} />
      </Campo>
    </fieldset>
  );
}

export default function EtapaOperacion({ s }) {
  const { t, lang } = useI18n();
  const { sim, hoy, actualizarOperacion: cambiar, avisoValor } = s;
  const op = sim.operacion;
  const paises = usarPaises(lang);
  const lista = (ids, ns) => ids.map((id) => ({ id, label: t(`sim.${ns}.${id}`) }));

  const hayProductos = sim.productos.some((p) => p.cantidad > 0 && p.valorUnitario > 0);
  const calculado = hayProductos ? valorComercial(conDefectos(sim), tasasDe(sim, PARAMS)) : null;
  const partidaLimpia = op.partida.replace(/\D/g, '');
  const partidaInvalida = !!op.partida.trim() && (partidaLimpia.length < 4 || partidaLimpia.length > 10);
  const fechaInvalida = !!op.fechaSalida && op.fechaSalida < hoy;
  const mismoLugar = !!op.origen.pais && op.origen.pais === op.destino.pais && !!op.origen.ciudad.trim() && op.origen.ciudad.trim().toLowerCase() === op.destino.ciudad.trim().toLowerCase();
  const matriz = PARAMS.matrizIncoterms[op.incoterm];

  return (
    <Tarjeta className="flex flex-col gap-5">
      <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.op.titulo')}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={t('sim.op.tipo')}>
          <Opciones valor={op.tipo} vacio={t('sim.elegir')} opciones={lista(TIPOS, 'tipoOperacion')} onCambio={(tipo) => cambiar({ tipo })} />
        </Campo>
        <Campo label={t('sim.op.necesidad')}>
          <Opciones valor={op.necesidad} vacio={t('sim.elegir')} opciones={lista(NECESIDADES, 'necesidad')} onCambio={(necesidad) => cambiar({ necesidad })} />
        </Campo>
        <BloqueLugar titulo={t('sim.op.origen')} lugar={op.origen} paises={paises} onCambio={(origen) => cambiar({ origen })} />
        <BloqueLugar titulo={t('sim.op.destino')} lugar={op.destino} paises={paises} onCambio={(destino) => cambiar({ destino })} />
        {mismoLugar && <p role="alert" className="m-0 text-sm text-[#8f3f22] sm:col-span-2">{t('sim.op.igualError')}</p>}
        <Campo label={t('sim.op.modalidad')} ayuda={op.modalidad === 'POR_EVALUAR' ? t('sim.op.modalidadAyuda') : null}>
          <Opciones valor={op.modalidad} vacio={t('sim.elegir')} opciones={lista(MODALIDADES, 'modalidad')} onCambio={(modalidad) => cambiar({ modalidad })} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label={t('sim.op.incoterm')}>
            <Opciones valor={op.incoterm} vacio={t('sim.elegir')} opciones={Object.keys(PARAMS.matrizIncoterms).map((id) => ({ id, label: id }))} onCambio={(incoterm) => cambiar({ incoterm })} />
          </Campo>
          <Campo label={t('sim.op.lugarConvenido')}>
            <Texto valor={op.lugarConvenido} onCambio={(lugarConvenido) => cambiar({ lugarConvenido })} />
          </Campo>
        </div>
      </div>

      {matriz && <Aviso tono="oro" titulo={t('sim.op.ayudaIncoterm', { i: op.incoterm })}>{matriz.ayuda[lang]}</Aviso>}
      {advertenciaIncoterm(op.incoterm, op.modalidad, PARAMS) && (
        <Aviso tono="arcilla">
          {lang === 'en'
            ? `${op.incoterm} is meant for sea or inland waterway transport; consider FCA, CPT or CIP.`
            : `${op.incoterm} es propio del transporte marítimo o fluvial; considere FCA, CPT o CIP.`}
        </Aviso>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <Campo label={t('sim.op.moneda')}>
            <Opciones valor={op.moneda} vacio={t('sim.elegir')} opciones={MONEDAS.map((id) => ({ id, label: id }))} onCambio={(moneda) => cambiar({ moneda })} />
          </Campo>
          <Campo label={t('sim.op.valor')} ayuda={calculado != null ? t('sim.op.valorCalculado', { v: formatoDinero(calculado, op.moneda, lang) }) : null}>
            {calculado != null ? (
              <input className="field w-full bg-mist" readOnly value={formatoDinero(calculado, op.moneda, lang)} />
            ) : (
              <Numero valor={op.valorEstimado} onCambio={(valorEstimado) => cambiar({ valorEstimado })} />
            )}
          </Campo>
        </div>
        <Campo label={t('sim.op.fecha')} error={fechaInvalida ? t('sim.op.fechaError') : null}>
          <input type="date" className="field w-full bg-white" min={hoy} value={op.fechaSalida ?? ''} onChange={(e) => cambiar({ fechaSalida: e.target.value || null })} />
        </Campo>
        <Campo label={t('sim.op.tipoProducto')}>
          <Opciones valor={op.tipoProducto} vacio={t('sim.elegir')} opciones={lista(CATEGORIAS, 'categoria')} onCambio={(tipoProducto) => cambiar({ tipoProducto })} />
        </Campo>
        <Campo label={t('sim.op.partida')} error={partidaInvalida ? t('sim.op.partidaError') : null} ayuda={t('sim.op.partidaAyuda')}>
          <Texto valor={op.partida} inputMode="numeric" onCambio={(partida) => cambiar({ partida })} />
        </Campo>
      </div>

      {avisoValor != null && calculado != null && <Aviso tono="azul">{t('sim.op.valorReemplazado', { v: formatoDinero(avisoValor, op.moneda, lang) })}</Aviso>}
      <Aviso tono="menta">{PARAMS.textosLegales.datos[lang]}</Aviso>
    </Tarjeta>
  );
}
