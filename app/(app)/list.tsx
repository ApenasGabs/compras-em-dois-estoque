import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useGroupStore } from "../../stores/useGroupStore";
import { useAuthStore } from "../../stores/useAuthStore";
import AddItemModal from "../../components/addItemModal";
import {handleError, showInfo, showSuccess} from "../../lib/handleError";
import {Swipeable} from "react-native-gesture-handler";

interface Item {
    id: string;
    nome: string;
    quantidade: string;
    categoria: string;
    comprado: boolean;
    criado_por: string;
    preco: number | null;
}

const CATEGORIES = ["Todos", "🥦 Hortifruti", "🥩 Carnes", "🥛 Laticínios", "🧹 Limpeza", "🌾 Grãos", "🍪 Outros"];

const CATEGORY_EMOJI: { [key: string]: string } = {
    "Hortifruti": "🥦",
    "Carnes": "🥩",
    "Laticínios": "🥛",
    "Grãos": "🌾",
    "Limpeza": "🧹",
    "Outros": "🍪",
};

export default function List() {
    const [modalVisible, setModalVisible] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [newItem, setNewItem] = useState("");
    const [loading, setLoading] = useState(true);
    const [precos, setPrecos] = useState<{ [id: string]: string }>({});
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const { listId } = useGroupStore();
    const { userId } = useAuthStore();

    useEffect(() => {
        if (!listId) return;
        fetchItems();

        const channel = supabase
            .channel("list-channel")
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "items",
                filter: `list_id=eq.${listId}`,
            }, () => {
                fetchItems();
            })
            .on("postgres_changes", {
                event: "UPDATE",
                schema: "public",
                table: "shopping_lists",
                filter: `id=eq.${listId}`,
            }, async (payload: any) => {
                if (payload.new.ativa === false) {
                    const { data: newList } = await supabase
                        .from("shopping_lists")
                        .select("id")
                        .eq("group_id", useGroupStore.getState().groupId)
                        .eq("ativa", true)
                        .single();

                    if (newList) {
                        useGroupStore.getState().setListId(newList.id);
                    }
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [listId]);

    function renderRightActions(id: string) {
        return (
            <TouchableOpacity
                onPress={() => handleDeleteItem(id)}
                style={{
                    backgroundColor: "#D4614A",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 80,
                    borderRadius: 14,
                    marginLeft: 8,
                }}
            >
                <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>Remover</Text>
            </TouchableOpacity>
        );
    }

    async function fetchItems() {
        const { data } = await supabase
            .from("items")
            .select("*")
            .eq("list_id", listId)
            .order("criado_em", { ascending: true });

        if (data) setItems(data);
        setLoading(false);
    }

    function groupByCategory(items: Item[]) {
        const groups: { [key: string]: Item[] } = {};
        items.forEach(item => {
            const cat = item.categoria || "Outros";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return Object.entries(groups);
    }

    async function handleFinishShopping() {
        if (items.length === 0) {
            showInfo("Adicione itens antes de finalizar.");
            return;
        }

        Alert.alert(
            "Finalizar compra",
            "Os itens serão arquivados e a lista será resetada.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Finalizar", onPress: async () => {
                        try {
                            const { groupId } = useGroupStore.getState();
                            const total = items
                                .filter(i => i.preco !== null)
                                .reduce((sum, i) => sum + (i.preco ?? 0), 0);

                            await supabase
                                .from("shopping_lists")
                                .update({
                                    ativa: false,
                                    finalizada_em: new Date().toISOString(),
                                    total: total > 0 ? total : null,
                                })
                                .eq("id", listId);

                            const { data: newList } = await supabase
                                .from("shopping_lists")
                                .insert({ group_id: groupId, titulo: "Lista da semana", ativa: true })
                                .select()
                                .single();

                            if (newList) {
                                useGroupStore.getState().setListId(newList.id);
                                setItems([]);
                                setPrecos({});
                                showSuccess("Compra finalizada!");
                            }
                        } catch (e) {
                            handleError(e);
                        }
                    }},
            ]
        );
    }

    async function handleAddItem() {
        if (!newItem.trim()) return;

        await supabase.from("items").insert({
            list_id: listId,
            nome: newItem.trim(),
            quantidade: "1",
            categoria: "Outros",
            comprado: false,
            criado_por: userId,
        });

        setNewItem("");
    }

    async function handleToggleItem(item: Item) {
        await supabase
            .from("items")
            .update({ comprado: !item.comprado })
            .eq("id", item.id);
        fetchItems();
    }

    async function handleDeleteItem(id: string) {
        try {
            await supabase.from("items").delete().eq("id", id);
            fetchItems();
        } catch (e) {
            handleError(e);
        }
    }

    const filteredItems = selectedCategory === "Todos"
        ? items
        : items.filter(i => i.categoria === selectedCategory.replace(/^\S+\s/, ""));

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F0E8" }}>
                <ActivityIndicator color="#7C9E87" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
            {/* Header */}
            <View style={{ padding: 24, paddingTop: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                    <Text style={{ fontSize: 28, color: "#2A2A2A", fontWeight: "300" }}>Esta semana</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#7C9E87" }} />
                        <Text style={{ fontSize: 12, color: "#7C9E87", fontWeight: "600" }}>AO VIVO</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={handleFinishShopping}
                    style={{ backgroundColor: "white", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: "#E5E0D8", marginTop: 4 }}
                >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#4E7059" }}>✓ Finalizar</Text>
                </TouchableOpacity>
            </View>



            {/* Category filter */}
            <FlatList
                data={CATEGORIES}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 8, marginBottom: 16, alignItems: "flex-start" }}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedCategory(item)}
                        style={{
                            backgroundColor: selectedCategory === item ? "#7C9E87" : "white",
                            borderWidth: 1.5,
                            borderColor: selectedCategory === item ? "#7C9E87" : "#E5E0D8",
                            borderRadius: 20,
                            paddingHorizontal: 14,
                            paddingVertical: 4,
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: "500",
                            color: selectedCategory === item ? "white" : "#4A4A4A",
                        }}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Items agrupados */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
                {filteredItems.length === 0 ? (
                    <Text style={{ color: "#9A9590", textAlign: "center", marginTop: 40 }}>
                        Nenhum item ainda. Adicione o primeiro!
                    </Text>
                ) : (
                    groupByCategory(filteredItems).map(([category, categoryItems]) => (
                        <View key={category} style={{ marginBottom: 20 }}>
                            {/* Título da categoria */}
                            <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
                                {CATEGORY_EMOJI[category] || "🍪"} {category}
                            </Text>

                            {/* Itens da categoria */}
                            <View style={{ gap: 6 }}>
                                {categoryItems.map(item => (
                                    <Swipeable
                                        key={item.id}
                                        renderRightActions={() => renderRightActions(item.id)}
                                    >
                                        <TouchableOpacity
                                            onPress={() => handleToggleItem(item)}
                                            style={{
                                                backgroundColor: item.comprado ? "rgba(124,158,135,0.08)" : "white",
                                                borderRadius: 14,
                                                padding: 14,
                                                borderWidth: 1.5,
                                                borderColor: item.comprado ? "rgba(124,158,135,0.2)" : "transparent",
                                            }}
                                        >
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                            <View style={{
                                                width: 22, height: 22, borderRadius: 11,
                                                borderWidth: 2,
                                                borderColor: item.comprado ? "#7C9E87" : "#E5E0D8",
                                                backgroundColor: item.comprado ? "#7C9E87" : "transparent",
                                                alignItems: "center", justifyContent: "center",
                                            }}>
                                                {item.comprado && <Text style={{ color: "white", fontSize: 11 }}>✓</Text>}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{
                                                    fontSize: 15, fontWeight: "500",
                                                    color: item.comprado ? "#9A9590" : "#2A2A2A",
                                                    textDecorationLine: item.comprado ? "line-through" : "none",
                                                }}>
                                                    {item.nome}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: "#9A9590" }}>{item.quantidade}</Text>
                                            </View>
                                        </View>

                                        {/* Campo de preço — aparece só quando comprado */}
                                        {item.comprado && (
                                            <TouchableOpacity
                                                activeOpacity={1}
                                                onPress={e => e.stopPropagation?.()}
                                                style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(124,158,135,0.15)" }}
                                            >
                                                <Text style={{ fontSize: 12, color: "#9A9590", fontWeight: "500" }}>Preço pago</Text>
                                                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 8, borderWidth: 1, borderColor: "#E5E0D8", paddingHorizontal: 8 }}>
                                                    <Text style={{ fontSize: 13, color: "#9A9590" }}>R$</Text>
                                                    <TextInput
                                                        value={precos[item.id] ?? (item.preco ? String(item.preco).replace(".", ",") : "")}
                                                        onChangeText={(value) => {
                                                            // Permite apenas números e vírgula
                                                            const cleaned = value.replace(/[^0-9,]/g, "");
                                                            setPrecos(prev => ({ ...prev, [item.id]: cleaned }));
                                                        }}
                                                        onBlur={async () => {
                                                            const value = precos[item.id];
                                                            if (value === undefined) return;
                                                            const preco = parseFloat(value.replace(",", ".")) || null;
                                                            await supabase.from("items").update({ preco }).eq("id", item.id);
                                                            fetchItems();
                                                        }}
                                                        keyboardType="numeric"
                                                        placeholder="0,00"
                                                        placeholderTextColor="#C5C0B8"
                                                        style={{ flex: 1, padding: 6, fontSize: 13, color: "#2A2A2A" }}
                                                    />
                                                </View>
                                                </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>
                                    </Swipeable>
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add bar */}
            <View style={{
                flexDirection: "row", gap: 10, padding: 24,
                borderTopWidth: 1, borderTopColor: "#E5E0D8",
                backgroundColor: "#F5F0E8",
            }}>
                <TextInput
                    placeholder="Adicionar item rápido..."
                    placeholderTextColor="#9A9590"
                    value={newItem}
                    onChangeText={setNewItem}
                    onSubmitEditing={handleAddItem}
                    style={{
                        flex: 1, backgroundColor: "white",
                        borderWidth: 1.5, borderColor: "#E5E0D8",
                        borderRadius: 14, padding: 12, fontSize: 15, color: "#2A2A2A",
                    }}
                />
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{
                        width: 46, height: 46, backgroundColor: "#7C9E87",
                        borderRadius: 14, alignItems: "center", justifyContent: "center",
                    }}
                >
                    <Text style={{ color: "white", fontSize: 24, lineHeight: 28 }}>+</Text>
                </TouchableOpacity>
            </View>

            <AddItemModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setNewItem("");
                }}
                onAdded={fetchItems}
                initialName={newItem}
            />
        </View>
        </KeyboardAvoidingView>
    );
}