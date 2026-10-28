// Calcula el cubicaje fuera del hilo principal
import { calcularCubicaje } from './packing.js';

self.onmessage = (e) => {
  const { id, tipoContenedor, productos } = e.data;
  try {
    self.postMessage({ id, resultado: calcularCubicaje(tipoContenedor, productos) });
  } catch (err) {
    self.postMessage({ id, error: String(err?.message || err) });
  }
};
