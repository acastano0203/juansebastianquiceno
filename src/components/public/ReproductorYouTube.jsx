import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';

// Reproductor con controles propios sobre la API oficial de YouTube (controls=0).
// Sin los controles de YouTube no aparecen su logo, "copiar enlace" ni "ver en YouTube"; una capa transparente
// recibe los clics (así el iframe nunca recibe el mouse y no muestra su barra de título), y al pausar o terminar
// se muestra nuestra propia pantalla en lugar de la de YouTube (que sugiere otros videos).

let cargaApi;
function cargarApiYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!cargaApi) {
    cargaApi = new Promise((resolve) => {
      const previo = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previo?.();
        resolve(window.YT);
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return cargaApi;
}

const mmss = (seg) => {
  const s = Math.max(0, Math.floor(seg || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function BotonControl({ etiqueta, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex size-10 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-white/10 text-white transition-colors hover:bg-gold hover:text-ink"
    >
      {children}
    </button>
  );
}

/**
 * videoId: id de YouTube. portadaPausa(reanudar): lo que se muestra en pausa o al terminar.
 * textos: { pausar, reproducir, silenciar, activarSonido, pantallaCompleta, salirPantallaCompleta, progreso }
 */
export default function ReproductorYouTube({ videoId, titulo, miniatura, textos, portadaPausa }) {
  const marco = useRef(null);
  const destino = useRef(null);
  const player = useRef(null);
  // cargando → arrancando (ya suena, pero YouTube aún muestra su capa de inicio) → reproduciendo | pausado | terminado
  const [estado, setEstado] = useState('cargando');
  const inicio = useRef(null); // segundo del video en que arrancó; null = aún no arranca
  const [tiempo, setTiempo] = useState({ actual: 0, total: 0 });
  const [silencio, setSilencio] = useState(false);
  const [completa, setCompleta] = useState(false);
  const [arrastrando, setArrastrando] = useState(null);

  // Crear el reproductor (o cambiar de video) cuando cambia el id
  useEffect(() => {
    let vivo = true;
    cargarApiYouTube().then((YT) => {
      if (!vivo || !destino.current) return;
      if (player.current) {
        inicio.current = null;
        setEstado('cargando');
        player.current.loadVideoById(videoId);
        return;
      }
      // YouTube reemplaza este nodo por su iframe: se crea fuera de React para que React no pierda su árbol
      const nodo = document.createElement('div');
      destino.current.appendChild(nodo);
      player.current = new YT.Player(nodo, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, iv_load_policy: 3, modestbranding: 1, cc_load_policy: 0 },
        events: {
          onReady: (e) => {
            e.target.getIframe().setAttribute('title', titulo);
            e.target.playVideo();
            // Si el navegador bloquea el autoplay (frecuente en celulares), no se queda "cargando": vuelve la portada
            setTimeout(() => setEstado((x) => (x === 'cargando' ? 'pausado' : x)), 3000);
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              // Los subtítulos automáticos tapan el video: se descargan al arrancar
              e.target.unloadModule?.('captions');
              e.target.unloadModule?.('cc');
              if (inicio.current === null) {
                inicio.current = e.target.getCurrentTime();
                setEstado('arrancando');
              } else setEstado('reproduciendo');
            } else if (e.data === S.PAUSED) setEstado('pausado');
            else if (e.data === S.ENDED) setEstado('terminado');
          },
        },
      });
    });
    return () => {
      vivo = false;
    };
  }, [videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Destruir al desmontar
  useEffect(
    () => () => {
      player.current?.destroy?.();
      player.current = null;
    },
    [],
  );

  // Avance de la barra
  useEffect(() => {
    const id = setInterval(() => {
      const p = player.current;
      if (!p?.getCurrentTime) return;
      const actual = p.getCurrentTime();
      setTiempo({ actual, total: p.getDuration() || 0 });
      // YouTube muestra su capa de inicio (título, logo, "copiar enlace") unos 4 s; mientras, se ve la portada
      if (inicio.current !== null && actual - inicio.current >= 4.2) setEstado((x) => (x === 'arrancando' ? 'reproduciendo' : x));
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const cambio = () => setCompleta(document.fullscreenElement === marco.current);
    document.addEventListener('fullscreenchange', cambio);
    return () => document.removeEventListener('fullscreenchange', cambio);
  }, []);

  const alternar = () => {
    const p = player.current;
    if (!p?.getPlayerState) return;
    if (estado === 'reproduciendo' || estado === 'arrancando') p.pauseVideo();
    else {
      if (estado === 'terminado') p.seekTo(0, true);
      p.playVideo();
    }
  };
  const sonido = () => {
    const p = player.current;
    if (!p) return;
    if (silencio) p.unMute();
    else p.mute();
    setSilencio(!silencio);
  };
  const pantalla = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else marco.current?.requestFullscreen?.();
  };
  const buscar = (valor) => {
    setArrastrando(null);
    player.current?.seekTo(valor, true);
    setTiempo((t) => ({ ...t, actual: valor }));
  };

  const actual = arrastrando ?? tiempo.actual;
  const avance = tiempo.total ? (actual / tiempo.total) * 100 : 0;
  const detenido = estado === 'pausado' || estado === 'terminado';
  const sonando = estado === 'reproduciendo' || estado === 'arrancando';

  return (
    <div ref={marco} className="group/rep absolute inset-0 bg-ink">
      <div ref={destino} className="absolute inset-0 [&>iframe]:size-full" />

      {/* Capa que recibe los clics: el iframe no recibe el mouse, así YouTube no muestra su barra */}
      <button type="button" onClick={alternar} aria-label={sonando ? textos.pausar : textos.reproducir} className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0" />

      {/* Franja superior: el reproductor de YouTube muestra el título unos segundos al arrancar */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[72px] bg-gradient-to-b from-ink to-transparent" />

      {(estado === 'cargando' || estado === 'arrancando') && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink">
          {miniatura && <img src={miniatura} alt="" className="absolute inset-0 size-full object-cover opacity-60" />}
          <span className="relative size-12 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold" />
        </div>
      )}

      {/* En pausa o al terminar: nuestra portada, no la pantalla de YouTube con videos sugeridos */}
      {detenido && <div className="absolute inset-0">{portadaPausa(alternar)}</div>}

      {/* Barra de controles */}
      <div
        className={
          'absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent px-3 pt-10 pb-3 transition-opacity duration-300 md:gap-3 md:px-5 md:pb-4 ' +
          (estado === 'reproduciendo' || estado === 'arrancando' ? 'opacity-0 group-hover/rep:opacity-100 focus-within:opacity-100' : 'opacity-100') +
          (estado === 'cargando' ? ' invisible' : '')
        }
      >
        <BotonControl etiqueta={sonando ? textos.pausar : textos.reproducir} onClick={alternar}>
          {sonando ? <Pause size={18} fill="currentColor" strokeWidth={0} /> : <Play size={18} className="ml-0.5" fill="currentColor" strokeWidth={0} />}
        </BotonControl>
        <span className="w-[86px] flex-none text-center text-[12px] font-semibold text-white tabular-nums md:text-[13px]">
          {mmss(actual)} / {mmss(tiempo.total)}
        </span>
        <div className="relative flex h-10 min-w-0 flex-1 items-center">
          <div className="pointer-events-none absolute inset-x-0 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gold" style={{ width: `${avance}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={tiempo.total || 0}
            step={0.5}
            value={actual}
            aria-label={textos.progreso}
            aria-valuetext={`${mmss(actual)} / ${mmss(tiempo.total)}`}
            onChange={(e) => setArrastrando(Number(e.target.value))}
            onPointerUp={(e) => buscar(Number(e.currentTarget.value))}
            onKeyUp={(e) => buscar(Number(e.currentTarget.value))}
            className="relative h-10 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(221,189,98,.25)]"
          />
        </div>
        <BotonControl etiqueta={silencio ? textos.activarSonido : textos.silenciar} onClick={sonido}>
          {silencio ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </BotonControl>
        <BotonControl etiqueta={completa ? textos.salirPantallaCompleta : textos.pantallaCompleta} onClick={pantalla}>
          {completa ? <Minimize size={17} /> : <Maximize size={17} />}
        </BotonControl>
      </div>
    </div>
  );
}
