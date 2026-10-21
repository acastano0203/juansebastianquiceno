// Contenido del diagnóstico y de los servicios (español del diseño + inglés).

const Q = {
  es: [
    {
      key: 'perfil',
      label: 'Perfil',
      q: '¿Qué te describe mejor?',
      help: 'Así entiendo desde qué lugar ves la oportunidad.',
      opts: [
        { id: 'productor', t: 'Productor', d: 'Tengo finca o cultivo propio y quiero vender mejor.' },
        { id: 'empresario', t: 'Empresario', d: 'Dirijo una empresa que quiere crecer o llegar a otros mercados.' },
        { id: 'inversionista', t: 'Inversionista', d: 'Evalúo dónde poner capital en café o agroindustria.' },
        { id: 'institucion', t: 'Institución', d: 'Represento una asociación, cooperativa, gremio o entidad pública.' },
      ],
    },
    {
      key: 'etapa',
      label: 'Etapa del negocio',
      q: '¿En qué etapa está tu negocio?',
      help: 'No hay una respuesta mejor que otra. Solo cambia el punto de partida.',
      opts: [
        { id: 'idea', t: 'Idea o validación', d: 'Todavía estoy evaluando si el negocio tiene sentido.' },
        { id: 'local', t: 'Operando en el mercado local', d: 'Vendo en Colombia y quiero dar el siguiente paso.' },
        { id: 'primeras', t: 'Primeras ventas al exterior', d: 'Ya hice envíos o mandé muestras, pero sin continuidad.' },
        { id: 'constante', t: 'Exportando de forma constante', d: 'Tengo clientes afuera y quiero ordenar o crecer.' },
      ],
    },
    {
      key: 'area',
      label: 'Qué resolver',
      q: '¿Qué necesitas resolver?',
      help: 'Escoge la que más pesa hoy. En la llamada revisamos el resto.',
      opts: [
        { id: 'estrategia', t: 'Estrategia e internacionalización', d: 'Definir mercados, modelo de entrada y plan de crecimiento.' },
        { id: 'comex', t: 'Comercio exterior y supply chain', d: 'Costos, logística y documentación para exportar o importar.' },
        { id: 'inversion', t: 'Café, agroindustria e inversión', d: 'Estructurar un proyecto productivo o evaluar una inversión.' },
        { id: 'formacion', t: 'Formación y mentoría', d: 'Fortalecer las capacidades de mi equipo o mi asociación.' },
      ],
    },
    {
      key: 'mercado',
      label: 'Mercado',
      q: '¿A qué mercado quieres llegar?',
      help: 'Si todavía no lo tienes claro, también sirve saberlo.',
      opts: [
        { id: 'usa', t: 'Estados Unidos', d: '' },
        { id: 'europa', t: 'Europa', d: '' },
        { id: 'asia', t: 'Asia', d: 'Japón, Corea del Sur, China' },
        { id: 'medio', t: 'Medio Oriente', d: 'Emiratos Árabes, Arabia Saudita' },
        { id: 'colombia', t: 'Mercado nacional', d: 'Crecer primero en Colombia' },
        { id: 'nose', t: 'Aún no lo sé', d: 'Quiero comparar opciones' },
      ],
    },
    {
      key: 'volumen',
      label: 'Tamaño',
      q: '¿Cuál es el tamaño aproximado?',
      help: 'Un rango es suficiente. Toma la referencia que aplique a tu caso.',
      opts: [
        { id: 'pequeno', t: 'Pequeño', d: 'Menos de 10 hectáreas o ventas hasta $500 millones al año.' },
        { id: 'mediano', t: 'Mediano', d: 'De 10 a 50 hectáreas o ventas entre $500 y $3.000 millones al año.' },
        { id: 'grande', t: 'Grande', d: 'Más de 50 hectáreas o ventas superiores a $3.000 millones al año.' },
        { id: 'capital', t: 'Capital para invertir', d: 'Un monto disponible entre $200 y $2.000 millones.' },
      ],
    },
    {
      key: 'plazo',
      label: 'Plazo',
      q: '¿Qué tan pronto necesitas avanzar?',
      help: 'Me ayuda a proponer un ritmo de trabajo realista.',
      opts: [
        { id: 'mes', t: 'En el próximo mes', d: 'Hay una decisión o un cliente esperando.' },
        { id: 'tres', t: 'En 1 a 3 meses', d: 'Quiero arrancar este trimestre.' },
        { id: 'seis', t: 'En 3 a 6 meses', d: 'Tengo una meta definida para el próximo semestre.' },
        { id: 'explorando', t: 'En más de 6 meses', d: 'Estoy explorando y quiero hacerlo bien.' },
      ],
    },
  ],
  en: [
    {
      key: 'perfil',
      label: 'Profile',
      q: 'What describes you best?',
      help: 'It helps me understand where you see the opportunity from.',
      opts: [
        { id: 'productor', t: 'Grower', d: 'I own a farm or crop and want to sell better.' },
        { id: 'empresario', t: 'Business owner', d: 'I run a company that wants to grow or reach new markets.' },
        { id: 'inversionista', t: 'Investor', d: "I'm evaluating where to put capital in coffee or agribusiness." },
        { id: 'institucion', t: 'Institution', d: 'I represent an association, cooperative, trade group or public entity.' },
      ],
    },
    {
      key: 'etapa',
      label: 'Business stage',
      q: 'What stage is your business at?',
      help: 'No answer is better than another. It only changes the starting point.',
      opts: [
        { id: 'idea', t: 'Idea or validation', d: "I'm still evaluating whether the business makes sense." },
        { id: 'local', t: 'Operating locally', d: 'I sell in Colombia and want to take the next step.' },
        { id: 'primeras', t: 'First sales abroad', d: "I've shipped or sent samples, but not consistently." },
        { id: 'constante', t: 'Exporting regularly', d: 'I have clients abroad and want to organize or grow.' },
      ],
    },
    {
      key: 'area',
      label: 'What to solve',
      q: 'What do you need to solve?',
      help: "Choose the one that matters most today. We'll cover the rest on the call.",
      opts: [
        { id: 'estrategia', t: 'Strategy and internationalization', d: 'Define markets, entry model and growth plan.' },
        { id: 'comex', t: 'Foreign trade and supply chain', d: 'Costs, logistics and documentation to export or import.' },
        { id: 'inversion', t: 'Coffee, agribusiness and investment', d: 'Structure a productive project or evaluate an investment.' },
        { id: 'formacion', t: 'Training and mentoring', d: "Strengthen my team's or association's capabilities." },
      ],
    },
    {
      key: 'mercado',
      label: 'Market',
      q: 'Which market do you want to reach?',
      help: "If you're not sure yet, that's useful to know too.",
      opts: [
        { id: 'usa', t: 'United States', d: '' },
        { id: 'europa', t: 'Europe', d: '' },
        { id: 'asia', t: 'Asia', d: 'Japan, South Korea, China' },
        { id: 'medio', t: 'Middle East', d: 'United Arab Emirates, Saudi Arabia' },
        { id: 'colombia', t: 'Domestic market', d: 'Grow in Colombia first' },
        { id: 'nose', t: "I don't know yet", d: 'I want to compare options' },
      ],
    },
    {
      key: 'volumen',
      label: 'Size',
      q: 'What is the approximate size?',
      help: 'A range is enough. Use whichever reference applies to you.',
      opts: [
        { id: 'pequeno', t: 'Small', d: 'Under 10 hectares or sales up to COP 500 million a year.' },
        { id: 'mediano', t: 'Medium', d: '10 to 50 hectares or sales of COP 500–3,000 million a year.' },
        { id: 'grande', t: 'Large', d: 'Over 50 hectares or sales above COP 3,000 million a year.' },
        { id: 'capital', t: 'Capital to invest', d: 'Available funds between COP 200 and 2,000 million.' },
      ],
    },
    {
      key: 'plazo',
      label: 'Timeline',
      q: 'How soon do you need to move forward?',
      help: 'It helps me propose a realistic pace of work.',
      opts: [
        { id: 'mes', t: 'Within the next month', d: "There's a decision or a client waiting." },
        { id: 'tres', t: 'In 1 to 3 months', d: 'I want to start this quarter.' },
        { id: 'seis', t: 'In 3 to 6 months', d: 'I have a defined goal for the next semester.' },
        { id: 'explorando', t: 'In more than 6 months', d: "I'm exploring and want to do it right." },
      ],
    },
  ],
};

