import { useEffect, useRef, useState } from 'react';
import {
  applyMove,
  isSolved,
  type CubeState,
  type Face,
  type Move,
} from '../../games/cube/engine/cube';
import { MAX_MOVES, type CubeSession } from '../../games/cube/engine/session';
import { describeMove, notation, verifySolution } from '../../games/cube/engine/solution';

interface Props {
  session: CubeSession;
  state: CubeState;
  busy: boolean;
  onApply(move: Move): void;
  onSelect(face: Face): void;
}
interface Plan {
  moves: Move[];
  states: string[];
}
const fingerprint = (state: CubeState) =>
  state.stickers.map((s) => `${s.position}:${s.normal}`).join('|');

export function SolutionPanel({ session, state, busy, onApply, onSelect }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loadingSession, setLoadingSession] = useState<CubeSession | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = fingerprint(state);
  const solved = isSolved(state);
  const loading = loadingSession === session;
  const error = failure?.key === key ? failure.message : '';
  const index = plan?.states.indexOf(key) ?? -1;
  const next = index >= 0 ? plan?.moves[index] : undefined;
  const canApply = !busy && session.cursor < MAX_MOVES;

  function stop() {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  // A changed puzzle cancels old searches; matching plans can still advance/rewind.
  useEffect(() => {
    return stop;
  }, [session]);

  function request(full: boolean) {
    if (busy || loading || solved) return;
    setExpanded(full);
    setFailure(null);
    if (index >= 0 && plan) return;
    stop();
    setLoadingSession(session);
    try {
      const worker = new Worker(new URL('../../workers/cube-solver.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      const fail = (message: string) => {
        if (workerRef.current !== worker) return;
        stop();
        setLoadingSession(null);
        setFailure({ key, message });
      };
      timerRef.current = setTimeout(
        () => fail('Solver timed out. You can retry or keep playing.'),
        45_000,
      );
      worker.onerror = () => fail('Solver could not start. Please retry.');
      worker.onmessage = (event: MessageEvent<unknown>) => {
        if (workerRef.current !== worker) return;
        try {
          const data = event.data;
          if (typeof data !== 'object' || data === null || !('moves' in data))
            throw new Error('Invalid result');
          const moves = verifySolution(session, data.moves);
          const states = [key];
          let current = state;
          for (const move of moves) {
            current = applyMove(current, move);
            states.push(fingerprint(current));
          }
          stop();
          setLoadingSession(null);
          setPlan({ moves, states });
        } catch {
          fail('Could not verify the solution. Please retry.');
        }
      };
      worker.postMessage(session);
    } catch {
      stop();
      setLoadingSession(null);
      setFailure({ key, message: 'Solver is unavailable in this browser.' });
    }
  }

  return (
    <section className="solution-panel" aria-label="Solve assistance">
      <div className="solution-heading">
        <h2>Solve assistance</h2>
        <div className="solution-actions">
          <button disabled={busy || loading || solved} onClick={() => request(false)}>
            Hint: next turn
          </button>
          <button
            disabled={busy || loading || solved}
            onClick={() => request(true)}
            aria-expanded={expanded}
          >
            Show solution
          </button>
        </div>
      </div>
      <div role="status" aria-live="polite">
        {solved && <p>Cube solved.</p>}
        {loading && (
          <p>
            Calculating locally… First use may take a few seconds.{' '}
            <button
              onClick={() => {
                stop();
                setLoadingSession(null);
              }}
            >
              Cancel
            </button>
          </p>
        )}
        {error && <p>{error}</p>}
        {!solved && !loading && !error && plan && index < 0 && (
          <p>Cube changed. Request a new hint or solution.</p>
        )}
        {!solved && next && !loading && (
          <p data-testid="next-turn">
            <strong>{notation(next)}</strong> · {describeMove(next)} Clockwise is viewed directly
            from that face.
          </p>
        )}
      </div>
      {!solved && next && !loading && (
        <div className="solution-actions">
          <button disabled={busy} onClick={() => onSelect(next.face)}>
            Select hinted face
          </button>
          <button disabled={!canApply} onClick={() => onApply(next)}>
            Apply next turn
          </button>
          <span>
            Turn {index + 1} of {plan!.moves.length}
          </span>
        </div>
      )}
      {expanded && plan && index >= 0 && (
        <div className="solution-steps">
          <p>
            Computed solution · 90° turns. This is not a beginner-method lesson or a guaranteed
            shortest solution.
          </p>
          <ol aria-label="Solution steps">
            {plan.moves.map((move, i) => (
              <li
                key={i}
                aria-current={i === index ? 'step' : undefined}
                className={i < index ? 'completed-step' : ''}
              >
                <code>{notation(move)}</code> {describeMove(move)}
              </li>
            ))}
          </ol>
          <button onClick={() => setExpanded(false)}>Hide solution</button>
        </div>
      )}
    </section>
  );
}
