import { AREAS, answerLabel, mercadoNombre } from './catalog';

// Borrador de propuesta: cada sección tiene variantes que "Regenerar sección" recorre.

const CARLOS = {
  titulo: 'Ruta de exportación',
  destino: 'a Estados Unidos',
  para: 'Preparada para Carlos Rivera · Finca El Mirador, Pitalito (Huila)',
  variantes: {
    contexto: [
      'Carlos Rivera produce café especial en la finca El Mirador (Pitalito, Huila): 12 hectáreas y cerca de 150 cargas de pergamino seco al año. Hoy vende a una cooperativa local y a dos tostadores en Bogotá. En agosto envió muestras a un importador en Miami, que pidió una cotización FOB por 40 sacos del lote Geisha y del perfil de 84 puntos.',
      'La finca El Mirador tiene 12 hectáreas en Pitalito, Huila, con un promedio de 84 puntos SCA y un lote Geisha de 86,5. Carlos quiere pasar de vender solo en Colombia a exportar a Estados Unidos antes de abril de 2027, empezando por un importador de Miami que ya probó sus muestras.',
    ],
    diagnostico: [
      'El café está listo para exportar; la operación todavía no. Hay tres vacíos: no existe un costo por kilo que permita cotizar FOB con margen claro, Carlos no está inscrito como exportador y el trámite puede tomar varias semanas, y su volumen anual (≈ 15 t de verde) no llena un contenedor, así que el primer envío debe ir consolidado o con un exportador aliado.',
      'La calidad no es el problema: los puntajes y el interés del importador lo confirman. El riesgo está en cotizar sin conocer el costo real, en el tiempo del registro como exportador y en el volumen: con ≈ 15 t de verde al año, comprometer 40 sacos con el importador reduce lo que queda para sus clientes actuales.',
    ],
    alcance: [
      '1. Costeo de exportación: costo por kilo desde la finca hasta FOB Cartagena y precio mínimo de venta.\n2. Ruta operativa: exportar directo o con un exportador aliado, con trámites, tiempos y costos de cada opción.\n3. Requisitos para Estados Unidos: registro FDA, aviso previo y documentos del envío.\n4. Primer envío: revisión de la cotización, contrato con el importador y seguimiento hasta el embarque.',
      'Fase 1 · Números: costo por kilo, precio FOB mínimo y margen por lote.\nFase 2 · Ruta: exportar directo o con aliado, con trámites y tiempos de cada opción.\nFase 3 · Primer envío: cotización, contrato con el importador de Miami y seguimiento hasta el embarque.',
    ],
    tiempos: [
      '8 semanas, del 19 de octubre al 11 de diciembre de 2026.\nSemanas 1 y 2: costeo y precio mínimo.\nSemanas 3 a 5: ruta operativa y requisitos FDA.\nSemanas 6 a 8: cotización, contrato y preparación del envío.\nEmbarque estimado: enero de 2027, dentro del plazo de 6 meses.',
      'Arranque el lunes 19 de octubre. Una entrega cada dos semanas, con una sesión de revisión de 60 minutos por entrega. Cierre el 11 de diciembre, con el primer envío listo para salir en enero de 2027.',
    ],
  },
  inversion: [
    {
      rows: [
        { c: 'Fase 1 · Costeo y precio mínimo', v: 4200000 },
        { c: 'Fase 2 · Ruta operativa y requisitos FDA', v: 6400000 },
        { c: 'Fase 3 · Acompañamiento del primer envío', v: 4200000 },
      ],
      nota: 'Forma de pago: 40 % al iniciar, 30 % al entregar la fase 2 y 30 % al cierre. Los viajes a Pitalito, si se requieren, se facturan aparte.',
    },
    {
      rows: [
        { c: 'Pago 1 · Al iniciar', v: 7400000 },
        { c: 'Pago 2 · Al entregar la fase 2', v: 7400000 },
      ],
      nota: 'Dos pagos iguales que cubren las tres fases. Los viajes a Pitalito, si se requieren, se facturan aparte.',
    },
  ],
  transcripcion: {
    resumen: '32 min · transcripción automática',
    lineas: [
      ['JS', 'Juan Sebastián', '00:02', 'Carlos, gracias por el tiempo. Revisé tus respuestas. Cuéntame del importador de Miami.'],
      ['CR', 'Carlos Rivera', '00:41', 'Les mandé muestras en agosto. Les gustó el Geisha y el de 84. Me pidieron precio FOB por 40 sacos.'],
      ['JS', 'Juan Sebastián', '02:15', '¿Ya sabes cuánto te cuesta producir una carga?'],
      ['CR', 'Carlos Rivera', '02:30', 'Más o menos. Yo calculo como un millón cien, pero no lo tengo todo anotado.'],
      ['CR', 'Carlos Rivera', '04:58', 'No estoy inscrito como exportador. Pensé que la cooperativa me podía ayudar con eso.'],
      ['JS', 'Juan Sebastián', '07:20', 'Con tu volumen no llenas un contenedor. Hay que mirar si conviene ir consolidado o con un exportador que maneje microlotes.'],
      ['CR', 'Carlos Rivera', '09:45', 'Lo que no quiero es quedarle mal a los tostadores de Bogotá.'],
      ['CR', 'Carlos Rivera', '14:10', 'Si puedo mandar el primer envío en enero, me sirve.'],
    ],
  },
  notas: 'Costo por carga sin soporte: arrancar por costeo.\nNo comprometer el volumen de los tostadores de Bogotá.\nMeta: primer envío en enero de 2027.',
};

