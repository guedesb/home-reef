import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Alimentacao, Aquario } from '../../../domain/models';

interface NovaAlimentacaoModalProps {
  aquario: Aquario;
  onClose: () => void;
  onSaved: (alimentacao: Alimentacao) => void;
  alimentacaoParaEditar?: Alimentacao | null;
}

const ALIMENTOS_PREDEFINIDOS = [
  { nome: 'Mysis Congelado enriquecido', qtd: '1 cubo' },
  { nome: 'Fitoplâncton vivo concentrado', qtd: '10 ml' },
  { nome: 'Zooplâncton / Náuplios de Artêmia', qtd: '1 dose (5 ml)' },
  { nome: 'Ração Granulada Marinha (Spirulina & Garlic)', qtd: '1 pitada média' },
  { nome: 'Alga Nori Natural (Folha verde)', qtd: '1 tira (5x3 cm)' },
  { nome: 'Alimento Líquido para Corais (LPS/SPS)', qtd: '5 ml' },
  { nome: 'Artemia Salina descongelada', qtd: '1/2 cubo' }
];

export const NovaAlimentacaoModal: React.FC<NovaAlimentacaoModalProps> = ({
  aquario,
  onClose,
  onSaved,
  alimentacaoParaEditar
}) => {
  const [dataHora, setDataHora] = useState(
    alimentacaoParaEditar?.data_hora
      ? alimentacaoParaEditar.data_hora.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [alimento, setAlimento] = useState(alimentacaoParaEditar?.alimento || '');
  const [quantidade, setQuantidade] = useState(alimentacaoParaEditar?.quantidade || '');
  const [observacao, setObservacao] = useState(alimentacaoParaEditar?.observacao || '');

  const handleSelectPreset = (item: { nome: string; qtd: string }) => {
    setAlimento(item.nome);
    setQuantidade(item.qtd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alimento.trim() || !quantidade.trim()) return;

    if (alimentacaoParaEditar) {
      const atualizada: Alimentacao = {
        ...alimentacaoParaEditar,
        data_hora: dataHora,
        alimento: alimento.trim(),
        quantidade: quantidade.trim(),
        observacao: observacao.trim() || undefined
      };
      LocalDatabase.updateAlimentacao(atualizada);
      onSaved(atualizada);
    } else {
      const nova = LocalDatabase.addAlimentacao({
        aquario_id: aquario.id,
        data_hora: dataHora,
        alimento: alimento.trim(),
        quantidade: quantidade.trim(),
        observacao: observacao.trim() || undefined
      });
      onSaved(nova);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#273741] bg-[#0d1d26] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8bcff2]/10 text-[#8bcff2] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">restaurant</span>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                {alimentacaoParaEditar ? 'Editar Alimentação' : 'Registrar Alimentação'}
              </h3>
              <p className="text-[10px] text-[#879390]">Dieta da fauna & nutrição de corais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#1c2c35] text-[#bdc9c6] hover:text-[#d3e5f2] flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          {/* Data e Hora */}
          <div>
            <label className="block font-mono text-[9px] uppercase text-[#879390] mb-1">
              Data e Horário
            </label>
            <input
              type="datetime-local"
              required
              value={dataHora}
              onChange={e => setDataHora(e.target.value)}
              className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none font-mono"
            />
          </div>

          {/* Atalhos Rápidos de Dieta */}
          <div>
            <label className="block font-mono text-[9px] uppercase text-[#879390] mb-1.5">
              Alimentos Frequentes (Toque para preencher)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALIMENTOS_PREDEFINIDOS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(item)}
                  className={`text-left px-2 py-1 rounded-md text-[10px] border transition-colors ${
                    alimento === item.nome
                      ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-semibold'
                      : 'bg-[#0d1d26] border-[#273741] text-[#bdc9c6] hover:text-[#d3e5f2]'
                  }`}
                >
                  {item.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Nome do Alimento */}
          <div>
            <label className="block font-mono text-[9px] uppercase text-[#879390] mb-1">
              Alimento / Ração / Fitoplâncton
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mysis congelado enriquecido, Nori, Flakes..."
              value={alimento}
              onChange={e => setAlimento(e.target.value)}
              className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none"
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block font-mono text-[9px] uppercase text-[#879390] mb-1">
              Quantidade / Porção
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 1 cubo, 10 ml, 1 pitada, 1/2 folha..."
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none font-mono"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block font-mono text-[9px] uppercase text-[#879390] mb-1">
              Comportamento & Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Tangs e Palhaços aceitaram vorazmente; corais estenderam pólipos em seguida..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg p-2 text-xs text-[#d3e5f2] outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-[#1c2c35] text-xs font-semibold text-[#bdc9c6]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-[#77dcce] hover:bg-[#5ac0b3] text-[#003732] text-xs font-semibold shadow"
            >
              Salvar Alimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
