import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { ApiError } from "../services/api";
import {
  getBrowserCoordinates,
  searchAddressInCanoas,
} from "../services/geocodingService";
import {
  isReportResponseDTO,
  reportService,
} from "../services/reportService";
import {
  CATEGORIA_LABELS,
  type AddressSuggestion,
  type InimigoDTO,
  type ReportResponseDTO,
} from "../types/denuncia";

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

interface ReportFormProps {
  endereco: string;
  onChangeEndereco: (value: string) => void;
  coordinates: { latitude: number; longitude: number } | null;
  onSelectLocation: (
    latitude: number,
    longitude: number,
    options?: {
      addressOverride?: string;
      flyTo?: boolean;
      skipReverseGeocode?: boolean;
    }
  ) => void;
  detectedBairroNome: string | null;
  targetBoss: InimigoDTO | null;
  isReverseGeocoding: boolean;
  onReportSuccess: (response: ReportResponseDTO) => Promise<void> | void;
}

export default function ReportForm({
  endereco,
  onChangeEndereco,
  coordinates,
  onSelectLocation,
  detectedBairroNome,
  targetBoss,
  isReverseGeocoding,
  onReportSuccess,
}: ReportFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [aiRejection, setAiRejection] = useState<ReportResponseDTO | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function updateImageSelection(file: File | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const nextUrl = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = nextUrl;
    setImagemFile(file);
    setPreviewUrl(nextUrl);
  }

  function validateAndSetFile(file: File | undefined) {
    setFormError(null);
    setAiRejection(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Selecione um arquivo de imagem válido (JPG, PNG ou WebP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormError("A imagem selecionada excede 15 MB. Escolha uma foto menor.");
      return;
    }

    updateImageSelection(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    validateAndSetFile(file);
  }

  async function handleUseCurrentLocation() {
    setFormError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLocatingGps(true);

    try {
      const pos = await getBrowserCoordinates();
      onSelectLocation(pos.latitude, pos.longitude, { flyTo: true });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Não foi possível obter sua localização pelo GPS."
      );
    } finally {
      setIsLocatingGps(false);
    }
  }

  async function handleSearchTypedAddress() {
    const query = endereco.trim();
    if (query.length < 3) {
      setFormError("Digite ao menos 3 caracteres para buscar o endereço em Canoas.");
      return;
    }

    setFormError(null);
    setIsSearchingAddress(true);

    try {
      const found = await searchAddressInCanoas(query);
      if (found.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        setFormError(
          "Endereço não encontrado em Canoas. Tente informar rua + bairro ou clique direto no mapa."
        );
        return;
      }

      if (found.length === 1) {
        applySuggestion(found[0]);
      } else {
        setSuggestions(found);
        setShowSuggestions(true);
        // Aplica o primeiro resultado no mapa imediatamente para facilitar, mantendo opções abertas
        onSelectLocation(found[0].latitude, found[0].longitude, {
          flyTo: true,
          skipReverseGeocode: true,
        });
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Falha ao localizar o endereço digitado."
      );
    } finally {
      setIsSearchingAddress(false);
    }
  }

  function applySuggestion(suggestion: AddressSuggestion) {
    setShowSuggestions(false);
    setSuggestions([]);
    setFormError(null);
    onSelectLocation(suggestion.latitude, suggestion.longitude, {
      addressOverride: suggestion.shortAddress || suggestion.displayName,
      flyTo: true,
      skipReverseGeocode: true,
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setAiRejection(null);

    if (!imagemFile) {
      setFormError("Anexe ou tire uma foto do descarte irregular antes de enviar.");
      return;
    }

    if (!endereco.trim()) {
      setFormError("Informe o endereço ou ponto de referência da denúncia.");
      return;
    }

    let finalCoords = coordinates;

    // Se o usuário apenas digitou o endereço sem clicar em "Buscar" ou no mapa, geocodifica automaticamente
    if (!finalCoords) {
      setIsSearchingAddress(true);
      try {
        const autoFound = await searchAddressInCanoas(endereco);
        if (autoFound.length > 0) {
          finalCoords = {
            latitude: autoFound[0].latitude,
            longitude: autoFound[0].longitude,
          };
          onSelectLocation(finalCoords.latitude, finalCoords.longitude, {
            flyTo: true,
            skipReverseGeocode: true,
          });
        }
      } catch {
        // Ignora erro aqui e cai na validação abaixo
      } finally {
        setIsSearchingAddress(false);
      }
    }

    if (!finalCoords) {
      setFormError(
        "Defina a localização usando o botão de GPS, buscando o endereço digitado ou clicando no mapa."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await reportService.createReport({
        endereco: endereco.trim(),
        latitude: finalCoords.latitude,
        longitude: finalCoords.longitude,
        imagem: imagemFile,
      });

      updateImageSelection(null);
      setSuggestions([]);
      setShowSuggestions(false);
      await onReportSuccess(response);
    } catch (err) {
      if (err instanceof ApiError && isReportResponseDTO(err.data)) {
        setAiRejection(err.data);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Erro inesperado ao enviar a denúncia. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isOutsideCanoas = Boolean(coordinates && !detectedBairroNome);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#c5cec7] bg-white p-5 sm:p-6 shadow-sm space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-custom-primary flex items-center gap-2">
          <i className="fa-solid fa-bullhorn"></i>
          Registrar Denúncia de Descarte
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Envie uma foto do foco de lixo em Canoas para causar dano ao Boss do bairro e ganhar XP.
        </p>
      </div>

      {formError && (
        <div role="alert" className="alert alert-warning text-sm py-3">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{formError}</span>
        </div>
      )}

      {aiRejection && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-950 space-y-1.5"
        >
          <div className="font-bold flex items-center gap-2 text-red-800">
            <i className="fa-solid fa-robot"></i>
            Denúncia não validada pela IA
          </div>
          <p>{aiRejection.justificativaIa}</p>
          {aiRejection.categoria && (
            <p className="text-xs text-red-700">
              Classificação detectada:{" "}
              <strong>
                {CATEGORIA_LABELS[aiRejection.categoria] ?? aiRejection.categoria}
              </strong>
            </p>
          )}
        </div>
      )}

      {/* 1. Upload de Imagem */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-800">
          1. Foto do local <span className="text-red-600">*</span>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isSubmitting}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={isSubmitting}
        />

        {!previewUrl ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? "border-custom-primary bg-custom-secondary/60"
                : "border-gray-300 hover:border-custom-primary bg-gray-50/70"
            }`}
          >
            <i className="fa-solid fa-cloud-arrow-up text-3xl text-custom-primary mb-2"></i>
            <p className="text-sm font-medium text-gray-800">
              Arraste uma imagem aqui ou clique para escolher
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG ou WebP (máx. 15 MB)
            </p>

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="btn btn-xs btn-outline border-custom-primary text-custom-primary"
                disabled={isSubmitting}
              >
                <i className="fa-solid fa-camera"></i>
                Usar câmera
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2.5">
            <div className="relative rounded-lg overflow-hidden bg-black/5 max-h-56 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Pré-visualização da denúncia"
                className="max-h-56 w-auto object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-gray-700 truncate max-w-[220px]">
                {imagemFile?.name} (
                {((imagemFile?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-xs btn-outline"
                  disabled={isSubmitting}
                >
                  Trocar foto
                </button>
                <button
                  type="button"
                  onClick={() => updateImageSelection(null)}
                  className="btn btn-xs btn-ghost text-red-600"
                  disabled={isSubmitting}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Localização: GPS + Digitação Manual */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="endereco-denuncia"
            className="block text-sm font-semibold text-gray-800"
          >
            2. Localização da denúncia <span className="text-red-600">*</span>
          </label>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocatingGps || isSubmitting}
            className="btn btn-xs sm:btn-sm bg-custom-secondary hover:bg-[#b8dfca] text-custom-primary border border-custom-primary/30 font-semibold"
          >
            {isLocatingGps ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Obtendo GPS...
              </>
            ) : (
              <>
                <i className="fa-solid fa-location-crosshairs"></i>
                Usar minha localização
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <div className="join w-full">
            <input
              id="endereco-denuncia"
              type="text"
              value={endereco}
              onChange={(e) => {
                onChangeEndereco(e.target.value);
                if (showSuggestions) {
                  setShowSuggestions(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearchTypedAddress();
                }
              }}
              placeholder="Digite rua, número e bairro (ou use o GPS / clique no mapa)"
              className="input input-bordered join-item w-full text-sm"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={handleSearchTypedAddress}
              disabled={isSearchingAddress || isSubmitting}
              className="btn btn-neutral join-item text-xs sm:text-sm"
              title="Buscar coordenadas a partir do endereço digitado"
            >
              {isSearchingAddress ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <i className="fa-solid fa-magnifying-glass"></i>
              )}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>

          {isReverseGeocoding && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="loading loading-dots loading-xs"></span>
              Consultando endereço aproximado para o ponto selecionado...
            </p>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="mt-1 rounded-lg border border-gray-300 bg-white shadow-lg divide-y divide-gray-100 max-h-52 overflow-y-auto z-20 relative">
              {suggestions.map((item, idx) => (
                <li key={`${item.latitude}-${item.longitude}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => applySuggestion(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-custom-secondary/40 transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-900">
                      {item.shortAddress}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {item.displayName}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Status das coordenadas + Bairro/Boss alvo */}
        {coordinates ? (
          <div
            className={`rounded-lg p-3 text-xs border ${
              isOutsideCanoas
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-[#f4faf6] border-[#bddbc8] text-gray-800"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-gray-600">
                <i className="fa-solid fa-map-pin mr-1 text-custom-primary"></i>
                Coordenadas: {coordinates.latitude.toFixed(5)},{" "}
                {coordinates.longitude.toFixed(5)}
              </span>

              {detectedBairroNome && (
                <span className="badge badge-sm bg-custom-primary text-white border-none">
                  Bairro: {detectedBairroNome}
                </span>
              )}
            </div>

            {isOutsideCanoas ? (
              <p className="mt-1.5 font-medium text-amber-800">
                <i className="fa-solid fa-circle-exclamation mr-1"></i>
                Este ponto parece estar fora dos bairros de Canoas. Clique em um bairro no mapa ao lado para corrigir.
              </p>
            ) : (
              targetBoss && (
                <div className="mt-2 pt-2 border-t border-[#d6eadf] flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Alvo no bairro:{" "}
                    <strong className="text-custom-primary">
                      {targetBoss.nome}
                    </strong>
                  </span>
                  <span className="font-semibold">
                    {targetBoss.statusInimigo === "DERROTADO" ||
                    targetBoss.hpAtual <= 0 ? (
                      <span className="text-emerald-700">
                        Boss já derrotado (0/{targetBoss.hpMaximo} HP)
                      </span>
                    ) : (
                      <span className="text-red-700">
                        HP: {targetBoss.hpAtual}/{targetBoss.hpMaximo}
                      </span>
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Dica: clique em <strong>Usar minha localização</strong>, digite o endereço e clique em <strong>Buscar</strong>, ou clique diretamente no mapa.
          </p>
        )}
      </div>

      {/* 3. Botão de Envio */}
      <button
        type="submit"
        disabled={isSubmitting || isOutsideCanoas}
        className="btn btn-primary w-full text-white font-semibold"
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Validando imagem com IA e atacando Boss...
          </>
        ) : (
          <>
            <i className="fa-solid fa-paper-plane"></i>
            Enviar Denúncia
          </>
        )}
      </button>
    </form>
  );
}
