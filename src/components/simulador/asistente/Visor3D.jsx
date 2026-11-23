// Vista 3D del cubicaje del asistente. Se carga aparte (lazy) porque trae three.js.
// La escena trabaja en metros; el motor entrega mm. Ejes: x largo (fondo → puerta), y alto, z ancho.

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, Line, OrbitControls } from '@react-three/drei';
import { BoxGeometry, CanvasTexture, Color, Matrix4, MeshStandardMaterial, SRGBColorSpace, Vector3 } from 'three';
import { mergeBufferGeometries, RoundedBoxGeometry } from 'three-stdlib';

const S = 0.001;

export const COLORES = { saco: '#C9A66B', caja: '#B9875A', pallet: '#A97C50', granel: '#8B6A3E', otro: '#B7C0BC', resalte: '#DDBD62' };

const DIRECCIONES = {
  iso: [1, 0.85, 1.25],
  frontal: [1, 0.15, 0.0001],
  lateral: [0.0001, 0.15, 1],
  superior: [0.0001, 1, 0.0001],
};

// ---------- Geometrías (unidad 1 × 1 × 1, centradas; se escalan por instancia) ----------

function geometriaPallet() {
  const piezas = [];
  const tabla = (x0, x1, y0, y1, z0, z1) => {
    const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    g.translate((x0 + x1) / 2 - 0.5, (y0 + y1) / 2 - 0.5, (z0 + z1) / 2 - 0.5);
    piezas.push(g);
  };
  // Cubierta superior: 5 tablillas a lo largo
  for (let i = 0; i < 5; i++) {
    const z0 = i * 0.215;
    tabla(0, 1, 0.84, 1, z0, z0 + 0.14);
  }
  // Tacos 3 × 3
  for (const x of [0, 0.44, 0.88]) for (const z of [0, 0.44, 0.88]) tabla(x, x + 0.12, 0.16, 0.84, z, z + 0.12);
  // Patines inferiores
  for (const z of [0, 0.44, 0.88]) tabla(0, 1, 0, 0.16, z, z + 0.12);
  return mergeBufferGeometries(piezas);
}

function texturaCaja(color) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,255,255,0.22)'; // cinta
  g.fillRect(52, 0, 24, 128);
  g.strokeStyle = 'rgba(40,24,10,0.55)'; // aristas
  g.lineWidth = 6;
  g.strokeRect(3, 3, 122, 122);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function texturaTexto(texto, { fondo = 'rgba(18,54,56,0.92)', tinta = '#fff', alto = 64 } = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const fuente = `600 ${Math.round(alto * 0.5)}px Inter, system-ui, sans-serif`;
  g.font = fuente;
  const w = Math.ceil(g.measureText(texto).width + alto * 0.6);
  c.width = w;
  c.height = alto;
  g.font = fuente;
  g.fillStyle = fondo;
  const r = alto / 2;
  g.beginPath();
  g.moveTo(r, 0);
  g.arcTo(w, 0, w, alto, r);
  g.arcTo(w, alto, 0, alto, r);
  g.arcTo(0, alto, 0, 0, r);
  g.arcTo(0, 0, w, 0, r);
  g.fill();
  g.fillStyle = tinta;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(texto, w / 2, alto / 2 + 1);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return { t, ratio: w / alto };
}

function Etiqueta({ texto, position, altura = 0.22, ...estilo }) {
  const { t, ratio } = useMemo(() => texturaTexto(texto, estilo), [texto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => t.dispose(), [t]);
  return (
    <sprite position={position} scale={[altura * ratio, altura, 1]} renderOrder={10}>
      <spriteMaterial map={t} depthTest={false} transparent />
    </sprite>
  );
}

// ---------- Contenedor ----------

function Contenedor({ L, W, H, sobrepeso, metros, letra }) {
  const t = 0.03;
  const pared = { color: '#9AA5A0', transparent: true, opacity: 0.16, depthWrite: false };
  const apertura = (110 * Math.PI) / 180;
  return (
    <group>
      <mesh position={[0, -t / 2, 0]} receiveShadow>
        <boxGeometry args={[L + t * 2, t, W + t * 2]} />
        <meshStandardMaterial color={sobrepeso ? '#C9776A' : '#AEB8B2'} roughness={0.95} />
      </mesh>
      <mesh position={[-L / 2 - t / 2, H / 2, 0]}>
        <boxGeometry args={[t, H, W + t * 2]} />
        <meshStandardMaterial {...pared} />
        <Edges color="#6F7B76" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, H / 2, s * (W / 2 + t / 2)]}>
          <boxGeometry args={[L + t * 2, H, t]} />
          <meshStandardMaterial {...pared} />
          <Edges color="#6F7B76" />
        </mesh>
      ))}
      {/* Techo: solo las aristas para no tapar la carga */}
      <mesh position={[0, H + t / 2, 0]}>
        <boxGeometry args={[L + t * 2, t, W + t * 2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color="#6F7B76" />
      </mesh>
      {/* Puertas abiertas */}
      {[1, -1].map((s) => (
        <group key={s} position={[L / 2 + t, H / 2, s * (W / 2 + t)]} rotation={[0, -s * apertura, 0]}>
          <mesh position={[0, 0, -s * (W / 4)]}>
            <boxGeometry args={[0.04, H, W / 2]} />
            <meshStandardMaterial color="#7E8C86" transparent opacity={0.5} depthWrite={false} />
            <Edges color="#56625D" />
          </mesh>
        </group>
      ))}
      <Cotas L={L} W={W} H={H} metros={metros} letra={letra} />
    </group>
  );
}

