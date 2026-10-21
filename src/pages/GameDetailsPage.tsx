import { Link, useParams } from 'react-router-dom';
import { findGame } from '../app/catalog';
import { GameArtwork } from '../shared/ui/GameArtwork';
import { NotFoundPage } from './NotFoundPage';

export default function GameDetailsPage() {
  const { gameId } = useParams();
  const game = findGame(gameId ?? '');
  if (!game) return <NotFoundPage />;
  return (
    <section className="game-details">
      <Link className="back-link" to="/games">
        ← All games
      </Link>
      <div className="details-layout">
        <div className={`details-art card-art-${game.id}`}>
          <GameArtwork game={game.id} />
        </div>
        <div>
          <span className="availability">In development</span>
          <h1>{game.title}</h1>
          <p>{game.description}</p>
          <h2>How it will work</h2>
          <ol>
            {game.instructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
          <p>This game is not playable yet.</p>
          <Link className="primary-link" to="/games/cube">
            Play the cube instead →
          </Link>
        </div>
      </div>
    </section>
  );
}
