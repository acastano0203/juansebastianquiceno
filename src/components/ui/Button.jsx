import { Link } from 'react-router-dom';

const VARIANTS = {
  gold: 'bg-gold text-ink border-0',
  ink: 'bg-ink text-white border-0',
  outline: 'border-[1.5px] border-line bg-white text-ink',
  'outline-ink': 'border-[1.5px] border-ink bg-transparent text-ink',
  'outline-gold': 'border border-gold bg-transparent text-gold',
  white: 'bg-white text-ink border-0',
};

const SIZES = {
  sm: 'min-h-9 px-3.5 text-[13px] font-medium gap-2',
  md: 'min-h-11 px-5 text-sm font-semibold gap-2',
  lg: 'min-h-[52px] px-6 text-[15px] font-semibold gap-2.5',
  xl: 'min-h-14 px-[30px] text-base font-semibold gap-2.5',
  hero: 'min-h-[60px] px-8 text-[17px] font-semibold gap-3',
};

function classes({ variant = 'gold', size = 'md', lift, className = '' }) {
  return [
    'inline-flex items-center justify-center rounded-full no-underline transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    lift ? 'cta-lift' : '',
    className,
  ].join(' ');
}

export function Button({ variant, size, lift, className, type = 'button', ...rest }) {
  return <button type={type} className={classes({ variant, size, lift, className })} {...rest} />;
}

export function ButtonLink({ variant, size, lift, className, ...rest }) {
  return <Link className={classes({ variant, size, lift, className })} {...rest} />;
}