export function getQuestions(lang = 'es') {
  return Q[lang] || Q.es;
}

// Compatibilidad: preguntas en español
export const QUESTIONS = Q.es;

export function answerLabel(key, id, lang = 'es') {
  const q = getQuestions(lang).find((x) => x.key === key);
  const o = q && q.opts.find((x) => x.id === id);
  return o ? o.t : '';
}

const STAGE_DOTS = ['#B8D8B8', '#7FB07F', '#DDBD62', '#995837', '#123638'];
const STAGE_NAMES = {
  es: ['Nuevo', 'Calificado', 'Llamada agendada', 'Propuesta enviada', 'Cerrado'],
  en: ['New', 'Qualified', 'Call booked', 'Proposal sent', 'Closed'],
};

export function getStages(lang = 'es') {
  return STAGE_NAMES[lang].map((name, i) => ({ name, dot: STAGE_DOTS[i] }));
}

export const STAGES = getStages('es');

export const TIPOS = {
  productor: { label: 'Productor', en: 'Grower', dot: '#995837' },
  empresario: { label: 'Empresario', en: 'Business owner', dot: '#123638' },
  inversionista: { label: 'Inversionista', en: 'Investor', dot: '#DDBD62' },
  institucion: { label: 'Institución', en: 'Institution', dot: '#7FB07F' },
};

