import { tipoDeLead } from './catalog';
import { monthName } from '../lib/format';

// Histórico de meses cerrados (del diseño). Se reemplaza por datos reales al conectar un backend.
export const HISTORICO = {
  leads: [21, 26, 30, 34, 41, 47],
  llamadas: [8, 10, 11, 13, 15, 18],
  cierres: [1, 1, 2, 2, 3, 4],
};

export function septiembre(lang = 'es') {
  const en = lang === 'en';
  return {
    id: 'cerrado',
    etiqueta: en ? 'September 2026' : 'Septiembre 2026',
    cerrado: true,
    titulo: en ? 'for September' : 'de septiembre',
    leads: 47,
    calificados: 29,
    llamadas: 18,
    propuestas: 9,
    cierres: 4,
    valor: 86500000,
    respuesta: '1 h 42 min',
    delta: true,
    listaCierres: [
      { n: 'Corporación Raíces del Macizo', d: en ? 'Institution · Pasto · Training' : 'Institución · Pasto · Formación', v: 32000000 },
      { n: 'Natalia Gómez', d: en ? 'Investor · Bogotá · Investment' : 'Inversionista · Bogotá · Inversión', v: 24000000 },
      { n: 'Mauricio Ospina', d: en ? 'Business owner · Pereira · Supply chain' : 'Empresario · Pereira · Supply chain', v: 15500000 },
      { n: 'Hernán Cárdenas', d: en ? 'Business owner · Manizales · Internationalization' : 'Empresario · Manizales · Internacionalización', v: 15000000 },
    ],
  };
}

const AREA_CORTA = {
  es: { estrategia: 'Internacionalización', comex: 'Supply chain', inversion: 'Inversión', formacion: 'Formación' },
  en: { estrategia: 'Internationalization', comex: 'Supply chain', inversion: 'Investment', formacion: 'Training' },
};

// Mes en curso, calculado en vivo a partir de los prospectos
export function mesEnCurso(leads, lang = 'es', now = new Date()) {
  const en = lang === 'en';
  const y = now.getFullYear();
  const m = now.getMonth();
  const mes = monthName(m, lang);
  const enMes = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() === y && d.getMonth() === m;
  };
  const cohorte = leads.filter((l) => enMes(l.createdAt));
  const cerrados = leads.filter((l) => l.stage === 4 && (l.activity || []).some((a) => a.k === 'cerrado' && enMes(a.at)));
  return {
    id: 'curso',
    etiqueta: (en ? mes : mes.charAt(0).toUpperCase() + mes.slice(1)) + ' ' + y + (en ? ' (in progress)' : ' (en curso)'),
    cerrado: false,
    titulo: (en ? 'for ' : 'de ') + mes,
    leads: cohorte.length,
    calificados: cohorte.filter((l) => l.stage >= 1).length,
    llamadas: cohorte.filter((l) => l.stage >= 2 || l.cita).length,
    propuestas: cohorte.filter((l) => l.stage >= 3).length,
    cierres: cerrados.length,
    valor: cerrados.reduce((s, l) => s + (l.valor || 0), 0),
    respuesta: null,
    delta: false,
    listaCierres: cerrados.map((l) => ({
      n: l.nombre,
      d: [tipoDeLead(l, lang), l.lugar.split(',')[0], AREA_CORTA[lang][l.answers.area]].filter(Boolean).join(' · '),
      v: l.valor || 0,
    })),
  };
}

export function pct(a, b) {
  return b ? Math.round((a / b) * 100) + ' %' : '—';
}
