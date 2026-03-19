import React, {useEffect, useState} from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    Modal, ScrollView, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { supabase } from "../lib/supabase";
import { useGroupStore } from "../stores/useGroupStore";
import { useAuthStore } from "../stores/useAuthStore";
import {trackAction} from "../lib/rateLimit";
import {handleError} from "../lib/handleError";

const CATEGORIES = [
    { emoji: "🥦", name: "Hortifruti" },
    { emoji: "🥩", name: "Carnes" },
    { emoji: "🥛", name: "Laticínios" },
    { emoji: "🌾", name: "Grãos" },
    { emoji: "🧹", name: "Limpeza" },
    { emoji: "🍪", name: "Outros" },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onAdded: () => void;
    initialName?: string;
}

export default function AddItemModal({ visible, onClose, onAdded, initialName = "" }: Props) {
    const [nome, setNome] = useState(initialName);
    const [quantidade, setQuantidade] = useState("1");
    const [unidade, setUnidade] = useState("un");
    const [categoria, setCategoria] = useState("Outros");
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const { groupId } = useGroupStore();
    const { listId } = useGroupStore();
    const { userId } = useAuthStore();

    useEffect(() => {
        if (visible) {
            setNome(initialName);
            fetchSuggestions();
        }
    }, [visible]);

    async function fetchSuggestions() {
        const { data } = await supabase
            .from("items")
            .select("nome, list_id, shopping_lists!inner(group_id)")
            .eq("shopping_lists.group_id", groupId)
            .order("criado_em", { ascending: false })
            .limit(50);

        if (data) {
            const unique = [...new Set(data.map(i => i.nome))].slice(0, 8);
            setSuggestions(unique);
        }
    }

    async function handleAdd() {
        if (!nome.trim()) return;
        setLoading(true);

        try {
            await trackAction("add_item");

            const { error } = await supabase.from("items").insert({
                list_id: listId,
                nome: nome.trim(),
                quantidade: `${quantidade} ${unidade}`,
                categoria,
                comprado: false,
                criado_por: userId,
            });

            if (error) {
                handleError(error);
                return;
            }

            setNome("");
            setQuantidade("1");
            setUnidade("un");
            setCategoria("Outros");
            onAdded();
            onClose();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                style={{ flex: 1, justifyContent: "flex-end" }}
            >
                <TouchableOpacity
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
                    onPress={onClose}
                    activeOpacity={1}
                />
                <View style={{
                    backgroundColor: "#F5F0E8",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    maxHeight: "90%",
                }}>
                    <ScrollView
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                    >
                    {/* Handle */}
                    <View style={{ width: 36, height: 4, backgroundColor: "#E5E0D8", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />

                    <Text style={{ fontSize: 22, fontWeight: "300", color: "#2A2A2A", marginBottom: 20 }}>
                        Novo item
                    </Text>

                    {/* Nome */}
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 6 }}>
                        Nome do produto
                    </Text>
                    <TextInput
                        placeholder="Ex: Arroz branco"
                        placeholderTextColor="#9A9590"
                        value={nome}
                        onChangeText={setNome}
                        autoFocus
                        style={{
                            backgroundColor: "white", borderWidth: 1.5, borderColor: "#E5E0D8",
                            borderRadius: 14, padding: 13, fontSize: 15, color: "#2A2A2A", marginBottom: 16,
                        }}
                    />

                    {/* Quantidade e unidade */}
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 6 }}>
                        Quantidade
                    </Text>
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                        <TextInput
                            value={quantidade}
                            onChangeText={setQuantidade}
                            keyboardType="numeric"
                            style={{
                                flex: 1, backgroundColor: "white", borderWidth: 1.5, borderColor: "#E5E0D8",
                                borderRadius: 14, padding: 13, fontSize: 15, color: "#2A2A2A",
                            }}
                        />
                        <TextInput
                            value={unidade}
                            onChangeText={setUnidade}
                            placeholder="un, kg, L..."
                            placeholderTextColor="#9A9590"
                            style={{
                                width: 90, backgroundColor: "white", borderWidth: 1.5, borderColor: "#E5E0D8",
                                borderRadius: 14, padding: 13, fontSize: 15, color: "#2A2A2A",
                            }}
                        />
                    </View>

                    {/* Categoria */}
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 10 }}>
                        Categoria
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.name}
                                    onPress={() => setCategoria(cat.name)}
                                    style={{
                                        backgroundColor: categoria === cat.name ? "rgba(124,158,135,0.15)" : "white",
                                        borderWidth: 1.5,
                                        borderColor: categoria === cat.name ? "#7C9E87" : "#E5E0D8",
                                        borderRadius: 12,
                                        padding: 10,
                                        alignItems: "center",
                                        minWidth: 80,
                                    }}
                                >
                                    <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                                    <Text style={{ fontSize: 11, fontWeight: "500", color: categoria === cat.name ? "#4E7059" : "#4A4A4A", marginTop: 4 }}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                        {suggestions.length > 0 && !nome && (
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 10 }}>
                                    Frequentes
                                </Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                    {suggestions.map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            onPress={() => setNome(s)}
                                            style={{ backgroundColor: "white", borderWidth: 1.5, borderColor: "#E5E0D8", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}
                                        >
                                            <Text style={{ fontSize: 13, color: "#4A4A4A" }}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                    {/* Botão */}
                    <TouchableOpacity
                        onPress={handleAdd}
                        disabled={loading || !nome.trim()}
                        style={{
                            backgroundColor: nome.trim() ? "#7C9E87" : "#C5C0B8",
                            borderRadius: 14, padding: 16, alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                            {loading ? "Adicionando..." : "Adicionar à lista ✓"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
                </View>
                </KeyboardAvoidingView>
        </Modal>
    );
}