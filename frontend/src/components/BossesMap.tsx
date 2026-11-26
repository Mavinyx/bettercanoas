import "leaflet/dist/leaflet.css";
import "../css/components/bosses-map.css";
import { useEffect, useMemo } from "react";
import L, { type LeafletMouseEvent, type PathOptions } from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import {
  CANOAS_CENTER,
  getCanoasBairrosGeoJson,
  getPolygonCentroid,
  type BairroGeoFeature,
} from "../services/geocodingService";
import type {
  BairroBossDTO,
  FiltroBossMapa,
  InimigoDTO,
  ReportResponseDTO,
} from "../types/denuncia";

type GeoJsonDataProp = Parameters<typeof GeoJSON>[0]["data"];

interface BossesMapProps {
  bairros: BairroBossDTO[];
  visibleBossIds: Set<number> | null;
  filtro: FiltroBossMapa;
  onChangeFiltro: (filtro: FiltroBossMapa) => void;
  isLoadingBosses: boolean;
  selectedPosition: { latitude: number; longitude: number } | null;
  selectedBairroNome: string | null;
  flyToKey: number;
  onSelectCoordinates: (latitude: number, longitude: number) => void;
  highlightedReport?: ReportResponseDTO | null;
}

function MapInteractionController({
  selectedPosition,
  flyToKey,
  onSelectCoordinates,
}: {
  selectedPosition: { latitude: number; longitude: number } | null;
  flyToKey: number;
  onSelectCoordinates: (latitude: number, longitude: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(event: LeafletMouseEvent) {
      const lat = Number(event.latlng.lat.toFixed(6));
      const lng = Number(event.latlng.lng.toFixed(6));
      onSelectCoordinates(lat, lng);
    },
  });

  useEffect(() => {
    if (selectedPosition && flyToKey > 0) {
      map.flyTo(
        [selectedPosition.latitude, selectedPosition.longitude],
        Math.max(map.getZoom(), 15),
        { duration: 0.8 }
      );
    }
  }, [flyToKey, map, selectedPosition]);

  return null;
}

function getBossColor(inimigo: InimigoDTO | undefined): string {
  if (!inimigo) return "#94a3b8";
  if (inimigo.statusInimigo === "DERROTADO" || inimigo.hpAtual <= 0) {
    return "#22c55e";
  }
  const ratio =
    inimigo.hpMaximo > 0 ? inimigo.hpAtual / inimigo.hpMaximo : 1;
  if (ratio > 0.6) return "#ef4444";
  if (ratio > 0.25) return "#f97316";
  return "#eab308";
}

