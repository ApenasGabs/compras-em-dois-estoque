import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Group {
    id: string;
    nome: string;
    codigo_convite: string;
}

interface GroupStore {
    groupId: string | null;
    groupName: string | null;
    groupCode: string | null;
    listId: string | null;
    allGroups: Group[];
    setGroup: (id: string, name: string, code: string) => void;
    setListId: (id: string) => void;
    setAllGroups: (groups: Group[]) => void;
    clearGroup: () => void;
}


export const useGroupStore = create<GroupStore>()(
    persist(
        (set) => ({
            groupId: null,
            groupName: null,
            groupCode: null,
            listId: null,
            allGroups: [],
            setAllGroups: (groups) => set({ allGroups: groups }),
            setGroup: (id, name, code) => set({ groupId: id, groupName: name, groupCode: code }),
            setListId: (id) => set({ listId: id }),
            clearGroup: () => set({ groupId: null, groupName: null, groupCode: null, listId: null }),
        }),
        {
            name: "group-storage",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);