function Cotas({ L, W, H, metros, letra }) {
  const c = '#123638';
  const d = letra * 1.1;
  return (
    <group>
      <Line points={[[-L / 2, 0, W / 2 + d], [L / 2, 0, W / 2 + d]]} color={c} lineWidth={1.5} />
      <Etiqueta texto={metros(L)} position={[0, letra * 0.6, W / 2 + d]} altura={letra} />
      <Line points={[[L / 2 + d, 0, -W / 2], [L / 2 + d, 0, W / 2]]} color={c} lineWidth={1.5} />
      <Etiqueta texto={metros(W)} position={[L / 2 + d, letra * 0.6, 0]} altura={letra} />
      <Line points={[[-L / 2, 0, W / 2 + d], [-L / 2, H, W / 2 + d]]} color={c} lineWidth={1.5} />
      <Etiqueta texto={metros(H)} position={[-L / 2, H / 2, W / 2 + d + letra * 0.5]} altura={letra} />
    </group>
  );
}

// ---------- Unidades ----------

const escalaJunta = { saco: 0.96, caja: 0.985, pallet: 1, granel: 1, otro: 1 };

function Grupo({ piezas, forma, geometria, material, origen, visibles, onHover, base, variacion = 0 }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const m = new Matrix4();
    const col = new Color();
    const k = escalaJunta[forma];
    piezas.forEach((p, i) => {
      m.makeScale(p.dx * S * k, p.dy * S * (forma === 'saco' ? 0.98 : k), p.dz * S * k);
      m.setPosition((p.x + p.dx / 2) * S - origen[0], (p.y + p.dy / 2) * S, (p.z + p.dz / 2) * S - origen[2]);
      ref.current.setMatrixAt(i, m);
      if (variacion) {
        // Variación leve del tono entre sacos para que no se vean idénticos
        const v = ((p.n * 2654435761) % 1000) / 1000 - 0.5;
        col.set(base).offsetHSL(0, 0, v * variacion);
        ref.current.setColorAt(i, col);
      }
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [piezas, origen, forma, base, variacion]);

  useLayoutEffect(() => {
    let n = 0;
    while (n < piezas.length && piezas[n].orden < visibles) n++;
    ref.current.count = n;
  }, [piezas, visibles]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometria, material, piezas.length]}
      castShadow={forma !== 'otro'}
      receiveShadow
      onPointerMove={onHover ? (e) => { e.stopPropagation(); onHover({ pieza: piezas[e.instanceId], x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }); } : undefined}
      onPointerOut={onHover ? () => onHover(null) : undefined}
    />
  );
}

