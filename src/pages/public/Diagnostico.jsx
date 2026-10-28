import { useEffect, useRef, useState } from 'react';
import { QUESTIONS } from '../../data/catalog';
import { useLead, useLeads } from '../../data/LeadsContext';
import { cubicajesRepo } from '../../data/cubicajesRepo';
import { CONTENEDOR_DEFAULT, getContenedor } from '../../cubicaje/config';
import { useI18n } from '../../i18n/LanguageContext';
import { num } from '../../lib/format';
import StepsAside from '../../components/diagnostico/StepsAside';
import QuestionStep from '../../components/diagnostico/QuestionStep';
import CubicajeStep from '../../components/diagnostico/CubicajeStep';
import ResultAside from '../../components/diagnostico/ResultAside';
import Scheduler from '../../components/diagnostico/Scheduler';
import Confirmation from '../../components/diagnostico/Confirmation';
import { totales } from '../../components/cubicaje/CubicajeEditor';
import { useCubicajeEnVivo } from '../../components/cubicaje/useCubicajeEnVivo';

// Las 6 preguntas van en los pasos 0–5; el cubicaje (opcional) es el paso 6
const PASO_CUBICAJE = QUESTIONS.length;

export default function Diagnostico() {
  const { t, lang } = useI18n();
  const { addLead, updateLead } = useLeads();
  const [stage, setStage] = useState('paso'); // paso | resultado | confirmado
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [agenda, setAgenda] = useState(() => {
    const now = new Date();
    return { month: new Date(now.getFullYear(), now.getMonth(), 1), day: null, time: null, nombre: '', whatsapp: '' };
  });
  const [cub, setCub] = useState({ nombre: '', tipoContenedor: CONTENEDOR_DEFAULT, productos: [] });
  const [cubOmitido, setCubOmitido] = useState(false);
  const live = useCubicajeEnVivo(cub.tipoContenedor, cub.productos);
  const [leadId, setLeadId] = useState(null);
  const lead = useLead(leadId);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage, step === PASO_CUBICAJE]); // eslint-disable-line react-hooks/exhaustive-deps

  let reached = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[q.key]) reached = i + 1;
  });

  const goNext = (a = answers, s = step) => {
    if (!a[QUESTIONS[s].key]) return;
    setStep(s + 1);
  };

  const choose = (key, id) => {
    const next = { ...answers, [key]: id };
    setAnswers(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => goNext(next, step), 320);
  };

  const conCubicaje = !cubOmitido && cub.productos.length > 0 && !!live.resultado;
  const estadoCub = conCubicaje
    ? { estado: 'listo', texto: t('cub.diag.cajas', { n: num(totales(cub.productos).cajas, 0, lang), cont: getContenedor(cub.tipoContenedor).nombre }) }
    : cubOmitido
      ? { estado: 'omitido', texto: t('cub.diag.omitido') }
      : { estado: 'pendiente', texto: step === PASO_CUBICAJE ? t('diag.inProgress') : t('cub.diag.opcional') };

  const confirmar = () => {
    const cita = new Date(agenda.day);
    cita.setHours(Math.floor(agenda.time / 60), agenda.time % 60, 0, 0);
    if (leadId) {
      updateLead(leadId, (l) => ({
        cita: cita.toISOString(),
        activity: [...l.activity, { k: 'reagendo', at: new Date().toISOString() }],
      }));
    } else {
      const nuevo = addLead({ nombre: agenda.nombre, whatsapp: agenda.whatsapp, answers, cita, conCubicaje });
      setLeadId(nuevo.id);
      // El cubicaje del paso 7 queda ligado al prospecto; solo se ve desde el panel
      if (conCubicaje) {
        cubicajesRepo
          .crearPublico({
            origen: 'diagnostico',
            nombre: cub.nombre.trim() || t('cub.diag.nombreDe', { n: agenda.nombre.trim() }),
            tipoContenedor: cub.tipoContenedor,
            productos: cub.productos,
            resultado: live.resultado,
            contacto: { nombre: agenda.nombre.trim(), whatsapp: agenda.whatsapp.trim(), correo: null },
            prospectoId: nuevo.id,
          })
          .catch(() => {
            // La cita ya quedó agendada; el cubicaje es un complemento
          });
      }
    }
    setStage('confirmado');
  };

  if (stage === 'confirmado' && lead) {
    return (
      <Confirmation
        lead={lead}
        onReschedule={() => {
          setAgenda((a) => ({ ...a, time: null }));
          setStage('resultado');
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-wrap bg-white text-ink">
      {stage === 'paso' ? (
        <>
          <StepsAside
            step={step}
            answers={answers}
            reached={reached}
            cubicaje={estadoCub}
            onGoto={(i) => {
              if (i <= reached) setStep(i);
            }}
          />
          {step === PASO_CUBICAJE ? (
            <CubicajeStep
              valor={cub}
              onChange={setCub}
              live={live}
              destacado={answers.area === 'comex'}
              onBack={() => setStep(PASO_CUBICAJE - 1)}
              onSkip={() => {
                setCubOmitido(true);
                setStage('resultado');
              }}
              onNext={() => {
                setCubOmitido(false);
                setStage('resultado');
              }}
            />
          ) : (
            <QuestionStep
              step={step}
              answers={answers}
              onChoose={choose}
              onBack={() => {
                clearTimeout(timer.current);
                if (step > 0) setStep(step - 1);
              }}
              onNext={() => {
                clearTimeout(timer.current);
                goNext();
              }}
            />
          )}
        </>
      ) : (
        <>
          <ResultAside
            answers={answers}
            onEdit={() => {
              setStage('paso');
              setStep(0);
            }}
          />
          <Scheduler value={agenda} onChange={setAgenda} onConfirm={confirmar} />
        </>
      )}
    </div>
  );
}
