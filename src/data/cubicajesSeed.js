// Cubicajes de ejemplo para el modo local: repartidos en los últimos 12 meses y calculados de verdad.
import { CONTENEDORES } from '../cubicaje/config';
import { calcularAsync } from '../cubicaje/calcular';
import { estadoDe } from './cubicajesRepo';

const CARGAS = [
  { nombre: 'Café tostado · caja máster', largo: 60, ancho: 40, alto: 35, peso: 14, color: '#995837', limitaRotX: true, limitePeso: { activo: true, superior: 60, frontal: 40 } },
  { nombre: 'Café verde en cajas', largo: 70, ancho: 45, alto: 40, peso: 30, color: '#123638', limitePeso: { activo: true, superior: 150, frontal: 90 } },
  { nombre: 'Cacao en grano', largo: 80, ancho: 58, alto: 59, peso: 32, color: '#2C6B6E', limitePeso: { activo: true, superior: 120, frontal: 80 } },
  { nombre: 'Panela orgánica', largo: 40, ancho: 47, alto: 34, peso: 18, color: '#DDBD62', limitaRotZ: true },
  { nombre: 'Flores secas', largo: 100, ancho: 50, alto: 30, peso: 8, color: '#C9774B', limitaRotX: true, limitaRotZ: true, limitePeso: { activo: true, superior: 40 } },
  { nombre: 'Repuestos agrícolas', largo: 120, ancho: 80, alto: 90, peso: 180, color: '#5B7F95' },
  { nombre: 'Muebles en kit', largo: 200, ancho: 90, alto: 40, peso: 60, color: '#7FB07F' },
  { nombre: 'Textiles', largo: 60, ancho: 50, alto: 50, peso: 20, color: '#B8D8B8' },
  { nombre: 'Frutas deshidratadas', largo: 50, ancho: 40, alto: 30, peso: 12, color: '#C9774B', limitaRotX: true },
  { nombre: 'Artesanías', largo: 70, ancho: 60, alto: 50, peso: 15, color: '#DDBD62', limitePeso: { activo: true, superior: 30 } },
];
const DESTINOS = ['Miami', 'Hamburgo', 'Rotterdam', 'Guayaquil', 'Ciudad de Panamá', 'Valencia', 'Houston', 'Yokohama', 'Amberes', 'Veracruz', 'Montreal', 'Busan'];
// Cubicajes creados por mes, del más antiguo al mes en curso
const POR_MES = [3, 4, 3, 4, 5, 6, 5, 6, 7, 8, 9, 7];
// Prospectos de ejemplo de comercio exterior que dejaron su cubicaje en el diagnóstico
const DIAGNOSTICO = ['carlos-rivera', 'santiago-velez', 'luisa-ortiz'];

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export async function generarEjemplos(ahora = new Date()) {
  const r = rng(7);
  const out = [];
  let n = 0;
  for (let i = 0; i < 12; i++) {
    const mes = new Date(ahora.getFullYear(), ahora.getMonth() - 11 + i, 1);
    const diasMes = i === 11 ? ahora.getDate() : new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    for (let k = 0; k < POR_MES[i]; k++) {
      const tipo = ['20', '40', '40HC'][Math.floor(r() * 3)];
      const cont = CONTENEDORES[tipo];
      const volCont = cont.largo * cont.ancho * cont.alto;
      // Llenado objetivo: casi siempre cabe; de vez en cuando se pasa
      const llenado = n % 9 === 4 ? 1.2 : 0.4 + r() * 0.3;
      const nProd = 1 + Math.floor(r() * 3);
      const elegidas = [];
      while (elegidas.length < nProd) {
        const c = CARGAS[Math.floor(r() * CARGAS.length)];
        if (!elegidas.includes(c)) elegidas.push(c);
      }
      const productos = elegidas.map((c, j) => ({
        ...c,
        id: 'p' + (j + 1),
        tipoPaquete: 'box',
        limitaRotX: !!c.limitaRotX,
        limitaRotZ: !!c.limitaRotZ,
        limitePeso: c.limitePeso ? { superior: null, frontal: null, ...c.limitePeso } : { activo: false, superior: null, frontal: null },
        cantidad: Math.max(1, Math.round((volCont * llenado) / nProd / (c.largo * c.ancho * c.alto))),
      }));
      const fecha = new Date(mes.getFullYear(), mes.getMonth(), Math.max(1, Math.round(diasMes - (k + 0.5) * (diasMes / POR_MES[i]))), 9 + (n % 8), (n * 7) % 60);
      const borrador = n % 11 === 6;
      const diag = n % 13 === 3 && DIAGNOSTICO.length > out.filter((c) => c.origen === 'diagnostico').length;
      const resultado = borrador ? null : await calcularAsync(tipo, productos);
      out.push({
        id: 'ej-' + String(n + 1).padStart(3, '0'),
        nombre: elegidas[0].nombre.split(' · ')[0] + ' — ' + DESTINOS[Math.floor(r() * DESTINOS.length)],
        tipoContenedor: tipo,
        origen: diag ? 'diagnostico' : 'admin',
        prospectoId: diag ? DIAGNOSTICO[out.filter((c) => c.origen === 'diagnostico').length] : null,
        estado: estadoDe(resultado),
        productos,
        resultado,
        createdAt: fecha.toISOString(),
        updatedAt: fecha.toISOString(),
      });
      n++;
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