export function tipoNombre(perfil, lang = 'es') {
  const t = TIPOS[perfil] || TIPOS.empresario;
  return lang === 'en' ? t.en : t.label;
}

// Etiqueta del tipo para un prospecto (en español respeta el género guardado, p. ej. «Empresaria»)
export function tipoDeLead(lead, lang = 'es') {
  return lang === 'es' && lead.tipoLabel ? lead.tipoLabel : tipoNombre(lead.answers.perfil, lang);
}

const PRECIOS = { estrategia: 12000000, comex: 14800000, inversion: 16000000, formacion: 27600000 };

const AREAS_TXT = {
  es: {
    estrategia: {
      nombre: 'Estrategia e internacionalización',
      corta: 'estrategia e internacionalización.',
      servicio: 'Plan de internacionalización',
      duracion: '6 semanas',
      incluye: ['Selección y priorización de mercados', 'Modelo de entrada y canal', 'Modelo de precios', 'Plan de crecimiento a 12 meses'],
      preparar: 'tus ventas del último año y los mercados que has considerado.',
      revisar: ['Qué mercado tiene más sentido para tu producto.', 'Canal de entrada: importador, distribuidor o venta directa.', 'Recursos y plazos para un primer paso.'],
      preguntas: [
        { q: '¿Qué mercados ha considerado y por qué?', why: 'Muestra si la elección parte de datos o de intuición.' },
        { q: '¿Cuánto vendió el último año y con qué margen?', why: 'Define cuánto puede invertir en la expansión sin poner en riesgo la operación.' },
        { q: '¿Prefiere un importador, un distribuidor o venta directa?', why: 'Cambia el modelo de entrada, los precios y los tiempos.' },
        { q: '¿Quién en el equipo liderará la internacionalización?', why: 'Sin un responsable, el plan se queda en papel.' },
        { q: '¿Qué resultado haría que este trabajo valga la pena?', why: 'Aterriza el alcance y la forma de medir el éxito.' },
      ],
    },
    comex: {
      nombre: 'Comercio exterior y supply chain',
      corta: 'comercio exterior y supply chain.',
      servicio: 'Ruta de exportación',
      duracion: '8 semanas',
      incluye: ['Costeo de exportación FOB por kilo', 'Requisitos y documentación del mercado', 'Exportar directo o con un exportador aliado', 'Acompañamiento del primer envío'],
      preparar: 'tu costo de producción por kilo, el volumen disponible y, si los tienes, los puntajes de taza de tus lotes.',
      revisar: null,
      preguntas: [
        { q: '¿Ya tiene un comprador definido en el exterior o está buscándolo?', why: 'Cambia el alcance: cerrar con un comprador o abrir canal desde cero.' },
        { q: '¿Exportaría directo o a través de un exportador autorizado?', why: 'Define tiempos de registro y quién asume la logística y los documentos.' },
        { q: '¿Cuánto volumen puede comprometer el primer año?', why: 'Cada contrato pesa sobre lo que hoy vende en el mercado local.' },
        { q: '¿Tiene claro su costo de producción por unidad?', why: 'Sin ese dato no hay forma de saber si el precio FOB le deja margen.' },
        { q: '¿Qué espera del comprador: mejor precio, volumen fijo o continuidad?', why: 'Orienta la negociación y el tipo de contrato que conviene.' },
      ],
    },
    inversion: {
      nombre: 'Café, agroindustria e inversión',
      corta: 'café, agroindustria e inversión.',
      servicio: 'Evaluación de inversión',
      duracion: '6 semanas',
      incluye: ['Modelo financiero del proyecto', 'Flujo de caja y retorno esperado', 'Matriz de riesgos y mitigación', 'Estructura de inversión recomendada'],
      preparar: 'el monto que piensas invertir y la información del proyecto que estás evaluando.',
      revisar: ['Monto, plazo y retorno esperado.', 'Riesgos del proyecto y cómo mitigarlos.', 'Estructura: socio, crédito o capital propio.'],
      preguntas: [
        { q: '¿Qué monto está dispuesto a invertir y en qué plazo?', why: 'Define el tamaño del proyecto que vale la pena modelar.' },
        { q: '¿Qué retorno espera y en cuánto tiempo?', why: 'Permite descartar opciones que no cumplen desde el inicio.' },
        { q: '¿Ya tiene un proyecto identificado o está comparando?', why: 'Cambia el trabajo: evaluar uno a fondo o filtrar varios.' },
        { q: '¿Invertiría solo, con socios o con crédito?', why: 'La estructura cambia el riesgo y el flujo de caja.' },
        { q: '¿Qué información del proyecto ya tiene disponible?', why: 'Sin datos de producción y costos, la evaluación toma más tiempo.' },
      ],
    },
    formacion: {
      nombre: 'Formación y mentoría',
      corta: 'formación y mentoría.',
      servicio: 'Programa de formación',
      duracion: '10 semanas',
      incluye: ['Diagnóstico de capacidades del equipo', 'Talleres prácticos por módulos', 'Mentoría a líderes', 'Plan de seguimiento'],
      preparar: 'cuántas personas participarían y qué temas te preocupan más.',
      revisar: ['Quiénes participarían y su nivel actual.', 'Temas prioritarios para el equipo.', 'Formato: talleres, mentoría o programa.'],
      preguntas: [
        { q: '¿Cuántas personas participarían y qué roles tienen?', why: 'Define el formato y el tamaño de los grupos.' },
        { q: '¿Qué temas les preocupan más hoy?', why: 'Prioriza los módulos del programa.' },
        { q: '¿Han recibido formación similar antes?', why: 'Evita repetir contenidos y ajusta el nivel.' },
        { q: '¿Quién financia el programa?', why: 'Cambia los tiempos de aprobación y los entregables exigidos.' },
        { q: '¿Cómo medirán si el programa funcionó?', why: 'Aterriza los indicadores desde el diseño.' },
      ],
    },
  },
  en: {
    estrategia: {
      nombre: 'Strategy and internationalization',
      corta: 'strategy and internationalization.',
      servicio: 'Internationalization plan',
      duracion: '6 weeks',
      incluye: ['Market selection and prioritization', 'Entry model and channel', 'Pricing model', '12-month growth plan'],
      preparar: "your sales from last year and the markets you've considered.",
      revisar: ['Which market makes the most sense for your product.', 'Entry channel: importer, distributor or direct sales.', 'Resources and timeline for a first step.'],
      preguntas: [
        { q: 'Which markets have they considered, and why?', why: 'Shows whether the choice is based on data or intuition.' },
        { q: 'How much did they sell last year, and at what margin?', why: 'Defines how much they can invest in expansion without risking operations.' },
        { q: 'Do they prefer an importer, a distributor or direct sales?', why: 'Changes the entry model, pricing and timeline.' },
        { q: 'Who on the team will lead internationalization?', why: 'Without an owner, the plan stays on paper.' },
        { q: 'What outcome would make this work worthwhile?', why: 'Grounds the scope and how success is measured.' },
      ],
    },
    comex: {
      nombre: 'Foreign trade and supply chain',
      corta: 'foreign trade and supply chain.',
      servicio: 'Export roadmap',
      duracion: '8 weeks',
      incluye: ['FOB export costing per kilo', 'Market requirements and documentation', 'Export directly or through a partner exporter', 'Support through the first shipment'],
      preparar: 'your production cost per kilo, available volume and, if you have them, the cupping scores of your lots.',
      revisar: null,
      preguntas: [
        { q: 'Do they already have a buyer abroad, or are they looking for one?', why: 'Changes the scope: close with a buyer or build a channel from scratch.' },
        { q: 'Would they export directly or through a licensed exporter?', why: 'Defines registration time and who handles logistics and documents.' },
        { q: 'How much volume can they commit in the first year?', why: 'Every contract affects what they currently sell locally.' },
        { q: 'Do they know their production cost per unit?', why: "Without it there's no way to know if the FOB price leaves a margin." },
        { q: 'What do they expect from the buyer: better price, fixed volume or continuity?', why: 'Guides the negotiation and the right type of contract.' },
      ],
    },
    inversion: {
      nombre: 'Coffee, agribusiness and investment',
      corta: 'coffee, agribusiness and investment.',
      servicio: 'Investment evaluation',
      duracion: '6 weeks',
      incluye: ['Project financial model', 'Cash flow and expected return', 'Risk matrix and mitigation', 'Recommended investment structure'],
      preparar: "the amount you plan to invest and information about the project you're evaluating.",
      revisar: ['Amount, timeline and expected return.', 'Project risks and how to mitigate them.', 'Structure: partner, loan or own capital.'],
      preguntas: [
        { q: 'How much are they willing to invest, and over what period?', why: 'Defines the size of project worth modeling.' },
        { q: 'What return do they expect, and how soon?', why: "Rules out options that don't qualify from the start." },
        { q: 'Do they have a specific project or are they comparing?', why: 'Changes the work: evaluate one in depth or screen several.' },
        { q: 'Would they invest alone, with partners or with a loan?', why: 'The structure changes risk and cash flow.' },
        { q: 'What project information do they already have?', why: 'Without production and cost data, the evaluation takes longer.' },
      ],
    },
    formacion: {
      nombre: 'Training and mentoring',
      corta: 'training and mentoring.',
      servicio: 'Training program',
      duracion: '10 weeks',
      incluye: ['Team capability assessment', 'Hands-on modular workshops', 'Leadership mentoring', 'Follow-up plan'],
      preparar: 'how many people would take part and which topics concern you most.',
      revisar: ['Who would take part and their current level.', 'Priority topics for the team.', 'Format: workshops, mentoring or a full program.'],
      preguntas: [
        { q: 'How many people would take part, and in what roles?', why: 'Defines the format and group size.' },
        { q: 'Which topics concern them most today?', why: 'Prioritizes the program modules.' },
        { q: 'Have they had similar training before?', why: 'Avoids repeating content and sets the level.' },
        { q: 'Who is funding the program?', why: 'Changes approval times and required deliverables.' },
        { q: 'How will they measure whether the program worked?', why: 'Grounds the indicators from the design stage.' },
      ],
    },
  },
};

