import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/LanguageContext';
import { PAISES_DESTINO, UMBRALES_MODALIDAD } from '../../../config/asistente/asistente.config';
import { PARTIDAS_CAFE } from '../../../config/asistente/partidas';
import { formatoNumero } from '../../../engine/unidades';
import { preguntaUrgencia } from '../../../engine/asistente/reglas';
import { Numero, Tarjeta, Texto } from '../Campos';
import { ChipInfo, ConUnidad, Pregunta, SelectBuscable, Tarjetas } from './Pregunta';

export function usePaisesDestino(lang) {
  return useMemo(() => {
    const nombres = new Intl.DisplayNames([lang], { type: 'region' });
    return PAISES_DESTINO.map((id) => ({ id, label: nombres.of(id) })).sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [lang]);
}

// ---------- Paso 1: destino ----------
export function PasoDestino({ s }) {
  const { t, lang } = useI18n();
  const { respuestas: r, responder } = s;
  const paises = usePaisesDestino(lang);
  const destino = (cambios) => responder((x) => ({ ...x, destino: { ...x.destino, ...cambios } }));
  return (
    <Tarjeta className="flex flex-col gap-7">
      <Pregunta principal id="q-pais" titulo={t('asi.destino.pais')} ayuda={t('asi.destino.paisAyuda')}>
        <SelectBuscable label={t('asi.destino.pais')} opciones={paises} valor={r.destino.pais} onCambio={(pais) => destino({ pais })} placeholder={t('asi.destino.buscar')} />
      </Pregunta>
      {r.destino.pais && (
        <Pregunta id="q-ciudad" titulo={t('asi.destino.ciudad')} ayuda={t('asi.destino.ciudadAyuda')}>
          <div className="max-w-[460px]">
            <Texto valor={r.destino.ciudad} onCambio={(ciudad) => destino({ ciudad })} placeholder={t('asi.destino.ciudadEj')} aria-labelledby="q-ciudad" />
          </div>
        </Pregunta>
      )}
      {/* TODO(fuera de alcance): módulo "¿a qué país exportar?" con mapas de oportunidades (ver config/asistente/asistente.config.ts) */}
    </Tarjeta>
  );
}

// ---------- Paso 2: necesidad ----------
export function PasoNecesidad({ s }) {
  const { t } = useI18n();
  const { respuestas: r, responder } = s;
  const opciones = ['COSTOS', 'CUBICAJE', 'AMBOS'].map((id) => ({ id, titulo: t(`asi.necesidad.${id}.t`), detalle: t(`asi.necesidad.${id}.d`), icono: { COSTOS: '💵', CUBICAJE: '📦', AMBOS: '✅' }[id] }));
  return (
    <Tarjeta className="flex flex-col gap-6">
      <Pregunta principal id="q-necesidad" titulo={t('asi.necesidad.titulo')} ayuda={t('asi.necesidad.ayuda')}>
        <Tarjetas label={t('asi.necesidad.titulo')} opciones={opciones} valor={r.necesidad} onCambio={(necesidad) => responder({ necesidad })} />
      </Pregunta>
    </Tarjeta>
  );
}

// ---------- Paso 3: volumen ----------
const VIAS = ['COURIER', 'AEREO', 'MARITIMO'];

export function PasoVolumen({ s }) {
  const { t, lang } = useI18n();
  const { respuestas: r, responder, asistente } = s;
  const [cambiando, setCambiando] = useState(false);
  const urgencia = preguntaUrgencia(r.kilos) && !r.viaManual;
  const via = asistente.via;
  return (
    <Tarjeta className="flex flex-col gap-7">
      <Pregunta principal id="q-kilos" titulo={t('asi.volumen.titulo')} ayuda={t('asi.volumen.ayuda')}>
        <ConUnidad unidad="kg">
          <Numero valor={r.kilos} onCambio={(kilos) => responder({ kilos: kilos != null && kilos >= 0 ? kilos : null, viaManual: null, tipoCargaManual: null, contenedorManual: null })} placeholder="1.200" aria-labelledby="q-kilos" className="!pr-12 text-[17px]" />
        </ConUnidad>
        {r.kilos > 0 && <p className="m-0 text-[13px] text-muted">{t('asi.volumen.equivale', { lb: formatoNumero(r.kilos * 2.20462, 0, lang), s: formatoNumero(Math.ceil(r.kilos / 70), 0, lang) })}</p>}
      </Pregunta>

      {urgencia && (
        <Pregunta id="q-urgencia" titulo={t('asi.volumen.urgencia')} ayuda={t('asi.volumen.urgenciaAyuda', { a: UMBRALES_MODALIDAD.courierMaxKg, b: UMBRALES_MODALIDAD.maritimoMinKg })}>
          <Tarjetas
            label={t('asi.volumen.urgencia')}
            columnas={2}
            valor={r.urgencia}
            onCambio={(u) => responder({ urgencia: u, tipoCargaManual: null })}
            opciones={['URGENTE', 'ESPERAR'].map((id) => ({ id, titulo: t(`asi.volumen.urg.${id}.t`), detalle: t(`asi.volumen.urg.${id}.d`), icono: id === 'URGENTE' ? '✈️' : '🚢' }))}
          />
        </Pregunta>
      )}

      {via && (
        <div className="flex flex-col gap-3">
          <ChipInfo onCambiar={() => setCambiando((c) => !c)} textoCambiar={cambiando ? t('asi.cerrar') : t('asi.cambiar')}>
            {t('asi.via.chip.' + via)}
            {r.viaManual && ` · ${t('asi.elegidoPorTi')}`}
          </ChipInfo>
          <p className="m-0 text-[13px] text-muted">{t('asi.via.porque.' + (r.viaManual ? 'MANUAL' : via), { a: UMBRALES_MODALIDAD.courierMaxKg, b: UMBRALES_MODALIDAD.maritimoMinKg })}</p>
          {cambiando && (
            <div className="flex flex-col gap-2">
              <Tarjetas
                label={t('asi.via.cambiar')}
                valor={via}
                onCambio={(v) => {
                  responder({ viaManual: v, tipoCargaManual: null, contenedorManual: null });
                  setCambiando(false);
                }}
                opciones={VIAS.map((id) => ({ id, titulo: t('asi.via.nombre.' + id), detalle: t('asi.via.detalle.' + id) }))}
              />
              {r.viaManual && (
                <button type="button" onClick={() => { responder({ viaManual: null }); setCambiando(false); }} className="min-h-9 cursor-pointer self-start border-0 bg-transparent p-0 text-[13px] text-muted underline">
                  {t('asi.via.volverSugerida')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Tarjeta>
  );
}

// ---------- Paso 4: entrega ----------
export function PasoEntrega({ s }) {
  const { t } = useI18n();
  const { respuestas: r, responder } = s;
  const recogida = (cambios) => responder((x) => ({ ...x, recogida: { ...x.recogida, ...cambios } }));
  return (
    <Tarjeta className="flex flex-col gap-7">
      <Pregunta principal id="q-recogida" titulo={t('asi.entrega.recogida')} ayuda={t('asi.entrega.recogidaAyuda')}>
        <Tarjetas
          label={t('asi.entrega.recogida')}
          columnas={2}
          valor={r.recogida.lugar}
          onCambio={(lugar) => recogida({ lugar })}
          opciones={['TRILLADORA', 'TOSTADORA'].map((id) => ({ id, titulo: t(`asi.entrega.lugar.${id}.t`), detalle: t(`asi.entrega.lugar.${id}.d`), icono: id === 'TRILLADORA' ? '🌱' : '🔥' }))}
        />
      </Pregunta>
      {r.recogida.lugar && (
        <Pregunta id="q-ciudad-origen" titulo={t('asi.entrega.ciudad')}>
          <div className="max-w-[460px]">
            <Texto valor={r.recogida.ciudad} onCambio={(ciudad) => recogida({ ciudad })} placeholder={t('asi.entrega.ciudadEj')} aria-labelledby="q-ciudad-origen" />
          </div>
        </Pregunta>
      )}
      {r.recogida.lugar && (
        <Pregunta id="q-entrega" titulo={t('asi.entrega.entrega')} ayuda={t('asi.entrega.entregaAyuda')}>
          <Tarjetas
            label={t('asi.entrega.entrega')}
            columnas={2}
            valor={r.entrega}
            onCambio={(entrega) => responder({ entrega })}
            opciones={['PUERTO', 'COMPRADOR'].map((id) => ({ id, titulo: t(`asi.entrega.destino.${id}.t`), detalle: t(`asi.entrega.destino.${id}.d`), icono: id === 'PUERTO' ? '⚓' : '🏢' }))}
          />
        </Pregunta>
      )}
    </Tarjeta>
  );
}

// ---------- Paso 5: producto ----------
export function PasoProducto({ s }) {
  const { t, lang } = useI18n();
  const { respuestas: r, responder } = s;
  const destacadas = PARTIDAS_CAFE.filter((p) => p.destacada);
  const otras = PARTIDAS_CAFE.filter((p) => !p.destacada);
  const esOtra = otras.some((p) => p.codigo === r.partida);
  const [verOtras, setVerOtras] = useState(esOtra);
  const NINGUNO = 'NINGUNO';
  return (
    <Tarjeta className="flex flex-col gap-7">
      <Pregunta principal id="q-producto" titulo={t('asi.producto.titulo')} ayuda={t('asi.producto.ayuda')}>
        <Tarjetas
          label={t('asi.producto.titulo')}
          valor={verOtras ? NINGUNO : r.partida}
          onCambio={(id) => {
            if (id === NINGUNO) {
              setVerOtras(true);
              if (!esOtra) responder({ partida: '' });
            } else {
              setVerOtras(false);
              responder({ partida: id });
            }
          }}
          opciones={[
            ...destacadas.map((p) => ({ id: p.codigo, titulo: p.nombre[lang], icono: p.codigo.startsWith('0901.21') ? '☕' : '🌿' })),
            { id: NINGUNO, titulo: t('asi.producto.ninguno'), detalle: t('asi.producto.ningunoD') },
          ]}
        />
      </Pregunta>
      {verOtras && (
        <Pregunta id="q-producto-otro" titulo={t('asi.producto.otro')}>
          <Tarjetas label={t('asi.producto.otro')} columnas={2} valor={r.partida} onCambio={(partida) => responder({ partida })} opciones={otras.map((p) => ({ id: p.codigo, titulo: p.nombre[lang] }))} />
        </Pregunta>
      )}
    </Tarjeta>
  );
}
