import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seedLeads } from './seed';
import { TIPOS, puntaje } from './catalog';

const KEY = 'jsq.leads.v1';
const LeadsContext = createContext(null);

// Datos guardados por versiones anteriores: la actividad usaba texto en español en vez de códigos
const ACT_CODES = {
  'Completó el diagnóstico': 'diag',
  'Agendó la llamada': 'agendo',
  'Confirmó por WhatsApp': 'confirmo',
  'Recordatorio programado': 'recordatorio',
  Calificado: 'calificado',
  'Llamada de diagnóstico': 'llamada',
  'Llamada agendada': 'agendada',
  'Propuesta enviada': 'propuesta',
  Cerrado: 'cerrado',
  'Devuelto a nuevo': 'nuevo',
  'Cambió el horario de la llamada': 'reagendo',
};

// Los prospectos de ejemplo de versiones anteriores se descartan: el tablero solo muestra los que llegan por la landing
const IDS_EJEMPLO = new Set(seedLeads().map((l) => l.id));

function migrate(leads) {
  return leads.filter((l) => !IDS_EJEMPLO.has(l.id)).map((l) => ({
    ...l,
    lugar: l.lugar === 'Sin ciudad' ? '' : l.lugar,
    activity: (l.activity || []).map(({ t, ...a }) => (a.k ? a : { ...a, k: ACT_CODES[t] || 'diag' })),
  }));
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    // almacenamiento no disponible: el tablero arranca vacío
  }
  return [];
}

function slug(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const digitos = (x) => (x || '').replace(/\D/g, '').slice(-10);

export function nuevoLeadId(nombre) {
  return slug(nombre) + '-' + Date.now().toString(36);
}

export function LeadsProvider({ children }) {
  const [leads, setLeads] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(leads));
    } catch {
      // sin persistencia
    }
  }, [leads]);

  // Sincroniza entre pestañas: un diagnóstico enviado en la landing aparece en el panel abierto
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY && e.newValue) setLeads(migrate(JSON.parse(e.newValue)));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateLead = useCallback((id, patch) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...(typeof patch === 'function' ? patch(l) : patch) } : l)));
  }, []);

  const moveLead = useCallback((id, stage) => {
    const STAGE_ACT = ['nuevo', 'calificado', 'agendada', 'propuesta', 'cerrado'];
    setLeads((ls) =>
      ls.map((l) =>
        l.id === id && l.stage !== stage
          ? { ...l, stage, activity: [...(l.activity || []), { k: STAGE_ACT[stage], at: new Date().toISOString() }] }
          : l,
      ),
    );
  }, []);

  // Diagnóstico completado y llamada agendada desde la landing
  const addLead = useCallback(({ nombre, whatsapp, answers, cita, conCubicaje = false }) => {
    const now = new Date();
    const tipo = TIPOS[answers.perfil] || TIPOS.empresario;
    const lead = {
      id: slug(nombre) + '-' + now.getTime().toString(36),
      // Todo prospecto que llega por la landing arranca en «Nuevo»
      stage: 0,
      nombre: nombre.trim(),
      tipoLabel: tipo.label,
      lugar: '',
      answers,
      score: puntaje(answers),
      createdAt: now.toISOString(),
      cita: cita.toISOString(),
      fuente: 'Landing',
      whatsapp: whatsapp.trim(),
      correo: '',
      valor: 0,
      detalles: null,
      alertas: null,
      cita_texto: null,
      preguntasHechas: {},
      propuesta: null,
      nuevo: true,
      activity: [
        { k: 'diag', at: now.toISOString() },
        { k: 'agendo', at: now.toISOString() },
        ...(conCubicaje ? [{ k: 'cubicaje', at: now.toISOString() }] : []),
        { k: 'recordatorio', at: new Date(cita.getTime() - 24 * 3600 * 1000).toISOString(), pending: true },
      ],
    };
    setLeads((ls) => [lead, ...ls]);
    return lead;
  }, []);

  // Prospecto existente para un cubicaje de la landing: el que llegó del diagnóstico o el que tiene el mismo WhatsApp
  const resolverLead = useCallback(
    ({ leadId, whatsapp }) => {
      const d = digitos(whatsapp);
      const l = leads.find((x) => x.id === leadId) || (d.length >= 7 && leads.find((x) => digitos(x.whatsapp) === d));
      return l ? l.id : null;
    },
    [leads],
  );

  // Registra que el prospecto generó un cubicaje; si no existe, lo crea en «Nuevo» con ese id
  const registrarCubicaje = useCallback(
    ({ leadId, nombre, whatsapp, correo }) => {
      const now = new Date().toISOString();
      if (leads.some((l) => l.id === leadId)) {
        setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, correo: l.correo || correo || '', activity: [...(l.activity || []), { k: 'cubicaje', at: now }] } : l)));
        return leadId;
      }
      const answers = { area: 'comex' };
      const lead = {
        id: leadId || nuevoLeadId(nombre),
        stage: 0,
        nombre: nombre.trim(),
        tipoLabel: '',
        lugar: '',
        answers,
        score: puntaje(answers),
        createdAt: now,
        cita: null,
        fuente: 'Cubicaje',
        whatsapp: whatsapp.trim(),
        correo: correo || '',
        valor: 0,
        detalles: null,
        alertas: null,
        cita_texto: null,
        preguntasHechas: {},
        propuesta: null,
        nuevo: true,
        activity: [{ k: 'cubicaje', at: now }],
      };
      setLeads((ls) => [lead, ...ls]);
      return lead.id;
    },
    [leads],
  );

  const value = useMemo(
    () => ({ leads, updateLead, moveLead, addLead, resolverLead, registrarCubicaje }),
    [leads, updateLead, moveLead, addLead, resolverLead, registrarCubicaje],
  );
  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads debe usarse dentro de LeadsProvider');
  return ctx;
}

export function useLead(id) {
  const { leads } = useLeads();
  return leads.find((l) => l.id === id) || null;
}

// Prospecto con la próxima llamada (destino de "Briefs" y "Propuestas" en el menú)
export function useProximoLead() {
  const { leads } = useLeads();
  const conCita = leads.filter((l) => l.stage === 2 && l.cita).sort((a, b) => new Date(a.cita) - new Date(b.cita));
  const futuras = conCita.filter((l) => new Date(l.cita) >= new Date(Date.now() - 3600 * 1000));
  return futuras[0] || conCita[0] || leads.find((l) => l.stage === 3) || leads[0] || null;
}

// Campo del prospecto en el idioma activo (los datos de ejemplo traen versión en inglés en `en`)
export function campo(lead, key, lang) {
  return lang === 'en' && lead.en && lead.en[key] != null ? lead.en[key] : lead[key];
}
