import { z } from 'zod';
import { FACES, replay, type Move } from './cube';

const moveSchema = z
  .object({ face: z.enum(FACES), direction: z.union([z.literal(1), z.literal(-1)]) })
  .strict();
export const MAX_MOVES = 2000;
export const sessionSchema = z
  .object({
    version: z.literal(1),
    game: z.literal('cube'),
    scramble: z.array(moveSchema).max(100),
    moves: z.array(moveSchema).max(MAX_MOVES),
    cursor: z.number().int().min(0).max(MAX_MOVES),
  })
  .strict()
  .refine((value) => value.cursor <= value.moves.length, 'Invalid history cursor');
export type CubeSession = z.infer<typeof sessionSchema>;
export const newSession = (scramble: Move[] = []): CubeSession => ({
  version: 1,
  game: 'cube',
  scramble,
  moves: [],
  cursor: 0,
});
export const sessionState = (session: CubeSession) =>
  replay(session.moves.slice(0, session.cursor), replay(session.scramble));
export function appendMove(session: CubeSession, move: Move): CubeSession {
  if (session.cursor >= MAX_MOVES)
    throw new Error('This session has reached its move limit. Start a new puzzle to continue.');
  return {
    ...session,
    moves: [...session.moves.slice(0, session.cursor), move],
    cursor: session.cursor + 1,
  };
}