export function getArea(id, lang = 'es') {
  const key = AREAS_TXT.es[id] ? id : 'comex';
  return { ...(AREAS_TXT[lang] || AREAS_TXT.es)[key], precio: PRECIOS[key] };
}

// Compatibilidad: áreas en español
export const AREAS = Object.fromEntries(Object.keys(PRECIOS).map((k) => [k, getArea(k, 'es')]));

const MERCADO_N = {
  es: { usa: 'Estados Unidos', europa: 'Europa', asia: 'Asia', medio: 'Medio Oriente', colombia: 'el mercado nacional', nose: 'el mercado destino' },
  en: { usa: 'the United States', europa: 'Europe', asia: 'Asia', medio: 'the Middle East', colombia: 'the domestic market', nose: 'the target market' },
};

export function mercadoNombre(id, lang = 'es') {
  return MERCADO_N[lang][id] || MERCADO_N[lang].nose;
}

export function revisarPara(area, mercado, lang = 'es') {
  if (area === 'comex') {
    return lang === 'en'
      ? ['Your cost per kilo delivered to port (FOB).', 'Available volume and shipping method.', 'Requirements and documents for ' + mercadoNombre(mercado, lang) + '.']
      : ['Tu costo por kilo puesto en puerto (FOB).', 'Volumen disponible y forma de envío.', 'Requisitos y documentos para ' + mercadoNombre(mercado, lang) + '.'];
  }
  return getArea(area, lang).revisar;
}

