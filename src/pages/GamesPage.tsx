import { catalog } from '../app/catalog';
import { GameCard } from '../shared/ui/GameCard';

export default function GamesPage() {
  return (
    <>
      <div className="catalog-page-heading">
        <h1>All games</h1>
        <p>Choose a puzzle to play, or read about what’s coming next.</p>
      </div>
      <section className="game-grid catalog-section" aria-label="All games">
        {catalog.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
    </>
  );
}