function Resalte({ p, origen }) {
  if (!p) return null;
  return (
    <mesh position={[(p.x + p.dx / 2) * S - origen[0], (p.y + p.dy / 2) * S, (p.z + p.dz / 2) * S - origen[2]]} scale={[p.dx * S * 1.03, p.dy * S * 1.03, p.dz * S * 1.03]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={COLORES.resalte} transparent opacity={0.3} depthWrite={false} />
      <Edges color={COLORES.resalte} />
    </mesh>
  );
}

function CentroGravedad({ cg, origen, ok }) {
  const pos = [cg.x * S - origen[0], cg.y * S, cg.z * S - origen[2]];
  const color = ok ? '#2E6B3A' : '#B3261E';
  return (
    <group>
      <mesh position={pos}>
        <sphereGeometry args={[0.09, 20, 14]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <Line points={[pos, [pos[0], 0.01, pos[2]]]} color={color} lineWidth={2} dashed dashSize={0.08} gapSize={0.05} depthTest={false} />
    </group>
  );
}

/** Caja envolvente de la carga del usuario en LCL: "tu espacio" */
function TuEspacio({ piezas, origen, texto, letra }) {
  const b = useMemo(() => {
    const x0 = Math.min(...piezas.map((p) => p.x));
    const x1 = Math.max(...piezas.map((p) => p.x + p.dx));
    const z0 = Math.min(...piezas.map((p) => p.z));
    const z1 = Math.max(...piezas.map((p) => p.z + p.dz));
    const y1 = Math.max(...piezas.map((p) => p.y + p.dy));
    return { x0, x1, z0, z1, y1 };
  }, [piezas]);
  const c = [((b.x0 + b.x1) / 2) * S - origen[0], (b.y1 / 2) * S, ((b.z0 + b.z1) / 2) * S - origen[2]];
  return (
    <group>
      <mesh position={c} scale={[(b.x1 - b.x0) * S + 0.06, b.y1 * S + 0.06, (b.z1 - b.z0) * S + 0.06]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={COLORES.resalte} transparent opacity={0.08} depthWrite={false} />
        <Edges color="#B8922F" />
      </mesh>
      <Etiqueta texto={texto} position={[c[0], b.y1 * S + letra * 1.2, c[2]]} altura={letra} fondo="rgba(221,189,98,0.95)" tinta="#123638" />
    </group>
  );
}

// ---------- Cámara ----------

// foco: en LCL la cámara mira la carga del usuario (junto a la puerta), no todo el contenedor compartido
function Camara({ apiRef, tam, foco, onListo }) {
  const { camera, controls, gl, invalidate } = useThree();
  const meta = useRef(null);
  const target = useMemo(() => (foco ? new Vector3(foco.x, foco.y, foco.z) : new Vector3(0, tam.H / 2, 0)), [tam.H, foco]);
  const dist = foco ? Math.max(foco.r * 3.2, 4.5) : Math.max(tam.L, tam.W * 2, 2.2) * 1.2;

  const irA = (v) => {
    meta.current = target.clone().add(new Vector3(...DIRECCIONES[v]).normalize().multiplyScalar(dist));
    invalidate();
  };

  useEffect(() => {
    if (!controls) return undefined;
    controls.target.copy(target);
    camera.position.copy(target.clone().add(new Vector3(...DIRECCIONES.iso).normalize().multiplyScalar(dist)));
    controls.update();
    const cancelar = () => {
      meta.current = null;
    };
    controls.addEventListener('start', cancelar);
    return () => controls.removeEventListener('start', cancelar);
  }, [controls, camera, target, dist]);

  useEffect(() => {
    apiRef.current = { vista: irA, reiniciar: () => irA('iso'), capturar: () => gl.domElement.toDataURL('image/png') };
    onListo?.();
  });

  useFrame(() => {
    if (!meta.current || !controls) return;
    camera.position.lerp(meta.current, 0.15);
    if (camera.position.distanceTo(meta.current) < 0.005) {
      camera.position.copy(meta.current);
      meta.current = null;
    }
    controls.update();
  });
  return null;
}

/**
 * escena: salida de calcularCubicajeCafe (una de sus escenas).
 * apiRef recibe { vista(id), reiniciar(), capturar() }.
 */
export default function Visor3D({ escena, visibles, apiRef, onHover, hover, ligero, metros, textoTuEspacio, sobrepeso, cgOk, onListo }) {
  const tam = useMemo(() => {
    if (escena.contenedor) return { L: escena.contenedor.largoMm * S, W: escena.contenedor.anchoMm * S, H: escena.contenedor.altoMm * S };
    const L = Math.max(...escena.piezas.map((p) => p.x + p.dx)) * S;
    const W = Math.max(...escena.piezas.map((p) => p.z + p.dz)) * S;
    const H = Math.max(...escena.piezas.map((p) => p.y + p.dy)) * S;
    return { L, W, H };
  }, [escena]);
  const origen = useMemo(() => [tam.L / 2, 0, tam.W / 2], [tam]);
  // Tamaño de las etiquetas proporcional a la escena para que se lean en un 40' y en un pallet suelto
  const letra = Math.max(0.2, Math.max(tam.L, tam.W) * 0.028);
  const foco = useMemo(() => {
    if (escena.tipo !== 'LCL' || !escena.piezas.length) return null;
    const xs = escena.piezas.flatMap((p) => [p.x, p.x + p.dx]);
    const zs = escena.piezas.flatMap((p) => [p.z, p.z + p.dz]);
    const y1 = Math.max(...escena.piezas.map((p) => p.y + p.dy));
    const x = ((Math.min(...xs) + Math.max(...xs)) / 2) * S - origen[0];
    const z = ((Math.min(...zs) + Math.max(...zs)) / 2) * S - origen[2];
    const r = Math.max((Math.max(...xs) - Math.min(...xs)) * S, (Math.max(...zs) - Math.min(...zs)) * S, y1 * S);
    return { x: x - 0.8, y: (y1 * S) / 2, z, r };
  }, [escena, origen]);

  const grupos = useMemo(() => {
    const g = { saco: [], caja: [], pallet: [], granel: [] };
    for (const p of escena.piezas) g[p.forma]?.push(p);
    for (const k of Object.keys(g)) g[k].sort((a, b) => a.orden - b.orden);
    return g;
  }, [escena]);

  const recursos = useMemo(() => {
    const geoSaco = new RoundedBoxGeometry(1, 1, 1, ligero ? 1 : 3, 0.3);
    const geoCaja = new BoxGeometry(1, 1, 1);
    const geoPallet = geometriaPallet();
    const texCaja = texturaCaja(COLORES.caja);
    const mat = {
      // El color de cada saco va por instancia (setColorAt); el material queda en blanco para no teñirlo dos veces
      saco: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }),
      caja: new MeshStandardMaterial({ map: texCaja, roughness: 0.8 }),
      pallet: new MeshStandardMaterial({ color: COLORES.pallet, roughness: 0.9 }),
      granel: new MeshStandardMaterial({ color: COLORES.granel, roughness: 1, transparent: true, opacity: 0.92 }),
      otro: new MeshStandardMaterial({ color: COLORES.otro, roughness: 1, transparent: true, opacity: 0.38, depthWrite: false }),
    };
    return { geoSaco, geoCaja, geoPallet, texCaja, mat };
  }, [ligero]);
  useEffect(() => () => {
    recursos.geoSaco.dispose();
    recursos.geoCaja.dispose();
    recursos.geoPallet.dispose();
    recursos.texCaja.dispose();
    Object.values(recursos.mat).forEach((m) => m.dispose());
  }, [recursos]);

  const L = tam.L;

  return (
    <Canvas
      camera={{ fov: 40, near: 0.05, far: 300 }}
      dpr={ligero ? 1 : [1, 2]}
      gl={{ antialias: !ligero, preserveDrawingBuffer: true }}
      shadows={!ligero}
      aria-hidden="true"
    >
      <color attach="background" args={['#E7EEE8']} />
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#FFFFFF', '#B9C3BD', 0.55]} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} castShadow={!ligero} shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} />
      <directionalLight position={[-8, 5, -6]} intensity={0.35} />

      {escena.contenedor ? (
        <Contenedor L={tam.L} W={tam.W} H={tam.H} sobrepeso={sobrepeso} metros={metros} letra={letra} />
      ) : (
        <group>
          <mesh position={[0, -0.01, 0]} receiveShadow>
            <boxGeometry args={[L + 1.2, 0.02, tam.W + 1.2]} />
            <meshStandardMaterial color="#C9D3CD" roughness={1} />
          </mesh>
          <Cotas L={tam.L} W={tam.W} H={tam.H} metros={metros} letra={letra} />
        </group>
      )}

      {grupos.pallet.length > 0 && <Grupo key={'p' + grupos.pallet.length} piezas={grupos.pallet} forma="pallet" geometria={recursos.geoPallet} material={recursos.mat.pallet} origen={origen} visibles={visibles} onHover={onHover} />}
      {grupos.saco.length > 0 && (
        <Grupo key={'s' + grupos.saco.length + ligero} piezas={grupos.saco} forma="saco" geometria={recursos.geoSaco} material={recursos.mat.saco} origen={origen} visibles={visibles} onHover={onHover} base={COLORES.saco} variacion={0.08} />
      )}
      {grupos.caja.length > 0 && <Grupo key={'c' + grupos.caja.length} piezas={grupos.caja} forma="caja" geometria={recursos.geoCaja} material={recursos.mat.caja} origen={origen} visibles={visibles} onHover={onHover} />}
      {grupos.granel.length > 0 && <Grupo key={'g' + grupos.granel.length} piezas={grupos.granel} forma="granel" geometria={recursos.geoCaja} material={recursos.mat.granel} origen={origen} visibles={visibles} onHover={onHover} />}
      {escena.otros.length > 0 && <Grupo key={'o' + escena.otros.length} piezas={escena.otros} forma="otro" geometria={recursos.geoCaja} material={recursos.mat.otro} origen={origen} visibles={Infinity} />}

      {hover && <Resalte p={hover} origen={origen} />}
      {escena.tipo === 'LCL' && escena.piezas.length > 0 && <TuEspacio piezas={escena.piezas} origen={origen} texto={textoTuEspacio} letra={letra} />}
      {escena.centroGravedad && visibles >= escena.pasos && <CentroGravedad cg={escena.centroGravedad} origen={origen} ok={cgOk} />}

      <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={0.8} maxDistance={Math.max(tam.L, tam.W, 3) * 4} maxPolarAngle={Math.PI / 2 - 0.02} />
      <Camara apiRef={apiRef} tam={tam} foco={foco} onListo={onListo} />
    </Canvas>
  );
}
