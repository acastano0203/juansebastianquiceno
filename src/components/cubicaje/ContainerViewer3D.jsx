import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Edges, OrbitControls } from '@react-three/drei';
import { Matrix4, Vector3 } from 'three';
import { texturaCara } from './three/etiqueta';

// La escena trabaja en metros: 1 cm = 0,01
const S = 0.01;

const DIRECCIONES = {
  iso: [1, 0.85, 1.25],
  frontal: [1, 0.12, 0],
  lateral: [0, 0.12, 1],
  superior: [0, 1, 0.0001],
};

function Contenedor({ c }) {
  const L = c.largo * S;
  const W = c.ancho * S;
  const H = c.alto * S;
  const t = 0.02;
  const pared = { color: '#9AA5A0', transparent: true, opacity: 0.22, depthWrite: false };
  return (
    <group>
      <mesh position={[0, -t / 2, 0]} receiveShadow>
        <boxGeometry args={[L + t * 2, t, W + t * 2]} />
        <meshStandardMaterial color="#B9C3BD" roughness={0.95} />
      </mesh>
      {/* Fondo y paredes laterales; la puerta y el techo quedan abiertos */}
      <mesh position={[-L / 2 - t / 2, H / 2, 0]}>
        <boxGeometry args={[t, H, W + t * 2]} />
        <meshStandardMaterial {...pared} />
        <Edges color="#7C8783" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, H / 2, s * (W / 2 + t / 2)]}>
          <boxGeometry args={[L + t * 2, H, t]} />
          <meshStandardMaterial {...pared} />
          <Edges color="#7C8783" />
        </mesh>
      ))}
    </group>
  );
}

