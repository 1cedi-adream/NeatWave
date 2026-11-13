import { create } from "zustand";
import type { UserRole } from "../types/roles";

export type SessionUser = { id: string; name: string; role: UserRole; email?: string; identifier?: string };
type SessionState = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null, remember?: boolean) => void;
  updateUser: (patch: Partial<Pick<SessionUser, "name" | "email">>) => void;
};

function readRememberedUser(): SessionUser | null {
  try {
    const saved = localStorage.getItem("laundry-app-user");
    return saved ? JSON.parse(saved) as SessionUser : null;
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  user: readRememberedUser(),
  setUser: (user, remember = false) => {
    if (user && remember) localStorage.setItem("laundry-app-user", JSON.stringify(user));
    else localStorage.removeItem("laundry-app-user");
    set({ user });
  },
  updateUser: (patch) => set((state) => {
    if (!state.user) return state;
    const user = { ...state.user, ...patch };
    if (localStorage.getItem("laundry-app-user")) localStorage.setItem("laundry-app-user", JSON.stringify(user));
    return { user };
  }),
}));
