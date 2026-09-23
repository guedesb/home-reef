import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Aquario, Manutencao } from '../../../domain/models';

interface NovaManutencaoModalProps {
  aquario: Aquario;
  onClose: () => void;
  onSaved: (manutencao: Manutencao) => void;
  manutencaoParaEditar?: Manutencao | null;
}

const TIPOS_MANUTENCAO = [
  { id: 'TPA', label: 'TPA (Troca Parcial de Água)', icon: 'water_drop', isTpa: true },
  { id: 'Limpeza de Skimmer', label: 'Limpeza do Copo / Bomba do Skimmer', icon: 'cleaning_services', isTpa: false },
  { id: 'Troca de Perlon/Meia', label: 'Troca de Perlon / Meia Filtrante', icon: 'filter_alt', isTpa: false },
  { id: 'Troca de Carvão/Resina', label: 'Troca de Carvão Ativado / Resina DI', icon: 'grain', isTpa: false },
  { id: 'Calibração de Sonda', label: 'Calibração de Sonda (pH / Salinidade)', icon: 'tune', isTpa: false },
  { id: 'Limpeza de Bombas', label: 'Limpeza de Bombas de Circulação (Vinagre/Ácido)', icon: 'waves', isTpa: false },
  { id: 'Outro', label: 'Outro Procedimento Operacional', icon: 'build', isTpa: false }
];

