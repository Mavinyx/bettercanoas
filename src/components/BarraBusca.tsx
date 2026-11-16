import BairroData from "../data/bairros.json";
import type {Bairro}  from "../types/index.ts";
import MateriaisData from '../data/materiais.json'
import type {Material} from '../types/index'

interface IBarraBuscaProps {
    bairroSelecionado: string;
    materialSelecionado: string;
    onSelectBairro: (bairroId: string) => void;
    onSelectMaterial: (materialId: string) => void;
}

function BarraBusca({
    bairroSelecionado,
    materialSelecionado,
    onSelectBairro,
    onSelectMaterial,
}: IBarraBuscaProps) {
    const bairros: Bairro[] = BairroData as Bairro[];
    const materiaisData: Material[] = MateriaisData as Material[];

    const handleBairroChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedBairroId = event.target.value;
        onSelectBairro(selectedBairroId);
    }
    const handleMaterialChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedMaterialId = event.target.value;
        onSelectMaterial(selectedMaterialId);
    }
    return ( 

    <div className="flex w-full flex-col gap-3">
        <div className="w-full min-w-0">
            <label htmlFor="select-bairro" className="mb-1 block text-lg font-medium text-custom-primary">Selecione um bairro:</label>
            <select id="select-bairro" className="select w-full bg-custom-tertiary text-base" value={bairroSelecionado} onChange={handleBairroChange}>
            <option value="">Todos os bairros</option>
                {bairros.map((bairro) => (
                    <option key={bairro.id} value={bairro.id}>
                        {bairro.nome}
                    </option>
                ))}
            </select>
        </div>
        <div className="w-full min-w-0">
            <label htmlFor="select-material" className="mb-1 block text-lg font-medium text-custom-primary">Selecione um tipo de material:</label>
            <select id="select-material" className="select w-full bg-custom-tertiary text-base" value={materialSelecionado} onChange={handleMaterialChange}>
                <option value="">Todos os materiais</option>
                    {materiaisData.map((material) => (
                        <option key={material.id} value={material.id}>
                            {material.titulo}
                        </option>
                    ))}
            </select>
        </div>
    </div>
    )
}
export default BarraBusca;