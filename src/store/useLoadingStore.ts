import { create } from "zustand";

type LoadingStore = {
  activeRequests: number;
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

export const useLoadingStore = create<LoadingStore>((set) => ({
  activeRequests: 0,
  isLoading: false,
  startLoading: () =>
    set((state) => ({
      activeRequests: state.activeRequests + 1,
      isLoading: true,
    })),
  stopLoading: () =>
    set((state) => {
      const activeRequests = Math.max(0, state.activeRequests - 1);

      return {
        activeRequests,
        isLoading: activeRequests > 0,
      };
    }),
}));
