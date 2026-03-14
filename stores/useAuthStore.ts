import {supabase} from "../lib/supabase";
import {create} from "zustand";


interface AuthStore {
    userId: string | null;
    userName: string | null;
    setUser: (id: string, name: string) => void;
    clearUser: () => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    userId: null,
    userName: null,

    setUser: (id, name) => set({ userId: id, userName: name }),
    clearUser: () => set({ userId: null, userName: null }),

    signOut: async () => {
        await supabase.auth.signOut();
        set({ userId: null, userName: null });
    },
}));