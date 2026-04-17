"use client";

import { invoke } from "@tauri-apps/api/core";
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
  master_code_index: number;
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
    try {
      // Busca dados do usuário no backend
      const userData = await invoke<User>("get_local_user", { userId });

      if (userData?.id) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error("Usuário não encontrado");
      }
    } catch (error) {
      // Limpa sessão em caso de erro
      console.error("Erro na autenticação local:", error);
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (userId: string) => {
    setLoading(true);
    localStorage.setItem("token", userId);
    await fetchUser(userId);
  };

  const logout = () => {
    localStorage.removeItem("token");
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
    const storedToken = localStorage.getItem("token");
    // Restaura sessão se houver token
    if (storedToken) {
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
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
