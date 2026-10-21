import type { CatalogGame } from '../core/contracts/catalog';

// Public, authored metadata only. Route lookup must match a known ID exactly.
export const catalog: readonly CatalogGame[] = [
  {
    id: 'cube',
    title: '3×3 Cube',
    category: 'Rotation',
    available: true,
    description:
      'Turn the layers until each face has a single color. Explore the cube in 3D, with next-turn hints and a full solution when you need it.',
    instructions: [
      'Select a face by its color, then use the arrows beside the cube to turn it.',
      'Drag to rotate or flip the view. Use Reset view to return to the starting angle.',
      'Use Hint: next turn for one move, or Show solution to follow a complete sequence.',
    ],
  },
  {
    id: 'burr',
    title: 'Burr puzzle',
    category: 'Interlocking',
    available: false,
    description:
      'Find the order that lets interlocking wooden pieces slide apart. Each piece constrains the movement of the others.',
    instructions: [
      'The goal is to separate every piece without passing through another.',
      'The planned controls let you select a piece and slide it along its available axes.',
    ],
  },
  {
    id: 'sliding-tiles',
    title: 'Sliding tiles',
    category: 'Sequencing',
    available: false,
    description:
      'Slide numbered tiles into the empty space and put them back in order. Plan ahead to move a tile without undoing your progress.',
    instructions: [
      'The goal is to arrange the numbered tiles in order.',
      'The planned controls let you move a tile next to the empty space into it.',
    ],
  },
];

export const findGame = (id: string) => catalog.find((game) => game.id === id);
