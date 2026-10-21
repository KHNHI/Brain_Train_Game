import { useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '../app/catalog';
import { CubePreview } from '../features/home/CubePreview';
import { PlayGuide } from '../features/home/PlayGuide';
import { HomeQuestions } from '../features/home/HomeQuestions';
import { GameCard } from '../shared/ui/GameCard';

export default function HomePage() {
  const [filter, setFilter] = useState<'all' | 'available' | 'upcoming'>('all');
  const featured = catalog
    .slice(0, 3)
    .filter(
      (game) => filter === 'all' || (filter === 'available' ? game.available : !game.available),
    );
  return (
    <>
      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-intro-copy">
          <h1 id="home-title">Interactive puzzles.</h1>
          <p>
            Solve spatial puzzles in 3D. Start with the 3×3 cube, with hints and step-by-step
            instructions.
          </p>
          <div className="intro-actions">
            <Link to="/games/cube" className="primary-link">
              Play the cube <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/games" className="text-link">
              Browse games →
            </Link>
          </div>
        </div>
        <CubePreview />
      </section>
      <section className="catalog-section" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <h2 id="featured-title">Games</h2>
            <p>One ready to play. More in development.</p>
          </div>
          <Link className="text-link" to="/games">
            See more →
          </Link>
        </div>
        <div className="catalog-filters" role="group" aria-label="Filter featured games">
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            All games
          </button>
          <button aria-pressed={filter === 'available'} onClick={() => setFilter('available')}>
            Available now
          </button>
          <button aria-pressed={filter === 'upcoming'} onClick={() => setFilter('upcoming')}>
            In development
          </button>
          <span role="status">{featured.length} shown</span>
        </div>
        <div className="game-grid">
          {featured.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
      <PlayGuide />
      <section className="home-practice" aria-label="Practice features">
        <h2>Space to work it out</h2>
        <div>
          <article>
            <h3>No time limit</h3>
            <p>
              Practice without a countdown. Scramble the cube for a new starting position whenever
              you want.
            </p>
          </article>
          <article>
            <h3>Room to experiment</h3>
            <p>Undo and redo your turns. Rotate the view freely without changing the puzzle.</p>
          </article>
          <article>
            <h3>Pick up where you stopped</h3>
            <p>Your cube saves after completed turns. Return in the same browser to continue.</p>
          </article>
        </div>
      </section>
      <HomeQuestions />
      <section className="home-start">
        <div>
          <h2>Ready to try the full cube?</h2>
          <p>Free rotation, your saved puzzle, and guidance when you need it.</p>
        </div>
        <Link className="primary-link" to="/games/cube">
          Open cube game →
        </Link>
      </section>
    </>
  );
}
