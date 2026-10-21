import { useEffect, useRef, useState } from 'react';
import { QUESTIONS } from '../../data/catalog';
import { useLead, useLeads } from '../../data/LeadsContext';
import StepsAside from '../../components/diagnostico/StepsAside';
import QuestionStep from '../../components/diagnostico/QuestionStep';
import ResultAside from '../../components/diagnostico/ResultAside';
import Scheduler from '../../components/diagnostico/Scheduler';
import Confirmation from '../../components/diagnostico/Confirmation';

export default function Diagnostico() {
  const { addLead, updateLead } = useLeads();
  const [stage, setStage] = useState('paso'); // paso | resultado | confirmado
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [agenda, setAgenda] = useState(() => {
    const now = new Date();
    return { month: new Date(now.getFullYear(), now.getMonth(), 1), day: null, time: null, nombre: '', whatsapp: '' };
  });
  const [leadId, setLeadId] = useState(null);
  const lead = useLead(leadId);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  let reached = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[q.key]) reached = i + 1;
  });

  const goNext = (a = answers, s = step) => {
    if (!a[QUESTIONS[s].key]) return;
    if (s < QUESTIONS.length - 1) setStep(s + 1);
    else setStage('resultado');
  };

  const choose = (key, id) => {
    const next = { ...answers, [key]: id };
    setAnswers(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => goNext(next, step), 320);
  };

  const confirmar = () => {
    const cita = new Date(agenda.day);
    cita.setHours(Math.floor(agenda.time / 60), agenda.time % 60, 0, 0);
    if (leadId) {
      updateLead(leadId, (l) => ({
        cita: cita.toISOString(),
        activity: [...l.activity, { k: 'reagendo', at: new Date().toISOString() }],
      }));
    } else {
      setLeadId(addLead({ nombre: agenda.nombre, whatsapp: agenda.whatsapp, answers, cita }).id);
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
            onGoto={(i) => {
              if (i <= reached) setStep(i);
            }}
          />
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
