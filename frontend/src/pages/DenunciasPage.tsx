import "../css/pages/denuncias.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BossesMap from "../components/BossesMap";
import CombatResultCard from "../components/CombatResultCard";
import ReportForm from "../components/ReportForm";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import { combatService } from "../services/combatService";
import {
  findBairroNameByPoint,
  reverseGeocode,
} from "../services/geocodingService";
import { reportService } from "../services/reportService";
import {
  CATEGORIA_LABELS,
  type BairroBossDTO,
  type FiltroBossMapa,
  type ReportResponseDTO,
} from "../types/denuncia";

type AbaDenuncia = "nova" | "historico";

export default function DenunciasPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const abaAtiva: AbaDenuncia =
    searchParams.get("aba") === "historico" ? "historico" : "nova";

  // Estado dos Bairros e Bosses (Mapa)
  const [bairros, setBairros] = useState<BairroBossDTO[]>([]);
  const [filtroMapa, setFiltroMapa] = useState<FiltroBossMapa>("TODOS");
  const [visibleBossIds, setVisibleBossIds] = useState<Set<number> | null>(
    null
  );
  const [isLoadingBosses, setIsLoadingBosses] = useState<boolean>(true);
  const [bossLoadError, setBossLoadError] = useState<string | null>(null);

  // Estado da Localização Sincronizada (Formulário <-> Mapa)
  const [endereco, setEndereco] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [flyToKey, setFlyToKey] = useState<number>(0);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const reverseReqIdRef = useRef<number>(0);

  // Resultado da última denúncia validada
  const [lastCombatResult, setLastCombatResult] =
    useState<ReportResponseDTO | null>(null);

  // Histórico do usuário (/api/v1/reports/mine)
  const [myReports, setMyReports] = useState<ReportResponseDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(
    abaAtiva === "historico"
  );
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [highlightedReport, setHighlightedReport] =
    useState<ReportResponseDTO | null>(null);

  const loadBairros = useCallback(async () => {
    setIsLoadingBosses(true);
    setBossLoadError(null);
    try {
      const data = await combatService.getBairros();
      setBairros(data);
    } catch (err) {
      setBossLoadError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar os Bosses dos bairros."
      );
    } finally {
      setIsLoadingBosses(false);
    }
  }, []);

  const applyMapFilter = useCallback(async (novoFiltro: FiltroBossMapa) => {
    setFiltroMapa(novoFiltro);
    if (novoFiltro === "TODOS") {
      setVisibleBossIds(null);
      return;
    }

    setIsLoadingBosses(true);
    try {
      const lista =
        novoFiltro === "ATIVOS"
          ? await combatService.getActiveBosses()
          : await combatService.getDefeatedBosses();
      setVisibleBossIds(new Set(lista.map((item) => item.id)));
    } catch {
      // Fallback local caso a chamada falhe momentaneamente
      setVisibleBossIds(null);
    } finally {
      setIsLoadingBosses(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await reportService.getMyReports();
      setMyReports([...data].reverse());
    } catch (err) {
      setHistoryError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar seu histórico de denúncias."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    combatService
      .getBairros()
      .then((data) => {
        if (active) {
          setBairros(data);
          setBossLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setBossLoadError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar os Bosses dos bairros."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingBosses(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (abaAtiva !== "historico") {
      return;
    }
    let active = true;
    reportService
      .getMyReports()
      .then((data) => {
        if (active) {
          setMyReports([...data].reverse());
          setHistoryError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setHistoryError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar seu histórico de denúncias."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      active = false;
    };
  }, [abaAtiva]);

  const detectedBairroNome = useMemo(() => {
    if (!coordinates) return null;
    return findBairroNameByPoint(coordinates.latitude, coordinates.longitude);
  }, [coordinates]);

  const targetBoss = useMemo(() => {
    if (!detectedBairroNome) return null;
    const normalized = detectedBairroNome.trim().toLowerCase();
    const match = bairros.find(
      (b) => b.nome.trim().toLowerCase() === normalized
    );
    return match?.inimigo ?? null;
  }, [bairros, detectedBairroNome]);

  const handleSelectLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      options?: {
        addressOverride?: string;
        flyTo?: boolean;
        skipReverseGeocode?: boolean;
      }
    ) => {
      setHighlightedReport(null);
      setCoordinates({ latitude, longitude });

      if (options?.flyTo) {
        setFlyToKey((prev) => prev + 1);
      }

      if (options?.addressOverride !== undefined) {
        setEndereco(options.addressOverride);
        return;
      }

      if (options?.skipReverseGeocode) {
        return;
      }

      const reqId = ++reverseReqIdRef.current;
      setIsReverseGeocoding(true);
      try {
        const resolvedAddress = await reverseGeocode(latitude, longitude);
        if (reqId === reverseReqIdRef.current && resolvedAddress) {
          setEndereco(resolvedAddress);
        }
      } finally {
        if (reqId === reverseReqIdRef.current) {
          setIsReverseGeocoding(false);
        }
      }
    },
    []
  );

  const handleReportSuccess = useCallback(
    async (result: ReportResponseDTO) => {
      setLastCombatResult(result);

      // Atualiza imediatamente o Boss atingido no estado local
      if (result.inimigo) {
        const updatedBoss = result.inimigo;
        setBairros((prev) =>
          prev.map((item) =>
            item.inimigo.id === updatedBoss.id
              ? { ...item, inimigo: updatedBoss }
              : item
          )
        );
      }

      // Sincroniza XP do jogador e estado atualizado do mapa em paralelo
      await Promise.allSettled([
        refreshUser(),
        loadBairros(),
        filtroMapa !== "TODOS" ? applyMapFilter(filtroMapa) : Promise.resolve(),
      ]);
    },
    [applyMapFilter, filtroMapa, loadBairros, refreshUser]
  );

  function switchAba(novaAba: AbaDenuncia) {
    setHighlightedReport(null);
    if (novaAba === "historico") {
      setIsLoadingHistory(true);
      setSearchParams({ aba: "historico" }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  function handleFocusReportOnMap(report: ReportResponseDTO) {
    setHighlightedReport(report);
    setCoordinates({ latitude: report.latitude, longitude: report.longitude });
    setFlyToKey((prev) => prev + 1);
  }

  return (
    <main id="denuncias-page">
      {/* Cabeçalho do Jogador e Abas Unificadas */}
      <section className="rounded-xl bg-white border border-[#c5cec7] p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-custom-primary text-white flex items-center justify-center text-xl shrink-0">
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-custom-primary">
                Central de Denúncias &amp; Combate
              </h1>
              <span className="badge bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs">
                <i className="fa-solid fa-star text-amber-500 mr-1"></i>
                {user?.xp ?? 0} XP
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              Olá, <strong>{user?.nome ?? user?.login}</strong>! Ajude a eliminar os focos de descarte irregular nos bairros de Canoas.
            </p>
          </div>
        </div>

        <div role="tablist" className="tabs tabs-boxed bg-base-200 p-1">
          <button
            type="button"
            role="tab"
            onClick={() => switchAba("nova")}
            className={`tab text-xs sm:text-sm font-semibold gap-1.5 ${
              abaAtiva === "nova" ? "tab-active !bg-custom-primary !text-white" : ""
            }`}
          >
            <i className="fa-solid fa-camera"></i>
            Nova Denúncia
          </button>
          <button
            type="button"
            role="tab"
            onClick={() => switchAba("historico")}
            className={`tab text-xs sm:text-sm font-semibold gap-1.5 ${
              abaAtiva === "historico"
                ? "tab-active !bg-custom-primary !text-white"
                : ""
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            Minhas Denúncias
          </button>
        </div>
      </section>

      {bossLoadError && (
        <div role="alert" className="alert alert-error text-sm py-3 text-white">
          <i className="fa-solid fa-circle-xmark"></i>
          <span>{bossLoadError}</span>
          <button
            type="button"
            onClick={() => void loadBairros()}
            className="btn btn-xs btn-outline text-white border-white"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Grid Principal: Formulário / Histórico à esquerda + Mapa de Bosses à direita */}
      <div className="denuncias-grid">
        <div className="denuncias-left-col">
          {abaAtiva === "nova" ? (
            <>
              {lastCombatResult && (
                <CombatResultCard
                  result={lastCombatResult}
                  onDismiss={() => setLastCombatResult(null)}
                />
              )}

              <ReportForm
                endereco={endereco}
                onChangeEndereco={setEndereco}
                coordinates={coordinates}
                onSelectLocation={(lat, lng, opts) => {
                  void handleSelectLocation(lat, lng, opts);
                }}
                detectedBairroNome={detectedBairroNome}
                targetBoss={targetBoss}
                isReverseGeocoding={isReverseGeocoding}
                onReportSuccess={handleReportSuccess}
              />
            </>
          ) : (
            <section className="rounded-xl border border-[#c5cec7] bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-custom-primary flex items-center gap-2">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    Histórico de Denúncias
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Registros enviados pela sua conta e avaliados pela IA
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  disabled={isLoadingHistory}
                  className="btn btn-xs btn-outline"
                >
                  <i className="fa-solid fa-rotate"></i>
                  Atualizar
                </button>
              </div>

              {historyError && (
                <div role="alert" className="alert alert-warning text-sm py-2.5">
                  <span>{historyError}</span>
                </div>
              )}

              {isLoadingHistory ? (
                <div className="py-10 flex flex-col items-center gap-2 text-gray-500">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <span className="text-sm">Carregando suas denúncias...</span>
                </div>
              ) : myReports.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <i className="fa-regular fa-folder-open text-3xl text-gray-400"></i>
                  <p className="text-sm text-gray-600">
                    Você ainda não registrou nenhuma denúncia.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchAba("nova")}
                    className="btn btn-sm btn-primary text-white"
                  >
                    Fazer primeira denúncia
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
                  {myReports.map((rep, index) => (
                    <article
                      key={`${rep.latitude}-${rep.longitude}-${index}`}
                      className="rounded-lg border border-gray-200 bg-gray-50/70 p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`badge badge-sm font-semibold ${
                            rep.valido
                              ? "badge-success text-green-950"
                              : "badge-error text-white"
                          }`}
                        >
                          {rep.valido ? "Validada" : "Rejeitada pela IA"}
                        </span>

                        {rep.valido && rep.dano > 0 && (
                          <span className="text-xs font-bold text-red-700">
                            -{rep.dano} HP / +{rep.dano} XP
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
                        <span>
                          <strong>Categoria:</strong>{" "}
                          {CATEGORIA_LABELS[rep.categoria] ?? rep.categoria}
                        </span>
                        <span>
                          <strong>Severidade:</strong> {rep.severidade}
                        </span>
                        {rep.inimigo && (
                          <span>
                            <strong>Alvo:</strong> {rep.inimigo.nome} (
                            {rep.inimigo.bairro})
                          </span>
                        )}
                      </div>

                      {rep.justificativaIa && (
                        <p className="text-xs text-gray-600 italic">
                          &ldquo;{rep.justificativaIa}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-500">
                          {rep.latitude.toFixed(4)}, {rep.longitude.toFixed(4)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFocusReportOnMap(rep)}
                          className="btn btn-xs btn-ghost text-custom-primary"
                        >
                          <i className="fa-solid fa-location-dot"></i>
                          Ver no mapa
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="denuncias-right-col">
          <BossesMap
            bairros={bairros}
            visibleBossIds={visibleBossIds}
            filtro={filtroMapa}
            onChangeFiltro={(novo) => {
              void applyMapFilter(novo);
            }}
            isLoadingBosses={isLoadingBosses}
            selectedPosition={coordinates}
            selectedBairroNome={detectedBairroNome}
            flyToKey={flyToKey}
            onSelectCoordinates={(lat, lng) => {
              void handleSelectLocation(lat, lng);
            }}
            highlightedReport={highlightedReport}
          />
        </div>
      </div>
    </main>
  );
}
