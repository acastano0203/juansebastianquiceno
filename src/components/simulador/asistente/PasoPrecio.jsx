import { useEffect, useState } from 'react';
import { useI18n } from '../../../i18n/LanguageContext';
import { PRECIO } from '../../../config/asistente/asistente.config';
import { PRECIO_C_MANUAL } from '../../../config/asistente/precio.config';
import { PARAMS } from '../../../config/params';
import { centavosC, diferencial } from '../../../engine/asistente/derivar';
import { formatoDinero, formatoNumero } from '../../../engine/unidades';
import { getCoffeePrice, precioLibraCop } from '../../../services/precioCafe';
import { Button } from '../../ui/Button';
import { Campo, Numero, Tarjeta } from '../Campos';
import { ConUnidad, Pregunta, Tarjetas } from './Pregunta';

function Liquidador({ s, onAceptar }) {
  const { t, lang } = useI18n();
  const { respuestas: r, responder, trm } = s;
  const [fuente, setFuente] = useState({ fecha: PRECIO_C_MANUAL.fecha, fuente: PRECIO_C_MANUAL.fuente, manual: true });
  useEffect(() => {
    let vivo = true;
    getCoffeePrice().then((p) => {
      if (!vivo) return;
      setFuente(p);
      if (r.liquidador.centavosC == null) responder((x) => ({ ...x, liquidador: { ...x.liquidador, centavosC: p.centavosLb } }));
    });
    return () => {
      vivo = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tasa = trm?.valor ?? PARAMS.fx.copPorUnidad.USD;
  const c = centavosC(r);
  const d = diferencial(r);
  const sugerido = precioLibraCop(c, d, tasa);
  const liq = (cambios) => responder((x) => ({ ...x, liquidador: { ...x.liquidador, ...cambios } }));

  return (
    <section aria-labelledby="liq-t" className="flex flex-col gap-4 rounded-2xl border border-line bg-mist p-4 md:p-5">
      <div className="flex flex-col gap-1">
        <h3 id="liq-t" className="m-0 font-serif text-[19px] font-semibold">{t('asi.liq.titulo')}</h3>
        <p className="m-0 text-[13px] text-muted">{t('asi.liq.ayuda')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label={t('asi.liq.c')} ayuda={t('asi.liq.cFuente', { f: fuente.fuente, d: fuente.fecha })}>
          <ConUnidad unidad="¢/lb">
            <Numero valor={c} onCambio={(v) => liq({ centavosC: v })} className="!pr-14" />
          </ConUnidad>
        </Campo>
        <Campo label={t('asi.liq.dif')} ayuda={t('asi.liq.difAyuda')}>
          <ConUnidad unidad="¢/lb">
            <Numero valor={d} onCambio={(v) => liq({ diferencial: v })} className="!pr-14" />
          </ConUnidad>
        </Campo>
        <Campo label={t('asi.liq.trm')} ayuda={trm ? t('asi.liq.trmFuente', { f: trm.fuente, d: trm.fecha }) : t('asi.liq.trmSemilla', { d: PARAMS.fx.fecha })}>
          <div className="field flex items-center bg-white font-semibold">{formatoNumero(tasa, 2, lang)} COP</div>
        </Campo>
      </div>
      {fuente.manual && <p className="m-0 text-xs text-muted">{t('asi.liq.manual')}</p>}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted">{t('asi.liq.resultado')}</span>
          <span className="font-serif text-[26px] font-semibold">{formatoDinero(sugerido, 'COP', lang)} <span className="text-base font-normal text-muted">/ lb</span></span>
          <span className="text-xs text-muted">{t('asi.liq.formula', { c: formatoNumero(c, 2, lang), d: formatoNumero(d, 2, lang), trm: formatoNumero(tasa, 2, lang) })}</span>
        </div>
        <Button variant="ink" onClick={() => onAceptar(Math.round(sugerido))}>{t('asi.liq.usar')}</Button>
      </div>
    </section>
  );
}

export default function PasoPrecio({ s }) {
  const { t, lang } = useI18n();
  const { respuestas: r, responder, asistente } = s;
  const [ayuda, setAyuda] = useState(false);
  return (
    <Tarjeta className="flex flex-col gap-7">
      <Pregunta principal id="q-moneda" titulo={t('asi.precio.moneda')} ayuda={t('asi.precio.monedaAyuda')}>
        <Tarjetas
          label={t('asi.precio.moneda')}
          columnas={2}
          valor={r.moneda}
          onCambio={(moneda) => responder({ moneda })}
          opciones={PRECIO.monedas.map((id) => ({ id, titulo: t('asi.precio.mon.' + id), icono: id === 'USD' ? '$' : '€' }))}
        />
      </Pregunta>

      {r.moneda && (
        <Pregunta id="q-precio" titulo={t('asi.precio.libra')} ayuda={t('asi.precio.libraAyuda')}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ConUnidad unidad="COP / lb">
              <Numero valor={r.precioLibraCop} onCambio={(v) => responder({ precioLibraCop: v != null && v > 0 ? v : null })} placeholder={asistente.precioLibraCop != null ? formatoNumero(Math.round(asistente.precioLibraCop), 0, lang) : ''} aria-labelledby="q-precio" className="!pr-24 text-[17px]" />
            </ConUnidad>
            <Button variant="outline-ink" onClick={() => setAyuda((x) => !x)} aria-expanded={ayuda}>
              {ayuda ? t('asi.cerrar') : t('asi.precio.noSe')}
            </Button>
          </div>
          {r.precioLibraCop == null && asistente.precioLibraCop != null && (
            <p className="m-0 text-[13px] text-muted">{t('asi.precio.siVacio', { v: formatoDinero(asistente.precioLibraCop, 'COP', lang) })}</p>
          )}
          {ayuda && (
            <Liquidador
              s={s}
              onAceptar={(v) => {
                responder({ precioLibraCop: v });
                setAyuda(false);
              }}
            />
          )}
        </Pregunta>
      )}
    </Tarjeta>
  );
}
