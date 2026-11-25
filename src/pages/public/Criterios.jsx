import { useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import PaginaSeccion from '../../components/public/PaginaSeccion';
import { Coffee, UserCheck } from 'lucide-react';
import { ChevronDown } from '../../components/ui/Icons';

// Los mismos íconos del original: persona con check (trayectoria) y taza (café)
const ICONOS = [UserCheck, Coffee];

function Pregunta({ id, q, a, abierta, onToggle }) {
  return (
    <div
      className={
        'rounded-[16px] border bg-white transition-colors ' + (abierta ? 'border-gold shadow-[0_12px_30px_rgba(221,189,98,.14)]' : 'border-line hover:border-ink/30')
      }
    >
      <h3 className="m-0">
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={abierta}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-5 py-3 text-left font-serif text-[16px] font-semibold text-ink"
        >
          <span className={abierta ? 'text-clay' : ''}>{q}</span>
          <ChevronDown size={18} className={'shrink-0 text-muted transition-transform duration-300 ' + (abierta ? 'rotate-180 text-clay' : '')} />
        </button>
      </h3>
      {/* grid-rows 0fr→1fr anima la altura sin medirla */}
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        className={'grid transition-[grid-template-rows] duration-300 ' + (abierta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
      >
        {/* React 18 solo pinta inert como texto: "" lo activa, undefined lo quita */}
        <div className="overflow-hidden" inert={abierta ? undefined : ''}>
          <div className="px-5 pb-5 text-[14.5px] leading-[1.65] text-muted">
            {Array.isArray(a) ? (
              <ul className="m-0 flex flex-col gap-1.5 pl-5">
                {a.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0">{a}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Una columna: tarjeta de encabezado + acordeón (una pregunta abierta a la vez; la primera, al entrar)
function Columna({ columna, i }) {
  const [abierta, setAbierta] = useState(0);
  const Icono = ICONOS[i];
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="mb-2 flex flex-col gap-3 rounded-[24px_24px_24px_6px] border border-line bg-white p-6">
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-sage/35 px-3 py-1.5 text-[11px] font-bold tracking-[0.1em] text-ink uppercase">
          <Icono size={15} strokeWidth={2.2} aria-hidden="true" />
          {columna.badge}
        </span>
        <h2 className="m-0 font-serif text-[22px] leading-[1.2] font-semibold text-balance md:text-[24px]">{columna.titulo}</h2>
        <p className="m-0 text-[14.5px] text-muted">{columna.sub}</p>
      </div>
      {columna.preguntas.map((p, j) => (
        <Pregunta
          key={p.q}
          id={`criterio-${i}-${j}`}
          q={p.q}
          a={p.a}
          abierta={abierta === j}
          onToggle={() => setAbierta((x) => (x === j ? null : j))}
        />
      ))}
    </div>
  );
}

export default function Criterios() {
  const { t } = useI18n();
  return (
    <PaginaSeccion>
      <section className="mx-auto flex max-w-[1240px] flex-col gap-10 px-[22px] py-12 md:px-10 md:py-20">
        <header className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-medium tracking-[0.12em] text-clay uppercase md:text-[13px] md:tracking-[0.14em]">{t('criterios.badge')}</span>
          <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-balance md:text-[46px]">{t('criterios.titulo')}</h1>
          <p className="m-0 text-base leading-[1.6] text-muted md:text-[17px]">{t('criterios.intro')}</p>
        </header>

        <div className="mx-auto grid w-full max-w-[1040px] items-start gap-8 lg:grid-cols-2">
          {t('criterios.columnas').map((c, i) => (
            <Columna key={c.titulo} columna={c} i={i} />
          ))}
        </div>
      </section>
    </PaginaSeccion>
  );
}
