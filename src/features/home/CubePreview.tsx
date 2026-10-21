import { useMemo, useState } from 'react';
import { FACE_INFO, isSolved, replay, type Face, type Move } from '../../games/cube/engine/cube';
import { GameArtwork } from '../../shared/ui/GameArtwork';

const visibleFaces = ['U', 'R', 'F'] as const;
export function CubePreview() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [face, setFace] = useState<Face>('F');
  const state = useMemo(() => replay(moves), [moves]);
  const colors = useMemo(() => {
    const tile = (position: number[], normal: number[]) => {
      const sticker = state.stickers.find(
        (s) =>
          s.position.every((v, i) => v === position[i]) &&
          s.normal.every((v, i) => v === normal[i]),
      );
      return sticker ? FACE_INFO[sticker.face].color : '#25302e';
    };
    return {
      U: Array.from({ length: 9 }, (_, i) =>
        tile([(i % 3) - 1, 1, Math.floor(i / 3) - 1], [0, 1, 0]),
      ),
      F: Array.from({ length: 9 }, (_, i) =>
        tile([(i % 3) - 1, 1 - Math.floor(i / 3), 1], [0, 0, 1]),
      ),
      R: Array.from({ length: 9 }, (_, i) =>
        tile([1, 1 - Math.floor(i / 3), 1 - (i % 3)], [1, 0, 0]),
      ),
    };
  }, [state]);
  const limit = moves.length >= 60;
  const turn = (direction: 1 | -1) => {
    setMoves((current) => (current.length < 60 ? [...current, { face, direction }] : current));
  };
  const solved = isSolved(state);
  const undo = () => setMoves((current) => current.slice(0, -1));
  return (
    <section className="home-cube-preview" aria-label="Interactive cube preview">
      <div className="preview-heading">
        <h2>Try a turn</h2>
        <button onClick={() => setMoves([])} disabled={!moves.length}>
          Reset
        </button>
      </div>
      <div
        className="preview-art"
        role="img"
        aria-label={`Cube preview after ${moves.length} turns, ${solved ? 'solved' : 'mixed'}`}
      >
        <GameArtwork game="cube" cubeColors={colors} selectedFace={face} />
      </div>
      <div className="preview-face-controls" role="group" aria-label="Preview face">
        {visibleFaces.map((value) => (
          <button key={value} aria-pressed={face === value} onClick={() => setFace(value)}>
            <span style={{ background: FACE_INFO[value].color }} />
            {FACE_INFO[value].name}
          </button>
        ))}
      </div>
      <div className="preview-turn-controls">
        <button
          onClick={() => turn(-1)}
          disabled={limit}
          aria-label={`Preview: turn ${FACE_INFO[face].name.toLowerCase()} counterclockwise`}
        >
          ↶ <span>Counterclockwise</span>
        </button>
        <button
          onClick={() => turn(1)}
          disabled={limit}
          aria-label={`Preview: turn ${FACE_INFO[face].name.toLowerCase()} clockwise`}
        >
          <span>Clockwise</span> ↷
        </button>
        <button onClick={undo} disabled={!moves.length}>
          Undo
        </button>
      </div>
      <p className="preview-status" role="status">
        {moves.length} {moves.length === 1 ? 'turn' : 'turns'} · {solved ? 'Solved' : 'Mixed'}
        {limit ? ' · Reset to continue' : ''}
      </p>
      <p className="preview-note">A quick preview. Your saved game stays unchanged.</p>
    </section>
  );
}
