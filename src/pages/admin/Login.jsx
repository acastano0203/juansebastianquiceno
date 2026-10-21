import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { DEMO_USER, useAuth } from '../../lib/AuthContext';
import { useI18n } from '../../i18n/LanguageContext';
import { AsideShell } from '../../components/diagnostico/StepsAside';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Lock } from '../../components/ui/Icons';

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState(false);
  const destino = location.state?.from || '/admin';

  if (user) return <Navigate to={destino} replace />;

  const submit = (e) => {
    e.preventDefault();
    if (login(usuario, clave)) navigate(destino, { replace: true });
    else setError(true);
  };

  const [demoA, demoB] = t('login.demo').split('{u}');
  const [demoB1, demoB2] = demoB.split('{p}');

  return (
    <div className="flex min-h-screen flex-wrap bg-white text-ink">
      <AsideShell>
        <div className="relative flex flex-col gap-3.5">
          <span className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase">{t('login.eyebrow')}</span>
          <h1 className="m-0 font-serif text-[40px] leading-[1.05] font-semibold md:text-[44px]">
            {t('login.title1')}
            <em className="font-normal text-gold">{t('login.titleEm')}</em>
          </h1>
          <p className="m-0 max-w-[360px] text-base leading-[1.6] text-pale">{t('login.lead')}</p>
        </div>
        <p className="relative m-0 mt-auto text-[13px] leading-[1.5] text-faint">{t('login.only')}</p>
      </AsideShell>

      <main className="box-border flex min-w-0 flex-[999_1_560px] items-center justify-center px-[22px] py-14 md:px-[72px]">
        <form onSubmit={submit} className="flex w-full max-w-[420px] flex-col gap-6" noValidate>
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-[0_28px_0_28px] bg-mist text-ink">
            <Lock size={24} />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="m-0 font-serif text-[36px] leading-[1.1] font-semibold">{t('login.title')}</h2>
            <p className="m-0 text-[15px] text-muted">{t('login.sub')}</p>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {t('login.user')}
            <input className="field" type="text" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {t('login.pass')}
            <input className="field" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          </label>
          {error && (
            <p role="alert" className="m-0 rounded-[14px] bg-clay-bg px-4 py-3 text-sm text-clay-ink">
              {t('login.error')}
            </p>
          )}
          <Button type="submit" variant="gold" size="xl" disabled={!usuario || !clave}>
            {t('login.submit')}
            <ArrowRight />
          </Button>
          <p className="m-0 rounded-[18px_18px_18px_4px] bg-mist px-5 py-4 text-[13px] leading-[1.6] text-muted">
            {demoA}
            <strong className="text-ink">{DEMO_USER.usuario}</strong>
            {demoB1}
            <strong className="text-ink">{DEMO_USER.clave}</strong>
            {demoB2}
          </p>
          <Link to="/" className="inline-flex min-h-11 items-center self-start text-sm text-muted">
            {t('login.back')}
          </Link>
        </form>
      </main>
    </div>
  );
}