function createBossDivIcon(inimigo: InimigoDTO): L.DivIcon {
  const defeated =
    inimigo.statusInimigo === "DERROTADO" || inimigo.hpAtual <= 0;
  const ratio =
    inimigo.hpMaximo > 0
      ? Math.max(0, Math.min(100, Math.round((inimigo.hpAtual / inimigo.hpMaximo) * 100)))
      : 0;

  let pillModifier = "boss-badge__pill--active";
  let hpColor = "#f87171";
  let iconClass = "fa-solid fa-skull";

  if (defeated) {
    pillModifier = "boss-badge__pill--defeated";
    hpColor = "#4ade80";
    iconClass = "fa-solid fa-shield-heart";
  } else if (ratio <= 40) {
    pillModifier = "boss-badge__pill--weak";
    hpColor = "#fbbf24";
    iconClass = "fa-solid fa-fire";
  }

  const label = defeated ? "Limpo" : `${ratio}%`;

  const html = `
    <div class="boss-badge" title="${inimigo.nome} (${inimigo.bairro})">
      <span class="boss-badge__pill ${pillModifier}">
        <i class="${iconClass}"></i>
        <span>${label}</span>
      </span>
      <div class="boss-badge__hp-track">
        <div class="boss-badge__hp-fill" style="width:${defeated ? 100 : ratio}%;background:${hpColor};"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "boss-marker-icon",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -18],
  });
}

const reportPinIcon = L.divIcon({
  className: "report-pin-icon",
  html: `<div class="report-pin"><i class="fa-solid fa-location-crosshairs"></i></div>`,
  iconSize: [36, 36],
  iconAnchor: [0, 0],
  popupAnchor: [0, -34],
});

export default function BossesMap({
  bairros,
  visibleBossIds,
  filtro,
  onChangeFiltro,
  isLoadingBosses,
  selectedPosition,
  selectedBairroNome,
  flyToKey,
  onSelectCoordinates,
  highlightedReport,
}: BossesMapProps) {
  const geoJsonCollection = useMemo(() => getCanoasBairrosGeoJson(), []);

  const bossByBairroName = useMemo(() => {
    const map = new Map<string, BairroBossDTO>();
    for (const b of bairros) {
      map.set(b.nome.trim().toLowerCase(), b);
    }
    return map;
  }, [bairros]);

  const bossMarkers = useMemo(() => {
    return geoJsonCollection.features
      .map((feature: BairroGeoFeature) => {
        const bairroInfo = bossByBairroName.get(
          feature.properties.name.trim().toLowerCase()
        );
        if (!bairroInfo) return null;

        const isVisible =
          visibleBossIds === null || visibleBossIds.has(bairroInfo.inimigo.id);
        if (!isVisible) return null;

        const centroid = getPolygonCentroid(feature.geometry.coordinates);
        return {
          bairroInfo,
          centroid,
          icon: createBossDivIcon(bairroInfo.inimigo),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [bossByBairroName, geoJsonCollection.features, visibleBossIds]);

  const geoJsonRenderKey = useMemo(() => {
    const bossSignature = bairros
      .map((b) => `${b.id}:${b.inimigo.hpAtual}:${b.inimigo.statusInimigo}`)
      .join("|");
    const visibleSig =
      visibleBossIds === null
        ? "ALL"
        : Array.from(visibleBossIds).sort().join(",");
    return `${filtro}-${selectedBairroNome ?? "none"}-${visibleSig}-${bossSignature}`;
  }, [bairros, filtro, selectedBairroNome, visibleBossIds]);

  const styleFeature = (feature?: { properties?: { name?: string } }): PathOptions => {
    const featureName = feature?.properties?.name?.trim() ?? "";
    const bairroInfo = bossByBairroName.get(featureName.toLowerCase());
    const inimigo = bairroInfo?.inimigo;

    const isSelectedBairro =
      Boolean(selectedBairroNome) &&
      featureName.toLowerCase() === selectedBairroNome?.trim().toLowerCase();

    const isVisibleInFilter =
      !inimigo || visibleBossIds === null || visibleBossIds.has(inimigo.id);

    if (!isVisibleInFilter) {
      return {
        color: "#94a3b8",
        weight: 1,
        fillColor: "#cbd5e1",
        fillOpacity: 0.1,
      };
    }

    const baseColor = getBossColor(inimigo);
    return {
      color: isSelectedBairro ? "#192524" : baseColor,
      weight: isSelectedBairro ? 3.5 : 1.75,
      fillColor: baseColor,
      fillOpacity: isSelectedBairro ? 0.36 : 0.22,
    };
  };

  const totalAtivos = useMemo(
    () =>
      bairros.filter(
        (b) => b.inimigo.statusInimigo === "ATIVO" && b.inimigo.hpAtual > 0
      ).length,
    [bairros]
  );
  const totalDerrotados = bairros.length - totalAtivos;

  return (
    <div className="bosses-map-wrapper">
      <div className="bosses-map-toolbar">
        <div>
          <h2 className="text-base font-bold text-custom-primary flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot"></i>
            Mapa de Bosses por Bairro
          </h2>
          <p className="text-xs text-gray-600">
            Clique no mapa ou arraste o pino para ajustar o local exato da denúncia
          </p>
        </div>

        <div className="join">
          <button
            type="button"
            onClick={() => onChangeFiltro("TODOS")}
            className={`btn btn-xs sm:btn-sm join-item ${
              filtro === "TODOS" ? "btn-primary text-white" : "btn-ghost bg-base-200"
            }`}
          >
            Todos ({bairros.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeFiltro("ATIVOS")}
            className={`btn btn-xs sm:btn-sm join-item ${
              filtro === "ATIVOS" ? "btn-error text-white" : "btn-ghost bg-base-200"
            }`}
          >
            Ativos ({totalAtivos})
          </button>
          <button
            type="button"
            onClick={() => onChangeFiltro("DERROTADOS")}
            className={`btn btn-xs sm:btn-sm join-item ${
              filtro === "DERROTADOS"
                ? "btn-success text-custom-quinary"
                : "btn-ghost bg-base-200"
            }`}
          >
            Derrotados ({totalDerrotados})
          </button>
        </div>
      </div>

      <div className="relative">
        {isLoadingBosses && (
          <div className="absolute top-3 right-3 z-[500] badge badge-neutral gap-2 py-3 px-3 shadow">
            <span className="loading loading-spinner loading-xs"></span>
            Atualizando mapa...
          </div>
        )}

        <MapContainer
          center={CANOAS_CENTER}
          zoom={12}
          scrollWheelZoom={true}
          className="bosses-map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapInteractionController
            selectedPosition={selectedPosition}
            flyToKey={flyToKey}
            onSelectCoordinates={onSelectCoordinates}
          />

          <GeoJSON
            key={geoJsonRenderKey}
            data={geoJsonCollection as unknown as GeoJsonDataProp}
            style={styleFeature}
          />

          {bossMarkers.map(({ bairroInfo, centroid, icon }) => {
            const { inimigo } = bairroInfo;
            const hpPct =
              inimigo.hpMaximo > 0
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round((inimigo.hpAtual / inimigo.hpMaximo) * 100)
                    )
                  )
                : 0;
            const defeated =
              inimigo.statusInimigo === "DERROTADO" || inimigo.hpAtual <= 0;

            return (
              <Marker
                key={inimigo.id}
                position={centroid}
                icon={icon}
              >
                <Popup>
                  <div className="min-w-[210px] space-y-2 py-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {bairroInfo.nome}
                      </span>
                      <span
                        className={`badge badge-xs font-semibold ${
                          defeated
                            ? "badge-success text-green-950"
                            : "badge-error text-white"
                        }`}
                      >
                        {defeated ? "DERROTADO" : "ATIVO"}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 leading-tight">
                      {inimigo.nome}
                    </h3>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span>HP do Boss</span>
                        <span>
                          {inimigo.hpAtual} / {inimigo.hpMaximo} ({hpPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            defeated
                              ? "bg-green-500"
                              : hpPct > 60
                              ? "bg-red-500"
                              : hpPct > 25
                              ? "bg-orange-500"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelectCoordinates(
                          Number(centroid[0].toFixed(6)),
                          Number(centroid[1].toFixed(6))
                        )
                      }
                      className="btn btn-xs btn-primary text-white w-full mt-1"
                    >
                      <i className="fa-solid fa-crosshairs"></i>
                      Denunciar neste bairro
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {selectedPosition && (
            <Marker
              position={[selectedPosition.latitude, selectedPosition.longitude]}
              icon={reportPinIcon}
              draggable={true}
              eventHandlers={{
                dragend(event) {
                  const marker = event.target as L.Marker;
                  const pos = marker.getLatLng();
                  onSelectCoordinates(
                    Number(pos.lat.toFixed(6)),
                    Number(pos.lng.toFixed(6))
                  );
                },
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-custom-primary">
                    Local da sua denúncia
                  </p>
                  <p className="text-gray-600">
                    {selectedPosition.latitude.toFixed(5)},{" "}
                    {selectedPosition.longitude.toFixed(5)}
                  </p>
                  {selectedBairroNome && (
                    <p className="font-medium text-emerald-800">
                      Bairro: {selectedBairroNome}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {highlightedReport && (
            <Marker
              position={[highlightedReport.latitude, highlightedReport.longitude]}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold">
                    Denúncia ({highlightedReport.categoria})
                  </p>
                  <p>{highlightedReport.justificativaIa}</p>
                  {highlightedReport.dano > 0 && (
                    <p className="font-semibold text-red-700">
                      Dano causado: -{highlightedReport.dano} HP
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="bosses-map-legend">
        <span className="font-semibold">Legenda:</span>
        <span className="bosses-map-legend__item">
          <span
            className="bosses-map-legend__dot"
            style={{ background: "#ef4444" }}
          />
          Boss Ativo (&gt;60% HP)
        </span>
        <span className="bosses-map-legend__item">
          <span
            className="bosses-map-legend__dot"
            style={{ background: "#f97316" }}
          />
          Enfraquecido (25–60% HP)
        </span>
        <span className="bosses-map-legend__item">
          <span
            className="bosses-map-legend__dot"
            style={{ background: "#eab308" }}
          />
          Quase derrotado (&lt;25% HP)
        </span>
        <span className="bosses-map-legend__item">
          <span
            className="bosses-map-legend__dot"
            style={{ background: "#22c55e" }}
          />
          Bairro Limpo (Boss derrotado)
        </span>
      </div>
    </div>
  );
}
