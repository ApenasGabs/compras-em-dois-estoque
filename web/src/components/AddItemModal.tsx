/** @jsxImportSource react */
import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildQuantityLabel } from "../domain/listRules";

const categories = [
  { emoji: "🥦", name: "Hortifruti" },
  { emoji: "🥩", name: "Carnes" },
  { emoji: "🥛", name: "Laticínios" },
  { emoji: "🌾", name: "Grãos" },
  { emoji: "🧹", name: "Limpeza" },
  { emoji: "🍪", name: "Outros" },
];

export interface AddItemPayload {
  nome: string;
  quantidade: string;
  categoria: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (payload: AddItemPayload) => Promise<void> | void;
  initialName?: string;
}

export function AddItemModal({
  visible,
  onClose,
  onAdd,
  initialName = "",
}: Props) {
  const [nome, setNome] = useState(initialName);
  const [quantidade, setQuantidade] = useState("1");
  const [unidade, setUnidade] = useState("un");
  const [categoria, setCategoria] = useState("Outros");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setNome(initialName);
    setQuantidade("1");
    setUnidade("un");
    setCategoria("Outros");
  }, [visible, initialName]);

  const quantityLabel = useMemo(
    () => buildQuantityLabel(quantidade, unidade),
    [quantidade, unidade],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nome.trim()) return;

    setSaving(true);
    try {
      await onAdd({
        nome: nome.trim(),
        quantidade: quantityLabel,
        categoria,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card card"
        role="dialog"
        aria-modal="true"
        onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Novo item</h2>
          <button type="button" className="ghost" onClick={onClose}>
            Fechar
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nome do produto
            <input
              value={nome}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNome(e.target.value)
              }
              autoFocus
            />
          </label>

          <div className="grid two-cols">
            <label>
              Quantidade
              <input
                value={quantidade}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setQuantidade(e.target.value)
                }
                inputMode="numeric"
              />
            </label>
            <label>
              Unidade
              <input
                value={unidade}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUnidade(e.target.value)
                }
              />
            </label>
          </div>

          <div>
            <p className="section-title">Categoria</p>
            <div className="category-grid">
              {categories.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={categoria === item.name ? "active" : ""}
                  onClick={() => setCategoria(item.name)}
                >
                  <span>{item.emoji}</span>
                  <small>{item.name}</small>
                </button>
              ))}
            </div>
          </div>

          <p className="hint">Quantidade final: {quantityLabel}</p>

          <button type="submit" disabled={saving || !nome.trim()}>
            {saving ? "Adicionando..." : "Adicionar à lista"}
          </button>
        </form>
      </div>
    </div>
  );
}
