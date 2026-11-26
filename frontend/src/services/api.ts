const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit ={}
): Promise<T>{
    const token = localStorage.getItem("acess_token");
    const isFormData = options.body instanceof FormData;
    const headers = new Headers(options.headers);

    if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    }
    if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
     });

    if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(errorText || `Erro HTTP ${response.status}`, response.status);
     }

    if (response.status === 204) {
    return undefined as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json() as Promise<T>;
    }

    return (await response.text()) as unknown as T;
}