import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/LanguageContext';
import { Button } from '../ui/Button';
import { Check, Download, Message, Trash } from '../ui/Icons';
import { Aviso, Tarjeta } from './Campos';
import BotonWhatsApp from './BotonWhatsApp';
import { Documento, useDescargarPdf } from './EtapaReporte';

function Paso({ n, titulo, descripcion, hecho, children }) {
  return (
    <Tarjeta className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className={'grid size-8 flex-none place-items-center rounded-full text-sm font-semibold ' + (hecho ? 'bg-[#dbe9dc] text-[#245a30]' : 'bg-ink text-white')}>
          {hecho ? <Check size={15} /> : n}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="m-0 text-[17px] font-semibold">{titulo}</h2>
          <p className="m-0 text-sm leading-normal text-muted">{descripcion}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:pl-11">{children}</div>
    </Tarjeta>
  );
}

// Última fase: guardar el reporte, pedir soporte y terminar. Terminar borra los datos y vuelve al inicio.
export default function EtapaSoporte({ s }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { snapshot, codigo, terminar } = s;
  const descargar = useDescargarPdf(codigo);
  const [descargado, setDescargado] = useState(false);

  const finalizar = () => {
    if (!window.confirm(t('sim.sop.confirmar'))) return;
    terminar();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="no-print flex flex-col gap-1.5">
        <h1 className="m-0 font-serif text-[28px] leading-tight font-semibold md:text-[34px]">{t('sim.sop.titulo')}</h1>
        <p className="m-0 max-w-[680px] text-sm leading-[1.5] text-muted">{t('sim.sop.lead')}</p>
        {codigo && <p className="m-0 text-sm font-semibold">{t('sim.sop.codigo', { c: codigo })}</p>}
      </div>

      <div className="no-print flex flex-col gap-4">
        <Paso n={1} titulo={t('sim.sop.paso1')} descripcion={t('sim.sop.paso1D')} hecho={descargado}>
          {snapshot ? (
            <>
              <Button
                variant="gold"
                size="lg"
                onClick={() => {
                  descargar();
                  setDescargado(true);
                }}
              >
                <Download size={16} />
                {t('sim.rep.descargar')}
              </Button>
              {!descargado && (
                <button type="button" onClick={() => setDescargado(true)} className="min-h-9 cursor-pointer border-0 bg-transparent p-0 text-sm text-muted underline">
                  {t('sim.sop.descargado')}
                </button>
              )}
            </>
          ) : (
            <Aviso tono="menta">{t('sim.sop.sinPdf')}</Aviso>
          )}
        </Paso>

        <Paso n={2} titulo={t('sim.sop.paso2')} descripcion={t('sim.sop.paso2D')}>
          <BotonWhatsApp variant="ink" mensaje={codigo ? t('sim.sop.msgSoporte', { c: codigo }) : t('sim.sop.msgSoporteSin')}>
            <Message size={16} />
            {t('sim.sop.soporte')}
          </BotonWhatsApp>
        </Paso>

        <Paso n={3} titulo={t('sim.sop.paso3')} descripcion={t('sim.sop.paso3D')}>
          <Button variant="outline-ink" size="lg" onClick={finalizar}>
            <Trash size={16} />
            {t('sim.sop.terminar')}
          </Button>
        </Paso>
      </div>

      {/* Solo para el PDF: en pantalla no se ve, al imprimir es lo único que sale */}
      {snapshot && (
        <div className="hidden print:block">
          <Documento s={s} />
        </div>
      )}
    </div>
  );
}
