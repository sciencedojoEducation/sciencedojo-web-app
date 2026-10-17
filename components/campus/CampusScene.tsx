"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Color, Object3D, Vector3, type Group, type InstancedMesh } from "three";
import { AVATAR_COLOURS, SEATS, type Player, type Snapshot } from "@/lib/campus/protocol";
import { advancePresentation, createPresentation, receivePresentation } from "@/lib/campus/presentation";

type Triple = [number, number, number];
type Box = { position: Triple; size: Triple; colour: string; seat?: number };
// One unit-box geometry/material and one draw call for the fixed library.
const BOXES: Box[] = [];
function box(position: Triple, size: Triple, colour: string, seat?: number) {
  BOXES.push({ position, size, colour, seat });
}
box([0, -.5, 0], [23, .8, 19], "#b6c6ae");
box([0, -.03, 0], [19.5, .18, 15.5], "#ede9dc");
box([0, .08, .7], [5, .08, 9], "#9cb9ac");
box([0, 1.3, -7.5], [19.5, 2.6, .22], "#d0d9c8");
for (const x of [-9.5, 9.5]) {
  box([x, 1.8, 0], [.18, 3.6, 15], "#a7b7a2");
  for (const z of [-6, 0, 6]) box([x, 2.3, z], [.28, 4.6, .28], "#426c60");
}
for (const x of [-7.2, 7.2]) {
  box([x, 1.4, -6.8], [3.8, 2.8, .7], "#7a6954");
  for (const y of [.5, 1.3, 2.1]) {
    box([x, y, -6.3], [3.8, .08, .9], "#b49b77");
    for (let i = 0; i < 11; i++) box([x - 1.5 + i * .29, y + .24, -6.4],
      [.17, .4 + i % 3 * .05, .35], ["#477a70", "#ceae70", "#ac7462", "#ded7bb"][i % 4]);
  }
}
SEATS.forEach((seat, i) => {
  const at = (x: number, y: number, z: number): Triple => [seat.x + x, y, seat.z + z];
  box(at(0, 1.1, -.7), [2.3, .15, 1.3], "#c5ac83");
  for (const x of [-.9, .9]) box(at(x, .5, -.7), [.12, 1, .9], "#55766b");
  box(at(0, i < 2 ? 1.58 : 1.45, -1), [1.05, i < 2 ? .67 : .5, .1], "#264c49");
  box(at(0, i < 2 ? 1.58 : 1.45, -.935), [.89, i < 2 ? .52 : .38, .02], "#a2ccba");
  box(at(0, 1.21, -.65), [i < 2 ? .8 : 1.12, .06, i < 2 ? .26 : .7], i < 2 ? "#426c60" : "#546c69");
  box(at(0, .55, 0), [.8, .15, .8], "#53877b", i);
  box(at(0, .95, .38), [.8, .85, .12], "#53877b");
});

const Library = memo(function Library({ occupied }: { occupied: number }) {
  const boxes = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!boxes.current) return;
    const transform = new Object3D();
    BOXES.forEach((b, i) => {
      transform.position.set(...b.position); transform.scale.set(...b.size); transform.updateMatrix();
      boxes.current!.setMatrixAt(i, transform.matrix);
    });
    boxes.current.instanceMatrix.needsUpdate = true;
    boxes.current.computeBoundingSphere();
  }, []);
  useLayoutEffect(() => {
    if (!boxes.current) return;
    const colour = new Color();
    BOXES.forEach((b, i) => boxes.current!.setColorAt(i,
      colour.set(b.seat !== undefined && (occupied & (1 << b.seat)) ? "#ae8965" : b.colour)));
    if (boxes.current.instanceColor) boxes.current.instanceColor.needsUpdate = true;
  }, [occupied]);
  return <>
    <color attach="background" args={["#d8e4dd"]} />
    <fog attach="fog" args={["#d8e4dd", 35, 65]} />
    <ambientLight intensity={1.3} />
    <directionalLight position={[8, 18, 6]} intensity={2.5} castShadow
      shadow-mapSize={[1024, 1024]} shadow-camera-left={-15} shadow-camera-right={15}
      shadow-camera-top={12} shadow-camera-bottom={-12}
      shadow-autoUpdate={false} shadow-needsUpdate={true} />
    <instancedMesh ref={boxes} args={[undefined, undefined, BOXES.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={.8} />
    </instancedMesh>
    {[-7.6, 7.6].flatMap(x => [3, 6].map(z => <group key={x + ":" + z} position={[x, 0, z]}>
      <mesh position={[0, .4, 0]} castShadow><cylinderGeometry args={[.55, .4, .8, 8]} /><meshStandardMaterial color="#b78a68" /></mesh>
      <mesh position={[0, 1.5, 0]} castShadow><icosahedronGeometry args={[.9, 1]} /><meshStandardMaterial color="#6e936b" /></mesh>
      <mesh position={[.2, 2.1, 0]} castShadow><icosahedronGeometry args={[.65, 0]} /><meshStandardMaterial color="#82a479" /></mesh>
    </group>))}
  </>;
});

