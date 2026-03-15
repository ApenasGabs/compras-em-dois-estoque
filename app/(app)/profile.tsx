import React, {useCallback, useState} from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAuthStore } from "../../stores/useAuthStore";
import { useGroupStore } from "../../stores/useGroupStore";
import * as Clipboard from "expo-clipboard";
import { supabase } from "../../lib/supabase";
import {useFocusEffect, useRouter} from "expo-router";

export default function Profile() {
    const { userName, signOut } = useAuthStore();
    const { groupName, groupCode, groupId, allGroups, setGroup, setListId, clearGroup } = useGroupStore();
    const [switching, setSwitching] = useState(false);
    const [members, setMembers] = useState<{ [groupId: string]: { id: string; nome: string }[] }>({});
    const router = useRouter();

    async function fetchMembers(gId: string) {
        const { data: memberData } = await supabase
            .from("group_members")
            .select("user_id")
            .eq("group_id", gId);

        if (!memberData) return;

        const userIds = memberData.map(m => m.user_id);

        const { data: profileData } = await supabase
            .from("profiles")
            .select("id, nome")
            .in("id", userIds);

        if (profileData) {
            setMembers(prev => ({
                ...prev,
                [gId]: profileData.map(p => ({ id: p.id, nome: p.nome ?? "Usuário" })),
            }));
        }
    }

    useFocusEffect(
        useCallback(() => {
            const userId = useAuthStore.getState().userId;
            if (!userId) return;

            async function loadGroups() {
                const { data } = await supabase
                    .from("groups")
                    .select("id, nome, codigo_convite, group_members!inner(user_id)")
                    .eq("group_members.user_id", userId);

                if (data) {
                    const groups = data.map(g => ({
                        id: g.id,
                        nome: g.nome,
                        codigo_convite: g.codigo_convite,
                    }));
                    useGroupStore.getState().setAllGroups(groups);

                    const currentGroupId = useGroupStore.getState().groupId;
                    if (currentGroupId) fetchMembers(currentGroupId);
                }
            }

            loadGroups();
        }, [])
    );

    async function handleCopyCode() {
        if (!groupCode) return;
        await Clipboard.setStringAsync(groupCode);
    }

    async function handleLeaveGroup(group: { id: string; nome: string; codigo_convite: string }) {
        Alert.alert(
            "Sair do grupo",
            `Tem certeza que deseja sair do grupo "${group.nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Sair", style: "destructive", onPress: async () => {
                        const userId = useAuthStore.getState().userId;

                        const { error } = await supabase
                            .from("group_members")
                            .delete()
                            .eq("group_id", group.id)
                            .eq("user_id", userId);

                        if (error) {
                            Alert.alert("Erro", error.message);
                            return;
                        }

                        const remaining = allGroups.filter(g => g.id !== group.id);
                        useGroupStore.getState().setAllGroups(remaining);

                        if (group.id === groupId) {
                            if (remaining.length > 0) {
                                const next = remaining[0];
                                const { data: list } = await supabase
                                    .from("shopping_lists")
                                    .select("id")
                                    .eq("group_id", next.id)
                                    .eq("ativa", true)
                                    .single();

                                useGroupStore.getState().setGroup(next.id, next.nome, next.codigo_convite);
                                if (list) useGroupStore.getState().setListId(list.id);
                            } else {
                                useGroupStore.getState().clearGroup();
                            }
                        }
                    }},
            ]
        );
    }

    async function handleSwitchGroup(group: { id: string; nome: string; codigo_convite: string }) {
        if (group.id === groupId) return;
        setSwitching(true);

        const { data: list } = await supabase
            .from("shopping_lists")
            .select("id")
            .eq("group_id", group.id)
            .eq("ativa", true)
            .single();

        setGroup(group.id, group.nome, group.codigo_convite);
        if (list) setListId(list.id);
        setSwitching(false);
    }

    async function handleSignOut() {
        Alert.alert("Sair", "Tem certeza que deseja sair?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Sair", style: "destructive", onPress: async () => {
                    clearGroup();
                    await signOut();
                }},
        ]);
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F5F0E8" }} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 40 }}>
            <Text style={{ fontSize: 28, color: "#2A2A2A", fontWeight: "300", marginBottom: 32 }}>
                Perfil
            </Text>

            {/* Usuário */}
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: "#E5E0D8" }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 12 }}>
                    Você
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#7C9E87", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                            {userName?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "500", color: "#2A2A2A" }}>{userName}</Text>
                </View>
            </View>

            {/* Grupos */}
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: "#E5E0D8" }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 12 }}>
                    Meus grupos
                </Text>
                <View style={{ gap: 8 }}>
                    {allGroups.map(group => (
                        <TouchableOpacity
                            key={group.id}
                            onPress={() => {
                                handleSwitchGroup(group);
                                fetchMembers(group.id);
                            }}
                            disabled={switching}
                            style={{
                                borderRadius: 12, borderWidth: 1.5,
                                borderColor: group.id === groupId ? "#7C9E87" : "#E5E0D8",
                                backgroundColor: group.id === groupId ? "rgba(124,158,135,0.08)" : "#F5F0E8",
                                overflow: "hidden",
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                    <View style={{
                                        width: 32, height: 32, borderRadius: 10,
                                        backgroundColor: group.id === groupId ? "#7C9E87" : "#E5E0D8",
                                        alignItems: "center", justifyContent: "center"
                                    }}>
                                        <Text style={{ fontSize: 16 }}>🛒</Text>
                                    </View>
                                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#2A2A2A" }}>{group.nome}</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <TouchableOpacity
                                        onPress={() => handleLeaveGroup(group)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={{ fontSize: 12, color: "#D4614A", fontWeight: "600" }}>Sair</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Membros */}
                            {group.id === groupId && members[group.id] && (
                                <View style={{ borderTopWidth: 1, borderTopColor: "#E5E0D8", padding: 12, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                                    {members[group.id].map(member => (
                                        <View key={member.id} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "white", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#7C9E87", alignItems: "center", justifyContent: "center" }}>
                                                <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                                                    {member.nome.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 12, fontWeight: "500", color: "#2A2A2A" }}>{member.nome}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={() => router.push("/(app)/group")}
                    style={{ marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E0D8", alignItems: "center" }}
                >
                    <Text style={{ fontSize: 14, color: "#7C9E87", fontWeight: "600" }}>+ Criar ou entrar em grupo</Text>
                </TouchableOpacity>
            </View>

            {/* Código de convite */}
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1.5, borderColor: "#E5E0D8" }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
                    Código de convite do grupo ativo
                </Text>
                <TouchableOpacity
                    onPress={handleCopyCode}
                    style={{ backgroundColor: "#F5F0E8", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                >
                    <Text style={{ fontWeight: "600", color: "#4E7059", fontSize: 15, letterSpacing: 2 }}>
                        {groupCode}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#7C9E87", fontWeight: "600" }}>Copiar</Text>
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity
                onPress={handleSignOut}
                style={{ backgroundColor: "white", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#E5E0D8" }}
            >
                <Text style={{ color: "#D4614A", fontWeight: "600", fontSize: 16 }}>Sair da conta</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}