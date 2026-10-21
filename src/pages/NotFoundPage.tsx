import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <section className="not-found">
      <h1>Page not found</h1>
      <p>That page or game isn’t available.</p>
      <Link className="primary-link" to="/games">
        Browse games →
      </Link>
    </section>
  );
}
