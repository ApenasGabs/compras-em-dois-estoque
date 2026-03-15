import React, {useCallback, useEffect, useState} from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { supabase } from "../../lib/supabase";
import { useGroupStore } from "../../stores/useGroupStore";
import {useFocusEffect} from "expo-router";

interface Item {
    id: string;
    nome: string;
    quantidade: string;
    categoria: string;
    comprado: boolean;
}

interface ShoppingList {
    id: string;
    titulo: string;
    finalizada_em: string;
    items: Item[];
}

export default function History() {
    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { groupId } = useGroupStore();

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchHistory();
        }, [groupId])
    );

    async function fetchHistory() {
        const { data } = await supabase
            .from("shopping_lists")
            .select("id, titulo, finalizada_em, items(*)")
            .eq("group_id", groupId)
            .eq("ativa", false)
            .order("finalizada_em", { ascending: false });

        if (data) setLists(data as ShoppingList[]);
        setLoading(false);
    }

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    }

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F0E8" }}>
                <ActivityIndicator color="#7C9E87" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
            <View style={{ padding: 24, paddingTop: 60 }}>
                <Text style={{ fontSize: 28, color: "#2A2A2A", fontWeight: "300" }}>Histórico</Text>
                <Text style={{ fontSize: 14, color: "#9A9590", marginTop: 4 }}>
                    {lists.length} {lists.length === 1 ? "compra" : "compras"} realizadas
                </Text>
            </View>

            <FlatList
                data={lists}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 40 }}
                ListEmptyComponent={
                    <Text style={{ color: "#9A9590", textAlign: "center", marginTop: 40 }}>
                        Nenhuma compra finalizada ainda.
                    </Text>
                }
                renderItem={({ item: list }) => (
                    <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1.5, borderColor: "#E5E0D8", overflow: "hidden" }}>

                        {/* Header da lista */}
                        <TouchableOpacity
                            onPress={() => setExpanded(expanded === list.id ? null : list.id)}
                            style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                        >
                            <View>
                                <Text style={{ fontSize: 15, fontWeight: "600", color: "#2A2A2A" }}>
                                    {formatDate(list.finalizada_em)}
                                </Text>
                                <Text style={{ fontSize: 13, color: "#9A9590", marginTop: 2 }}>
                                    {list.items.length} {list.items.length === 1 ? "item" : "itens"}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 18, color: "#9A9590" }}>
                                {expanded === list.id ? "▲" : "▼"}
                            </Text>
                        </TouchableOpacity>

                        {/* Itens expandidos */}
                        {expanded === list.id && (
                            <View style={{ borderTopWidth: 1, borderTopColor: "#E5E0D8" }}>
                                {list.items.map(item => (
                                    <View
                                        key={item.id}
                                        style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}
                                    >
                                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#7C9E87", alignItems: "center", justifyContent: "center" }}>
                                            <Text style={{ color: "white", fontSize: 10 }}>✓</Text>
                                        </View>
                                        <Text style={{ flex: 1, fontSize: 14, color: "#4A4A4A" }}>{item.nome}</Text>
                                        <Text style={{ fontSize: 13, color: "#9A9590" }}>{item.quantidade}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            />
        </View>
    );
}