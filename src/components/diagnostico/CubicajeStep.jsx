import { useI18n } from '../../i18n/LanguageContext';
import { Button } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';
import CubicajeEditor from '../cubicaje/CubicajeEditor';
import PaqueteIcono from '../cubicaje/PaqueteIcono';
import { PASOS_DIAGNOSTICO, ProgresoDiag } from './QuestionStep';

// Paso 7 (opcional): el cubicaje de la carga, con el mismo formulario en vivo del módulo
export default function CubicajeStep({ valor, onChange, live, destacado, onBack, onSkip, onNext }) {
  const { t } = useI18n();
  const listo = valor.productos.length > 0 && !!live.resultado && !live.calculando;

  return (
    <main className="box-border flex min-w-0 flex-[999_1_560px] flex-col gap-10 px-[22px] pt-10 pb-14 md:px-[56px]">
      <ProgresoDiag step={PASOS_DIAGNOSTICO - 1} />

      <div className="flex max-w-[820px] flex-col gap-3.5">
        <span className="font-serif text-[22px] text-clay italic">{t('cub.diag.eyebrow')}</span>
        <h1 className="m-0 font-serif text-[34px] leading-[1.08] font-semibold tracking-[-0.015em] md:text-[44px]">{t('cub.diag.titulo')}</h1>
        <p className="m-0 text-[17px] leading-[1.6] text-muted">{t('cub.diag.help')}</p>
      </div>

      {destacado && (
        <div className="flex max-w-[920px] gap-4 rounded-[22px_22px_22px_4px] border-[1.5px] border-gold bg-[#FBF3DC] px-5 py-4">
          <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-[0_22px_0_22px] bg-ink text-gold">
            <PaqueteIcono tipo="box" size={22} />
          </span>
          <span className="flex flex-col gap-1">
            <strong className="text-[15px] font-semibold">{t('cub.diag.destacadoT')}</strong>
            <span className="text-sm leading-normal text-[#4A3B10]">{t('cub.diag.destacadoD')}</span>
          </span>
        </div>
      )}

      <CubicajeEditor variante="diagnostico" valor={valor} onChange={onChange} resultado={live.resultado} calculando={live.calculando} version={live.version} />

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={onBack} className="min-h-12 cursor-pointer border-0 bg-transparent px-2 text-[15px] font-medium text-ink">
          {t('diag.back')}
        </button>
        <span className="flex flex-wrap gap-3">
          <Button variant="outline" size="xl" onClick={onSkip}>
            {t('cub.diag.saltar')}
          </Button>
          <Button variant="gold" size="xl" onClick={onNext} disabled={!listo}>
            {t('cub.diag.continuar')}
            <ArrowRight />
          </Button>
        </span>
      </div>
    </main>
  );
}
