import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../i18n/LanguageContext';
import { leerNumero } from '../../engine/unidades';
import { Alert } from '../ui/Icons';

export function Campo({ label, ayuda, error, children, className = '' }) {
  return (
    <label className={'flex min-w-0 flex-col gap-1.5 text-[13px] font-semibold text-ink ' + className}>
      {label}
      {children}
      {error ? (
        <span role="alert" className="text-xs font-normal text-[#8f3f22]">{error}</span>
      ) : (
        ayuda && <span className="text-xs font-normal text-muted">{ayuda}</span>
      )}
    </label>
  );
}

export function Texto({ valor, onCambio, ...rest }) {
  return <input type="text" className="field w-full bg-white" value={valor ?? ''} onChange={(e) => onCambio(e.target.value)} {...rest} />;
}

export function Opciones({ valor, onCambio, opciones, vacio, ...rest }) {
  return (
    <select className="field w-full cursor-pointer bg-white" value={valor ?? ''} onChange={(e) => onCambio(e.target.value)} {...rest}>
      {vacio && <option value="">{vacio}</option>}
      {opciones.map((o) => (
        <option key={o.id} value={o.id} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Campo numérico que respeta lo que se escribe (coma decimal) y solo se resincroniza al salir del campo
export function Numero({ valor, onCambio, onConfirmar, className = '', ...rest }) {
  const { lang } = useI18n();
  const mostrar = (v) => {
    if (v == null) return '';
    const redondo = Number(Number(v).toPrecision(12));
    return lang === 'es' ? String(redondo).replace('.', ',') : String(redondo);
  };
  const [texto, setTexto] = useState(mostrar(valor));
  const [foco, setFoco] = useState(false);
  const alEnfocar = useRef(null);

  useEffect(() => {
    if (!foco) setTexto(mostrar(valor));
  }, [valor, foco, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={'field w-full bg-white ' + className}
      value={texto}
      onFocus={() => {
        alEnfocar.current = valor;
        setFoco(true);
      }}
      onBlur={() => {
        setFoco(false);
        if (onConfirmar && alEnfocar.current !== valor) onConfirmar(alEnfocar.current, valor);
      }}
      onChange={(e) => {
        setTexto(e.target.value);
        onCambio(leerNumero(e.target.value, lang));
      }}
      {...rest}
    />
  );
}

export function Chips({ opciones, seleccion, onCambio, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const on = seleccion.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onCambio(on ? seleccion.filter((x) => x !== o.id) : [...seleccion, o.id])}
            className={'min-h-9 cursor-pointer rounded-full border-[1.5px] px-3.5 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-45 ' + (on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink')}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Interruptor({ checked, onCambio, children }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
      <input id={id} type="checkbox" className="size-[18px] accent-[#123638]" checked={checked} onChange={(e) => onCambio(e.target.checked)} />
      {children}
    </label>
  );
}

export function Aviso({ tono = 'oro', titulo, children, className = '' }) {
  const tonos = { oro: 'bg-[#f6e8c8] text-[#5a4509]', azul: 'bg-[#dde4f2] text-[#2d3e6e]', arcilla: 'bg-clay-bg text-clay-ink', menta: 'bg-mist-2 text-ink' };
  return (
    <div className={'rounded-2xl px-4 py-3 text-sm leading-[1.5] ' + tonos[tono] + ' ' + className}>
      {titulo && <strong className="font-semibold">{titulo} </strong>}
      {children}
    </div>
  );
}

export function Tarjeta({ children, className = '' }) {
  return <section className={'min-w-0 rounded-[20px] border border-line bg-white p-4 md:p-6 ' + className}>{children}</section>;
}

export function Dato({ etiqueta, valor, nota }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-2xl bg-mist-2 px-4 py-3">
      <span className="text-[13px] text-muted">{etiqueta}</span>
      <span className="font-serif text-[22px] leading-tight font-semibold break-words md:text-[26px]">{valor}</span>
      {nota && <span className="text-xs text-muted">{nota}</span>}
    </div>
  );
}

export function ListaAlertas({ alertas, lang }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {alertas.map((a) => (
        <li key={a.id} className="flex gap-2.5 text-sm leading-[1.45]">
          <Alert size={16} className="mt-0.5 flex-none text-clay" />
          <span>{a.texto[lang]}</span>
        </li>
      ))}
    </ul>
  );
}

export const usarPaises = (lang) => {
  const nombres = new Intl.DisplayNames([lang], { type: 'region' });
  return PAISES.map((id) => ({ id, label: nombres.of(id) })).sort((a, b) => a.label.localeCompare(b.label, lang));
};

const PAISES = 'AR,AT,AU,BE,BO,BR,CA,CH,CL,CN,CO,CR,CZ,DE,DK,DO,EC,EG,ES,FI,FR,GB,GR,GT,HK,HN,ID,IE,IL,IN,IT,JP,KR,MA,MX,MY,NL,NO,NZ,PA,PE,PH,PL,PT,PY,RO,SA,SE,SG,SV,TH,TR,TW,AE,US,UY,VE,VN,ZA'.split(',');
