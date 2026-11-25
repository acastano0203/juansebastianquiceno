import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Sirve los .vcf como tarjeta de contacto (UTF-8, para descargar), igual que vercel.json en producción.
// Sin esto, el servidor local los manda sin tipo y Chrome los pinta como texto con tildes dañadas.
const HEADERS_VCARD = {
  'Content-Type': 'text/vcard; charset=utf-8',
  'Content-Disposition': 'attachment; filename="juan-sebastian-quiceno.vcf"',
};

function vcard() {
  const middleware = (req, res, next) => {
    if (req.url?.split('?')[0].endsWith('.vcf')) {
      for (const [k, v] of Object.entries(HEADERS_VCARD)) res.setHeader(k, v);
    }
    next();
  };
  return {
    name: 'vcard-headers',
    // Con llaves: si el hook devuelve algo, Vite lo ejecuta como función "post" y falla
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vcard()],
});
