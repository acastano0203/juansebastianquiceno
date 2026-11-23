import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import Brand from '../ui/Brand';
import { Check } from '../ui/Icons';
import LanguageSwitcher from '../ui/LanguageSwitcher';

function Marca({ estado, n }) {
  return (
    <span
      aria-hidden="true"
      className={
        'flex size-8 flex-none items-center justify-center rounded-full border-[1.5px] text-xs font-semibold ' +
        (estado === 'completa' ? 'border-gold bg-gold text-ink' : estado === 'curso' ? 'border-white text-white' : 'border-ink-4 text-faint')
      }
    >
      {estado === 'completa' ? <Check size={15} /> : n}
    </span>
  );
}

// Barra lateral en escritorio y franja deslizable en móvil. El orden de las etapas es libre (RN-SIM-03).
export default function ProgresoEtapas({ etapas, etapa, completas, onIr }) {
  const { t } = useI18n();
  const estadoDe = (e) => (e === etapa ? 'curso' : completas[e] ? 'completa' : 'pendiente');
  const actual = useRef(null);

  // En móvil la franja se desliza: mantiene visible la etapa en curso
  useEffect(() => {
    actual.current?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [etapa]);

  return (
    <aside className="no-print flex flex-col gap-4 bg-ink px-4 pt-4 pb-3 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[264px] lg:flex-none lg:gap-9 lg:px-6 lg:py-8">
      <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
        <Brand small />
        <LanguageSwitcher compact />
      </div>
      <nav aria-label={t('sim.progreso')} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
        <ol className="m-0 flex list-none gap-1 p-0 lg:flex-col lg:gap-0.5">
          {etapas.map((e, i) => {
            const estado = estadoDe(e);
            return (
              <li key={e} ref={e === etapa ? actual : null} className="flex-none">
                <button
                  type="button"
                  aria-current={e === etapa ? 'step' : undefined}
                  aria-label={`${i + 1}. ${t('sim.etapas.' + e)}: ${t('sim.estadoEtapa.' + estado)}`}
                  onClick={() => onIr(e)}
                  className="group flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent py-1 pr-2 text-left text-inherit lg:w-full lg:gap-3"
                >
                  <Marca estado={estado} n={i + 1} />
                  <span className="flex flex-col">
                    <span className={'text-[13px] font-semibold group-hover:underline lg:text-[15px] ' + (estado === 'pendiente' ? 'text-pale' : 'text-white')}>{t('sim.etapas.' + e)}</span>
                    <span className="hidden text-xs text-sage lg:block">{t('sim.estadoEtapa.' + estado)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <p className="m-0 mt-auto hidden text-[13px] text-sage lg:block">{t('sim.guardadoAuto')}</p>
    </aside>
  );
}
