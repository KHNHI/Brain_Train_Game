export interface PuzzleEngine<State, Move> {
  initialState(): State;
  legalMoves(state: State): readonly Move[];
  applyMove(state: State, move: Move): State;
  isSolved(state: State): boolean;
}

export type GameCapability = 'undo' | 'scramble' | 'local-save';
export interface GameMetadata {
  id: string;
  title: string;
  capabilities: readonly GameCapability[];
  modes: readonly 'practice'[];
}
