import { Link } from 'react-router-dom';
import type { CatalogGame } from '../../core/contracts/catalog';
import { GameArtwork } from './GameArtwork';

export function GameCard({ game }: { game: CatalogGame }) {
  return (
    <article className="game-card" aria-labelledby={`game-${game.id}`}>
      <div className={`card-art card-art-${game.id}`}>
        <GameArtwork game={game.id} />
        <span className={`availability ${game.available ? 'available' : ''}`}>
          {game.available ? 'Available' : 'In development'}
        </span>
      </div>
      <div className="card-content">
        <span className="game-category">{game.category}</span>
        <h3 id={`game-${game.id}`}>{game.title}</h3>
        <p>{game.description}</p>
        <div className="card-actions">
          {game.available ? (
            <>
              <Link className="primary-link" to={`/games/${game.id}`}>
                Play now <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" to={`/games/${game.id}#instructions`}>
                Instructions
              </Link>
            </>
          ) : (
            <Link className="text-link" to={`/games/${game.id}`}>
              View details <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
