import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface WebGroupRecord {
  id: string;
  nome: string;
  codigo_convite: string;
}

export interface GroupStoreSnapshot {
  groupId: string | null;
  groupName: string | null;
  groupCode: string | null;
  listId: string | null;
  lastGroupId: string | null;
  lastListId: string | null;
  allGroups: WebGroupRecord[];
}

const STORAGE_KEY = "group-storage-web";

export const getPersistedGroupSnapshot = (): GroupStoreSnapshot | null => {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (typeof parsedValue !== "object" || parsedValue === null || !("state" in parsedValue)) {
      return null;
    }

    const state = (parsedValue as { state?: Partial<GroupStoreSnapshot> }).state;
    if (!state) return null;

    return {
      groupId: state.groupId ?? null,
      groupName: state.groupName ?? null,
      groupCode: state.groupCode ?? null,
      listId: state.listId ?? null,
      lastGroupId: state.lastGroupId ?? null,
      lastListId: state.lastListId ?? null,
      allGroups: Array.isArray(state.allGroups) ? state.allGroups : [],
    };
  } catch {
    return null;
  }
};

interface GroupStore {
  groupId: string | null;
  groupName: string | null;
  groupCode: string | null;
  listId: string | null;
  lastGroupId: string | null;
  lastListId: string | null;
  allGroups: WebGroupRecord[];
  setGroup: (id: string, name: string, code: string) => void;
  setListId: (listId: string | null) => void;
  setAllGroups: (groups: WebGroupRecord[]) => void;
  clearGroup: () => void;
}

export const useGroupStore = create<GroupStore>()(
  persist(
    (set) => ({
      groupId: null,
      groupName: null,
      groupCode: null,
      listId: null,
      lastGroupId: null,
      lastListId: null,
      allGroups: [],
      setGroup: (id, name, code) =>
        set({
          groupId: id,
          groupName: name,
          groupCode: code,
          lastGroupId: id,
        }),
      setListId: (listId) =>
        set({
          listId,
          lastListId: listId,
        }),
      setAllGroups: (groups) => set({ allGroups: groups }),
      clearGroup: () =>
        set({
          groupId: null,
          groupName: null,
          groupCode: null,
          listId: null,
        }),
    }),
    {
      name: "group-storage-web",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
