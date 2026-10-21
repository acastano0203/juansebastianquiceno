# Sistema de captación — Juan Sebastián Quiceno

React + Vite + Tailwind CSS v4 + React Router.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Rutas

| Ruta | Qué es |
| --- | --- |
| `/` | Landing pública (escritorio y móvil) |
| `/diagnostico` | Diagnóstico de 6 preguntas → resultado y agenda → confirmación |
| `/admin/login` | Inicio de sesión de la cuenta administrativa |
| `/admin` | Panel: tablero de prospectos (arrastrar tarjetas entre etapas) |
| `/admin/prospectos/:id` | Brief previo a la llamada (+ vista previa de WhatsApp) |
| `/admin/propuestas/:id` | Generador de propuestas (editable, exporta a PDF) |
| `/admin/resultados` | Tablero de resultados (mes cerrado o mes en curso en vivo) |

Cuenta de demostración: **admin** / **captacion2026**.

## Datos

Todo se guarda en `localStorage` del navegador (`src/data/LeadsContext.jsx`). Cada diagnóstico
confirmado en la landing crea un prospecto en la columna «Llamada agendada» del panel.
«Restaurar datos de ejemplo» (al pie del tablero) vuelve a los datos semilla de `src/data/seed.js`.

El login es solo de demostración (`src/lib/AuthContext.jsx`): la contraseña está en el código del
frontend. Antes de publicar, cámbialo por autenticación real (por ejemplo, Supabase Auth) y mueve
los prospectos a una base de datos.

## Idiomas

Español e inglés, con selector de bandera (España / EE. UU.) en la landing, el diagnóstico, el login y
la barra lateral del panel. El idioma elegido se guarda en el navegador; la primera vez se toma del
idioma del navegador.

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
  data/           Catálogo de preguntas y servicios, semilla, propuestas, métricas
  lib/            Formatos de fecha/moneda, autenticación
```
