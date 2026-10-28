import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Edges, OrbitControls } from '@react-three/drei';
import { texturaCara, sombra } from './three/etiqueta';

// Vista previa de una caja: se escala para que la medida mayor ocupe 2 unidades.
// Ejes como en el contenedor: x = largo, y = alto, z = ancho.
function Caja({ largo, ancho, alto, color, nombre }) {
  const k = 2 / Math.max(largo, ancho, alto);
  const [x, y, z] = [largo * k, alto * k, ancho * k];
  // Orden de caras en BoxGeometry: +x, -x, +y, -y, +z, -z
  const caras = useMemo(
    () => [
      texturaCara(color, nombre, ancho, alto),
      texturaCara(color, nombre, ancho, alto),
      texturaCara(color, nombre, largo, ancho),
      texturaCara(color, '', largo, ancho),
      texturaCara(color, nombre, largo, alto),
      texturaCara(color, nombre, largo, alto),
    ],
    [color, nombre, largo, ancho, alto],
  );

  return (
    <mesh position={[0, y / 2, 0]} castShadow>
      <boxGeometry args={[x, y, z]} />
      {caras.map((map, i) => (
        <meshStandardMaterial key={i} attach={`material-${i}`} map={map} roughness={0.85} />
      ))}
      <Edges color={sombra(color, -0.45)} />
    </mesh>
  );
}

export default function BoxPreview3D(props) {
  return (
    <Canvas camera={{ position: [3.2, 2.4, 3.6], fov: 38 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <directionalLight position={[-3, 2, -4]} intensity={0.5} />
      <group position={[0, -0.9, 0]}>
        <Caja {...props} />
        <ContactShadows position={[0, 0.001, 0]} opacity={0.35} scale={6} blur={2.4} far={3} />
      </group>
      <OrbitControls autoRotate autoRotateSpeed={1.6} enablePan={false} minDistance={3} maxDistance={9} target={[0, 0, 0]} />
    </Canvas>
  );
}
