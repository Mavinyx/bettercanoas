
import BarraBusca from '../components/BarraBusca.tsx'
import PontosColeta from '../data/pontos-coleta.json'
import type {PontoColeta} from '../types/index.ts'
import { useState } from 'react'
import CardPontoColeta from '../components/CardPontoColeta.tsx'
import Map from '../components/Map.tsx'

import '../css/pages/home.css'
function Home(){
    const pontosColeta: PontoColeta[] = PontosColeta.map((ponto) => ({
        ...ponto,
        horarioFuncionamento: ponto.horario,
    }));
    const [bairroSelecionado, setBairroSelecionado] = useState('');
    const [materialSelecionado, setMaterialSelecionado] = useState('');
    const list = pontosColeta.filter((ponto) =>
        (!bairroSelecionado || ponto.bairrosProximos.includes(bairroSelecionado)) &&
        (!materialSelecionado || ponto.materiaisAceitos.includes(materialSelecionado))
    );
  
  //handlers
  const handleSelectBairro = (bairroId: string) => {
    setBairroSelecionado(bairroId);
  }
  const handleSelectMaterial = (materialId: string) => {
    setMaterialSelecionado(materialId);
  }

    return(
        <div id="home-container">
            <div id="busca-container">
                <section className="w-full h-auto rounded-lg border border-[#e08a7b] bg-[#f5b0a3]/50 p-6 shadow-md">
                    <h2 className="mb-4 text-[1.7rem] font-semibold text-[#8f493e]">
                       <i className="fa-solid fa-magnifying-glass"></i> Encontre um local
                    </h2>
                    <BarraBusca 
                    bairroSelecionado={bairroSelecionado}
                    materialSelecionado={materialSelecionado}
                    onSelectBairro={(bairroId) => {
                        handleSelectBairro(bairroId);
                    }}
                    onSelectMaterial={(materialId) => {
                        handleSelectMaterial(materialId);
                    }}
                    />
                </section>

                <div className="w-full max-w-4xl mx-auto px-4 my-6">
                    <h2 className="text-2xl font-bold mb-3 text-custom-primary">Pontos de Coleta Encontrados</h2>
                    
                    {list.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhum ponto encontrado para os filtros selecionados.</p>
                    ) : (
                    <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 scrollbar scrollbar-thumb-custom-quaternary">
                        {list.map((ponto) => (
                        <div key={ponto.id} className="snap-center shrink-0 w-80">
                            <CardPontoColeta ponto={ponto} />
                        </div>
                        ))}
                    </div>
                    )}
                </div>
            </div>
            <Map pontosColeta={list} />
         </div>
    )
}
export default Home;