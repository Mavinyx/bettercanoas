import { CATEGORIA_LABELS, type ReportResponseDTO } from "../types/denuncia";

interface CombatResultCardProps {
  result: ReportResponseDTO;
  onDismiss: () => void;
}

export default function CombatResultCard({
  result,
  onDismiss,
}: CombatResultCardProps) {
  const inimigo = result.inimigo;
  const bossDefeated =
    inimigo?.statusInimigo === "DERROTADO" || (inimigo?.hpAtual ?? 1) <= 0;
  const hpPct =
    inimigo && inimigo.hpMaximo > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((inimigo.hpAtual / inimigo.hpMaximo) * 100))
        )
      : 0;

  return (
    <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50/90 p-5 shadow-md space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0">
            <i
              className={
                bossDefeated ? "fa-solid fa-trophy" : "fa-solid fa-bolt"
              }
            ></i>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              {bossDefeated
                ? "Boss Derrotado! Bairro Pacificado!"
                : "Denúncia Validada pela IA"}
            </span>
            <h3 className="text-lg font-extrabold text-gray-900">
              Você causou -{result.dano} HP de dano!
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-ghost btn-xs btn-circle"
          aria-label="Fechar resultado"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2.5 border border-emerald-200">
          <span className="text-gray-500 block">Categoria (IA)</span>
          <strong className="text-gray-900 text-sm">
            {CATEGORIA_LABELS[result.categoria] ?? result.categoria}
          </strong>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-emerald-200">
          <span className="text-gray-500 block">Severidade</span>
          <strong className="text-gray-900 text-sm">
            Nível {result.severidade}
          </strong>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-emerald-200 col-span-2 sm:col-span-1">
          <span className="text-gray-500 block">Recompensa</span>
          <strong className="text-emerald-700 text-sm">
            +{result.dano} XP
          </strong>
        </div>
      </div>

      {result.justificativaIa && (
        <p className="text-xs text-gray-700 bg-white/80 rounded-lg p-3 border border-emerald-200">
          <strong className="text-gray-900">Análise da IA: </strong>
          {result.justificativaIa}
        </p>
      )}

      {inimigo && (
        <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-800">
              <i className="fa-solid fa-skull mr-1 text-red-600"></i>
              {inimigo.nome} ({inimigo.bairro})
            </span>
            <span className="font-semibold text-gray-700">
              {inimigo.hpAtual} / {inimigo.hpMaximo} HP
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                bossDefeated ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-sm btn-primary text-white"
        >
          Nova Denúncia
        </button>
      </div>
    </div>
  );
}
