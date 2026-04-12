import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadShoppingHistory, type ShoppingListRecord } from "../lib/webData";
import { useGroupStore } from "../stores/groupStore";

export function HistoryPage() {
  const groupId = useGroupStore((state) => state.groupId);
  const groupName = useGroupStore((state) => state.groupName);
  const navigate = useNavigate();
  const [history, setHistory] = useState<ShoppingListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!groupId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await loadShoppingHistory(groupId);
        setHistory(data);
      } catch (historyError) {
        setError(
          historyError instanceof Error
            ? historyError.message
            : "Falha ao carregar histórico",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, [groupId]);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Histórico</h1>
          <p>{groupName ?? "Grupo ativo"}</p>
        </div>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/list")}
        >
          Voltar para a lista
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="card">
        {loading ? (
          <p className="empty-state">Carregando histórico...</p>
        ) : history.length === 0 ? (
          <p className="empty-state">Nenhuma lista finalizada ainda.</p>
        ) : (
          <div className="stack-list">
            {history.map((list) => (
              <article key={list.id} className="history-item">
                <div className="history-head">
                  <div>
                    <strong>Lista finalizada</strong>
                    <p>
                      {list.finalizada_em
                        ? new Date(list.finalizada_em).toLocaleString()
                        : "Sem data"}
                    </p>
                  </div>
                  <span>
                    {list.total !== null
                      ? `R$ ${list.total.toFixed(2)}`
                      : "Sem total"}
                  </span>
                </div>
                <p>{list.items?.length ?? 0} itens</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
