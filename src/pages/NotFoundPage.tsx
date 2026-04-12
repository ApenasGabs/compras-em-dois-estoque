import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button/Button";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="page">
      <h1>404</h1>
      <p>Pagina nao encontrada.</p>
      <Button variant="ghost" onClick={() => navigate("/login")}>
        Ir para login
      </Button>
    </main>
  );
}
