import { z } from 'zod';
import { FACE_INFO, isSolved, replay, type Face, type Move } from './cube';
import { sessionState, type CubeSession } from './session';

export const solutionSchema = z
  .array(
    z
      .object({
        face: z.enum(['U', 'R', 'F', 'D', 'L', 'B']),
        direction: z.union([z.literal(1), z.literal(-1)]),
      })
      .strict(),
  )
  .max(64);

export function notation(move: Move): string {
  return `${move.face}${move.direction === -1 ? "'" : ''}`;
}

export function describeMove(move: Move): string {
  return `Turn the ${FACE_INFO[move.face].name.toLowerCase()} face ${move.direction === 1 ? 'clockwise' : 'counterclockwise'} by 90°.`;
}

export function parseAlgorithm(algorithm: string): Move[] {
  if (algorithm.length > 256) throw new Error('Solver output exceeds the allowed size.');
  if (!algorithm.trim()) return [];
  return algorithm
    .trim()
    .split(/\s+/)
    .flatMap((token): Move[] => {
      if (!/^[URFDLB](2|')?$/.test(token)) throw new Error('Invalid solver move.');
      const move: Move = { face: token[0] as Face, direction: token.endsWith("'") ? -1 : 1 };
      return token.endsWith('2') ? [move, move] : [move];
    });
}

export function verifySolution(session: CubeSession, raw: unknown): Move[] {
  const moves = solutionSchema.parse(raw);
  if (!isSolved(replay(moves, sessionState(session))))
    throw new Error('The proposed solution failed validation.');
  return moves;
}
