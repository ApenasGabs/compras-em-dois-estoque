import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddItemModal, type AddItemPayload } from "../components/AddItemModal";
import { Alert } from "../components/Alert/Alert";
import { Badge } from "../components/Badge/Badge";
import { Button } from "../components/Button/Button";
import { Card, CardBody } from "../components/Card/Card";
import { calculateShoppingTotal, filterItemsByCategory, type ListItem } from "../domain/listRules";
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
};

const groupByCategory = (items: ItemRecord[]): Array<[string, ItemRecord[]]> => {
  const groups: Record<string, ItemRecord[]> = {};

  items.forEach((item) => {
    const category = item.categoria || "Outros";
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  });

  return Object.entries(groups);
};

const formatPrice = (price: number | null): string => {
  if (price === null || Number.isNaN(price)) return "";
  return String(price).replace(".", ",");
};

export const ListPage = () => {
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

  const refreshItems = useCallback(async (targetListId?: string | null) => {
    if (!targetListId) return;
    const loadedItems = await loadListItems(targetListId);
    setItems(loadedItems as ItemRecord[]);
    setPriceDrafts(
      Object.fromEntries(loadedItems.map((item) => [item.id, formatPrice(item.preco)])),
    );
  }, []);

  useEffect(() => {
    if (!groupId) return;

    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const activeListId = listId ?? (await ensureActiveListForGroup(groupId)).id;

        if (!mounted) return;

        if (!listId) {
          setListId(activeListId);
        }

        await refreshItems(activeListId);
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Falha ao carregar lista");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [groupId, listId, refreshItems, setListId]);

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
  }, [groupId, listId, refreshItems, setListId]);

  const handleAddItem = async (payload: AddItemPayload): Promise<void> => {
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
      await refreshItems(listId);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Falha ao adicionar item");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleItem = async (item: ItemRecord): Promise<void> => {
    setError(null);
    try {
      await toggleListItemPurchased(item.id, !item.comprado);
      await refreshItems(listId);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Falha ao atualizar item");
    }
  };

  const handleDeleteItem = async (itemId: string): Promise<void> => {
    setError(null);
    try {
      await deleteListItem(itemId);
      await refreshItems(listId);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Falha ao remover item");
    }
  };

  const handleUpdatePrice = async (itemId: string): Promise<void> => {
    const rawPrice = priceDrafts[itemId];
    if (rawPrice === undefined) return;

    const normalized =
      rawPrice.trim() === "" ? null : Number.parseFloat(rawPrice.replace(",", "."));
    if (normalized !== null && Number.isNaN(normalized)) return;

    try {
      await updateListItemPrice(itemId, normalized);
      await refreshItems(listId);
    } catch (priceError) {
      setError(priceError instanceof Error ? priceError.message : "Falha ao atualizar preco");
    }
  };

  const handleFinishShopping = async (): Promise<void> => {
    if (!listId || !groupId || items.length === 0) {
      setError(items.length === 0 ? "Adicione itens antes de finalizar." : null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const nextListId = await finishShoppingList(listId, groupId);
      if (nextListId) {
        setListId(nextListId);
      }
      await refreshItems(nextListId);
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : "Falha ao finalizar compra");
    } finally {
      setSaving(false);
    }
  };

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
        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleFinishShopping()}
          disabled={saving || items.length === 0}
        >
          {saving ? "Finalizando..." : "Finalizar"}
        </Button>
      </header>

      {error && <Alert type="error">{error}</Alert>}

      <div className="row categories-row">
        {categories.map((category) => (
          <Button
            key={category}
            type="button"
            variant={selectedCategory === category ? "primary" : "ghost"}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <Card className="card">
        <CardBody>
          <div className="card-header">
            <div>
              <h2>Itens</h2>
              <p className="muted">
                Toque para marcar como comprado e ajuste o preço quando precisar.
              </p>
            </div>
            <Button type="button" onClick={() => setModalVisible(true)}>
              Novo item
            </Button>
          </div>

          {filteredItems.length === 0 ? (
            <p className="empty-state">Nenhum item ainda. Adicione o primeiro.</p>
          ) : (
            groupByCategory(filteredItems as ItemRecord[]).map(([category, categoryItems]) => (
              <section key={category} className="category-section">
                <Badge variant="secondary" size="sm" className="section-title">
                  {category}
                </Badge>
                <div className="stack-list">
                  {categoryItems.map((item) => (
                    <article
                      key={item.id}
                      className={item.comprado ? "list-item done" : "list-item"}
                    >
                      <div className="item-main">
                        <strong>{item.nome}</strong>
                        <span>{item.quantidade}</span>
                      </div>

                      <div className="item-controls">
                        <label className="price-label" htmlFor={`price-${item.id}`}>
                          Preço
                        </label>
                        <input
                          id={`price-${item.id}`}
                          value={priceDrafts[item.id] ?? formatPrice(item.preco)}
                          onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setPriceDrafts((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          onBlur={() => void handleUpdatePrice(item.id)}
                          inputMode="decimal"
                          placeholder="0,00"
                        />

                        <div className="actions-row">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void handleToggleItem(item)}
                          >
                            {item.comprado ? "Desmarcar" : "Comprar"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="danger"
                            onClick={() => void handleDeleteItem(item.id)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}

          <footer className="total-row">
            <span>Total da seleção</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </footer>
        </CardBody>
      </Card>

      <div className="row">
        <Button type="button" variant="ghost" onClick={() => navigate("/history")}>
          Ver histórico
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate("/profile")}>
          Perfil
        </Button>
      </div>

      <div className="row quick-add-row">
        <input
          value={draftName}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftName(event.target.value)}
          placeholder="Adicao rapida de item"
        />
        <Button
          type="button"
          onClick={() =>
            void handleAddItem({
              nome: draftName.trim(),
              quantidade: "1 un",
              categoria: "Outros",
            }).then(() => setDraftName(""))
          }
          disabled={!draftName.trim()}
        >
          Adicionar rapido
        </Button>
      </div>

      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddItem}
        initialName={draftName}
      />
    </main>
  );
};
