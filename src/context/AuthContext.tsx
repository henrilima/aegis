"use client";

import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  masterCodeIndex: number;
  passwordHint?: string;
  hasVaultPassword?: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  updateUsername: (newUsername: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async (userId: string) => {
    // Definimos um tempo mínimo de carregamento para o usuário ver a animação
    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const userData = await invoke<User>("get_local_user", { userId: userId });

      if (userData) {
        const rawData = userData as unknown as Record<string, unknown>;
        const id = (rawData.id || rawData.userId) as string | undefined;

        if (id) {
          setUser({ ...userData, id });
          setIsAuthenticated(true);
        } else {
          throw new Error("Usuário sem identificador válido");
        }
      } else {
        throw new Error("Usuário não encontrado ou formato inválido");
      }
    } catch (_error) {
      const store = await load("aegis-session.json", {
        defaults: {},
        autoSave: true,
      });
      await store.delete("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      // Aguarda o tempo mínimo antes de remover o loading
      await minLoadingTime;
      setLoading(false);
    }
  }, []);

  const login = async (userId: string) => {
    setLoading(true);
    const store = await load("aegis-session.json", {
      defaults: {},
      autoSave: true,
    });
    await store.set("token", userId);
    await fetchUser(userId);
  };

  const logout = () => {
    load("aegis-session.json", { defaults: {}, autoSave: true }).then((store) =>
      store.delete("token"),
    );
    setUser(null);
    setIsAuthenticated(false);
    router.push("/");
  };

  const updateUsername = (newUsername: string) => {
    if (user) {
      setUser({ ...user, username: newUsername });
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const store = await load("aegis-session.json", {
          defaults: {},
          autoSave: true,
        });
        const storedToken = await store.get<string>("token");
        if (storedToken) {
          await fetchUser(storedToken);
        } else {
          // Mesmo sem token, damos um pequeno delay para a logo aparecer
          setTimeout(() => setLoading(false), 1000);
        }
      } catch {
        setLoading(false);
      }
    };
    restoreSession();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, logout, updateUsername }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
