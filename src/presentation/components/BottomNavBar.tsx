import React from 'react';

export type TabType = 'inicio' | 'parametros' | 'timeline' | 'animais' | 'equipamentos' | 'diario';

interface BottomNavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

/**
 * Barra inferior móvel fiel ao wireframe original com as 4 abas primárias:
 * Início, Parâmetros, Timeline e Animais.
 * 
 * Totalmente responsiva para telas ultra-estreitas (iPhone SE ~320px):
 * - Usa flex-1 min-w-0 (eliminando o w-16 fixo de 64px que causava overflow horizontal)
 * - 4 abas em 320px garantem generosos 80px por botão (área de toque > 48px WCAG)
 * - Mapeamento contextual inteligente: 'diario' destaca 'timeline', 'equipamentos' destaca 'inicio'
 */
export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs: Array<{ id: 'inicio' | 'parametros' | 'timeline' | 'animais'; label: string; icon: string }> = [
    { id: 'inicio', label: 'Início', icon: 'dashboard' },
    { id: 'parametros', label: 'Parâmetros', icon: 'speed' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
    { id: 'animais', label: 'Animais', icon: 'set_meal' }
  ];

  // Identifica a aba primária correspondente para manter o estado visual coerente
  const effectiveActiveTab = activeTab === 'diario' ? 'timeline' : activeTab === 'equipamentos' ? 'inicio' : activeTab;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#04151e]/95 backdrop-blur-xl border-t border-[#1c2c35] shadow-[0_-2px_12px_rgba(0,0,0,0.4)]">
      <div className="flex items-stretch justify-around h-16 w-full max-w-md mx-auto px-1 pb-[env(safe-area-inset-bottom,0px)]">
        {tabs.map(tab => {
          const isActive = effectiveActiveTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full py-1 transition-all relative group select-none ${
                isActive ? 'text-[#77dcce]' : 'text-[#879390] hover:text-[#d3e5f2]'
              }`}
            >
              {/* Indicador superior sutil da aba ativa */}
              {isActive && (
                <span className="absolute top-0 inset-x-2 sm:inset-x-4 h-0.5 bg-[#77dcce] rounded-full shadow-[0_0_8px_#77dcce]" />
              )}
              <span
                className="material-symbols-outlined text-[22px] transition-transform group-active:scale-90"
                style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
              >
                {tab.icon}
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] tracking-tight uppercase font-medium mt-0.5 truncate max-w-full px-0.5 text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
