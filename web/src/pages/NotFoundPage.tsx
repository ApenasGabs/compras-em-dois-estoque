import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page">
      <h1>404</h1>
      <p>Pagina nao encontrada.</p>
      <Link to="/login">Ir para login</Link>
    </main>
  );
}
