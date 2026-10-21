export default class Cube {
  static initSolver(): void;
  move(algorithm: string): Cube;
  solve(maxDepth?: number): string;
  isSolved(): boolean;
}
