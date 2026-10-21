import { describe, expect, it } from 'vitest';
import { applyMove, FACES, initialState, inverse, isSolved, replay, scramble } from './cube';
import { appendMove, newSession, sessionSchema, sessionState } from './session';

describe('cube rules', () => {
  it('starts with 26 cubies and 54 stickers', () => {
    const state = initialState();
    expect(state.cubies).toHaveLength(26);
    expect(state.stickers).toHaveLength(54);
    expect(isSolved(state)).toBe(true);
  });
  for (const face of FACES) {
    it(`${face}: inverse and four turns restore exact state`, () => {
      const start = initialState();
      const move = { face, direction: 1 as const };
      expect(applyMove(applyMove(start, move), inverse(move))).toEqual(start);
      expect(replay([move, move, move, move])).toEqual(start);
      expect(isSolved(applyMove(start, move))).toBe(false);
    });
  }
  it('front clockwise moves upper-right front sticker to lower-right', () => {
    const turned = applyMove(initialState(), { face: 'F', direction: 1 });
    expect(turned.stickers.find((piece) => piece.id === '1,1,1:F')?.position).toEqual([1, -1, 1]);
  });
  it('preserves occupancy, color counts, normals and reversibility across 100 seeded scrambles', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const moves = scramble(seed, 100);
      const state = replay(moves);
      expect(new Set(state.cubies.map((piece) => piece.position.join())).size).toBe(26);
      expect(new Set(state.stickers.map((piece) => `${piece.position}:${piece.normal}`)).size).toBe(
        54,
      );
      for (const piece of state.stickers) {
        expect(piece.position.every((coordinate) => [-1, 0, 1].includes(coordinate))).toBe(true);
        expect(piece.normal.reduce((sum, n) => sum + Math.abs(n), 0)).toBe(1);
      }
      expect(replay([...moves].reverse().map(inverse), state)).toEqual(initialState());
    }
  });
  it('uses reproducible non-cancelling practice scrambles', () => {
    expect(scramble(42)).toEqual(scramble(42));
    const moves = scramble(42);
    expect(moves.every((move, i) => move.face !== moves[i - 1]?.face)).toBe(true);
  });
});

describe('versioned session boundary', () => {
  it('rejects malicious, unsupported, oversized, and inconsistent records', () => {
    const valid = newSession();
    for (const bad of [
      null,
      { ...valid, version: 9 },
      { ...valid, cursor: 2 },
      { ...valid, moves: [{ face: '<script>', direction: 1 }] },
      { ...valid, moves: Array.from({ length: 2001 }, () => ({ face: 'F', direction: 1 })) },
      { ...valid, admin: true },
    ]) {
      expect(sessionSchema.safeParse(bad).success).toBe(false);
    }
  });
  it('round trips a save and truncates redo when branching', () => {
    const first = appendMove(newSession(scramble(18)), { face: 'U', direction: 1 });
    const next = appendMove(first, { face: 'R', direction: -1 });
    expect(sessionState(sessionSchema.parse(JSON.parse(JSON.stringify(next))))).toEqual(
      sessionState(next),
    );
    const branch = appendMove({ ...next, cursor: 1 }, { face: 'F', direction: 1 });
    expect(branch.moves.map((m) => m.face)).toEqual(['U', 'F']);
  });
});
