import type { PuzzleEngine } from '../../../core/contracts/puzzle';

export type Vector = readonly [number, number, number];
export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export type Face = (typeof FACES)[number];
export interface Move {
  readonly face: Face;
  readonly direction: 1 | -1;
}
export interface Sticker {
  readonly id: string;
  readonly position: Vector;
  readonly normal: Vector;
  readonly face: Face;
}
export interface Cubie {
  readonly id: string;
  readonly position: Vector;
}
export interface CubeState {
  readonly stickers: readonly Sticker[];
  readonly cubies: readonly Cubie[];
}

export const FACE_INFO: Record<
  Face,
  { axis: 0 | 1 | 2; sign: 1 | -1; color: string; name: string; symbol: string }
> = {
  U: { axis: 1, sign: 1, color: '#f4edcf', name: 'White', symbol: '○' },
  R: { axis: 0, sign: 1, color: '#ce604c', name: 'Red', symbol: '+' },
  F: { axis: 2, sign: 1, color: '#46897a', name: 'Green', symbol: '△' },
  D: { axis: 1, sign: -1, color: '#e9bc55', name: 'Yellow', symbol: '◇' },
  L: { axis: 0, sign: -1, color: '#e6914b', name: 'Orange', symbol: '□' },
  B: { axis: 2, sign: -1, color: '#618cba', name: 'Blue', symbol: '×' },
};

export function initialState(): CubeState {
  const cubies: Cubie[] = [];
  const stickers: Sticker[] = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const position: Vector = [x, y, z];
        cubies.push({ id: `${x},${y},${z}`, position });
        for (const face of FACES) {
          const { axis, sign } = FACE_INFO[face];
          if (position[axis] !== sign) continue;
          const normal: [number, number, number] = [0, 0, 0];
          normal[axis] = sign;
          stickers.push({ id: `${x},${y},${z}:${face}`, position, normal, face });
        }
      }
  return { cubies, stickers };
}

// Exact integer quarter-turns: no floating-point transforms enter domain state.
export function rotateVector([x, y, z]: Vector, axis: 0 | 1 | 2, quarter: 1 | -1): Vector {
  const result: Vector =
    axis === 0
      ? [x, -quarter * z, quarter * y]
      : axis === 1
        ? [quarter * z, y, -quarter * x]
        : [-quarter * y, quarter * x, z];
  return [result[0] || 0, result[1] || 0, result[2] || 0];
}

export function applyMove(state: CubeState, move: Move): CubeState {
  const { axis, sign } = FACE_INFO[move.face];
  const quarter = (-sign * move.direction) as 1 | -1;
  return {
    cubies: state.cubies.map((piece) =>
      piece.position[axis] === sign
        ? { ...piece, position: rotateVector(piece.position, axis, quarter) }
        : piece,
    ),
    stickers: state.stickers.map((sticker) =>
      sticker.position[axis] === sign
        ? {
            ...sticker,
            position: rotateVector(sticker.position, axis, quarter),
            normal: rotateVector(sticker.normal, axis, quarter),
          }
        : sticker,
    ),
  };
}

export function isSolved(state: CubeState): boolean {
  return state.stickers.every((sticker) => {
    const { axis, sign } = FACE_INFO[sticker.face];
    return sticker.normal[axis] === sign;
  });
}

export function faceFromNormal(normal: Vector): Face {
  return FACES.find((face) => normal[FACE_INFO[face].axis] === FACE_INFO[face].sign) ?? 'F';
}

export function inverse(move: Move): Move {
  return { face: move.face, direction: move.direction === 1 ? -1 : 1 };
}

export function replay(moves: readonly Move[], state = initialState()): CubeState {
  return moves.reduce(applyMove, state);
}

export function scramble(seed: number, length = 20): Move[] {
  let value = seed >>> 0 || 1;
  const next = () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return value >>> 0;
  };
  const result: Move[] = [];
  for (let i = 0; i < Math.min(Math.max(length, 0), 100); i++) {
    const previous = result.at(-1)?.face;
    const choices = FACES.filter((face) => face !== previous);
    result.push({ face: choices[next() % choices.length]!, direction: next() % 2 ? 1 : -1 });
  }
  return result;
}

export const cubeEngine: PuzzleEngine<CubeState, Move> = {
  initialState,
  applyMove,
  isSolved,
  legalMoves: () =>
    FACES.flatMap((face) => [
      { face, direction: 1 },
      { face, direction: -1 },
    ]),
};
