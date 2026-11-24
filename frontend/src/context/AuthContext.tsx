import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "../services/api";
import { authService } from "../services/auhtService";
import type { LoginRequest, RegisterRequest, User } from "../types/auth";

interface AuthContextValue{
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }){
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const clearSession = useCallback(() => {
        localStorage.removeItem("access_token");
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setUser(null);
            return;
        }
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                clearSession();
            }
            throw error;
        }
    }, [clearSession]);

    useEffect(() => {
    let active = true;

    async function initAuth() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            if (active) {
            setUser(null);
            setIsLoading(false);
            }
            return;
        }

        try {
            const currentUser = await authService.getCurrentUser();
            if (active) {
            setUser(currentUser);
            }
        } catch (error) {
            if (active) {
            if (error instanceof ApiError && error.status === 401) {
                clearSession();
            } else {
                setUser(null);
            }
            }
        } finally {
            if (active) {
            setIsLoading(false);
            }
        }
        }

        initAuth();
        return () => {
            active = false;
        };
    }, [clearSession]);

    const login = useCallback(async (data: LoginRequest) => {
        const response = await authService.login(data);
        localStorage.setItem("access_token", response.token);
        await refreshUser();
    }, [refreshUser]);

    const register = useCallback(async (data: RegisterRequest) => {
        await authService.register(data);
    }, []);

    const logout = useCallback(() => {
        clearSession();
    }, [clearSession]);
    return(
       <AuthContext.Provider
        value={{
            user,
            isAuthenticated: Boolean(user),
            isLoading,
            login,
            register,
            logout,
            refreshUser,
        }}
        >
        {children}
       </AuthContext.Provider>
    );
}
    export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return context;
}
