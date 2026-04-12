import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddItemModal, type AddItemPayload } from "../components/AddItemModal";
import {
  calculateShoppingTotal,
  filterItemsByCategory,
  type ListItem,
} from "../domain/listRules";
import { supabase } from "../lib/supabase";
import {
  addListItem,
  deleteListItem,
  ensureActiveListForGroup,
  finishShoppingList,
  loadListItems,
  toggleListItemPurchased,
  updateListItemPrice,
} from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";

const categories = [
  "Todos",
  "🥦 Hortifruti",
  "🥩 Carnes",
  "🥛 Laticínios",
  "🧹 Limpeza",
  "🌾 Grãos",
  "🍪 Outros",
];

type ItemRecord = ListItem & {
  quantidade: string;
  comprado: boolean;
  preco: number | null;
};

function groupByCategory(items: ItemRecord[]) {
  const groups: Record<string, ItemRecord[]> = {};

  items.forEach((item) => {
    const category = item.categoria || "Outros";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  });

  return Object.entries(groups);
}

function formatPrice(price: number | null) {
  if (price === null || Number.isNaN(price)) return "";
  return String(price).replace(".", ",");
}

export function ListPage() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [modalVisible, setModalVisible] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const groupId = useGroupStore((state) => state.groupId);
  const groupName = useGroupStore((state) => state.groupName);
  const listId = useGroupStore((state) => state.listId);
  const setListId = useGroupStore((state) => state.setListId);
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  useEffect(() => {
    const currentGroupId = groupId;
    if (!currentGroupId) return;

    let mounted = true;

    async function loadList() {
      setLoading(true);
      setError(null);

      try {
        const activeList =
          listId ??
          (await ensureActiveListForGroup(currentGroupId as string)).id;
        if (!mounted) return;
        if (!listId) {
          setListId(activeList);
        }

        const loadedItems = await loadListItems(activeList);
        if (!mounted) return;

        setItems(loadedItems as ItemRecord[]);
        const drafts = Object.fromEntries(
          loadedItems.map((item) => [item.id, formatPrice(item.preco)]),
        );
        setPriceDrafts(drafts);
      } catch (loadError) {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Falha ao carregar lista",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadList();

    return () => {
      mounted = false;
    };
  }, [groupId, listId, setListId]);

  useEffect(() => {
    if (!listId) return;

    const channel = supabase
      .channel(`list-${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `list_id=eq.${listId}`,
        },
        () => {
          void refreshItems(listId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shopping_lists",
          filter: `id=eq.${listId}`,
        },
        async (payload) => {
          if (payload.new && payload.new.ativa === false && groupId) {
            const nextList = await ensureActiveListForGroup(groupId);
            setListId(nextList.id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [groupId, listId, setListId]);

  async function refreshItems(targetListId = listId) {
    if (!targetListId) return;
    const loadedItems = await loadListItems(targetListId);
    setItems(loadedItems as ItemRecord[]);
    setPriceDrafts(
      Object.fromEntries(
        loadedItems.map((item) => [item.id, formatPrice(item.preco)]),
      ),
    );
  }

  async function handleAddItem(payload: AddItemPayload) {
    if (!listId) return;

    setSaving(true);
    setError(null);

    try {
      await addListItem({
        listId,
        nome: payload.nome,
        quantidade: payload.quantidade,
        categoria: payload.categoria,
        createdBy: userId,
      });
      await refreshItems();
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Falha ao adicionar item",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleItem(item: ItemRecord) {
    setError(null);

    try {
      await toggleListItemPurchased(item.id, !item.comprado);
      await refreshItems();
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Falha ao atualizar item",
      );
    }
  }

  async function handleDeleteItem(itemId: string) {
    setError(null);

    try {
      await deleteListItem(itemId);
      await refreshItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Falha ao remover item",
      );
    }
  }

  async function handleUpdatePrice(itemId: string) {
    const rawPrice = priceDrafts[itemId];
    if (rawPrice === undefined) return;

    const numericPrice =
      rawPrice.trim() === ""
        ? null
        : Number.parseFloat(rawPrice.replace(",", "."));
    if (numericPrice !== null && Number.isNaN(numericPrice)) return;

    setError(null);

    try {
      await updateListItemPrice(itemId, numericPrice);
      await refreshItems();
    } catch (priceError) {
      setError(
        priceError instanceof Error
          ? priceError.message
          : "Falha ao atualizar preço",
      );
    }
  }

  async function handleFinishShopping() {
    if (!listId || !groupId || items.length === 0) {
      setError(
        items.length === 0 ? "Adicione itens antes de finalizar." : null,
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const nextListId = await finishShoppingList(listId, groupId);
      setItems([]);
      setPriceDrafts({});
      if (nextListId) {
        setListId(nextListId);
      }
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : "Falha ao finalizar compra",
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = useMemo(
    () => filterItemsByCategory(items, selectedCategory),
    [items, selectedCategory],
  );
  const total = calculateShoppingTotal(filteredItems);

  if (loading) {
    return (
      <main className="page auth">
        <h1>Carregando lista</h1>
        <p>Buscando os itens do grupo {groupName ?? "ativo"}...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Lista</h1>
          <p>{groupName ?? "Grupo ativo"}</p>
        </div>
        <button
          type="button"
          className="ghost"
          onClick={handleFinishShopping}
          disabled={saving || items.length === 0}
        >
          {saving ? "Finalizando..." : "Finalizar"}
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="row categories-row">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? "active" : ""}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Itens</h2>
            <p className="muted">
              Toque para marcar como comprado. Deslize ou use o botão para
              remover.
            </p>
          </div>
          <button type="button" onClick={() => setModalVisible(true)}>
            Novo item
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <p className="empty-state">Nenhum item ainda. Adicione o primeiro.</p>
        ) : (
          groupByCategory(filteredItems as ItemRecord[]).map(
            ([category, categoryItems]) => (
              <section key={category} className="category-section">
                <p className="section-title">{category}</p>
                <div className="stack-list">
                  {categoryItems.map((item) => (
                    <article
                      key={item.id}
                      className={item.comprado ? "list-item done" : "list-item"}
                    >
                      <button
                        type="button"
                        className="item-main"
                        onClick={() => handleToggleItem(item)}
                      >
                        <strong>{item.nome}</strong>
                        <span>{item.quantidade}</span>
                      </button>

                      <div className="item-meta">
                        <label>
                          Preço
                          <input
                            value={
                              priceDrafts[item.id] ?? formatPrice(item.preco)
                            }
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              setPriceDrafts((current) => ({
                                ...current,
                                [item.id]: e.target.value,
                              }))
                            }
                            onBlur={() => void handleUpdatePrice(item.id)}
                            inputMode="decimal"
                            placeholder="0,00"
                          />
                        </label>

                        <div className="actions-row">
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => handleToggleItem(item)}
                          >
                            {item.comprado ? "Desmarcar" : "Comprar"}
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ),
          )
        )}
      </section>

      <p className="total">Total parcial: R$ {total.toFixed(2)}</p>

      <div className="actions-row">
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/group")}
        >
          Ajustar grupo
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/history")}
        >
          Histórico
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/profile")}
        >
          Perfil
        </button>
      </div>

      <AddItemModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setDraftName("");
        }}
        onAdd={handleAddItem}
        initialName={draftName}
      />
    </main>
  );
}
