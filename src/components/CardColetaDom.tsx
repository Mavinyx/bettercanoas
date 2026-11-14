import type { Bairro, TipoColeta } from "../types";
interface ICardeColetaDom{
    bairro: Bairro;
    tipoColeta: TipoColeta;
    onSelecionar: (bairro: Bairro) => void;
}
function CardColetaDom({bairro, tipoColeta, onSelecionar}: ICardeColetaDom){
    const dias = tipoColeta === "seletiva" ? bairro.diasSeletiva : bairro.diasOrganica;
    const turnos = tipoColeta === "seletiva" ? bairro.turnoSeletiva : bairro.turnoOrganica;

    return(
        <div className="card h-46 w-full">
            <div className="card-body h-full bg-base-200/80 border border-custom-secondary rounded-box shadow-lg">
            <h2 className="text-xl font-semibold"> <i className="fa-solid fa-location-dot text-custom-primary"></i>{bairro.nome}</h2>
            <div className="flex flex-wrap gap-2" aria-label="Dias de coleta">
                {dias.length ? dias.map((dia) => (
                    <span
                        key={dia}
                        className="bg-custom-default rounded-md px-3 py-1 text-sm"
                    >
                        {dia}
                    </span>
                )) : (
                    <span className="bg-custom-default rounded-md px-3 py-1 text-sm">
                        A consultar
                    </span>
                )}
            </div>
            <button className="mt-auto text-custom-primary font-bold" onClick={() => onSelecionar(bairro)}>Clique para Consultar Turnos</button>
            </div>
        </div>
    )
}
export default CardColetaDom;