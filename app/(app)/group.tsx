import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import { useGroupStore } from "../../stores/useGroupStore";
import { generateInviteCode } from "../../lib/generateCode";

export default function Group() {
    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { userId, userName } = useAuthStore();
    const { setGroup, setListId } = useGroupStore();

    async function handleCreateGroup() {
        setLoading(true);
        const code = generateInviteCode();

        const { data: group, error: groupError } = await supabase
            .from("groups")
            .insert({ nome: `Grupo de ${userName}`, codigo_convite: code })
            .select()
            .single();

        if (groupError) {
            Alert.alert("Erro", groupError.message);
            setLoading(false);
            return;
        }

        await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });

        const { data: list } = await supabase
            .from("shopping_lists")
            .insert({ group_id: group.id, titulo: "Lista da semana", ativa: true })
            .select()
            .single();

        setGroup(group.id, group.nome, code);
        if (list) setListId(list.id);

        router.replace("/(app)/list");
        setLoading(false);
    }

    async function handleJoinGroup() {
        if (!inviteCode.trim()) {
            Alert.alert("Atenção", "Digite o código do grupo.");
            return;
        }
        setLoading(true);

        const { data: group, error } = await supabase
            .from("groups")
            .select()
            .eq("codigo_convite", inviteCode.trim().toUpperCase())
            .single();

        if (error || !group) {
            Alert.alert("Erro", "Grupo não encontrado. Verifique o código.");
            setLoading(false);
            return;
        }

        await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });

        const { data: list } = await supabase
            .from("shopping_lists")
            .select()
            .eq("group_id", group.id)
            .eq("ativa", true)
            .single();

        setGroup(group.id, group.nome, group.codigo_convite);
        if (list) setListId(list.id);

        router.replace("/(app)/list");
        setLoading(false);
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F5F0E8", padding: 32, justifyContent: "center" }}>
            <Text style={{ fontSize: 28, color: "#2A2A2A", marginBottom: 8, fontWeight: "300" }}>
                Seu grupo{"\n"}de compras
            </Text>
            <Text style={{ fontSize: 14, color: "#9A9590", marginBottom: 40 }}>
                Crie um grupo ou entre em um existente
            </Text>

            <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={loading}
                style={{
                    backgroundColor: "#7C9E87",
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                        Criar novo grupo
                    </Text>
                )}
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "#E5E0D8" }} />
                <Text style={{ color: "#9A9590", fontSize: 13 }}>ou entre em um grupo</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#E5E0D8" }} />
            </View>

            <TextInput
                placeholder="Código do grupo (ex: ABCD-1234)"
                placeholderTextColor="#9A9590"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                style={{
                    backgroundColor: "white",
                    borderWidth: 1.5,
                    borderColor: "#E5E0D8",
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 15,
                    color: "#2A2A2A",
                    marginBottom: 12,
                }}
            />

            <TouchableOpacity
                onPress={handleJoinGroup}
                disabled={loading}
                style={{
                    backgroundColor: "transparent",
                    borderWidth: 1.5,
                    borderColor: "#2A2A2A",
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "#2A2A2A", fontWeight: "600", fontSize: 16 }}>
                    Entrar no grupo
                </Text>
            </TouchableOpacity>
        </View>
    );
}