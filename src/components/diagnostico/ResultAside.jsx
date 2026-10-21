import { getArea, resultadoTexto, revisarPara } from '../../data/catalog';
import { useI18n } from '../../i18n/LanguageContext';
import { AsideShell } from './StepsAside';

export default function ResultAside({ answers, onEdit }) {
  const { t, lang } = useI18n();
  const area = answers.area || 'comex';
  const info = getArea(area, lang);
  const { frase1, frase2 } = resultadoTexto(answers, lang);

  return (
    <AsideShell>
      <div className="relative flex flex-col gap-[22px]">
        <span className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase">{t('diag.yourDiag')}</span>
        <h1 className="m-0 font-serif text-[34px] leading-[1.1] font-semibold tracking-[-0.01em] md:text-[40px]">
          {t('diag.startingPoint')}
          <em className="font-normal text-gold">{info.corta}</em>
        </h1>
        <p className="m-0 text-[17px] leading-[1.6] text-pale-2">{frase1}</p>
        <p className="m-0 text-[17px] leading-[1.6] text-pale-2">{frase2}</p>
      </div>
      <div className="relative flex flex-col gap-3.5">
        <span className="text-sm font-semibold text-white">{t('diag.weReview')}</span>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {revisarPara(area, answers.mercado, lang).map((r) => (
            <li key={r} className="flex items-start gap-3 text-[15px] leading-[1.5] text-pale">
              <span aria-hidden="true" className="mt-2 size-2 flex-none rounded-[0_4px_0_4px] bg-gold" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-auto flex flex-col gap-4">
        <div className="inline-flex flex-col gap-1 self-start rounded-[18px_18px_18px_4px] bg-ink-2 px-5 py-3.5">
          <span className="text-xs text-sage">{t('diag.bestService')}</span>
          <span className="text-base font-semibold">{info.servicio}</span>
        </div>
        <button type="button" onClick={onEdit} className="min-h-11 cursor-pointer self-start border-0 bg-transparent p-0 text-sm text-sage underline">
          {t('diag.edit')}
        </button>
      </div>
    </AsideShell>
  );
}
