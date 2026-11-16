import MaterialData from "../data/materiais.json"
import type { Material } from "../types"
import CardMaterial from "../components/CardMaterial";
import "../css/pages/guias.css";

export default function Guias() {
    const materiais: Material[] = MaterialData;

    return (
        <main className="guias-page">
            <div className="guias-panel">
                <h1 className="text-center text-2xl font-bold text-custom-primary">Guias de descarte</h1>

                <div className="guias-grid">
                    {materiais.map((material) => (
                        <CardMaterial key={material.id} material={material} />
                    ))}
                </div>
            </div>
        </main>
    )
}