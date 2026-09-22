import React from 'react';
import { Aquario } from '../../domain/models';

interface HeaderProps {
  aquario: Aquario;
  tempAtual?: number | null;
  salinidadeAtual?: number | null;
  onOpenSettings?: () => void;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  aquario,
  tempAtual = 25.4,
  onOpenSettings,
  showBack = false,
  onBack,
  title
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#04151e]/90 backdrop-blur-xl border-b border-[#1c2c35]">
      <div className="h-16 max-w-md mx-auto px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0d1d26] text-[#d3e5f2] hover:text-[#77dcce] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          ) : null}

          {/* Logo do Recife de Casa */}
          <div className="w-8 h-8 rounded-full bg-[#0d1d26] border border-[#273741] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#77dcce] text-[18px]">water</span>
          </div>

          <div className="flex flex-col min-w-0">
            {title ? (
              <h1 className="text-[15px] leading-[20px] text-[#d3e5f2] font-semibold tracking-tight truncate font-sans">
                {title}
              </h1>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] leading-[20px] text-[#d3e5f2] font-semibold truncate tracking-tight font-sans">
                    {aquario.nome}
                  </span>
                  <span className="font-mono text-[10px] text-[#bdc9c6] uppercase px-1.5 py-0.5 rounded bg-[#11212b] border border-[#273741]">
                    ({aquario.volume_sistema}L)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#77dcce] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#77dcce]"></span>
                  </span>
                  <span className="font-mono text-[11px] leading-[14px] text-[#77dcce] tracking-tight font-medium">
                    Online • {tempAtual !== null ? `${tempAtual}°C` : 'Monitorando'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#0d1d26] border border-[#273741] text-[#bdc9c6] hover:text-[#77dcce] active:scale-95 transition-all"
            title="Aquário / Configurações"
          >
            <span className="material-symbols-outlined text-[19px]">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#77dcce] text-[#003732] flex items-center justify-center font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