// Un InstancedMesh por producto y orientación: comparten medidas, color y texturas
function GrupoCajas({ cajas, producto, contenedor, fantasma, visibles = Infinity }) {
  const ref = useRef();
  const [dx, dy, dz] = [cajas[0].dx, cajas[0].dy, cajas[0].dz];
  const nombre = producto?.nombre || '';
  const color = producto?.color || '#DDBD62';
  const caras = useMemo(
    () => [
      texturaCara(color, nombre, dz, dy),
      texturaCara(color, nombre, dz, dy),
      texturaCara(color, nombre, dx, dz),
      texturaCara(color, '', dx, dz),
      texturaCara(color, nombre, dx, dy),
      texturaCara(color, nombre, dx, dy),
    ],
    [color, nombre, dx, dy, dz],
  );

  useLayoutEffect(() => {
    const m = new Matrix4();
    const ox = contenedor.largo / 2;
    const oz = contenedor.ancho / 2;
    // Se encoge un poco cada caja para que se vean las juntas
    const k = 0.985;
    cajas.forEach((b, i) => {
      m.makeScale(b.dx * S * k, b.dy * S * k, b.dz * S * k);
      m.setPosition((b.x + b.dx / 2 - ox) * S, (b.y + b.dy / 2) * S, (b.z + b.dz / 2 - oz) * S);
      ref.current.setMatrixAt(i, m);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [cajas, contenedor]);

  // Secuencia de carga: las cajas del grupo están en orden de carga, así que basta con recortar el conteo
  useLayoutEffect(() => {
    let n = 0;
    while (n < cajas.length && (cajas[n].orden ?? -1) < visibles) n++;
    ref.current.count = n;
  }, [cajas, visibles]);

  return (
    <instancedMesh ref={ref} args={[null, null, cajas.length]} castShadow={!fantasma} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      {caras.map((map, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} map={map} roughness={0.8} transparent={fantasma} opacity={fantasma ? 0.38 : 1} depthWrite={!fantasma} />
      ))}
    </instancedMesh>
  );
}

// Cajas que no cupieron: se muestran semitransparentes frente a la puerta
export function posicionesFuera(noColocadas, productos, contenedor, maxPorProducto = 240) {
  const out = [];
  let x0 = contenedor.largo + 60;
  for (const n of noColocadas) {
    const p = productos.find((q) => q.id === n.productoId);
    if (!p) continue;
    const [dx, dy, dz] = [p.largo, p.alto, p.ancho];
    const porFila = Math.max(1, Math.floor(contenedor.ancho / dz));
    const porCol = Math.max(1, Math.floor(contenedor.alto / dy));
    const cant = Math.min(n.cantidad, maxPorProducto);
    for (let i = 0; i < cant; i++) {
      const capa = Math.floor(i / (porFila * porCol));
      const r = i % (porFila * porCol);
      out.push({ productoId: p.id, x: x0 + capa * dx, y: Math.floor(r / porFila) * dy, z: (r % porFila) * dz, dx, dy, dz, orientacion: 'lhw' });
    }
    x0 += Math.ceil(cant / (porFila * porCol)) * dx + 40;
  }
  return out;
}

// Marca la última caja colocada durante la secuencia de carga
function Marcador({ caja, contenedor }) {
  const pos = [(caja.x + caja.dx / 2 - contenedor.largo / 2) * S, (caja.y + caja.dy / 2) * S, (caja.z + caja.dz / 2 - contenedor.ancho / 2) * S];
  return (
    <mesh position={pos} scale={[caja.dx * S * 1.02, caja.dy * S * 1.02, caja.dz * S * 1.02]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#DDBD62" transparent opacity={0.25} depthWrite={false} />
      <Edges color="#DDBD62" lineWidth={2} />
    </mesh>
  );
}

function agrupar(cajas) {
  const g = new Map();
  for (const b of cajas) {
    const k = `${b.productoId}|${b.dx}|${b.dy}|${b.dz}`;
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(b);
  }
  return [...g.entries()];
}

// Maneja la cámara: vistas predefinidas, rotar, acercar y reiniciar, con transición suave
function CameraRig({ apiRef, contenedor, alejar }) {
  const { camera, controls, gl, invalidate } = useThree();
  const meta = useRef(null);
  // Depende de las medidas (no del objeto): un resultado nuevo con el mismo contenedor no mueve la cámara
  const target = useMemo(() => new Vector3(0, (contenedor.alto * S) / 2, 0), [contenedor.alto]);
  const dist0 = Math.max(contenedor.largo, contenedor.ancho * 2) * S * 1.15 * (alejar ? 1.6 : 1);

  const irA = (v) => {
    const d = new Vector3(...DIRECCIONES[v]).normalize().multiplyScalar(dist0);
    meta.current = target.clone().add(d);
    invalidate();
  };

  useEffect(() => {
    if (!controls) return undefined;
    controls.target.copy(target);
    camera.position.copy(target.clone().add(new Vector3(...DIRECCIONES.iso).normalize().multiplyScalar(dist0)));
    controls.update();
    const cancelar = () => {
      meta.current = null;
    };
    controls.addEventListener('start', cancelar);
    return () => controls.removeEventListener('start', cancelar);
  }, [controls, camera, target, dist0]);

  useEffect(() => {
    apiRef.current = {
      vista: irA,
      reiniciar: () => irA('iso'),
      rotar: (grados) => {
        const off = (meta.current || camera.position).clone().sub(target);
        off.applyAxisAngle(new Vector3(0, 1, 0), (grados * Math.PI) / 180);
        meta.current = target.clone().add(off);
        invalidate();
      },
      zoom: (f) => {
        const off = (meta.current || camera.position).clone().sub(target);
        const len = Math.min(controls.maxDistance, Math.max(controls.minDistance, off.length() * f));
        meta.current = target.clone().add(off.setLength(len));
        invalidate();
      },
      capturar: () => gl.domElement.toDataURL('image/png'),
    };
  });

  useFrame(() => {
    if (!meta.current || !controls) return;
    camera.position.lerp(meta.current, 0.16);
    if (camera.position.distanceTo(meta.current) < 0.005) {
      camera.position.copy(meta.current);
      meta.current = null;
    }
    controls.update();
  });

  return null;
}

/**
 * Visor del contenedor. resultado = { contenedor, colocadas, noColocadas }.
 * apiRef recibe { vista(id), reiniciar(), rotar(grados), zoom(factor), capturar() }.
 */
export default function ContainerViewer3D({ resultado, productos, apiRef, mostrarFuera = true, visibles }) {
  const c = resultado.contenedor;
  const porId = useMemo(() => Object.fromEntries(productos.map((p) => [p.id, p])), [productos]);
  const grupos = useMemo(() => agrupar(resultado.colocadas.map((b, orden) => ({ ...b, orden }))), [resultado]);
  const total = resultado.colocadas.length;
  const enSecuencia = visibles != null && visibles < total;
  const fuera = useMemo(
    () => (mostrarFuera ? agrupar(posicionesFuera(resultado.noColocadas, productos, c)) : []),
    [resultado, productos, c, mostrarFuera],
  );
  const maxDist = Math.max(c.largo, c.ancho) * S * 4;

  return (
    <Canvas camera={{ fov: 40, near: 0.05, far: 200 }} dpr={[1, 2]} gl={{ antialias: true, preserveDrawingBuffer: true }} shadows>
      <color attach="background" args={['#E7EEE8']} />
      <ambientLight intensity={1} />
      <hemisphereLight args={['#FFFFFF', '#B9C3BD', 0.6]} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <directionalLight position={[-8, 5, -6]} intensity={0.4} />
      <Contenedor c={c} />
      {grupos.map(([k, cajas]) => (
        <GrupoCajas key={k} cajas={cajas} producto={porId[cajas[0].productoId]} contenedor={c} visibles={visibles ?? Infinity} />
      ))}
      {enSecuencia && visibles > 0 && <Marcador caja={resultado.colocadas[Math.floor(visibles) - 1]} contenedor={c} />}
      {!enSecuencia && fuera.map(([k, cajas]) => (
        <GrupoCajas key={'f' + k} cajas={cajas} producto={porId[cajas[0].productoId]} contenedor={c} fantasma />
      ))}
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={1} maxDistance={maxDist} maxPolarAngle={Math.PI / 2 - 0.02} />
      <CameraRig apiRef={apiRef} contenedor={c} alejar={fuera.length > 0} />
    </Canvas>
  );
}
