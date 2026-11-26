export interface RegisterRequest {
  login: string;
  password: string;
  nome: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface User {
  id?: string | number;
  login: string;
  nome: string;
  xp?: number;
  papel?: string[];
}