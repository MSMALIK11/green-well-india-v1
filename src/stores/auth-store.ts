import { create } from "zustand";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  referralId: string;
  rank?: string;
  role: "user" | "admin";
  activationStatus?: string;
  kycStatus?: string;
};

type State = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};

export const useAuthStore = create<State>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
