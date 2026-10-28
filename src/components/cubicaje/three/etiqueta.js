import { CanvasTexture, SRGBColorSpace } from 'three';

// Color del texto que contrasta con el fondo
export function tinta(hex) {
  const n = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? '#123638' : '#FFFFFF';
}

export function sombra(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

const cache = new Map();

/**
 * Textura de una cara de caja: fondo del color del producto, borde y el nombre centrado.
 * ancho/alto son las medidas reales de la cara (para mantener la proporción del texto).
 */
export function texturaCara(color, texto, ancho, alto) {
  const ratio = Math.max(0.15, Math.min(6, ancho / alto));
  const key = `${color}|${texto}|${ratio.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key);

  const base = 256;
  const w = Math.round(ratio >= 1 ? base * Math.min(ratio, 2) : base);
  const h = Math.round(ratio >= 1 ? base : base * Math.min(1 / ratio, 2));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = sombra(color, -0.3);
  g.lineWidth = 6;
  g.strokeRect(3, 3, w - 6, h - 6);

  if (texto) {
    g.fillStyle = tinta(color);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = Math.min(h * 0.22, 40);
    g.font = `600 ${size}px Inter, system-ui, sans-serif`;
    while (g.measureText(texto).width > w * 0.84 && size > 12) {
      size -= 2;
      g.font = `600 ${size}px Inter, system-ui, sans-serif`;
    }
    let t = texto;
    while (g.measureText(t + '…').width > w * 0.84 && t.length > 1) t = t.slice(0, -1);
    g.fillText(t === texto ? t : t + '…', w / 2, h / 2);
  }

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}
