import MaterialData from "../data/materiais.json"
import type { Material } from "../types"
import CardMaterial from "../components/CardMaterial";
import "../css/pages/guias.css";

export default function Guias() {
    const materiais: Material[] = MaterialData;

    return (
        <main className="guias-page">
            <div className="guias-panel">
                <header className="guias-header">
                    <h1 className="guias-title">Guias de descarte</h1>
                    <p className="guias-description">Saiba como descartar corretamente cada tipo de resíduo.</p>
                </header>

                <div className="guias-grid">
                    {materiais.map((material) => (
                        <CardMaterial key={material.id} material={material} />
                    ))}
                </div>
            </div>
        </main>
    )
}