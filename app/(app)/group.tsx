import React, {useCallback, useState} from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, ScrollView
} from "react-native";
import {useFocusEffect, useRouter} from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import { useGroupStore } from "../../stores/useGroupStore";
import { generateInviteCode } from "../../lib/generateCode";
import * as Clipboard from "expo-clipboard";
import {trackAction} from "../../lib/rateLimit";

export default function Group() {
    const [step, setStep] = useState<"menu" | "create" | "join">("menu");
    const [groupName, setGroupName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [createdCode, setCreatedCode] = useState<string | null>(null);
    const router = useRouter();
    const { userId, userName } = useAuthStore();
    const { setGroup, setListId, allGroups, setAllGroups } = useGroupStore();

    useFocusEffect(
        useCallback(() => {
            return () => {
                setCreatedCode(null);
                setStep("menu");
                setGroupName("");
                setInviteCode("");
            };
        }, [])
    );

    async function handleCreateGroup() {
        if (!groupName.trim()) {
            Alert.alert("Atenção", "Digite um nome para o grupo.");
            return;
        }
        setLoading(true);
        const code = generateInviteCode();

        await trackAction("create_group");
        const { data: groupId, error: groupError } = await supabase
            .rpc("create_group", {
                group_name: groupName.trim(),
                invite_code: code,
            });

        if (groupError) {
            Alert.alert("Erro", groupError.message);
            setLoading(false);
            return;
        }

        const { data: group } = await supabase
            .from("groups")
            .select()
            .eq("id", groupId)
            .single();

        if (!group) {
            Alert.alert("Erro", "Não foi possível carregar o grupo.");
            setLoading(false);
            return;
        }

        const { data: list } = await supabase
            .from("shopping_lists")
            .insert({ group_id: group.id, titulo: "Lista da semana", ativa: true })
            .select()
            .single();

        setGroup(group.id, group.nome, code);
        setAllGroups([...allGroups, { id: group.id, nome: group.nome, codigo_convite: code }]);
        if (list) setListId(list.id);

        setCreatedCode(code);
        setLoading(false);
    }

    async function handleJoinGroup() {
        if (!inviteCode.trim()) {
            Alert.alert("Atenção", "Digite o código do grupo.");
            return;
        }
        setLoading(true);

        await trackAction("join_group");
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

        const { data: existing } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", group.id)
            .eq("user_id", userId)
            .single();

        if (existing) {
            Alert.alert("Atenção", "Você já faz parte deste grupo.");
            setLoading(false);
            return;
        }

        await supabase
            .from("group_members")
            .insert({ group_id: group.id, user_id: userId });

        const { data: list } = await supabase
            .from("shopping_lists")
            .select()
            .eq("group_id", group.id)
            .eq("ativa", true)
            .single();

        setGroup(group.id, group.nome, group.codigo_convite);
        setAllGroups([...allGroups, { id: group.id, nome: group.nome, codigo_convite: group.codigo_convite }]);
        if (list) setListId(list.id);

        router.replace("/(app)/list");
        setLoading(false);
    }

    // Tela de sucesso após criar grupo
    if (createdCode && useGroupStore.getState().groupId) {
        return (
            <View style={{ flex: 1, backgroundColor: "#F5F0E8", padding: 32, justifyContent: "center" }}>
                <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#7C9E87", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Text style={{ fontSize: 28 }}>✓</Text>
                </View>
                <Text style={{ fontSize: 26, fontWeight: "300", color: "#2A2A2A", marginBottom: 8 }}>
                    Grupo criado!
                </Text>
                <Text style={{ fontSize: 14, color: "#9A9590", marginBottom: 32 }}>
                    Compartilhe o código abaixo com quem você quer convidar.
                </Text>

                <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1.5, borderColor: "#E5E0D8" }}>
                    <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 10 }}>
                        Código de convite
                    </Text>
                    <Text style={{ fontSize: 28, fontWeight: "700", color: "#4E7059", letterSpacing: 4, textAlign: "center", paddingVertical: 8 }}>
                        {createdCode}
                    </Text>
                    <TouchableOpacity
                        onPress={async () => {
                            await Clipboard.setStringAsync(createdCode!);
                        }}
                        style={{ marginTop: 8, alignItems: "center" }}
                    >
                        <Text style={{ fontSize: 13, color: "#7C9E87", fontWeight: "600" }}>Toque para copiar</Text>
                    </TouchableOpacity>
                </View>


                <TouchableOpacity
                    onPress={() => router.replace("/(app)/list")}
                    style={{ backgroundColor: "#7C9E87", borderRadius: 14, padding: 16, alignItems: "center" }}
                >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Ir para a lista →</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Menu principal
    if (step === "menu") {
        return (
            <View style={{ flex: 1, backgroundColor: "#F5F0E8", padding: 32, justifyContent: "center" }}>
                <Text style={{ fontSize: 28, fontWeight: "300", color: "#2A2A2A", marginBottom: 8 }}>
                    Grupos de compras
                </Text>
                <Text style={{ fontSize: 14, color: "#9A9590", marginBottom: 40 }}>
                    Crie um novo grupo ou entre em um existente
                </Text>

                <TouchableOpacity
                    onPress={() => setStep("create")}
                    style={{ backgroundColor: "#7C9E87", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 12 }}
                >
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Criar novo grupo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setStep("join")}
                    style={{ backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#2A2A2A", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 24 }}
                >
                    <Text style={{ color: "#2A2A2A", fontWeight: "600", fontSize: 16 }}>Entrar com código</Text>
                </TouchableOpacity>

                {allGroups.length > 0 && (
                    <TouchableOpacity onPress={() => router.replace("/(app)/list")}>
                        <Text style={{ color: "#9A9590", textAlign: "center", fontSize: 14 }}>Cancelar</Text>
                    </TouchableOpacity>
                )}
            </View>

        );
    }

    // Criar grupo
    if (step === "create") {
        return (
            <View style={{ flex: 1, backgroundColor: "#F5F0E8", padding: 32, justifyContent: "center" }}>
                <TouchableOpacity onPress={() => setStep("menu")} style={{ marginBottom: 24 }}>
                    <Text style={{ color: "#7C9E87", fontWeight: "600" }}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 26, fontWeight: "300", color: "#2A2A2A", marginBottom: 8 }}>
                    Criar grupo
                </Text>
                <Text style={{ fontSize: 14, color: "#9A9590", marginBottom: 32 }}>
                    Dê um nome para identificar o grupo
                </Text>

                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
                    Nome do grupo
                </Text>
                <TextInput
                    placeholder="Ex: Casa, Família, Trabalho..."
                    placeholderTextColor="#9A9590"
                    value={groupName}
                    onChangeText={setGroupName}
                    style={{
                        backgroundColor: "white", borderWidth: 1.5, borderColor: "#E5E0D8",
                        borderRadius: 14, padding: 14, fontSize: 15, color: "#2A2A2A", marginBottom: 32,
                    }}
                />

                <TouchableOpacity
                    onPress={handleCreateGroup}
                    disabled={loading || !groupName.trim()}
                    style={{
                        backgroundColor: groupName.trim() ? "#7C9E87" : "#C5C0B8",
                        borderRadius: 14, padding: 16, alignItems: "center",
                    }}
                >
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Criar grupo</Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    // Entrar no grupo
    return (
        <View style={{ flex: 1, backgroundColor: "#F5F0E8", padding: 32, justifyContent: "center" }}>
            <TouchableOpacity onPress={() => setStep("menu")} style={{ marginBottom: 24 }}>
                <Text style={{ color: "#7C9E87", fontWeight: "600" }}>← Voltar</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 26, fontWeight: "300", color: "#2A2A2A", marginBottom: 8 }}>
                Entrar no grupo
            </Text>
            <Text style={{ fontSize: 14, color: "#9A9590", marginBottom: 32 }}>
                Digite o código compartilhado por alguém do grupo
            </Text>

            <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
                Código do grupo
            </Text>
            <TextInput
                placeholder="Ex: ABCD-1234"
                placeholderTextColor="#9A9590"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                style={{
                    backgroundColor: "white", borderWidth: 1.5, borderColor: "#E5E0D8",
                    borderRadius: 14, padding: 14, fontSize: 15, color: "#2A2A2A", marginBottom: 32,
                }}
            />

            <TouchableOpacity
                onPress={handleJoinGroup}
                disabled={loading || !inviteCode.trim()}
                style={{
                    backgroundColor: inviteCode.trim() ? "#7C9E87" : "#C5C0B8",
                    borderRadius: 14, padding: 16, alignItems: "center",
                }}
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Entrar no grupo</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}