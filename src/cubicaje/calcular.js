import { calcularCubicaje } from './packing.js';

let worker;
let seq = 0;
const pendientes = new Map();

function getWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./packing.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const p = pendientes.get(e.data.id);
      if (!p) return;
      pendientes.delete(e.data.id);
      if (e.data.error) p.reject(new Error(e.data.error));
      else p.resolve(e.data.resultado);
    };
    worker.onerror = () => {
      // Si el worker falla, lo pendiente se resuelve en el hilo principal
      worker = null;
      for (const [, p] of pendientes) p.fallback();
      pendientes.clear();
    };
  } catch {
    worker = null;
  }
  return worker;
}

// Calcula en un Web Worker (sin congelar la interfaz); si no hay workers, en el hilo principal
export function calcularAsync(tipoContenedor, productos) {
  const w = getWorker();
  const local = () => calcularCubicaje(tipoContenedor, productos);
  if (!w) return new Promise((resolve) => setTimeout(() => resolve(local()), 0));
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pendientes.set(id, {
      resolve,
      reject,
      fallback: () => {
        try {
          resolve(local());
        } catch (err) {
          reject(err);
        }
      },
    });
    w.postMessage({ id, tipoContenedor, productos });
  });
}
