import React, { useState } from 'react';
import { Aquario } from '../../domain/models';

interface AquarioModalProps {
  aquario: Aquario;
  aquarios: Aquario[];
  onSelectAquario: (id: string) => void;
  onSaveAquario: (aq: Aquario) => void;
  onClose: () => void;
  onOpenEquipamentos?: () => void;
}

export const AquarioModal: React.FC<AquarioModalProps> = ({
  aquario,
  aquarios,
  onSelectAquario,
  onSaveAquario,
  onClose,
  onOpenEquipamentos
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(aquario.nome);
  const [dataMontagem, setDataMontagem] = useState(aquario.data_montagem);
  const [volumeDisplay, setVolumeDisplay] = useState(aquario.volume_display.toString());
  const [volumeSistema, setVolumeSistema] = useState(aquario.volume_sistema.toString());
  const [tipoSistema, setTipoSistema] = useState(aquario.tipo_sistema);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAquario({
      ...aquario,
      nome,
      data_montagem: dataMontagem,
      volume_display: parseFloat(volumeDisplay) || 0,
      volume_sistema: parseFloat(volumeSistema) || 0,
      tipo_sistema: tipoSistema
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#273741] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#77dcce] text-[22px]">tune</span>
            <h2 className="font-sans text-[16px] font-semibold text-[#d3e5f2]">
              Configurações do Aquário
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#bdc9c6] hover:text-[#d3e5f2] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Seletor de Aquário caso existam múltiplos */}
          {aquarios.length > 1 && (
            <div>
              <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                Alternar Aquário Ativo
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {aquarios.map(aq => (
                  <button
                    key={aq.id}
                    onClick={() => onSelectAquario(aq.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                      aq.id === aquario.id
                        ? 'bg-[#1c2c35] border-[#77dcce] text-[#77dcce]'
                        : 'bg-[#0d1d26] border-[#273741] text-[#d3e5f2]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold block">{aq.nome}</span>
                      <span className="text-xs text-[#bdc9c6]">
                        {aq.tipo_sistema} • {aq.volume_sistema}L
                      </span>
                    </div>
                    {aq.id === aquario.id && (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modo Edição vs Visualização */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Nome do Aquário
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-sm text-[#d3e5f2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                    Display (Litros)
                  </label>
                  <input
                    type="number"
                    value={volumeDisplay}
                    onChange={e => setVolumeDisplay(e.target.value)}
                    required
                    className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-sm text-[#d3e5f2] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                    Sistema Total (Sump)
                  </label>
                  <input
                    type="number"
                    value={volumeSistema}
                    onChange={e => setVolumeSistema(e.target.value)}
                    required
                    className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-sm text-[#d3e5f2] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Tipo de Sistema
                </label>
                <select
                  value={tipoSistema}
                  onChange={e => setTipoSistema(e.target.value as any)}
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-sm text-[#d3e5f2] outline-none"
                >
                  <option value="SPS">SPS Dominant</option>
                  <option value="LPS">LPS Dominant</option>
                  <option value="Misto (SPS/LPS)">Misto (SPS/LPS)</option>
                  <option value="Soft">Soft Corals</option>
                  <option value="Fish Only">Fish Only (FOWLR)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Data de Montagem
                </label>
                <input
                  type="date"
                  value={dataMontagem}
                  onChange={e => setDataMontagem(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-sm text-[#d3e5f2] outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1c2c35] text-[#d3e5f2] font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#77dcce] text-[#003732] font-semibold text-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="bg-[#0d1d26] border border-[#273741] rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#bdc9c6]">Identificação:</span>
                  <span className="font-semibold text-sm text-[#d3e5f2]">{aquario.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#bdc9c6]">Tipo de Sistema:</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1c2c35] text-[#77dcce]">
                    {aquario.tipo_sistema}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#bdc9c6]">Volume Total:</span>
                  <span className="font-mono text-xs text-[#d3e5f2]">
                    {aquario.volume_sistema} Litros ({aquario.volume_display}L display)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#bdc9c6]">Montado em:</span>
                  <span className="font-mono text-xs text-[#bdc9c6]">{aquario.data_montagem}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 rounded-lg bg-[#1c2c35] hover:bg-[#273741] text-[#77dcce] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Editar Dados do Aquário</span>
              </button>

              {onOpenEquipamentos && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEquipamentos();
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#0d1d26] hover:bg-[#1c2c35] border border-[#273741] text-[#8bcff2] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">build</span>
                  <span>Gerenciar Hardware & Equipamentos</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
