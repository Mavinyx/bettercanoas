import { apiFetch } from "./api";
import type { LoginRequest, LoginResponse, RegisterRequest, User } from "../types/auth";

export const authService = {
    async register(data: RegisterRequest): Promise<string>{
        return apiFetch<string>("/api/v1/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    async login(data: LoginRequest): Promise<LoginResponse>{
        return apiFetch<LoginResponse>("/api/v1/auth/login", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },
    async getCurrentUser():Promise<User>{
       return apiFetch<User>("/api/v1/auth/me", {
        method: "GET",
        });
    },
};