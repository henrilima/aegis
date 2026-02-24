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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async (userId: string) => {
    console.log(`[AUTH] Buscando dados para userId: ${userId}`);
    try {
      // Busca os dados do usuário no backend pelo ID
      const userData = await invoke<User>("get_local_user", { userId });

      // Atualiza o estado global se o usuário for encontrado
      if (userData?.id) {
        console.log(`[AUTH] Usuário encontrado: ${userData.username}`);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error("Usuário não encontrado");
      }
    } catch (error) {
      // Limpa a sessão em caso de erro na recuperação do usuário
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

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log(
      `[AUTH] Verificando token salvo: ${storedToken ? "Encontrado" : "Não encontrado"}`,
    );
    // Tenta restaurar a sessão se houver um token salvo
    if (storedToken) {
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
