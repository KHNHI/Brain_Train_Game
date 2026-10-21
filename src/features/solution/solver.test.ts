import { beforeAll, describe, expect, it } from 'vitest';
import Cube from '../../../vendor/cubejs/index.mjs';
import { applyMove, FACES, isSolved, replay, scramble } from '../../games/cube/engine/cube';
import { appendMove, newSession, sessionState } from '../../games/cube/engine/session';
import { notation, parseAlgorithm, verifySolution } from '../../games/cube/engine/solution';

describe('solver adapter', () => {
  beforeAll(() => {
    Cube.initSolver();
  }, 30_000);
  it('validates solver notation against every face and seeded scrambles', () => {
    const sequences = [
      ...FACES.map((face) => [{ face, direction: 1 as const }]),
      scramble(42),
      scramble(93),
      scramble(2026),
    ];
    for (const moves of sequences) {
      const session = newSession(moves);
      const cube = new Cube().move(moves.map(notation).join(' '));
      const result = verifySolution(session, parseAlgorithm(cube.solve()));
      expect(isSolved(replay(result, sessionState(session)))).toBe(true);
    }
  }, 30_000);
  it('solves an edited scrambled state', () => {
    const session = appendMove(newSession(scramble(17)), { face: 'R', direction: -1 });
    const cube = new Cube().move([...session.scramble, ...session.moves].map(notation).join(' '));
    const result = verifySolution(session, parseAlgorithm(cube.solve()));
    expect(result.length).toBeGreaterThan(0);
    expect(isSolved(replay(result, applyMove(replay(session.scramble), session.moves[0]!)))).toBe(
      true,
    );
  }, 30_000);
  it('rejects invalid tokens, oversized output, malformed results, and wrong solutions', () => {
    for (const text of ['R;alert(1)', 'X', 'R3', 'F '.repeat(200)])
      expect(() => parseAlgorithm(text)).toThrow();
    expect(parseAlgorithm("R2 U'")).toEqual([
      { face: 'R', direction: 1 },
      { face: 'R', direction: 1 },
      { face: 'U', direction: -1 },
    ]);
    expect(() => verifySolution(newSession(scramble(17)), [])).toThrow();
    expect(() => verifySolution(newSession(), [{ face: 'X', direction: 1 }])).toThrow();
    expect(verifySolution(newSession(), [])).toEqual([]);
  });
});
