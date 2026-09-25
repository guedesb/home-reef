import { useEffect, useMemo, useState } from 'react';
import { LocalDatabase } from './data/database';
import { filtrarMedicoesAtivas } from './domain/analytics_engine';
import { Aquario, Parametro } from './domain/models';
import { AquarioModal } from './presentation/components/AquarioModal';
import { BottomNavBar, TabType } from './presentation/components/BottomNavBar';
import { Header } from './presentation/components/Header';
import { AnimaisScreen } from './presentation/screens/animais/AnimaisScreen';
import { EquipamentosScreen } from './presentation/screens/equipamentos/EquipamentosScreen';
import { InicioDashboardScreen } from './presentation/screens/inicio/InicioDashboardScreen';
import { DetalheParametroScreen } from './presentation/screens/parametros/DetalheParametroScreen';
import { NovaMedicaoScreen } from './presentation/screens/parametros/NovaMedicaoScreen';
import { ParametrosConsoleScreen } from './presentation/screens/parametros/ParametrosConsoleScreen';
import { LinhaDoTempoScreen } from './presentation/screens/timeline/LinhaDoTempoScreen';

export default function App() {
  // Inicialização local-first
  useEffect(() => {
    LocalDatabase.init();
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [aquarios, setAquarios] = useState<Aquario[]>(LocalDatabase.getAquarios());
  const [activeAquarioId, setActiveAquarioId] = useState<string>(LocalDatabase.getActiveAquarioId());
  const [parametros, setParametros] = useState<Parametro[]>(LocalDatabase.getParametros());

  // Navegação detalhada interna (sub-rotas)
  const [selectedParametro, setSelectedParametro] = useState<Parametro | null>(null);
  const [isNovaMedicaoOpen, setIsNovaMedicaoOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Forçar re-render após mutações de dados
  const [, setTick] = useState(0);
  const refreshData = () => {
    setAquarios(LocalDatabase.getAquarios());
    setParametros(LocalDatabase.getParametros());
    setTick(t => t + 1);
  };

  const currentAquario = aquarios.find(a => a.id === activeAquarioId) || aquarios[0];

  // Telemetria real em tempo de execução para o Header
  const { realTemp, realSal } = useMemo(() => {
    if (!currentAquario) return { realTemp: null, realSal: null };
    const medicoes = LocalDatabase.getMedicoes(currentAquario.id);
    const ativas = filtrarMedicoesAtivas(medicoes);
    
    const tempP = parametros.find(p => p.codigo === 'TEMP' || p.codigo === 'Temp' || p.nome.toLowerCase().includes('temperatura'));
    const salP = parametros.find(p => p.codigo === 'SAL' || p.codigo === 'Salinidade' || p.unidade_canonica === 'sg' || p.unidade_canonica === 'ppt');

    const ultT = tempP ? ativas.filter(m => m.parametro_id === tempP.id).pop() : null;
    const ultS = salP ? ativas.filter(m => m.parametro_id === salP.id).pop() : null;

    return {
      realTemp: ultT ? ultT.valor : null,
      realSal: ultS ? ultS.valor : null
    };
  }, [currentAquario, parametros, LocalDatabase]);

  const handleSelectAquario = (id: string) => {
    LocalDatabase.setActiveAquarioId(id);
    setActiveAquarioId(id);
    refreshData();
  };

  const handleSaveAquario = (aq: Aquario) => {
    LocalDatabase.saveAquario(aq);
    refreshData();
  };

  // Se estiver na tela de Nova Medição
  if (isNovaMedicaoOpen) {
    return (
      <div className="bg-[#04151e] min-h-screen">
        <Header
          aquario={currentAquario}
          title="Novo Teste (Multicanal)"
          showBack
          onBack={() => setIsNovaMedicaoOpen(false)}
        />
        <main className="pt-16 max-w-md mx-auto">
          <NovaMedicaoScreen
            aquario={currentAquario}
            parametros={parametros}
            onBack={() => setIsNovaMedicaoOpen(false)}
            onSaved={() => {
              setIsNovaMedicaoOpen(false);
              refreshData();
            }}
          />
        </main>
      </div>
    );
  }

  // Se estiver inspecionando um parâmetro específico (Gráficos, estatísticas, histórico imutável)
  if (selectedParametro) {
    return (
      <div className="bg-[#04151e] min-h-screen">
        <Header
          aquario={currentAquario}
          title={`Canal • ${selectedParametro.codigo}`}
          showBack
          onBack={() => setSelectedParametro(null)}
        />
        <main className="pt-16 max-w-md mx-auto">
          <DetalheParametroScreen
            aquario={currentAquario}
            parametro={selectedParametro}
            onBack={() => setSelectedParametro(null)}
            onRefresh={refreshData}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#04151e] min-h-screen text-[#d3e5f2] selection:bg-[#77dcce] selection:text-[#003732] flex flex-col">
      {/* Cabeçalho Fixo */}
      <Header
        aquario={currentAquario}
        tempAtual={realTemp}
        salinidadeAtual={realSal}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Conteúdo Principal com base na aba ativa */}
      <main className="flex-1 pt-16 max-w-md mx-auto w-full">
        {activeTab === 'inicio' && (
          <InicioDashboardScreen
            aquario={currentAquario}
            parametros={parametros}
            onOpenNovaMedicao={() => setIsNovaMedicaoOpen(true)}
            onSelectParametro={p => setSelectedParametro(p)}
            onNavigateToTab={tab => setActiveTab(tab)}
          />
        )}

        {activeTab === 'parametros' && (
          <ParametrosConsoleScreen
            aquario={currentAquario}
            parametros={parametros}
            onSelectParametro={p => setSelectedParametro(p)}
            onOpenNovaBateria={() => setIsNovaMedicaoOpen(true)}
          />
        )}

        {activeTab === 'timeline' && (
          <LinhaDoTempoScreen
            aquario={currentAquario}
            parametros={parametros}
            initialView="timeline"
            onOpenNovaMedicao={() => setIsNovaMedicaoOpen(true)}
          />
        )}

        {activeTab === 'animais' && <AnimaisScreen aquario={currentAquario} />}

        {activeTab === 'equipamentos' && (
          <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-3 py-2 bg-[#0d1d26] border-b border-[#273741] sticky top-14 z-20">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className="flex items-center gap-1 text-xs text-[#77dcce] hover:underline font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Voltar ao Início</span>
              </button>
              <span className="font-mono text-[10px] text-[#879390] uppercase tracking-wider">
                Setup & Hardware
              </span>
            </div>
            <EquipamentosScreen aquario={currentAquario} />
          </div>
        )}

        {activeTab === 'diario' && (
          <LinhaDoTempoScreen
            aquario={currentAquario}
            parametros={parametros}
            initialView="diario"
            onOpenNovaMedicao={() => setIsNovaMedicaoOpen(true)}
          />
        )}
      </main>

      {/* Barra de Navegação Inferior Fixa */}
      <BottomNavBar
        activeTab={activeTab}
        onChangeTab={tab => {
          setSelectedParametro(null);
          setIsNovaMedicaoOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* Modal de Configuração do Aquário */}
      {isSettingsOpen && (
        <AquarioModal
          aquario={currentAquario}
          aquarios={aquarios}
          onSelectAquario={handleSelectAquario}
          onSaveAquario={handleSaveAquario}
          onClose={() => setIsSettingsOpen(false)}
          onOpenEquipamentos={() => setActiveTab('equipamentos')}
        />
      )}
    </div>
  );
}