const RESULT = {
  es: {
    perfil: { productor: 'Eres productor', empresario: 'Tienes una empresa', inversionista: 'Eres inversionista', institucion: 'Representas una institución' },
    perfilDef: 'Tienes un negocio',
    etapa: { idea: 'tu proyecto está en etapa de validación', local: 'hoy vendes en el mercado local', primeras: 'ya tienes primeras ventas al exterior', constante: 'ya exportas de forma constante' },
    etapaDef: 'estás en una etapa de definición',
    quieres: ' y quieres ',
    mercado: { usa: 'llegar a Estados Unidos', europa: 'llegar a Europa', asia: 'llegar a Asia', medio: 'llegar a Medio Oriente', colombia: 'crecer en Colombia', nose: 'llegar a un mercado que aún estás definiendo' },
    plazo: { mes: 'en el próximo mes', tres: 'en 1 a 3 meses', seis: 'en los próximos 3 a 6 meses', explorando: 'sin afán, en más de 6 meses' },
    lead: { mes: 'Con un plazo tan corto, lo primero es ', tres: 'Con ese plazo, lo primero es ', seis: 'Con ese plazo, lo primero es ', explorando: 'Como tienes tiempo, conviene empezar por ' },
    leadDef: 'Lo primero es ',
    foco: { comex: 'confirmar tu costo real de exportación y la ruta logística', estrategia: 'decidir el modelo de entrada y el canal', inversion: 'validar los números del proyecto: inversión, flujo de caja y retorno', formacion: 'definir qué capacidades necesita tu equipo primero' },
    req: { usa: ', y cumplir los requisitos de la FDA para alimentos importados.', europa: ', y preparar la trazabilidad que exige el reglamento europeo contra la deforestación (EUDR).', asia: ', y entender los perfiles de taza y certificaciones que pide ese mercado.', medio: ', y definir socios de distribución y registro sanitario.', colombia: ', antes de pensar en exportar.', nose: ', y comparar dos o tres mercados según tu producto.' },
  },
  en: {
    perfil: { productor: "You're a grower", empresario: 'You run a company', inversionista: "You're an investor", institucion: 'You represent an institution' },
    perfilDef: 'You have a business',
    etapa: { idea: 'your project is in validation', local: 'you currently sell in the local market', primeras: 'you already have first sales abroad', constante: 'you already export regularly' },
    etapaDef: "you're still defining your stage",
    quieres: ', and you want to ',
    mercado: { usa: 'reach the United States', europa: 'reach Europe', asia: 'reach Asia', medio: 'reach the Middle East', colombia: 'grow in Colombia', nose: "reach a market you're still defining" },
    plazo: { mes: 'within the next month', tres: 'in 1 to 3 months', seis: 'in the next 3 to 6 months', explorando: 'without rushing, in more than 6 months' },
    lead: { mes: 'With such a short timeline, the first step is to ', tres: 'With that timeline, the first step is to ', seis: 'With that timeline, the first step is to ', explorando: "Since you have time, it's best to start by " },
    leadDef: 'The first step is to ',
    foco: { comex: 'confirm your real export cost and logistics route', estrategia: 'decide on the entry model and channel', inversion: 'validate the project numbers: investment, cash flow and return', formacion: 'define which capabilities your team needs first' },
    fococ: { comex: 'confirming your real export cost and logistics route', estrategia: 'deciding on the entry model and channel', inversion: 'validating the project numbers: investment, cash flow and return', formacion: 'defining which capabilities your team needs first' },
    req: { usa: ', and meet FDA requirements for imported food.', europa: ', and prepare the traceability required by the EU Deforestation Regulation (EUDR).', asia: ', and understand the cup profiles and certifications that market asks for.', medio: ', and define distribution partners and sanitary registration.', colombia: ', before thinking about exporting.', nose: ', and compare two or three markets for your product.' },
  },
};

