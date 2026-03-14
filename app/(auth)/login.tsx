import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleLogin() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert("Erro", error.message);
        setLoading(false);
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#2A2A2A", justifyContent: "center", padding: 32 }}>
            <Text style={{ fontFamily: "serif", fontSize: 36, color: "#F5F0E8", marginBottom: 8 }}>
                Compras{"\n"}em Dois
            </Text>
            <Text style={{ fontSize: 14, color: "#9A9590", marginBottom: 40 }}>
                Lista compartilhada em tempo real
            </Text>

            <TextInput
                placeholder="E-mail"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    padding: 14,
                    color: "#F5F0E8",
                    marginBottom: 12,
                    fontSize: 15,
                }}
            />

            <TextInput
                placeholder="Senha"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    padding: 14,
                    color: "#F5F0E8",
                    marginBottom: 24,
                    fontSize: 15,
                }}
            />

            <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                style={{
                    backgroundColor: "#7C9E87",
                    borderRadius: 14,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
                    {loading ? "Entrando..." : "Entrar"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={{ color: "#9A9590", textAlign: "center", fontSize: 14 }}>
                    Não tem conta?{" "}
                    <Text style={{ color: "#A8C4AF", fontWeight: "600" }}>Criar conta</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}