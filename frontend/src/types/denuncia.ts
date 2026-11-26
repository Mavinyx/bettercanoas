export type CategoriaLixo =
  | "PLASTICO"
  | "METAL"
  | "ORGANICO"
  | "PAPEL"
  | "VIDRO"
  | "REJEITO"
  | "ENTULHO"
  | "ELETRONICO"
  | "HOSPITALAR"
  | "NAO_IDENTIFICADO";

export type StatusInimigo = "ATIVO" | "DERROTADO";

export type FiltroBossMapa = "TODOS" | "ATIVOS" | "DERROTADOS";

export interface InimigoDTO {
  id: number;
  nome: string;
  statusInimigo: StatusInimigo;
  hpAtual: number;
  hpMaximo: number;
  bairro: string;
}

export interface BairroBossDTO {
  id: number;
  codigoIbge: string | null;
  nome: string;
  inimigo: InimigoDTO;
}

export interface ReportRequest {
  endereco: string;
  latitude: number;
  longitude: number;
  imagem: File;
}

export interface ReportResponseDTO {
  justificativaIa: string;
  severidade: number;
  valido: boolean;
  categoria: CategoriaLixo;
  dano: number;
  latitude: number;
  longitude: number;
  inimigo: InimigoDTO | null;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  erro?: string;
  mensagem?: string;
}

export interface AddressSuggestion {
  displayName: string;
  shortAddress: string;
  latitude: number;
  longitude: number;
}

export const CATEGORIA_LABELS: Record<CategoriaLixo, string> = {
  PLASTICO: "Plástico",
  METAL: "Metal",
  ORGANICO: "Orgânico",
  PAPEL: "Papel",
  VIDRO: "Vidro",
  REJEITO: "Rejeito",
  ENTULHO: "Entulho / Volumoso",
  ELETRONICO: "Lixo Eletrônico",
  HOSPITALAR: "Resíduo Hospitalar",
  NAO_IDENTIFICADO: "Não Identificado",
};
