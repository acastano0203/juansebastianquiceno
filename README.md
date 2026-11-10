# Acceso Internacional · Costos y Cubicaje Inteligente

React + Vite + Tailwind CSS v4 + React Router. El motor de cálculo está en TypeScript.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas, incluido el caso de aceptación café Pereira → Miami
npm run typecheck  # tipos del motor y los parámetros
npm run build
```

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Landing pública |
| `/simulador` | Simulador de 6 etapas (`?etapa=operacion\|producto\|cubicaje\|costos\|resultado\|reporte`) |
| `/diagnostico` | Redirige a `/simulador` |
| `/cubicaje` | Calculadora anterior de cubicaje (3D y PDF); sin enlace desde la landing y con otro motor, sin pallets |
| `/admin/login` | Inicio de sesión de la cuenta administrativa |
| `/admin` | Panel de prospectos, propuestas y resultados |

Cuenta de demostración: **admin** / **captacion2026**.

## Simulador

- `src/config/params.ts`: todos los parámetros (equipos, matriz de Incoterms, rubros, tarifas, gastos, alertas, textos legales). Es público en el JS del sitio.
- `src/config/casoCafe.ts`: caso de la sección 16 de las reglas de negocio.
- `src/engine/`: funciones puras sin React. Unidades internas: mm, g y cm³; dinero sin redondeo intermedio.
- `src/components/simulador/`: interfaz y estado. Guarda en `localStorage` (`ai.simulador.v1`).
- `VITE_WHATSAPP_ASESOR`: WhatsApp del asesor. Sin este valor, los botones de contacto quedan inactivos.

Las tarifas marcadas DEMO en `params.ts` son ilustrativas. Vencen el 2027-06-30; las rutas sin tarifa muestran *Pendiente de cotización*.

## Datos

Todo se guarda en `localStorage` del navegador (`src/data/LeadsContext.jsx`). El tablero de prospectos
arranca vacío: solo muestra los prospectos que llegan por la landing, y todos entran en la columna «Nuevo».
Los crea el cliente que descarga su cubicaje en `/cubicaje`; el simulador aún no genera leads.

El login es solo de demostración (`src/lib/AuthContext.jsx`): la contraseña está en el código del
frontend. Antes de publicar, cámbialo por autenticación real (por ejemplo, Supabase Auth) y mueve
los prospectos a una base de datos.

## Idiomas

Español e inglés, con selector de bandera (España / EE. UU.) en la landing, el simulador, el login y
la barra lateral del panel. El idioma elegido se guarda en el navegador; la primera vez se toma del
idioma del navegador.

- Textos del simulador: `src/i18n/simulador.js`.
- Textos de la interfaz: `src/i18n/messages.js` (`t('seccion.clave', { variables })` vía `useI18n()`).
- Preguntas, servicios y frases del resultado: `src/data/catalog.js` (`getQuestions(lang)`, `getArea(id, lang)`…).
- Fechas y horas: `src/lib/format.js` reciben `lang`.
- Se mantienen en español a propósito: el documento de la propuesta y los mensajes de WhatsApp
  (son lo que recibe el cliente), y los datos escritos por personas (nombres, notas, transcripciones).

## Estructura

```
src/
  components/
    ui/           Botones, íconos, marca, trazos de raíces
    public/       Secciones de la landing
    diagnostico/  Pasos, resultado, agenda y confirmación
    admin/        Layout, barra lateral, tarjetas, gráfico, WhatsApp
  pages/
    public/       Landing, Diagnostico
    admin/        Login, Pipeline, Brief, Propuesta, Resultados
  config/         Parámetros de cálculo y caso de ejemplo
  engine/         Motor de cubicaje, costos, tributos y alertas
  data/           Catálogo de preguntas y servicios, semilla, propuestas, métricas
  lib/            Formatos de fecha/moneda, autenticación
```