type ViewPosition = { current: { x: number; z: number } };
function Avatar({ player, self, onPosition }: { player: Player; self: boolean; onPosition: (x: number, z: number) => void }) {
  const group = useRef<Group>(null);
  const motion = useRef(createPresentation(player, 0));
  const invalidate = useThree(s => s.invalidate);
  useLayoutEffect(() => { receivePresentation(motion.current, player, performance.now()); invalidate(); }, [player, invalidate]);
  useFrame(() => {
    const view = motion.current;
    const moving = advancePresentation(view, performance.now());
    group.current?.position.set(view.x, player.seat ? .4 : 0, view.z);
    if (group.current) group.current.rotation.y = view.rotation;
    if (self) onPosition(view.x, view.z);
    if (moving) invalidate();
  }, -1);
  return <group ref={group}>
    <mesh position={[0, .75, 0]}><capsuleGeometry args={[.28, player.seat ? .25 : .55, 4, 8]} /><meshStandardMaterial color={AVATAR_COLOURS[player.colour]} /></mesh>
    <mesh position={[0, player.seat ? 1.27 : 1.42, 0]}><sphereGeometry args={[.23, 12, 12]} /><meshStandardMaterial color="#e9c5a0" /></mesh>
    {!player.seat && <mesh position={[0, .075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[.4, 16]} /><meshBasicMaterial color="#25483d" transparent opacity={.15} depthWrite={false} />
    </mesh>}
    {self && <mesh position={[0, .1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[.43, .52, 24]} /><meshBasicMaterial color="#205e52" />
    </mesh>}
  </group>;
}
function Camera({ focus, present, reducedMotion }: { focus: ViewPosition; present: boolean; reducedMotion: boolean }) {
  const camera = useThree(s => s.camera), invalidate = useThree(s => s.invalidate);
  const target = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    const x = present && !reducedMotion ? focus.current.x * .25 : 0;
    const z = present && !reducedMotion ? focus.current.z * .15 : 0;
    target.set(x + 13, 16, z + 20);
    if (reducedMotion || camera.position.distanceToSquared(target) < .000001) camera.position.copy(target);
    else { camera.position.lerp(target, 1 - Math.exp(-delta * 3)); invalidate(); }
    camera.lookAt(x, 0, z - 1);
  });
  return null;
}
export default function CampusScene({ snapshot, active, onUnavailable }: {
  snapshot: Snapshot; active: boolean; onUnavailable: () => void;
}) {
  const focus = useRef({ x: 0, z: 0 });
  const follow = useCallback((x: number, z: number) => { focus.current.x = x; focus.current.z = z; }, []);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) onUnavailable();
    else context.getExtension("WEBGL_lose_context")?.loseContext();
  }, [onUnavailable]);
  const occupied = SEATS.reduce((mask, seat, i) => mask | (snapshot.occupied.includes(seat.id) ? 1 << i : 0), 0);
  return <Canvas shadows dpr={1} frameloop={active ? "demand" : "never"}
    camera={{ fov: 43, position: [13, 16, 20] }}
    fallback={<p>3D is unavailable. You can open your courses directly.</p>}
    onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", onUnavailable)}>
    <Library occupied={occupied} />
    {snapshot.players.map(p => <Avatar key={p.id} player={p} self={p.id === snapshot.self} onPosition={follow} />)}
    <Camera focus={focus} present={snapshot.players.some(p => p.id === snapshot.self)}
      reducedMotion={typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches} />
  </Canvas>;
}
