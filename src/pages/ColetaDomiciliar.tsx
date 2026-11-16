import BairroData from "../data/bairros.json"
import type { Bairro, TipoColeta } from "../types/index.ts"
import CardColetaDom from "../components/CardColetaDom";
import { useState } from "react";
import "../css/pages/coleta-domiciliar.css";
export default function ColetaDomiciliar(){
    const bairros: Bairro[] = BairroData as Bairro[];
    const [busca, setBusca] = useState("");
    const [sugestoes,setSugestoes] = useState(false);

    const [tipoColeta, setTipoColeta] = useState<TipoColeta>("seletiva");
    const bairrosFiltrados = bairros.filter((bairro)=>
        bairro.nome.toLowerCase().includes(busca.toLowerCase())
    )
    const [bairroSelecionado, setBairro] = useState<Bairro | null>(null);
    const turnosSelecionados = bairroSelecionado
        ? tipoColeta === "seletiva"
            ? bairroSelecionado.turnoSeletiva
            : bairroSelecionado.turnoOrganica
        : null;
    console.log(turnosSelecionados);
    return (
        <main className="coleta-page">
            <section className="coleta-info rounded-box border border-custom-secondary bg-base-100/80 p-6 shadow-lg">
                <div className="flex flex-col gap-2 items-center text-center text-custom-primary">
                    <i className="fa-solid fa-truck text-3xl font-bold"></i>
                    <h2 className="text-3xl font-bold">Coleta {tipoColeta === "seletiva" ? "Seletiva" : "Orgânica"}</h2>  
                    <p>Consulte os horários oficiais do recolhimento domiciliar e seletivo no seu bairro!</p> 
                </div>

                
                <label htmlFor="tipo-coleta">Tipo de coleta</label>
                <select
                    id="tipo-coleta"
                    value={tipoColeta}
                    onChange={(event) => setTipoColeta(
                        event.target.value === "organica" ? "organica" : "seletiva"
                    )}
                    className="select border-custom-secondary bg-base-100"
                >
                    <option value="seletiva">Coleta seletiva</option>
                    <option value="organica">Lixo orgânico</option>
                </select>

                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Digite o nome do seu Bairro"
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                        onFocus={() => setSugestoes(true)}
                        className="input input-bordered w-full bg-base-100 border-custom-secondary focus:outline-none focus:border-custom-primary"
                    />

                    {sugestoes && busca.trim() !== "" && (
                        <ul className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-box border border-custom-secondary bg-base-100 p-1 shadow-xl">
                            {bairrosFiltrados.length > 0 ? bairrosFiltrados.map((bairro) => (
                                <li key={bairro.id}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBusca(bairro.nome)
                                            setSugestoes(false)
                                        }}
                                        className="w-full rounded-md px-3 py-2 text-left text-sm text-custom-primary transition-colors hover:bg-custom-secondary/70 "
                                    >
                                        <i className="fa-solid fa-location-dot mr-2 text-custom-primary/70"></i>
                                        {bairro.nome}
                                    </button>
                                </li>
                            )) : (
                                <li className="px-3 py-2 text-sm text-custom-primary/70">Nenhum bairro encontrado</li>
                            )}
                        </ul>
                    )}
                </div>
                <div className="mt-12 flex flex-col gap-4">
                    <p className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-2 font-semibold text-amber-950">
                        <i className="fa-solid fa-sun"></i>Turno Diurno
                        <span className="ml-auto rounded-full bg-amber-500 px-2 py-1 text-amber-950/70">07:00 às 15:20</span>
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-800/70 px-3 py-2 font-semibold text-white">
                        <i className="fa-solid fa-moon"></i>Turno Noturno
                        <span className="ml-auto rounded-full bg-blue-950 px-2 py-1 text-blue-100/70">16:00 às 00:20</span>
                    </p>
                </div>
            </section>
            <div className="coleta-bairros-grid rounded-box p-2">
            {bairrosFiltrados.length >0 ? (bairrosFiltrados.map((bairro)=>(
                <CardColetaDom 
                key={bairro.id} 
                bairro={bairro} 
                tipoColeta={tipoColeta}
                onSelecionar={setBairro}
                />
            ))
            ):(<p>nenhum encontrado</p>)}
            </div>
            <dialog open={Boolean(bairroSelecionado)} className="modal">
                <div className="modal-box relative border border-custom-secondary bg-base-100 shadow-xl">
                    <button
                        type="button"
                        onClick={() => setBairro(null)}
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        aria-label="Fechar diálogo"
                    >
                        ✕
                    </button>
                    <h2 className="mb-4 text-2xzl font-bold text-custom-primary">
                        Turnos de coleta: {bairroSelecionado?.nome}
                    </h2>
                    <div className="space-y-3">
                        {turnosSelecionados && Object.entries(turnosSelecionados).length > 0 ? (
                            Object.entries(turnosSelecionados).map(([dia, turnos]) => (
                                <div key={dia} className="flex items-center justify-between gap-4 border-b border-custom-secondary py-2 last:border-b-0">
                                    <span className="font-semibold text-custom-primary">{dia}</span>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {turnos.map((turno) => (
                                            <span key={turno} className="badge badge-outline border-custom-primary text-custom-primary">
                                                {turno}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-custom-primary/70">Não há turnos cadastrados para este tipo de coleta.</p>
                        )}
                    </div>
                </div>
            </dialog>
        </main>
    )
}