const FASES = {
  estrategia: ['Mercados y priorización', 'Modelo de entrada y precios', 'Plan de crecimiento'],
  comex: ['Costeo y precio mínimo', 'Ruta operativa y requisitos', 'Acompañamiento del primer envío'],
  inversion: ['Modelo financiero', 'Riesgos y escenarios', 'Estructura de inversión'],
  formacion: ['Diagnóstico de capacidades', 'Talleres y mentoría', 'Seguimiento y cierre'],
};

function generico(lead) {
  const a = lead.answers;
  const area = AREAS[a.area] || AREAS.comex;
  const merc = mercadoNombre(a.mercado);
  const etapa = answerLabel('etapa', a.etapa).toLowerCase();
  const plazo = answerLabel('plazo', a.plazo).toLowerCase();
  const fases = FASES[a.area] || FASES.comex;
  const total = lead.valor || area.precio;
  const p1 = Math.round((total * 0.3) / 100000) * 100000;
  const p2 = Math.round((total * 0.4) / 100000) * 100000;
  const p3 = total - p1 - p2;

  return {
    titulo: area.servicio,
    destino: a.mercado && a.mercado !== 'nose' && a.mercado !== 'colombia' ? 'para ' + merc : '',
    para: 'Preparada para ' + lead.nombre + (lead.lugar ? ' · ' + lead.lugar : ''),
    variantes: {
      contexto: [
        lead.nombre + ' (' + lead.tipoLabel.toLowerCase() + (lead.lugar ? ', ' + lead.lugar : '') + ') está en etapa de ' + etapa + ' y busca avanzar en ' + area.nombre.toLowerCase() + ', con la mira puesta en ' + merc + '. Quiere avanzar ' + plazo + '.',
        'El punto de partida de ' + lead.nombre + ' es claro: ' + etapa + '. El objetivo es avanzar en ' + area.nombre.toLowerCase() + ' ' + plazo + ', con foco en ' + merc + '.',
      ],
      diagnostico: [
        '[Completar después de la llamada: qué está listo, qué falta y cuáles son los principales riesgos.]',
        '[Completar después de la llamada: los dos o tres vacíos que hay que resolver antes de avanzar.]',
      ],
      alcance: [
        area.incluye.map((x, i) => i + 1 + '. ' + x + '.').join('\n'),
        fases.map((f, i) => 'Fase ' + (i + 1) + ' · ' + f + '.').join('\n'),
      ],
      tiempos: [
        area.duracion + ', con una entrega por fase y una sesión de revisión de 60 minutos por entrega.\n[Fecha de inicio] a [fecha de cierre].',
        'Arranque en [fecha]. Una entrega cada dos semanas durante ' + area.duracion + '.',
      ],
    },
    inversion: [
      {
        rows: fases.map((f, i) => ({ c: 'Fase ' + (i + 1) + ' · ' + f, v: [p1, p2, p3][i] })),
        nota: 'Forma de pago: 40 % al iniciar, 30 % al entregar la fase 2 y 30 % al cierre. Los viajes, si se requieren, se facturan aparte.',
      },
      {
        rows: [
          { c: 'Pago 1 · Al iniciar', v: Math.round(total / 2) },
          { c: 'Pago 2 · A mitad del proyecto', v: total - Math.round(total / 2) },
        ],
        nota: 'Dos pagos iguales que cubren todas las fases. Los viajes, si se requieren, se facturan aparte.',
      },
    ],
    transcripcion: null,
    notas: '',
  };
}

export function plantillaPropuesta(lead) {
  return lead.id === 'carlos-rivera' ? CARLOS : generico(lead);
}

export function totalInversion(rows) {
  return rows.reduce((s, r) => s + r.v, 0);
}