export const NovaManutencaoModal: React.FC<NovaManutencaoModalProps> = ({
  aquario,
  onClose,
  onSaved,
  manutencaoParaEditar
}) => {
  const [tipo, setTipo] = useState<string>(manutencaoParaEditar?.tipo || 'TPA');
  const [dataHora, setDataHora] = useState<string>(
    manutencaoParaEditar?.data
      ? manutencaoParaEditar.data.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [descricao, setDescricao] = useState<string>(manutencaoParaEditar?.descricao || '');
  
  // Específicos para TPA
  const [volumeTpa, setVolumeTpa] = useState<string>(
    manutencaoParaEditar?.volume_tpa ? String(manutencaoParaEditar.volume_tpa) : '40'
  );
  const [salMarca, setSalMarca] = useState<string>(
    manutencaoParaEditar?.sal_marca || 'Tropic Marin Pro Reef'
  );
  const [salinidadePrep, setSalinidadePrep] = useState<string>(
    manutencaoParaEditar?.salinidade_preparada ? String(manutencaoParaEditar.salinidade_preparada) : '1.025'
  );

  const isTpa = tipo === 'TPA';
  const volNum = parseFloat(volumeTpa) || 0;
  const percSistema = aquario.volume_sistema > 0 ? (volNum / aquario.volume_sistema) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    if (manutencaoParaEditar) {
      const atualizada: Manutencao = {
        ...manutencaoParaEditar,
        tipo,
        data: dataHora,
        descricao: descricao.trim(),
        volume_tpa: isTpa ? volNum : null,
        sal_marca: isTpa ? salMarca.trim() || undefined : undefined,
        salinidade_preparada: isTpa ? parseFloat(salinidadePrep) || undefined : undefined
      };
      LocalDatabase.updateManutencao(atualizada);
      onSaved(atualizada);
    } else {
      const nova: Manutencao = LocalDatabase.addManutencao({
        aquario_id: aquario.id,
        tipo,
        data: dataHora,
        descricao: descricao.trim(),
        volume_tpa: isTpa ? volNum : null,
        sal_marca: isTpa ? salMarca.trim() || undefined : undefined,
        salinidade_preparada: isTpa ? parseFloat(salinidadePrep) || undefined : undefined
      });
      onSaved(nova);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-3.5 border-b border-[#273741] flex items-center justify-between bg-[#0d1d26]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#77dcce]/10 border border-[#77dcce]/30 flex items-center justify-center text-[#77dcce]">
              <span className="material-symbols-outlined text-[16px]">build</span>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                Registrar Manutenção
              </h3>
              <p className="text-[11px] text-[#879390]">
                {aquario.nome} ({aquario.volume_sistema}L)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#bdc9c6] hover:text-[#d3e5f2] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* Tipo de Manutenção */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1.5">
              Tipo de Procedimento
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <select
                value={tipo}
                onChange={e => {
                  const sel = e.target.value;
                  setTipo(sel);
                  if (sel === 'Limpeza de Skimmer' && !descricao) {
                    setDescricao('Esvaziamento do copo, limpeza do pescoço e verificação do venturi.');
                  } else if (sel === 'Troca de Perlon/Meia' && !descricao) {
                    setDescricao('Substituição do perlon mecânico no overflow.');
                  } else if (sel === 'TPA' && !descricao) {
                    setDescricao('Troca de água com sifonagem suave de detritos no fundo do sump.');
                  }
                }}
                className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none"
              >
                {TIPOS_MANUTENCAO.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção Exclusiva da TPA */}
          {isTpa && (
            <div className="bg-[#0d1d26] border border-[#273741] rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#1c2c35] pb-2">
                <span className="font-mono text-[10px] text-[#77dcce] uppercase font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">water_drop</span>
                  Parâmetros da TPA
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#77dcce]/10 text-[#77dcce] font-semibold">
                  {percSistema.toFixed(1)}% do Sistema
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                    Volume da TPA (L)
                  </label>
                  <div className="bg-[#011019] border border-[#273741] rounded px-2.5 py-1.5 flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={volumeTpa}
                      onChange={e => setVolumeTpa(e.target.value)}
                      className="w-full bg-transparent font-mono text-sm text-[#d3e5f2] outline-none"
                    />
                    <span className="font-mono text-xs text-[#879390] ml-1">L</span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                    Salinidade da Água Nova
                  </label>
                  <div className="bg-[#011019] border border-[#273741] rounded px-2.5 py-1.5 flex items-center">
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={salinidadePrep}
                      onChange={e => setSalinidadePrep(e.target.value)}
                      className="w-full bg-transparent font-mono text-sm text-[#d3e5f2] outline-none"
                    />
                    <span className="font-mono text-xs text-[#879390] ml-1">sg</span>
                  </div>
                </div>
              </div>

              {/* Botões Rápidos de Volume de TPA */}
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: '10% (35L)', vol: Math.round(aquario.volume_sistema * 0.1) },
                  { label: '15% (50L)', vol: Math.round(aquario.volume_sistema * 0.15) },
                  { label: '20% (70L)', vol: Math.round(aquario.volume_sistema * 0.2) }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setVolumeTpa(preset.vol.toString())}
                    className="flex-1 py-1 rounded bg-[#1c2c35] hover:bg-[#273741] border border-[#273741] text-[10px] font-mono text-[#8bcff2] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Marca do Sal Utilizado
                </label>
                <input
                  type="text"
                  value={salMarca}
                  onChange={e => setSalMarca(e.target.value)}
                  placeholder="Ex: Tropic Marin Pro Reef, Red Sea Blue Bucket..."
                  className="w-full bg-[#011019] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none"
                />
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
              Data e Hora da Operação
            </label>
            <input
              type="datetime-local"
              required
              value={dataHora}
              onChange={e => setDataHora(e.target.value)}
              className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none font-mono"
            />
          </div>

          {/* Descrição / Observações */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
              Descrição Detalhada do Procedimento
            </label>
            <textarea
              rows={3}
              required
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder="Descreva o que foi realizado, limpeza das mídias, bombas, refratômetro, etc..."
              className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg p-2.5 text-xs text-[#d3e5f2] outline-none resize-none"
            />
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-[#1c2c35] hover:bg-[#273741] text-[#d3e5f2] font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-[#77dcce] hover:bg-[#5ac0b3] active:scale-[0.98] text-[#003732] font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>Salvar Registro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
