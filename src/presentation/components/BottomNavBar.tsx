import React from 'react';

export type TabType = 'inicio' | 'parametros' | 'animais' | 'diario';

interface BottomNavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'inicio', label: 'Início', icon: 'dashboard' },
    { id: 'parametros', label: 'Parâmetros', icon: 'speed' },
    { id: 'animais', label: 'Animais', icon: 'set_meal' },
    { id: 'diario', label: 'Diário', icon: 'menu_book' }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#04151e]/95 backdrop-blur-xl border-t border-[#1c2c35] shadow-[0_-2px_12px_rgba(0,0,0,0.4)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-1 pb-safe">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center w-16 h-14 transition-colors gap-1 ${
                isActive ? 'text-[#77dcce]' : 'text-[#bdc9c6] hover:text-[#d3e5f2]'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="font-mono text-[10px] uppercase font-medium tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
