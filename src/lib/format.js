export const DAY_MS = 24 * 60 * 60 * 1000;

const DOWS = {
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const MESES = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export const cap = (x) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);

export function money(n) {
  return '$' + Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Número con separadores locales: 1.946.210,5 en español, 1,946,210.5 en inglés
export function num(n, decimales = 0, lang = 'es') {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n || 0);
}

export function monthName(m, lang = 'es') {
  return MESES[lang][m];
}

export function dayName(d, lang = 'es') {
  return DOWS[lang][new Date(d).getDay()];
}

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

// es: "Jueves 8 de octubre" · en: "Thursday, October 8"
export function fechaLarga(d, lang = 'es') {
  const x = new Date(d);
  if (lang === 'en') return DOWS.en[x.getDay()] + ', ' + MESES.en[x.getMonth()] + ' ' + x.getDate();
  return cap(DOWS.es[x.getDay()]) + ' ' + x.getDate() + ' de ' + MESES.es[x.getMonth()];
}

// es: "8 de octubre de 2026" · en: "October 8, 2026"
export function fechaConAnio(d, lang = 'es') {
  const x = new Date(d);
  if (lang === 'en') return MESES.en[x.getMonth()] + ' ' + x.getDate() + ', ' + x.getFullYear();
  return x.getDate() + ' de ' + MESES.es[x.getMonth()] + ' de ' + x.getFullYear();
}

// es: "Jue 8 oct" · en: "Thu Oct 8"
export function fechaCorta(d, lang = 'es') {
  const x = new Date(d);
  if (lang === 'en') return DOWS.en[x.getDay()].slice(0, 3) + ' ' + MESES.en[x.getMonth()].slice(0, 3) + ' ' + x.getDate();
  return cap(DOWS.es[x.getDay()].slice(0, 3)) + ' ' + x.getDate() + ' ' + MESES.es[x.getMonth()].slice(0, 3);
}

// es: "5 oct" · en: "Oct 5"
export function diaMes(d, lang = 'es') {
  const x = new Date(d);
  if (lang === 'en') return MESES.en[x.getMonth()].slice(0, 3) + ' ' + x.getDate();
  return x.getDate() + ' ' + MESES.es[x.getMonth()].slice(0, 3);
}

// Minutos desde medianoche -> es: "10:00 a. m." · en: "10:00 AM"
export function horaMin(min, lang = 'es') {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const am = h < 12;
  h = h % 12 || 12;
  const suf = lang === 'en' ? (am ? 'AM' : 'PM') : am ? 'a. m.' : 'p. m.';
  return h + ':' + String(m).padStart(2, '0') + ' ' + suf;
}

export function minutosDe(d) {
  const x = new Date(d);
  return x.getHours() * 60 + x.getMinutes();
}

export function hora(d, lang = 'es') {
  return horaMin(minutosDe(d), lang);
}

export function haceCuanto(d, lang = 'es', now = new Date()) {
  const en = lang === 'en';
  const diff = now - new Date(d);
  const min = Math.round(diff / 60000);
  if (min < 1) return en ? 'Just now' : 'Hace un momento';
  if (min < 60) return en ? min + ' min ago' : 'Hace ' + min + ' min';
  const h = Math.round(min / 60);
  if (sameDay(d, now)) return en ? (h === 1 ? '1 hour ago' : h + ' hours ago') : h === 1 ? 'Hace 1 hora' : 'Hace ' + h + ' horas';
  if (sameDay(d, new Date(now - DAY_MS))) return en ? 'Yesterday' : 'Ayer';
  return diaMes(d, lang);
}

export function enCuanto(d, lang = 'es', now = new Date()) {
  const en = lang === 'en';
  const days = Math.round((startOfDay(d) - startOfDay(now)) / DAY_MS);
  if (days === 0) return en ? 'today' : 'hoy';
  if (days === 1) return en ? 'tomorrow' : 'mañana';
  if (days > 1) return en ? 'in ' + days + ' days' : 'en ' + days + ' días';
  if (days === -1) return en ? 'yesterday' : 'ayer';
  return en ? -days + ' days ago' : 'hace ' + -days + ' días';
}

export function iniciales(nombre) {
  return (nombre || '')
    .split(/\s+/)
    .filter((w) => w && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

// Festivos de Colombia (2026 y comienzos de 2027)
const FESTIVOS = new Set([
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18',
  '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12',
  '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25', '2027-01-01', '2027-01-11', '2027-03-22',
]);

export function isoDay(d) {
  const x = new Date(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}

export function esFestivo(d) {
  return FESTIVOS.has(isoDay(d));
}
