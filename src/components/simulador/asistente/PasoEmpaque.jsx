import { useState } from 'react';
import { useI18n } from '../../../i18n/LanguageContext';
import { CONTENEDORES, GRANEL_MINIMO_KG, PALLETS, UMBRAL_LCL } from '../../../config/asistente/cubicaje.config';
import { formatoDinero, formatoNumero } from '../../../engine/unidades';
import { Aviso, Tarjeta } from '../Campos';
import PanelCubicaje from './PanelCubicaje';
import { ChipInfo, Pregunta, Tarjetas } from './Pregunta';

const m = (mm, lang) => formatoNumero(mm / 1000, 2, lang);

function Comparacion({ c }) {
  const { t, lang } = useI18n();
  return (
    <Aviso tono="azul" className="flex flex-col gap-1">
      <strong className="font-semibold">{t('asi.cmp.titulo')}</strong>
      <span>
        {t('asi.cmp.texto', {
          m3: formatoNumero(c.cobrableWm, 2, lang),
          lcl: formatoDinero(c.lclUsd, 'USD', lang),
          n: c.cantidad,
          cont: t('asi.contenedor.' + c.contenedorId),
          fcl: formatoDinero(c.fclUsd, 'USD', lang),
        })}
      </span>
      <span className="font-semibold">{t('asi.cmp.conviene.' + c.conviene)}</span>
      <span className="text-xs opacity-80">{t('asi.cmp.nota')}</span>
    </Aviso>
  );
}