// Textos del resultado del diagnóstico
export function resultadoTexto(a, lang = 'es') {
  const R = RESULT[lang] || RESULT.es;
  const area = a.area || 'comex';
  const merc = a.mercado || 'nose';
  const frase1 = (R.perfil[a.perfil] || R.perfilDef) + ', ' + (R.etapa[a.etapa] || R.etapaDef) + R.quieres + R.mercado[merc] + ' ' + (R.plazo[a.plazo] || '') + '.';
  // En inglés «start by» pide gerundio
  const foco = lang === 'en' && a.plazo === 'explorando' ? R.fococ[area] : R.foco[area];
  const frase2 = (R.lead[a.plazo] || R.leadDef) + foco + R.req[merc];
  return { frase1, frase2 };
}

// Puntaje del prospecto (1–10) según sus respuestas
export function puntaje(a) {
  let s = 4;
  s += { mes: 2, tres: 2, seis: 1, explorando: 0 }[a.plazo] || 0;
  s += { idea: 0, local: 1, primeras: 1, constante: 2 }[a.etapa] || 0;
  s += { pequeno: 0, mediano: 1, grande: 2, capital: 2 }[a.volumen] || 0;
  s += a.mercado && a.mercado !== 'nose' ? 1 : 0;
  return Math.max(1, Math.min(10, s));
}

