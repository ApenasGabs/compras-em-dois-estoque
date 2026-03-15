import { supabase } from "./supabase";
import { useAuthStore } from "../stores/useAuthStore";

export async function trackAction(action: string): Promise<boolean> {
    const userId = useAuthStore.getState().userId;
    if (!userId) return false;

    const { error } = await supabase
        .from("rate_limits")
        .insert({ user_id: userId, action });

    if (error) {
        if (error.message.includes("Muitas ações")) {
            throw new Error("Muitas ações em pouco tempo. Aguarde um momento.");
        }
        throw new Error(error.message);
    }

    return true;
}