export default function PasoEmpaque({ s }) {
  const { t, lang } = useI18n();
  const { respuestas: r, responder, asistente, setCaptura3D } = s;
  const cub = asistente.cubicaje;
  const [cambiarTipo, setCambiarTipo] = useState(false);
  const [cambiarCont, setCambiarCont] = useState(false);
  const maritimo = asistente.via === 'MARITIMO';

  const formas = [
    { id: 'SACO', titulo: t('asi.emp.SACO.t'), detalle: t('asi.emp.SACO.d'), icono: '🧺' },
    { id: 'CAJA', titulo: t('asi.emp.CAJA.t'), detalle: t('asi.emp.CAJA.d'), icono: '📦' },
    { id: 'GRANEL', titulo: t('asi.emp.GRANEL.t'), detalle: t('asi.emp.GRANEL.d', { t: formatoNumero(GRANEL_MINIMO_KG / 1000, 0, lang) }), icono: '🚛' },
  ];
  const pallets = [
    { id: 'AMERICANO', titulo: t('asi.pallet.AMERICANO'), detalle: `${m(PALLETS.AMERICANO.largoMm, lang)} × ${m(PALLETS.AMERICANO.anchoMm, lang)} m` },
    { id: 'EUROPEO', titulo: t('asi.pallet.EUROPEO'), detalle: `${m(PALLETS.EUROPEO.largoMm, lang)} × ${m(PALLETS.EUROPEO.anchoMm, lang)} m` },
    { id: 'NO', titulo: t('asi.pallet.NO'), detalle: t('asi.pallet.NOd') },
    { id: 'NO_SE', titulo: t('asi.pallet.NO_SE'), detalle: t('asi.pallet.NO_SEd') },
  ];

  if (!asistente.via || !r.kilos) {
    return (
      <Tarjeta className="flex flex-col items-start gap-3">
        <h1 className="m-0 font-serif text-[26px] font-semibold">{t('asi.emp.faltaVolumen')}</h1>
        <button type="button" onClick={() => s.irA('volumen')} className="min-h-9 cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold underline">{t('asi.emp.irVolumen')}</button>
      </Tarjeta>
    );
  }

  const fclElegido = cub?.fcl?.elegido;

  return (
    <div className="flex flex-col gap-4">
      <Tarjeta className="flex flex-col gap-7">
        <Pregunta principal id="q-forma" titulo={t('asi.emp.titulo')} ayuda={t('asi.emp.ayuda')}>
          <Tarjetas label={t('asi.emp.titulo')} valor={r.empaque} onCambio={(empaque) => responder({ empaque, tipoCargaManual: null, contenedorManual: null })} opciones={formas} />
        </Pregunta>

        {r.empaque === 'SACO' && (
          <Pregunta id="q-saco" titulo={t('asi.emp.tamSaco')}>
            <Tarjetas label={t('asi.emp.tamSaco')} columnas={2} valor={r.saco} onCambio={(saco) => responder({ saco })} opciones={['35', '70'].map((id) => ({ id, titulo: `${id} kg`, detalle: t('asi.emp.saco' + id) }))} />
          </Pregunta>
        )}
        {r.empaque === 'CAJA' && <ChipInfo>{t('asi.emp.cajaInfo')}</ChipInfo>}
        {cub?.granelAjustado && <Aviso tono="oro">{t('asi.alerta.GRANEL_AJUSTADO', { t: formatoNumero(GRANEL_MINIMO_KG / 1000, 0, lang) })}</Aviso>}

        {r.empaque && r.empaque !== 'GRANEL' && (
          <Pregunta id="q-pallet" titulo={t('asi.pallet.titulo')} ayuda={t('asi.pallet.ayuda')}>
            <Tarjetas label={t('asi.pallet.titulo')} columnas={4} valor={r.pallet} onCambio={(pallet) => responder({ pallet })} opciones={pallets} />
            {cub && r.pallet === 'NO_SE' && (
              <ChipInfo>{cub.palletId ? t('asi.pallet.sugerido', { p: t('asi.palletNombre.' + cub.palletId) }) : t('asi.pallet.sugeridoNo')}</ChipInfo>
            )}
            {cub?.alertas.includes('NIMF15') && <Aviso tono="oro" titulo={t('asi.alerta.NIMF15t')}>{t('asi.alerta.NIMF15')}</Aviso>}
          </Pregunta>
        )}
      </Tarjeta>

      {cub && r.empaque && (
        <Tarjeta className="flex flex-col gap-5">
          <header className="flex flex-col gap-2">
            <h2 className="m-0 font-serif text-[22px] leading-tight font-semibold md:text-[26px]">{t('asi.cub.titulo')}</h2>
            <div className="flex flex-wrap gap-2">
              <ChipInfo onCambiar={maritimo && cub.empaque !== 'GRANEL' ? () => setCambiarTipo((x) => !x) : undefined} textoCambiar={cambiarTipo ? t('asi.cerrar') : t('asi.cambiar')}>
                {t('asi.tipoCarga.chip.' + cub.tipoCarga)}
                {r.tipoCargaManual && ` · ${t('asi.elegidoPorTi')}`}
              </ChipInfo>
              {fclElegido && (
                <ChipInfo onCambiar={() => setCambiarCont((x) => !x)} textoCambiar={cambiarCont ? t('asi.cerrar') : t('asi.cambiar')}>
                  {t('asi.cub.contChip', { n: fclElegido.cantidad, c: t('asi.contenedor.' + fclElegido.contenedorId) })}
                </ChipInfo>
              )}
              {cub.alertas.includes('KRAFT') && <ChipInfo tono="oro">{t('asi.alerta.KRAFT')}</ChipInfo>}
            </div>
            <p className="m-0 text-[13px] text-muted">
              {t('asi.tipoCarga.porque.' + (r.tipoCargaManual ? 'MANUAL' : cub.tipoCarga), { v: formatoNumero(UMBRAL_LCL.volumenM3, 0, lang), p: formatoNumero(UMBRAL_LCL.pesoKg / 1000, 0, lang) })}
            </p>
          </header>

          {cambiarTipo && (
            <Tarjetas
              label={t('asi.tipoCarga.cambiar')}
              columnas={2}
              valor={cub.tipoCarga}
              onCambio={(tipo) => {
                responder({ tipoCargaManual: tipo === cub.tipoCargaSugerido ? null : tipo, contenedorManual: null });
                setCambiarTipo(false);
              }}
              opciones={['LCL', 'FCL'].map((id) => ({ id, titulo: t('asi.tipoCarga.' + id), detalle: t('asi.tipoCarga.detalle.' + id) + (id === cub.tipoCargaSugerido ? ` · ${t('asi.sugerido')}` : '') }))}
            />
          )}

          {cambiarCont && cub.fcl && (
            <Tarjetas
              label={t('asi.cub.elegirCont')}
              valor={fclElegido?.contenedorId}
              onCambio={(id) => {
                responder({ contenedorManual: id });
                setCambiarCont(false);
              }}
              opciones={cub.fcl.opciones
                .filter((o) => o.cantidad != null)
                .map((o) => {
                  const c = CONTENEDORES.find((x) => x.id === o.contenedorId);
                  return {
                    id: o.contenedorId,
                    titulo: `${o.cantidad} × ${t('asi.contenedor.' + o.contenedorId)}`,
                    detalle: `${formatoNumero(c.volumenM3, 1, lang)} m³ · ${t('asi.cub.hasta', { kg: formatoNumero(o.limiteKg, 0, lang) })}${o.costoUsd != null ? ` · ${t('asi.cub.fleteAprox', { v: formatoDinero(o.costoUsd, 'USD', lang) })}` : ''}`,
                  };
                })}
            />
          )}

          {asistente.comparacion && <Comparacion c={asistente.comparacion} />}

          {cub.escenas.length > 0 ? <PanelCubicaje cub={cub} onCaptura={setCaptura3D} /> : <Aviso tono="arcilla">{t('asi.alerta.NO_CABE')}</Aviso>}
          <p className="m-0 text-xs text-muted">{t('asi.cub.legal')}</p>
        </Tarjeta>
      )}
    </div>
  );
}
