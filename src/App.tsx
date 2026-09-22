import { useEffect, useState } from 'react';
import { LocalDatabase } from './data/database';
import { Aquario, Parametro } from './domain/models';
import { AquarioModal } from './presentation/components/AquarioModal';
import { BottomNavBar, TabType } from './presentation/components/BottomNavBar';
import { Header } from './presentation/components/Header';
import { AnimaisScreen } from './presentation/screens/animais/AnimaisScreen';
import { DiarioScreen } from './presentation/screens/diario/DiarioScreen';
import { InicioDashboardScreen } from './presentation/screens/inicio/InicioDashboardScreen';
import { DetalheParametroScreen } from './presentation/screens/parametros/DetalheParametroScreen';
import { NovaMedicaoScreen } from './presentation/screens/parametros/NovaMedicaoScreen';
import { ParametrosConsoleScreen } from './presentation/screens/parametros/ParametrosConsoleScreen';

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
        tempAtual={25.4}
        salinidadeAtual={1.025}
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

        {activeTab === 'animais' && <AnimaisScreen aquario={currentAquario} />}

        {activeTab === 'diario' && <DiarioScreen aquario={currentAquario} />}
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
        />
      )}
    </div>
  );
}
