import { createContext, useContext } from 'react';
import { MotionConfig, motion } from 'motion/react';

// Animaciones de entrada al hacer scroll (librería Motion). Pensadas para no cansar:
// solo opacidad + un desplazamiento corto (14 px), una sola vez por elemento, curva suave de salida,
// y nada se anima si la persona pidió "reducir movimiento" en su sistema.
// Solo se activan dentro de <Animaciones> (hoy, la portada); fuera de él estos componentes son etiquetas normales,
// así el pie y la agenda, que se comparten con otras páginas, no cambian allá.

const Activas = createContext(false);

const EASE = [0.22, 1, 0.36, 1]; // "ease-out" largo: arranca natural y se posa sin rebote
const DURACION = 0.7;
const DISTANCIA = 14;
const VISTA = { once: true, amount: 0.15, margin: '0px 0px -6% 0px' };

const oculto = (y = DISTANCIA) => ({ opacity: 0, y });
const visible = (retraso = 0) => ({ opacity: 1, y: 0, transition: { duration: DURACION, ease: EASE, delay: retraso } });

export function Animaciones({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <Activas.Provider value={true}>{children}</Activas.Provider>
    </MotionConfig>
  );
}

/** Un bloque que aparece al entrar en pantalla. retraso en segundos; y: distancia del desplazamiento. */
export function Aparecer({ as = 'div', retraso = 0, y = DISTANCIA, className, children, ...rest }) {
  const activas = useContext(Activas);
  if (!activas) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const M = motion[as];
  return (
    <M initial={oculto(y)} whileInView={visible(retraso)} viewport={VISTA} className={className} {...rest}>
      {children}
    </M>
  );
}

/** Imagen o tarjeta grande: entra con un leve ajuste de escala además del fundido */
export function AparecerImagen({ as = 'div', retraso = 0, className, children, ...rest }) {
  const activas = useContext(Activas);
  if (!activas) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const M = motion[as];
  return (
    <M
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: EASE, delay: retraso } }}
      viewport={VISTA}
      className={className}
      {...rest}
    >
      {children}
    </M>
  );
}

const variantesGrupo = (pausa, retraso) => ({
  oculto: {},
  visible: { transition: { staggerChildren: pausa, delayChildren: retraso } },
});
const variantesElemento = {
  oculto: oculto(),
  visible: { opacity: 1, y: 0, transition: { duration: DURACION, ease: EASE } },
};

/** Contenedor cuyos <Elemento> aparecen uno tras otro (pausa en segundos entre cada uno) */
export function Grupo({ as = 'div', pausa = 0.09, retraso = 0, className, children, ...rest }) {
  const activas = useContext(Activas);
  if (!activas) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const M = motion[as];
  return (
    <M initial="oculto" whileInView="visible" viewport={VISTA} variants={variantesGrupo(pausa, retraso)} className={className} {...rest}>
      {children}
    </M>
  );
}

export function Elemento({ as = 'div', className, children, ...rest }) {
  const activas = useContext(Activas);
  if (!activas) {
    const Tag = as;
    return (
      <Tag className={className} {...rest}>
        {children}
      </Tag>
    );
  }
  const M = motion[as];
  return (
    <M variants={variantesElemento} className={className} {...rest}>
      {children}
    </M>
  );
}
