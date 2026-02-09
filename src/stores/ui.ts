import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  searchQuery: string;
  filterTags: string[];
  filterStatus: string | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterTags: (tags: string[]) => void;
  setFilterStatus: (status: string | null) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  searchQuery: '',
  filterTags: [],
  filterStatus: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterTags: (tags) => set({ filterTags: tags }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  reset: () =>
    set({
      sidebarOpen: true,
      searchQuery: '',
      filterTags: [],
      filterStatus: null,
    }),
}));
