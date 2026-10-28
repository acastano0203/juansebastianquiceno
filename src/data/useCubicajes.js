import { useCallback, useEffect, useState } from 'react';
import { cubicajesRepo } from './cubicajesRepo';

// Lista de cubicajes; se recarga si otra pestaña los cambia
export function useCubicajes() {
  const [estado, setEstado] = useState({ cargando: true, error: null, lista: [] });

  const recargar = useCallback(async () => {
    try {
      const lista = await cubicajesRepo.listar();
      setEstado({ cargando: false, error: null, lista });
    } catch (error) {
      setEstado((s) => ({ ...s, cargando: false, error }));
    }
  }, []);

  useEffect(() => {
    recargar();
    return cubicajesRepo.suscribir(recargar);
  }, [recargar]);

  return { ...estado, recargar };
}

export function useCubicaje(id) {
  const [estado, setEstado] = useState({ cargando: !!id, error: null, cubicaje: null });

  useEffect(() => {
    if (!id) return undefined;
    let vivo = true;
    setEstado({ cargando: true, error: null, cubicaje: null });
    cubicajesRepo
      .obtener(id)
      .then((cubicaje) => vivo && setEstado({ cargando: false, error: null, cubicaje }))
      .catch((error) => vivo && setEstado({ cargando: false, error, cubicaje: null }));
    return () => {
      vivo = false;
    };
  }, [id]);

  return estado;
}

const digitos = (x) => (x || '').replace(/\D/g, '').slice(-10);

// Cubicajes de un prospecto: por id o, si el cliente lo generó en otro navegador, por su WhatsApp
export function cubicajesDeLead(lista, lead) {
  const wa = digitos(lead.whatsapp);
  return lista.filter((c) => c.prospectoId === lead.id || (wa.length >= 7 && digitos(c.contacto?.whatsapp) === wa));
}
