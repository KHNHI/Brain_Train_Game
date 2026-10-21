import { Link, useBlocker, useLocation } from 'react-router-dom';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FACE_INFO,
  FACES,
  inverse,
  isSolved,
  scramble,
  type Face,
  type Move,
} from '../games/cube/engine/cube';
import {
  appendMove,
  MAX_MOVES,
  newSession,
  sessionState,
  type CubeSession,
} from '../games/cube/engine/session';
import type { Transition } from '../games/cube/scene/CubeScene';
import { loadSession, saveSession } from '../infrastructure/local-save';
import { SceneBoundary } from '../shared/ui/SceneBoundary';
import { SolutionPanel } from '../features/solution/SolutionPanel';

const CubeScene = lazy(() => import('../games/cube/scene/CubeScene'));
type Pending = Transition & { next: CubeSession };

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function CubePage() {
  const location = useLocation();
  const [session, setSession] = useState<CubeSession>(() => newSession());
  const [selected, setSelected] = useState<Face>('F');
  const [pending, setPending] = useState<Pending | null>(null);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Opening local save…');
  const [notice, setNotice] = useState('Select a face, then use the arrows to turn it.');
  const [help, setHelp] = useState(location.hash === '#instructions');
  useEffect(() => {
    if (location.hash !== '#instructions') return;
    const frame = requestAnimationFrame(() =>
      document.getElementById('instructions')?.scrollIntoView(),
    );
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);
  const [symbols, setSymbols] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const pendingRef = useRef<Pending | null>(null);
  const token = useRef(0);
  const writeQueue = useRef(Promise.resolve());
  const reducedMotion = useReducedMotion();
  const state = useMemo(() => sessionState(session), [session]);
  const solved = isSolved(state);
  const busy = !ready || !!pending;

  useEffect(() => {
    let active = true;
    loadSession()
      .then((saved) => {
        if (!active) return;
        if (saved) {
          setSession(saved);
          setNotice('Saved puzzle restored.');
        }
        setSaveStatus(saved ? 'Saved on this device' : 'Local saves ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStorageBlocked(true);
        setSaveStatus('Local save unavailable');
        setNotice(
          error instanceof Error
            ? error.message
            : 'Local storage is unavailable. You can still play.',
        );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback(
    (next: CubeSession) => {
      setSession(next);
      if (storageBlocked) return;
      setSaveStatus('Saving…');
      writeQueue.current = writeQueue.current
        .then(() => saveSession(next))
        .then(() => {
          setSaveStatus('Saved on this device');
        })
        .catch(() => {
          setSaveStatus('Could not save — keep this tab open');
        });
    },
    [storageBlocked],
  );

  const complete = useCallback(
    (id: number) => {
      const current = pendingRef.current;
      if (!current || current.token !== id) return;
      pendingRef.current = null;
      setPending(null);
      commit(current.next);
    },
    [commit],
  );

  function animate(move: Move, next: CubeSession) {
    if (pendingRef.current || !ready) return;
    const value = { move, next, token: ++token.current };
    pendingRef.current = value;
    setPending(value);
    setNotice(
      `${move.face}${move.direction === -1 ? '′' : ''} · ${FACE_INFO[move.face].name} face ${move.direction === 1 ? 'clockwise' : 'counterclockwise'}`,
    );
  }

  // Accepted moves settle exactly once even if WebGL stalls or the tab is hidden.
  useEffect(() => {
    if (!pending) return;
    const settle = () => {
      if (document.hidden) complete(pending.token);
    };
    const timeout = window.setTimeout(() => complete(pending.token), reducedMotion ? 30 : 700);
    document.addEventListener('visibilitychange', settle);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', settle);
    };
  }, [pending, complete, reducedMotion]);

  function turn(direction: 1 | -1) {
    if (busy || session.cursor >= MAX_MOVES) return;
    const move = { face: selected, direction };
    animate(move, appendMove(session, move));
  }
  function applySuggestedMove(move: Move) {
    if (busy || session.cursor >= MAX_MOVES) return;
    setSelected(move.face);
    animate(move, appendMove(session, move));
  }
  function undo() {
    const move = session.moves[session.cursor - 1];
    if (!busy && move) animate(inverse(move), { ...session, cursor: session.cursor - 1 });
  }
  function redo() {
    const move = session.moves[session.cursor];
    if (!busy && move) animate(move, { ...session, cursor: session.cursor + 1 });
  }
  function startScramble() {
    if (busy) return;
    if (
      session.cursor > 0 &&
      !window.confirm('Start a new scramble? This replaces the current puzzle and its history.')
    )
      return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
    commit(newSession(scramble(seed)));
    setNotice('20-turn scramble applied.');
    setConfirmReset(false);
  }
  function reset() {
    if (busy) return;
    commit(newSession());
    setNotice('Cube reset.');
    setConfirmReset(false);
  }

  // In-app navigation waits for an accepted turn and its local save to settle.
  const blocker = useBlocker(!!pending || saveStatus === 'Saving…');
  useEffect(() => {
    if (blocker.state === 'blocked' && !pending && saveStatus !== 'Saving…') blocker.proceed();
  }, [blocker, pending, saveStatus]);
  const recent = session.moves.slice(Math.max(0, session.cursor - 8), session.cursor);

  return (
    <div className="cube-page">
      <div className="game-content">
        <div className="page-heading">
          <Link className="back-link" to="/games">
            ← All games
          </Link>
          <h1>Cube</h1>
          <span>3 × 3 · Practice</span>
          <button
            className="instructions-toggle"
            onClick={() => setHelp(!help)}
            aria-expanded={help}
          >
            How to play
          </button>
        </div>
        {help && (
          <aside className="field-notes" id="instructions">
            <div>
              <strong>Controls</strong>
              <p>
                Drag to rotate or flip the view freely. The amber border marks the selected face.
                Select a face on the cube or in the panel, then use the arrows beside the cube.
                Clockwise is viewed directly from the selected face. Scroll or pinch to zoom. All
                buttons support Tab and Enter.
              </p>
              <p>
                Color names stay with their faces when you rotate the view. Letters in the move
                history use the cube’s fixed starting orientation.
              </p>
              <p>Progress is saved in this browser only.</p>
            </div>
            <button onClick={() => setHelp(false)} aria-label="Close instructions">
              ×
            </button>
          </aside>
        )}

        <section className="play-layout" id="play" aria-label="Cube practice">
          <div className="play-board">
            <div className="board-topline">
              <span className="selected-face">
                <span className="face-swatch" style={{ background: FACE_INFO[selected].color }} />
                {FACE_INFO[selected].name} face selected
              </span>
              <button onClick={() => setViewKey((key) => key + 1)} disabled={busy}>
                Reset view
              </button>
            </div>
            <div className="scene-wrap">
              <div className="scene">
                <SceneBoundary>
                  <Suspense fallback={<div className="scene-fallback">Loading cube…</div>}>
                    <CubeScene
                      state={state}
                      selected={selected}
                      transition={pending}
                      symbols={symbols}
                      reducedMotion={reducedMotion}
                      viewKey={viewKey}
                      onSelect={(face) => {
                        if (!busy) setSelected(face);
                      }}
                      onComplete={complete}
                    />
                  </Suspense>
                </SceneBoundary>
              </div>
              <div className="cube-turn-controls" role="group" aria-label="Turn selected face">
                <button
                  className="cube-turn turn-counterclockwise"
                  disabled={busy || session.cursor >= MAX_MOVES}
                  onClick={() => turn(-1)}
                  aria-label={`Turn ${FACE_INFO[selected].name.toLowerCase()} face counterclockwise`}
                  title={`Turn ${FACE_INFO[selected].name.toLowerCase()} face counterclockwise`}
                >
                  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <path d="M48 49A23 23 0 1 0 12 22M11 9v14h14" />
                  </svg>
                  <span>Counterclockwise</span>
                </button>
                <button
                  className="cube-turn turn-clockwise"
                  disabled={busy || session.cursor >= MAX_MOVES}
                  onClick={() => turn(1)}
                  aria-label={`Turn ${FACE_INFO[selected].name.toLowerCase()} face clockwise`}
                  title={`Turn ${FACE_INFO[selected].name.toLowerCase()} face clockwise`}
                >
                  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <path d="M16 49A23 23 0 1 1 52 22M53 9v14H39" />
                  </svg>
                  <span>Clockwise</span>
                </button>
              </div>
            </div>
            <div className="board-footer">
              <span>Drag to orbit · Scroll to zoom</span>
              <span>Turns are relative to the selected face</span>
            </div>
          </div>

          <aside className="control-panel" aria-label="Puzzle controls">
            <div className="metrics">
              <div>
                <strong data-testid="move-count">{String(session.cursor).padStart(2, '0')}</strong>
                <span>Moves</span>
              </div>
              <div>
                <strong className="state-label">{solved ? 'Solved' : 'Unsolved'}</strong>
                <span>State</span>
              </div>
            </div>
            <h2 id="face-label">Select face</h2>
            <div className="face-selector" role="group" aria-labelledby="face-label">
              {FACES.map((face) => (
                <button
                  key={face}
                  disabled={busy}
                  aria-label={`Select ${FACE_INFO[face].name.toLowerCase()} face`}
                  aria-pressed={selected === face}
                  onClick={() => setSelected(face)}
                  className={selected === face ? 'selected' : ''}
                >
                  <span className="face-swatch" style={{ background: FACE_INFO[face].color }} />
                  <span>{FACE_INFO[face].name}</span>
                  <kbd>{face}</kbd>
                </button>
              ))}
            </div>
            <div className="history-controls">
              <button onClick={undo} disabled={busy || session.cursor === 0}>
                ↶ Undo
              </button>
              <button onClick={redo} disabled={busy || session.cursor === session.moves.length}>
                Redo ↷
              </button>
            </div>
            <div className="recent-moves" aria-label="Recent moves">
              <h2>History</h2>
              <div>
                {recent.length ? (
                  recent.map((move, i) => (
                    <code key={`${session.cursor}-${i}`}>
                      {move.face}
                      {move.direction === -1 ? '′' : ''}
                    </code>
                  ))
                ) : (
                  <span className="empty-trail">—</span>
                )}
              </div>
            </div>
            <button className="scramble-button" disabled={busy} onClick={startScramble}>
              Scramble
            </button>
            <div className="panel-bottom">
              <label>
                <input
                  type="checkbox"
                  checked={symbols}
                  onChange={(event) => setSymbols(event.target.checked)}
                />
                Sticker markings
              </label>
              <button
                disabled={busy}
                onClick={() => setConfirmReset(!confirmReset)}
                aria-expanded={confirmReset}
              >
                Start over
              </button>
            </div>
            {confirmReset && (
              <div className="reset-confirm">
                <p>Reset to a solved cube?</p>
                <button onClick={reset} disabled={busy}>
                  Yes, reset
                </button>
                <button onClick={() => setConfirmReset(false)}>Cancel</button>
              </div>
            )}
            <p className="save-status" role="status">
              {saveStatus}
            </p>
          </aside>
        </section>
        <SolutionPanel
          session={session}
          state={state}
          busy={busy}
          onApply={applySuggestedMove}
          onSelect={setSelected}
        />
        <div
          className={`session-notice${storageBlocked ? ' storage-warning' : ''}`}
          role="status"
          aria-live="polite"
        >
          {notice}
          {storageBlocked && ' Saving is disabled to preserve existing data.'}
          {session.cursor >= MAX_MOVES && ' Move limit reached. Undo or start a new puzzle.'}
        </div>
      </div>
    </div>
  );
}
