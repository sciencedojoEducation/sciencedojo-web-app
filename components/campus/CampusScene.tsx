"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3 } from "three";
import { AVATAR_COLOURS, SEATS, type Snapshot } from "@/lib/campus/protocol";

function Box({
  position,
  size,
  colour,
}: {
  position: [number, number, number];
  size: [number, number, number];
  colour: string;
}) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={colour} roughness={0.8} />
    </mesh>
  );
}
function Camera({
  snapshot,
  reducedMotion,
}: {
  snapshot: Snapshot;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const self = snapshot.players.find((p) => p.id === snapshot.self);
  useFrame((_, delta) => {
    const x = (self?.x || 0) * 0.25,
      z = (self?.z || 0) * 0.15;
    const target = new Vector3(x + 13, 16, z + 20);
    if (reducedMotion) camera.position.copy(target);
    else camera.position.lerp(target, Math.min(delta * 2, 1));
    camera.lookAt(x, 0, z - 1);
  });
  return null;
}
function Library({ snapshot }: { snapshot: Snapshot }) {
  return (
    <>
      <color attach="background" args={["#d8e4dd"]} />
      <fog attach="fog" args={["#d8e4dd", 35, 65]} />
      <ambientLight intensity={1.3} />
      <directionalLight
        position={[8, 18, 6]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <Box position={[0, -0.5, 0]} size={[23, 0.8, 19]} colour="#b6c6ae" />
      <Box
        position={[0, -0.03, 0]}
        size={[19.5, 0.18, 15.5]}
        colour="#ede9dc"
      />
      <Box position={[0, 0.08, 0.7]} size={[5, 0.08, 9]} colour="#9cb9ac" />
      <Box
        position={[0, 1.3, -7.5]}
        size={[19.5, 2.6, 0.22]}
        colour="#d0d9c8"
      />
      {[-9.5, 9.5].map((x) => (
        <group key={x}>
          <Box position={[x, 1.8, 0]} size={[0.18, 3.6, 15]} colour="#a7b7a2" />
          {[-6, 0, 6].map((z) => (
            <Box
              key={z}
              position={[x, 2.3, z]}
              size={[0.28, 4.6, 0.28]}
              colour="#426c60"
            />
          ))}
        </group>
      ))}
      {[-7.2, 7.2].map((x) => (
        <group key={x}>
          <Box
            position={[x, 1.4, -6.8]}
            size={[3.8, 2.8, 0.7]}
            colour="#7a6954"
          />
          {[0.5, 1.3, 2.1].map((y) => (
            <group key={y}>
              <Box
                position={[x, y, -6.3]}
                size={[3.8, 0.08, 0.9]}
                colour="#b49b77"
              />
              {Array.from({ length: 11 }, (_, i) => (
                <Box
                  key={i}
                  position={[x - 1.5 + i * 0.29, y + 0.24, -6.4]}
                  size={[0.17, 0.4 + (i % 3) * 0.05, 0.35]}
                  colour={["#477a70", "#ceae70", "#ac7462", "#ded7bb"][i % 4]}
                />
              ))}
            </group>
          ))}
        </group>
      ))}
      {SEATS.map((seat, index) => (
        <group key={seat.id} position={[seat.x, 0, seat.z]}>
          <Box
            position={[0, 1.1, -0.7]}
            size={[2.3, 0.15, 1.3]}
            colour="#c5ac83"
          />
          {[-0.9, 0.9].map((x) => (
            <Box
              key={x}
              position={[x, 0.5, -0.7]}
              size={[0.12, 1, 0.9]}
              colour="#55766b"
            />
          ))}
          <Box
            position={[0, index < 2 ? 1.58 : 1.45, -1]}
            size={[1.05, index < 2 ? 0.67 : 0.5, 0.1]}
            colour="#264c49"
          />
          <Box
            position={[0, index < 2 ? 1.58 : 1.45, -0.935]}
            size={[0.89, index < 2 ? 0.52 : 0.38, 0.02]}
            colour="#a2ccba"
          />
          <Box
            position={[0, 1.21, -0.65]}
            size={[index < 2 ? 0.8 : 1.12, 0.06, index < 2 ? 0.26 : 0.7]}
            colour={index < 2 ? "#426c60" : "#546c69"}
          />
          <Box
            position={[0, 0.55, 0]}
            size={[0.8, 0.15, 0.8]}
            colour={snapshot.occupied.includes(seat.id) ? "#ae8965" : "#53877b"}
          />
          <Box
            position={[0, 0.95, 0.38]}
            size={[0.8, 0.85, 0.12]}
            colour="#53877b"
          />
        </group>
      ))}
      {[-7.6, 7.6].flatMap((x) =>
        [3, 6].map((z) => (
          <group key={`${x}:${z}`} position={[x, 0, z]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.55, 0.4, 0.8, 8]} />
              <meshStandardMaterial color="#b78a68" />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow>
              <icosahedronGeometry args={[0.9, 1]} />
              <meshStandardMaterial color="#6e936b" />
            </mesh>
            <mesh position={[0.2, 2.1, 0]} castShadow>
              <icosahedronGeometry args={[0.65, 0]} />
              <meshStandardMaterial color="#82a479" />
            </mesh>
          </group>
        )),
      )}
      {snapshot.players.map((p) => (
        <group
          key={p.id}
          position={[p.x, p.seat ? 0.4 : 0, p.z]}
          rotation={[0, p.rotation, 0]}
        >
          <mesh position={[0, 0.75, 0]} castShadow>
            <capsuleGeometry args={[0.28, p.seat ? 0.25 : 0.55, 4, 8]} />
            <meshStandardMaterial color={AVATAR_COLOURS[p.colour]} />
          </mesh>
          <mesh position={[0, p.seat ? 1.27 : 1.42, 0]} castShadow>
            <sphereGeometry args={[0.23, 12, 12]} />
            <meshStandardMaterial color="#e9c5a0" />
          </mesh>
          {p.id === snapshot.self && (
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.43, 0.52, 24]} />
              <meshBasicMaterial color="#205e52" />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
export default function CampusScene({
  snapshot,
  active,
  onUnavailable,
}: {
  snapshot: Snapshot;
  active: boolean;
  onUnavailable: () => void;
}) {
  useEffect(() => {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) onUnavailable();
  }, [onUnavailable]);
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 43, position: [13, 16, 20] }}
      fallback={<p>3D is unavailable. You can open your courses directly.</p>}
      onCreated={({ gl }) =>
        gl.domElement.addEventListener("webglcontextlost", onUnavailable)
      }
    >
      <Camera
        snapshot={snapshot}
        reducedMotion={
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        }
      />
      <Library snapshot={snapshot} />
    </Canvas>
  );
}
