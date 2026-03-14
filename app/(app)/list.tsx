import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useGroupStore } from "../../stores/useGroupStore";
import { useAuthStore } from "../../stores/useAuthStore";
import AddItemModal from "../../components/addItemModal";

interface Item {
    id: string;
    nome: string;
    quantidade: string;
    categoria: string;
    comprado: boolean;
    criado_por: string;
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
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const { listId } = useGroupStore();
    const { userId } = useAuthStore();

    useEffect(() => {
        if (!listId) return;
        fetchItems();
        const cleanup = subscribeToItems();
        return cleanup;
    }, [listId]);


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
            Alert.alert("Lista vazia", "Adicione itens antes de finalizar a compra.");
            return;
        }
        Alert.alert(
            "Finalizar compra",
            "Os itens comprados serão arquivados e a lista será resetada.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Finalizar", onPress: async () => {
                        const { groupId } = useGroupStore.getState();

                        // Arquiva a lista atual
                        await supabase
                            .from("shopping_lists")
                            .update({ ativa: false, finalizada_em: new Date().toISOString() })
                            .eq("id", listId);

                        // Cria nova lista
                        const { data: newList } = await supabase
                            .from("shopping_lists")
                            .insert({ group_id: groupId, titulo: "Lista da semana", ativa: true })
                            .select()
                            .single();

                        if (newList) {
                            useGroupStore.getState().setListId(newList.id);
                            setItems([]);
                        }
                    }},
            ]
        );
    }

    function subscribeToItems() {
        const channel = supabase
            .channel("items-channel")
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "items",
                filter: `list_id=eq.${listId}`,
            }, () => {
                fetchItems();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
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
        Alert.alert("Remover item", "Tem certeza?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Remover", style: "destructive", onPress: async () => {
                    await supabase.from("items").delete().eq("id", id);
                    fetchItems();
                }},
        ]);
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
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => handleToggleItem(item)}
                                        onLongPress={() => handleDeleteItem(item.id)}
                                        style={{
                                            backgroundColor: item.comprado ? "rgba(124,158,135,0.08)" : "white",
                                            borderRadius: 14,
                                            padding: 14,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 12,
                                            borderWidth: 1.5,
                                            borderColor: item.comprado ? "rgba(124,158,135,0.2)" : "transparent",
                                        }}
                                    >
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
                                    </TouchableOpacity>
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