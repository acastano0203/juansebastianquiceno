import { useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/LanguageContext';
import { normalizarTexto } from '../../../engine/unidades';
import { Check, ChevronDown, Search } from '../../ui/Icons';

/** Un bloque de la conversación: una pregunta y su respuesta */
export function Pregunta({ titulo, ayuda, children, principal = false, id }) {
  const Tag = principal ? 'h1' : 'h2';
  return (
    <section className="flex min-w-0 flex-col gap-3 animate-[aparecer_.25s_ease-out]" aria-labelledby={id}>
      <div className="flex flex-col gap-1">
        <Tag id={id} className={'m-0 font-serif leading-tight font-semibold ' + (principal ? 'text-[26px] md:text-[32px]' : 'text-[20px] md:text-[22px]')}>
          {titulo}
        </Tag>
        {ayuda && <p className="m-0 max-w-[640px] text-sm leading-[1.5] text-muted">{ayuda}</p>}
      </div>
      {children}
    </section>
  );
}

/** Tarjetas seleccionables (una sola respuesta). opciones: { id, titulo, detalle?, icono? } */
export function Tarjetas({ opciones, valor, onCambio, label, columnas = 3 }) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columnas];
  return (
    <div role="radiogroup" aria-label={label} className={'grid grid-cols-1 gap-2.5 ' + cols}>
      {opciones.map((o) => {
        const on = valor === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onCambio(o.id)}
            className={
              'relative flex min-h-[64px] cursor-pointer flex-col items-start gap-1 rounded-2xl border-[1.5px] px-4 py-3.5 text-left transition-colors ' +
              (on ? 'border-ink bg-mist-2 text-ink' : 'border-line bg-white text-ink hover:border-ink-4')
            }
          >
            <span className="flex w-full items-start gap-2.5">
              {o.icono && <span aria-hidden="true" className="text-xl leading-none">{o.icono}</span>}
              <span className="flex-1 text-[15px] leading-snug font-semibold">{o.titulo}</span>
              <span aria-hidden="true" className={'grid size-5 flex-none place-items-center rounded-full border-[1.5px] ' + (on ? 'border-ink bg-ink text-white' : 'border-line')}>
                {on && <Check size={12} />}
              </span>
            </span>
            {o.detalle && <span className="text-[13px] leading-normal text-muted">{o.detalle}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Dato que el asistente dedujo, con opción de cambiarlo */
export function ChipInfo({ children, onCambiar, textoCambiar, tono = 'menta' }) {
  const tonos = { menta: 'bg-mist-2 text-ink', oro: 'bg-[#f6e8c8] text-[#5a4509]' };
  return (
    <div role="status" className={'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-4 py-2 text-sm font-medium ' + tonos[tono]}>
      <span>{children}</span>
      {onCambiar && (
        <button type="button" onClick={onCambiar} className="min-h-8 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-ink underline">
          {textoCambiar}
        </button>
      )}
    </div>
  );
}

/** Selector con búsqueda (combobox accesible). opciones: { id, label } */
export function SelectBuscable({ opciones, valor, onCambio, placeholder, label }) {
  const { t } = useI18n();
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const lista = useRef(null);
  const elegido = opciones.find((o) => o.id === valor);
  const filtradas = useMemo(() => {
    const q = normalizarTexto(texto);
    return q ? opciones.filter((o) => normalizarTexto(o.label).includes(q)) : opciones;
  }, [opciones, texto]);

  const elegir = (o) => {
    onCambio(o.id);
    setTexto('');
    setAbierto(false);
  };

  const teclas = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => Math.min(filtradas.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && abierto && filtradas[activo]) {
      e.preventDefault();
      elegir(filtradas[activo]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  return (
    <div className="relative w-full max-w-[460px]">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={id + '-lista'}
          aria-autocomplete="list"
          aria-activedescendant={abierto && filtradas[activo] ? `${id}-${filtradas[activo].id}` : undefined}
          autoComplete="off"
          className="field w-full bg-white !pl-10 !pr-10 text-[15px]"
          placeholder={elegido ? elegido.label : placeholder}
          value={abierto ? texto : elegido?.label ?? texto}
          onFocus={() => {
            setAbierto(true);
            setTexto('');
            setActivo(0);
          }}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setActivo(0);
          }}
          onKeyDown={teclas}
        />
        <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
      </div>
      {abierto && (
        <ul ref={lista} id={id + '-lista'} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full list-none overflow-auto rounded-2xl border border-line bg-white p-1 shadow-lg">
          {filtradas.length === 0 && <li className="px-3 py-2 text-sm text-muted">{t('asi.sinResultados')}</li>}
          {filtradas.map((o, i) => (
            <li
              key={o.id}
              id={`${id}-${o.id}`}
              role="option"
              aria-selected={o.id === valor}
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(o);
              }}
              onMouseEnter={() => setActivo(i)}
              className={'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm ' + (i === activo ? 'bg-mist-2' : '')}
            >
              {o.label}
              {o.id === valor && <Check size={14} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Número con unidad a la derecha */
export function ConUnidad({ unidad, children }) {
  return (
    <div className="relative w-full max-w-[280px]">
      {children}
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted">{unidad}</span>
    </div>
  );
}
