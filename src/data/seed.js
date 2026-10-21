import { DAY_MS, esFestivo } from '../lib/format';
import { puntaje } from './catalog';

// Fecha relativa a hoy: días de diferencia + hora
function at(days, h = 9, m = 0, now = new Date()) {
  const d = new Date(now.getTime() + days * DAY_MS);
  d.setHours(h, m, 0, 0);
  return d;
}

// Próximo día hábil a partir de `days`
function habil(days, h, m, now = new Date()) {
  let d = at(days, h, m, now);
  while (d.getDay() === 0 || d.getDay() === 6 || esFestivo(d)) d = new Date(d.getTime() + DAY_MS);
  return d;
}

function lead(base) {
  const answers = base.answers;
  return {
    whatsapp: '',
    correo: '',
    fuente: 'Landing',
    cita: null,
    valor: 0,
    detalles: null,
    alertas: null,
    cita_texto: null,
    preguntasHechas: {},
    propuesta: null,
    ...base,
    score: base.score ?? puntaje(answers),
    createdAt: base.createdAt.toISOString(),
    cita: base.cita ? base.cita.toISOString() : null,
    activity: (base.activity || []).map((a) => ({ ...a, at: a.at.toISOString() })),
  };
}

export function seedLeads(now = new Date()) {
  const carlosCreado = at(-1, 15, 41, now);
  const carlosCita = habil(2, 10, 0, now);

  return [
    lead({
      id: 'luisa-ortiz', stage: 0, nombre: 'Luisa Fernanda Ortiz', tipoLabel: 'Empresaria', lugar: 'Medellín, Antioquia',
      answers: { perfil: 'empresario', etapa: 'local', area: 'comex', mercado: 'europa', volumen: 'pequeno', plazo: 'explorando' },
      score: 6, createdAt: new Date(now.getTime() - 2 * 3600 * 1000), fuente: 'Instagram', whatsapp: '+57 301 555 0142',
      activity: [{ k: 'diag', at: new Date(now.getTime() - 2 * 3600 * 1000) }],
    }),
    lead({
      id: 'andres-munoz', stage: 0, nombre: 'Andrés Felipe Muñoz', tipoLabel: 'Productor', lugar: 'La Plata, Huila',
      answers: { perfil: 'productor', etapa: 'local', area: 'inversion', mercado: 'nose', volumen: 'pequeno', plazo: 'seis' },
      score: 5, createdAt: at(0, 9, 12, now), whatsapp: '+57 312 555 0188',
      activity: [{ k: 'diag', at: at(0, 9, 12, now) }],
    }),
    lead({
      id: 'cafeteras-la-union', stage: 0, nombre: 'Asociación de Cafeteras de La Unión', tipoLabel: 'Institución', lugar: 'La Unión, Nariño',
      answers: { perfil: 'institucion', etapa: 'local', area: 'formacion', mercado: 'colombia', volumen: 'mediano', plazo: 'tres' },
      score: 7, createdAt: at(-1, 17, 5, now), fuente: 'Referido', whatsapp: '+57 315 555 0103',
      activity: [{ k: 'diag', at: at(-1, 17, 5, now) }],
    }),
    lead({
      id: 'diana-rojas', stage: 1, nombre: 'Diana Marcela Rojas', tipoLabel: 'Inversionista', lugar: 'Bogotá',
      answers: { perfil: 'inversionista', etapa: 'idea', area: 'inversion', mercado: 'colombia', volumen: 'capital', plazo: 'tres' },
      score: 8, createdAt: at(-3, 11, 20, now), fuente: 'LinkedIn', whatsapp: '+57 310 555 0177',
      activity: [{ k: 'diag', at: at(-3, 11, 20, now) }, { k: 'calificado', at: at(-2, 8, 30, now) }],
    }),
    lead({
      id: 'jorge-restrepo', stage: 1, nombre: 'Jorge Iván Restrepo', tipoLabel: 'Empresario', lugar: 'Rionegro, Antioquia',
      answers: { perfil: 'empresario', etapa: 'local', area: 'estrategia', mercado: 'usa', volumen: 'mediano', plazo: 'seis' },
      score: 7, createdAt: at(-4, 16, 2, now), whatsapp: '+57 300 555 0164',
      activity: [{ k: 'diag', at: at(-4, 16, 2, now) }, { k: 'calificado', at: at(-3, 9, 10, now) }],
    }),
    lead({
      id: 'carlos-rivera', stage: 2, nombre: 'Carlos Rivera', tipoLabel: 'Productor', lugar: 'Pitalito, Huila',
      answers: { perfil: 'productor', etapa: 'primeras', area: 'comex', mercado: 'usa', volumen: 'mediano', plazo: 'seis' },
      score: 9, createdAt: carlosCreado, cita: carlosCita, fuente: 'LinkedIn',
      whatsapp: '+57 310 482 7719', correo: 'carlos@fincaelmirador.co',
      cita_texto: '12 hectáreas de café especial. Quiere exportar a Estados Unidos en los próximos 6 meses.',
      razones: ['Plazo definido: 3 a 6 meses', 'Café con puntaje de taza', 'Ya tuvo contacto con un comprador'],
      detalles: [
        ['Finca', 'El Mirador, Pitalito · 1.650 m s. n. m.'],
        ['Área y variedades', '12 ha · Caturra, Castillo y un lote de Geisha'],
        ['Producción anual', '≈ 150 cargas de pergamino seco (18.750 kg)'],
        ['Calidad', '84 puntos SCA en promedio · 86,5 en el Geisha'],
        ['A quién le vende hoy', 'Cooperativa local y 2 tostadores en Bogotá'],
        ['Contacto con el exterior', 'Envió muestras a un importador en Miami en agosto'],
      ],
      preguntas: [
        { q: '¿Ya tiene un comprador definido en Estados Unidos o está buscándolo?', why: 'Cambia el alcance: cerrar con el importador de Miami o abrir canal desde cero.' },
        { q: '¿Exportaría directo o a través de un exportador autorizado?', why: 'Define tiempos de registro y quién asume la logística y los documentos.' },
        { q: '¿Cuántos kilos puede comprometer el primer año sin dejar mal a sus clientes actuales?', why: 'Con ≈ 15 t de verde, cada contrato pesa sobre lo que hoy vende en Colombia.' },
        { q: '¿Tiene claro su costo de producción por carga?', why: 'Sin ese dato no hay forma de saber si el precio FOB le deja margen.' },
        { q: '¿Qué espera del importador: mejor precio, volumen fijo o continuidad?', why: 'Orienta la negociación y el tipo de contrato que conviene.' },
      ],
      incluye: ['Costeo de exportación FOB por kilo', 'Requisitos FDA y documentación', 'Exportar directo o con un exportador aliado', 'Acompañamiento del primer envío'],
      alertas: [
        'Su volumen (≈ 15 t de café verde al año) no llena un contenedor de 20 pies (≈ 19 t). Hay que evaluar envío consolidado o exportar con un aliado que maneje microlotes.',
        'No ha dicho si está inscrito como exportador de café. Si no, la ruta directa suma tiempo al plazo de 6 meses.',
      ],
      en: {
        cita_texto: '12 hectares of specialty coffee. Wants to export to the United States within the next 6 months.',
        razones: ['Clear timeline: 3 to 6 months', 'Coffee with cupping scores', 'Already in touch with a buyer'],
        detalles: [
          ['Farm', 'El Mirador, Pitalito · 1,650 m above sea level'],
          ['Area and varieties', '12 ha · Caturra, Castillo and a Geisha lot'],
          ['Annual production', '≈ 150 loads of dry parchment (18,750 kg)'],
          ['Quality', '84 SCA points on average · 86.5 for the Geisha'],
          ['Current buyers', 'Local cooperative and 2 roasters in Bogotá'],
          ['Contact abroad', 'Sent samples to an importer in Miami in August'],
        ],
        preguntas: [
          { q: 'Does he already have a defined buyer in the United States, or is he looking for one?', why: 'Changes the scope: close with the Miami importer or open a channel from scratch.' },
          { q: 'Would he export directly or through a licensed exporter?', why: 'Defines registration time and who handles logistics and documents.' },
          { q: 'How many kilos can he commit in the first year without letting down his current clients?', why: 'With ≈ 15 t of green coffee, every contract affects what he sells in Colombia today.' },
          { q: 'Does he know his production cost per load?', why: "Without it there's no way to know if the FOB price leaves him a margin." },
          { q: 'What does he expect from the importer: better price, fixed volume or continuity?', why: 'Guides the negotiation and the right type of contract.' },
        ],
        incluye: ['FOB export costing per kilo', 'FDA requirements and documentation', 'Export directly or through a partner exporter', 'Support through the first shipment'],
        alertas: [
          'His volume (≈ 15 t of green coffee a year) does not fill a 20-foot container (≈ 19 t). Consider a consolidated shipment or exporting with a partner that handles micro-lots.',
          "He hasn't said whether he is registered as a coffee exporter. If not, the direct route adds time to the 6-month timeline.",
        ],
      },
      activity: [
        { k: 'diag', at: carlosCreado },
        { k: 'agendo', at: new Date(carlosCreado.getTime() + 3 * 60000) },
        { k: 'confirmo', at: new Date(carlosCreado.getTime() + 11 * 60000) },
        { k: 'recordatorio', at: new Date(carlosCita.getTime() - DAY_MS - 3600 * 1000), pending: true },
      ],
    }),
    lead({
      id: 'paula-benavides', stage: 2, nombre: 'Paula Andrea Benavides', tipoLabel: 'Productora', lugar: 'Buesaco, Nariño',
      answers: { perfil: 'productor', etapa: 'local', area: 'formacion', mercado: 'colombia', volumen: 'pequeno', plazo: 'tres' },
      score: 7, createdAt: at(-2, 10, 15, now), cita: habil(3, 15, 30, now), whatsapp: '+57 318 555 0121',
      activity: [{ k: 'diag', at: at(-2, 10, 15, now) }, { k: 'agendo', at: at(-2, 10, 19, now) }],
    }),
    lead({
      id: 'santiago-velez', stage: 3, nombre: 'Santiago Vélez', tipoLabel: 'Empresario', lugar: 'Medellín, Antioquia',
      answers: { perfil: 'empresario', etapa: 'primeras', area: 'comex', mercado: 'usa', volumen: 'mediano', plazo: 'tres' },
      score: 8, createdAt: at(-12, 9, 40, now), valor: 18500000, whatsapp: '+57 304 555 0150',
      activity: [{ k: 'diag', at: at(-12, 9, 40, now) }, { k: 'llamada', at: at(-8, 10, 0, now) }, { k: 'propuesta', at: at(-6, 16, 0, now) }],
    }),
    lead({
      id: 'cooperativa-sur', stage: 3, nombre: 'Cooperativa Agraria del Sur', tipoLabel: 'Institución', lugar: 'Neiva, Huila',
      answers: { perfil: 'institucion', etapa: 'local', area: 'formacion', mercado: 'colombia', volumen: 'grande', plazo: 'tres' },
      score: 8, createdAt: at(-15, 14, 0, now), valor: 27600000, fuente: 'Referido',
      activity: [{ k: 'diag', at: at(-15, 14, 0, now) }, { k: 'llamada', at: at(-11, 11, 30, now) }, { k: 'propuesta', at: at(-9, 9, 0, now) }],
    }),
    lead({
      id: 'natalia-gomez', stage: 4, nombre: 'Natalia Gómez', tipoLabel: 'Inversionista', lugar: 'Bogotá',
      answers: { perfil: 'inversionista', etapa: 'idea', area: 'inversion', mercado: 'colombia', volumen: 'capital', plazo: 'mes' },
      score: 9, createdAt: at(-28, 8, 50, now), valor: 24000000, fuente: 'LinkedIn',
      activity: [{ k: 'diag', at: at(-28, 8, 50, now) }, { k: 'propuesta', at: at(-20, 9, 0, now) }, { k: 'cerrado', at: at(-14, 12, 0, now) }],
    }),
    lead({
      id: 'raices-macizo', stage: 4, nombre: 'Corporación Raíces del Macizo', tipoLabel: 'Institución', lugar: 'Pasto, Nariño',
      answers: { perfil: 'institucion', etapa: 'local', area: 'formacion', mercado: 'colombia', volumen: 'grande', plazo: 'tres' },
      score: 8, createdAt: at(-26, 15, 10, now), valor: 32000000, fuente: 'Referido',
      activity: [{ k: 'diag', at: at(-26, 15, 10, now) }, { k: 'propuesta', at: at(-18, 9, 0, now) }, { k: 'cerrado', at: at(-10, 12, 0, now) }],
    }),
  ];
}
