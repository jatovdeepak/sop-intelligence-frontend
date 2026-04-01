import { create } from 'zustand';
import { SOP_API, SYSTEM_API } from './api-service';

const useStore = create((set, get) => ({
  // State variables
  sops: [],
  sopMetadata: [],
  currentSop: null,
  serverHealth: null,
  isLoading: false,
  error: null,

  // =========================
  // ACTIONS
  // =========================
  
  // Fetch full SOPs
  fetchSOPs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await SOP_API.getAllSOPs();
      set({ sops: response.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Fetch only Metadata (Optimized Route)
  fetchSOPMetadata: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await SOP_API.getAllMetadata();
      set({ sopMetadata: response.data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Create SOP and instantly update the local state list
  createSOP: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await SOP_API.createSOP(data);
      // Append the new SOP to the existing list without refetching
      set((state) => ({ 
        sops: [...state.sops, response.data],
        isLoading: false 
      }));
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Delete SOP and remove it from the UI immediately
  deleteSOP: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await SOP_API.deleteSOP(id);
      set((state) => ({
        sops: state.sops.filter((sop) => sop._id !== id),
        sopMetadata: state.sopMetadata.filter((meta) => meta._id !== id),
        isLoading: false
      }));
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Update Health Status manually or via Socket
  updateServerHealth: (healthData) => {
    set({ serverHealth: healthData });
  }
}));

export default useStore;