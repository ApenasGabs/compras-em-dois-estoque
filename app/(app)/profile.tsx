import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "../../stores/useAuthStore";
import { useGroupStore } from "../../stores/useGroupStore";
import * as Clipboard from "expo-clipboard";

export default function Profile() {
    const { userName, signOut } = useAuthStore();
    const { groupName, clearGroup } = useGroupStore();
    const groupCode = useGroupStore(state => state.groupCode);

    async function handleCopyCode() {
        if (!groupCode) return;
        await Clipboard.setStringAsync(groupCode);
        Alert.alert("Copiado!", "Código do grupo copiado.");
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
        <View style={{ flex: 1, backgroundColor: "#F5F0E8", padding: 24, paddingTop: 60 }}>
            <Text style={{ fontSize: 28, color: "#2A2A2A", fontWeight: "300", marginBottom: 32 }}>
                Perfil
            </Text>

            {/* Usuário */}
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: "#E5E0D8" }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
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

            {/* Grupo */}
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, marginBottom: 32, borderWidth: 1.5, borderColor: "#E5E0D8" }}>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
                    Grupo
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "500", color: "#2A2A2A", marginBottom: 14 }}>{groupName}</Text>
                <Text style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#9A9590", fontWeight: "600", marginBottom: 8 }}>
                    Código de convite
                </Text>
                <TouchableOpacity
                    onPress={handleCopyCode}
                    style={{ backgroundColor: "#F5F0E8", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                >
                    <Text style={{ fontFamily: "monospace", fontWeight: "600", color: "#4E7059", fontSize: 15, letterSpacing: 2 }}>
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
        </View>
    );
}