const RAZONES = {
  es: {
    plazo: { mes: 'Plazo urgente: próximo mes', tres: 'Plazo definido: 1 a 3 meses', seis: 'Plazo definido: 3 a 6 meses', explorando: 'Explorando, sin plazo fijo' },
    etapa: { idea: 'Proyecto en validación', local: 'Ya opera en el mercado local', primeras: 'Ya tuvo ventas o muestras al exterior', constante: 'Exporta de forma constante' },
    mercado: 'Mercado destino claro',
  },
  en: {
    plazo: { mes: 'Urgent timeline: next month', tres: 'Clear timeline: 1 to 3 months', seis: 'Clear timeline: 3 to 6 months', explorando: 'Exploring, no fixed timeline' },
    etapa: { idea: 'Project in validation', local: 'Already operating locally', primeras: 'Has had sales or samples abroad', constante: 'Exports regularly' },
    mercado: 'Clear target market',
  },
};

export function razonesPuntaje(a, lang = 'es') {
  const R = RAZONES[lang] || RAZONES.es;
  const r = [];
  if (R.plazo[a.plazo]) r.push(R.plazo[a.plazo]);
  if (R.etapa[a.etapa]) r.push(R.etapa[a.etapa]);
  if (a.mercado && a.mercado !== 'nose') r.push(R.mercado);
  return r;
}
