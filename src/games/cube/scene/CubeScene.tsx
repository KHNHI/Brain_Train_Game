import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { TrackballControls, RoundedBox } from '@react-three/drei';
import { CanvasTexture, Group, Quaternion, SRGBColorSpace, Vector3 } from 'three';
import {
  FACE_INFO,
  faceFromNormal,
  type CubeState,
  type Face,
  type Move,
  type Sticker,
} from '../engine/cube';

export interface Transition {
  move: Move;
  token: number;
}
interface Props {
  state: CubeState;
  selected: Face;
  transition: Transition | null;
  symbols: boolean;
  reducedMotion: boolean;
  viewKey: number;
  onSelect(face: Face): void;
  onComplete(token: number): void;
}

function SymbolMark({ face }: { face: Face }) {
  // Geometry-only markings avoid remote fonts, HTML overlays, and canvas textures.
  const bars: Record<Face, [number, number, number][]> = {
    U: [[0, 0, 0]],
    R: [
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    ],
    F: [
      [-0.07, 0, -0.5],
      [0.07, 0, 0.5],
    ],
    D: [
      [0, 0, Math.PI / 4],
      [0, 0, -Math.PI / 4],
    ],
    L: [
      [-0.06, 0, 0],
      [0.06, 0, 0],
    ],
    B: [
      [-0.1, 0, 0],
      [0, 0, 0],
      [0.1, 0, 0],
    ],
  };
  return (
    <group position={[0, 0, 0.016]}>
      {bars[face].map(([x, y, angle], i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
          <boxGeometry args={[0.032, 0.17, 0.008]} />
          <meshBasicMaterial color="#1d2927" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function FaceLabel({ face, selected }: { face: Face; selected: boolean }) {
  // Local canvas texture: no remote font requests or HTML in the 3D scene.
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.font = '600 84px "Trebuchet MS", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#101a20';
      context.fillText(FACE_INFO[face].name.toUpperCase(), 256, 66);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [face]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 0, 0.03]}>
      <planeGeometry args={[0.77, 0.2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={selected ? 0.95 : 0.56}
        depthWrite={false}
      />
    </mesh>
  );
}

function Tile({
  sticker,
  selected,
  symbols,
  onSelect,
}: {
  sticker: Sticker;
  selected: Face;
  symbols: boolean;
  onSelect(face: Face): void;
}) {
  const normal = new Vector3(...sticker.normal);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
  const face = faceFromNormal(sticker.normal);
  const position = new Vector3(...sticker.position)
    .multiplyScalar(1.015)
    .addScaledVector(normal, 0.484);
  function choose(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(face);
  }
  const center = sticker.position.filter((coordinate) => coordinate !== 0).length === 1;
  return (
    <group position={position} quaternion={quaternion} onClick={choose}>
      <mesh>
        <boxGeometry args={[0.86, 0.86, 0.025]} />
        <meshStandardMaterial
          color={FACE_INFO[sticker.face].color}
          roughness={0.38}
          metalness={0.02}
          emissive={selected === face ? '#fff0be' : '#000000'}
          emissiveIntensity={selected === face ? 0.22 : 0}
        />
      </mesh>
      {center ? (
        <FaceLabel face={face} selected={selected === face} />
      ) : (
        symbols && <SymbolMark face={sticker.face} />
      )}
    </group>
  );
}

function SelectedFaceOutline({ face }: { face: Face }) {
  const { axis, sign } = FACE_INFO[face];
  const normal = new Vector3();
  normal.setComponent(axis, sign);
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal);
  // Keep depth testing: a hidden face must not be drawn through the cube.
  return (
    <group position={normal.clone().multiplyScalar(1.53)} quaternion={quaternion}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0, side * 1.465, 0]}>
            <boxGeometry args={[2.985, 0.055, 0.035]} />
            <meshBasicMaterial color="#f1c66e" toneMapped={false} />
          </mesh>
          <mesh position={[side * 1.465, 0, 0]}>
            <boxGeometry args={[0.055, 2.985, 0.035]} />
            <meshBasicMaterial color="#f1c66e" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Puzzle({
  state,
  selected,
  transition,
  symbols,
  reducedMotion,
  onSelect,
  onComplete,
}: Props) {
  const pivot = useRef<Group>(null);
  const progress = useRef({ token: -1, elapsed: 0, finished: false });
  useFrame((_, delta) => {
    if (!pivot.current) return;
    if (!transition) {
      pivot.current.rotation.set(0, 0, 0);
      return;
    }
    if (progress.current.token !== transition.token)
      progress.current = { token: transition.token, elapsed: 0, finished: false };
    if (progress.current.finished) return;
    progress.current.elapsed += Math.min(delta, 0.1);
    const t = reducedMotion ? 1 : Math.min(progress.current.elapsed / 0.26, 1);
    const eased = t * t * (3 - 2 * t);
    const { axis, sign } = FACE_INFO[transition.move.face];
    const angles: [number, number, number] = [0, 0, 0];
    angles[axis] = ((-sign * transition.move.direction * Math.PI) / 2) * eased;
    pivot.current.rotation.set(...angles);
    if (t === 1) {
      progress.current.finished = true;
      onComplete(transition.token);
    }
  });
  const info = transition ? FACE_INFO[transition.move.face] : null;
  const moving = (position: readonly number[]) => info && position[info.axis] === info.sign;
  const cubie = (piece: CubeState['cubies'][number]) => (
    <RoundedBox
      key={piece.id}
      args={[0.99, 0.99, 0.99]}
      radius={0.055}
      smoothness={2}
      position={piece.position.map((value) => value * 1.015) as [number, number, number]}
    >
      <meshStandardMaterial color="#25302e" roughness={0.5} />
    </RoundedBox>
  );
  const tile = (sticker: Sticker) => (
    <Tile
      key={sticker.id}
      sticker={sticker}
      selected={selected}
      symbols={symbols}
      onSelect={onSelect}
    />
  );
  return (
    <group>
      <SelectedFaceOutline face={selected} />
      {state.cubies.filter((p) => !moving(p.position)).map(cubie)}
      {state.stickers.filter((p) => !moving(p.position)).map(tile)}
      <group ref={pivot}>
        {state.cubies.filter((p) => moving(p.position)).map(cubie)}
        {state.stickers.filter((p) => moving(p.position)).map(tile)}
      </group>
    </group>
  );
}

export default function CubeScene(props: Props) {
  return (
    <Canvas
      key={props.viewKey}
      camera={{ position: [5.4, 4.3, 6.5], fov: 36 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      aria-label="Interactive 3D cube. Use the face selector and turn buttons for keyboard access."
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[3, 7, 5]} intensity={3.0} />
      <directionalLight position={[-4, 2, -3]} intensity={1.5} color="#cee4df" />
      <Puzzle {...props} />
      <TrackballControls
        key={props.viewKey}
        makeDefault
        noPan
        minDistance={5}
        maxDistance={12}
        rotateSpeed={2.5}
        zoomSpeed={0.9}
        staticMoving
      />
    </Canvas>
  );
}
