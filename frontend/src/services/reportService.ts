import { apiFetch } from "./api";
import type { ReportRequest, ReportResponseDTO } from "../types/denuncia";

export function isReportResponseDTO(data: unknown): data is ReportResponseDTO {
  if (!data || typeof data !== "object") {
    return false;
  }
  const record = data as Record<string, unknown>;
  return (
    typeof record.valido === "boolean" &&
    typeof record.justificativaIa === "string"
  );
}

export const reportService = {
  async createReport(payload: ReportRequest): Promise<ReportResponseDTO> {
    const formData = new FormData();
    formData.append("endereco", payload.endereco.trim());
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    formData.append("imagem", payload.imagem);

    return apiFetch<ReportResponseDTO>("/api/v1/reports", {
      method: "POST",
      body: formData,
    });
  },

  async getMyReports(): Promise<ReportResponseDTO[]> {
    return apiFetch<ReportResponseDTO[]>("/api/v1/reports/mine", {
      method: "GET",
    });
  },
};
