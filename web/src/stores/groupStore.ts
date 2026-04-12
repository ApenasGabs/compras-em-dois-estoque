import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface WebGroupRecord {
  id: string;
  nome: string;
  codigo_convite: string;
}

interface GroupStore {
  groupId: string | null;
  groupName: string | null;
  groupCode: string | null;
  listId: string | null;
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
      allGroups: [],
      setGroup: (id, name, code) =>
        set({ groupId: id, groupName: name, groupCode: code }),
      setListId: (listId) => set({ listId }),
      setAllGroups: (allGroups) => set({ allGroups }),
      clearGroup: () =>
        set({
          groupId: null,
          groupName: null,
          groupCode: null,
          listId: null,
          allGroups: [],
        }),
    }),
    {
      name: "group-storage-web",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
