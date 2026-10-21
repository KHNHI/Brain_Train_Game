export function GameArtwork({
  game,
  cubeColors,
  selectedFace,
}: {
  game: string;
  cubeColors?: Record<'U' | 'F' | 'R', string[]>;
  selectedFace?: string;
}) {
  if (game === 'cube') {
    const cells = Array.from({ length: 9 }, (_, i) => [i % 3, Math.floor(i / 3)] as const);
    return (
      <svg viewBox="0 0 300 230" aria-hidden="true" className="game-artwork">
        <g stroke="#11171e" strokeWidth="4" strokeLinejoin="round">
          {cells.map(([c, r]) => {
            const x = 150 + (c - r) * 28,
              y = 23 + (c + r) * 14;
            return (
              <polygon
                key={`u${c}${r}`}
                fill={cubeColors?.U[c + r * 3] ?? '#e9e7d6'}
                stroke={selectedFace === 'U' ? '#e5bd72' : undefined}
                points={`${x},${y} ${x + 28},${y + 14} ${x},${y + 28} ${x - 28},${y + 14}`}
              />
            );
          })}
          {cells.map(([c, r]) => {
            const x = 66 + c * 28,
              y = 65 + c * 14 + r * 30;
            return (
              <polygon
                key={`f${c}${r}`}
                fill={cubeColors?.F[c + r * 3] ?? '#46897a'}
                stroke={selectedFace === 'F' ? '#e5bd72' : undefined}
                points={`${x},${y} ${x + 28},${y + 14} ${x + 28},${y + 44} ${x},${y + 30}`}
              />
            );
          })}
          {cells.map(([c, r]) => {
            const x = 150 + c * 28,
              y = 107 - c * 14 + r * 30;
            return (
              <polygon
                key={`r${c}${r}`}
                fill={cubeColors?.R[c + r * 3] ?? '#ce604c'}
                stroke={selectedFace === 'R' ? '#e5bd72' : undefined}
                points={`${x},${y} ${x + 28},${y - 14} ${x + 28},${y + 16} ${x},${y + 30}`}
              />
            );
          })}
        </g>
      </svg>
    );
  }
  if (game === 'burr')
    return (
      <svg viewBox="0 0 300 230" aria-hidden="true" className="game-artwork">
        <g stroke="#171c23" strokeWidth="4" strokeLinejoin="round">
          <path d="M73 75l26-24 129 109-27 25z" fill="#aa7e50" />
          <path d="M73 75v29l128 109v-28z" fill="#76563b" />
          <path d="M77 159L184 42l35 15-105 119z" fill="#d4ac72" />
          <path d="M114 176v29L219 86V57z" fill="#977047" />
          <path d="M103 68l27-19 66 58-29 20z" fill="#c99b60" />
          <path d="M103 68v31l64 58v-30z" fill="#94673f" />
        </g>
      </svg>
    );
  return (
    <svg viewBox="0 0 300 230" aria-hidden="true" className="game-artwork">
      <rect x="56" y="23" width="188" height="188" rx="8" fill="#151b22" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <rect
            x={64 + (i % 3) * 60}
            y={31 + Math.floor(i / 3) * 60}
            width="52"
            height="52"
            rx="4"
            fill="#82999e"
          />
          <text
            x={90 + (i % 3) * 60}
            y={64 + Math.floor(i / 3) * 60}
            textAnchor="middle"
            fill="#141b22"
            fontSize="24"
            fontFamily="Georgia, serif"
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
