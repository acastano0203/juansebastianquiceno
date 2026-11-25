// Textos de la página "Sedes": copia exacta de la sección #contacto de juansebastianquiceno.com.
// Las direcciones no se traducen (el original las muestra igual en ambos idiomas).
const DIRECCIONES = {
  usa: ['848 Brickell Ave, Ste 950', 'Miami, FL. US 33131'],
  colombia: ['Carrera 15 No 12-37 Oficina 506', 'Edificio Torre Núcleo, Pereira, Risaralda'],
};

export const SEDES_MESSAGES = {
  es: {
    menu: 'Sedes',
    badge: 'Presencia Internacional',
    titulo: 'Sedes Internacionales y Nodos de Operación en Colombia y Estados Unidos',
    intro: 'Presencia directa y representación estratégica en nodos logísticos clave para facilitar tus negociaciones globales.',
    mapa: 'Ver ubicación en Google Maps',
    lista: [
      { titulo: 'Sede Estados Unidos: Hub Comercial en Miami, Florida', direccion: DIRECCIONES.usa, alt: 'Sede Estados Unidos en Miami, Florida' },
      { titulo: 'Sede Colombia: Eje Cafetero y Operaciones en Pereira', direccion: DIRECCIONES.colombia, alt: 'Sede Colombia en Pereira, Risaralda' },
    ],
  },
  en: {
    menu: 'Offices',
    badge: 'International Presence',
    titulo: 'International Offices & Operational Hubs in Colombia & the United States',
    intro: 'Direct presence and strategic representation across key logistics nodes to empower your global negotiations.',
    mapa: 'View location on Google Maps',
    lista: [
      { titulo: 'United States Office: Commercial Hub in Miami, Florida', direccion: DIRECCIONES.usa, alt: 'United States office in Miami, Florida' },
      { titulo: 'Colombia Office: Coffee Axis & Operations in Pereira', direccion: DIRECCIONES.colombia, alt: 'Colombia office in Pereira, Risaralda' },
    ],
  },
};
