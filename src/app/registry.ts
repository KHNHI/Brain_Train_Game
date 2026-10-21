import type { GameMetadata } from '../core/contracts/puzzle';

export const cubeMetadata: GameMetadata = {
  id: 'cube',
  title: 'The classic cube',
  capabilities: ['undo', 'scramble', 'local-save'],
  modes: ['practice'],
};
// Register only playable games. Catalog previews are not launchable game modules.
export const gameRegistry = new Map([[cubeMetadata.id, cubeMetadata]]);
