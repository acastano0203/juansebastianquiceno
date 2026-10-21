import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MESSAGES } from './messages';

const KEY = 'jsq.lang.v1';
const LanguageContext = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // sin almacenamiento: se usa el idioma del navegador
  }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('en') ? 'en' : 'es';
}

function lookup(obj, key) {
  return key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // el idioma dura solo mientras la pestaña esté abierta
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? 'Juan Sebastián Quiceno · Strategy consulting' : 'Juan Sebastián Quiceno · Consultoría estratégica';
  }, [lang]);

  // t('seccion.clave', { var }) — devuelve el texto (o arreglo/objeto) con las variables reemplazadas
  const t = useCallback(
    (key, vars) => {
      let v = lookup(MESSAGES[lang], key);
      if (v == null) v = lookup(MESSAGES.es, key);
      if (v == null) return key;
      if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
      return v;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de LanguageProvider');
  return ctx;
}
