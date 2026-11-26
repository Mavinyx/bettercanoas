import { apiFetch } from "./api";
import type { BairroBossDTO, InimigoDTO } from "../types/denuncia";

export const combatService = {
  async getBairros(): Promise<BairroBossDTO[]> {
    return apiFetch<BairroBossDTO[]>("/api/v1/bairros", {
      method: "GET",
    });
  },

  async getBairroById(id: number): Promise<BairroBossDTO> {
    return apiFetch<BairroBossDTO>(`/api/v1/bairros/${id}`, {
      method: "GET",
    });
  },

  async getActiveBosses(): Promise<InimigoDTO[]> {
    return apiFetch<InimigoDTO[]>("/api/v1/combat/active", {
      method: "GET",
    });
  },

  async getDefeatedBosses(): Promise<InimigoDTO[]> {
    return apiFetch<InimigoDTO[]>("/api/v1/combat/defeated", {
      method: "GET",
    });
  },

  async getBossById(id: number): Promise<InimigoDTO> {
    return apiFetch<InimigoDTO>(`/api/v1/combat/${id}`, {
      method: "GET",
    });
  },
};
