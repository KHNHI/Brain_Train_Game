import Cube from '../../vendor/cubejs/index.mjs';
import { sessionSchema } from '../games/cube/engine/session';
import { notation, parseAlgorithm } from '../games/cube/engine/solution';

self.onmessage = (event: MessageEvent<unknown>) => {
  try {
    const session = sessionSchema.parse(event.data);
    const cube = new Cube();
    cube.move(
      [...session.scramble, ...session.moves.slice(0, session.cursor)].map(notation).join(' '),
    );
    if (cube.isSolved()) {
      self.postMessage({ moves: [] });
      return;
    }
    Cube.initSolver();
    self.postMessage({ moves: parseAlgorithm(cube.solve()) });
  } catch {
    self.postMessage({ error: 'Could not calculate a solution. Try again.' });
  }
};
