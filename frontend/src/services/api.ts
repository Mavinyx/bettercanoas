const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedData: unknown = undefined;
    let errorMessage = errorText || `Erro HTTP ${response.status}`;

    if (errorText) {
      try {
        parsedData = JSON.parse(errorText);
        if (parsedData && typeof parsedData === "object") {
          const record = parsedData as Record<string, unknown>;
          if (typeof record.mensagem === "string" && record.mensagem.trim()) {
            errorMessage = record.mensagem;
          } else if (
            typeof record.justificativaIa === "string" &&
            record.justificativaIa.trim()
          ) {
            errorMessage = record.justificativaIa;
          } else if (typeof record.erro === "string" && record.erro.trim()) {
            errorMessage = record.erro;
          }
        }
      } catch {
        // Mantém texto puro caso a resposta não seja JSON
      }
    }

    throw new ApiError(errorMessage, response.status, parsedData);
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