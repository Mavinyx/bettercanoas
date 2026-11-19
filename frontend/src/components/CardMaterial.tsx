import type { Material } from "../types";

interface ICardMaterial {
    material: Material;
}

function CardMaterial({ material }: ICardMaterial) {
    return (
        <div className="card h-full w-full border border-base-300 bg-base-100 shadow-sm transition hover:shadow-md">
            <div className="card-body gap-3 p-4">
                <div className="flex items-center gap-2 text-xs uppercase">
                    <span
                        aria-hidden="true"
                        className="inline-block h-4 w-4 rounded-sm border border-base-300"
                        style={{ backgroundColor: material.corHex }}
                    />
                    <span>{material.corLixeira}</span>
                </div>
                <h2 className="card-title text-base font-bold text-custom-primary">{material.titulo}</h2>
                <p className="text-sm"><span className="font-semibold">Origem:</span> {material.origem}</p>
                <p className="text-sm"><span className="font-semibold">Composição:</span> {material.composicao}</p>
                <p className="text-sm"><span className="font-semibold">Orientação:</span> {material.orientacao}</p>
            </div>
        </div>
    );
}

export default CardMaterial;