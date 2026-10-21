import { lazy, Suspense, useEffect, useRef } from 'react';
import {
  createBrowserRouter,
  Link,
  NavLink,
  Outlet,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import HomePage from '../pages/HomePage';
import GamesPage from '../pages/GamesPage';
import GameDetailsPage from '../pages/GameDetailsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { findGame } from './catalog';

const CubePage = lazy(() => import('../pages/CubePage'));

function SiteLayout() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    const gameId = /^\/games\/([^/]+)\/?$/.exec(location.pathname)?.[1];
    const game = findGame(gameId ?? '');
    const title =
      location.pathname === '/'
        ? 'Interactive puzzles'
        : (game?.title ?? (location.pathname === '/games' ? 'All games' : 'Page not found'));
    document.title = `${title} — Form & Field`;
    if (previousPath.current !== location.pathname) {
      window.scrollTo(0, 0);
      document.getElementById('main')?.focus();
    }
    previousPath.current = location.pathname;
  }, [location.pathname]);
  return (
    <div className="workshop">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Form and Field home">
          <span className="brand-icon" aria-hidden="true">
            ▧
          </span>{' '}
          form <i>&</i> field
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/games">Games</NavLink>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <Suspense
          fallback={
            <p className="page-loading" role="status">
              Loading game…
            </p>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <footer className="site-footer">
        <span>Form & Field</span>
        <span>Browser-based puzzles · Progress saved locally</span>
      </footer>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'games', element: <GamesPage /> },
      { path: 'games/cube', element: <CubePage /> },
      { path: 'games/:gameId', element: <GameDetailsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
