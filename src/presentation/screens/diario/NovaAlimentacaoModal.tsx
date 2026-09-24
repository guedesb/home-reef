import React, { useMemo, useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Alimentacao, Animal, Aquario } from '../../../domain/models';

interface NovaAlimentacaoModalProps {
  aquario: Aquario;
  onClose: () => void;
  onSaved: (alimentacao: Alimentacao) => void;
  alimentacaoParaEditar?: Alimentacao | null;
  animalPreSelecionadoId?: string;
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
  alimentacaoParaEditar,
  animalPreSelecionadoId
}) => {
  const [dataHora, setDataHora] = useState(
    alimentacaoParaEditar?.data_hora
      ? alimentacaoParaEditar.data_hora.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [alimento, setAlimento] = useState(alimentacaoParaEditar?.alimento || '');
  const [quantidade, setQuantidade] = useState(alimentacaoParaEditar?.quantidade || '');
  const [observacao, setObservacao] = useState(alimentacaoParaEditar?.observacao || '');

  // Animais do aquário ativo para o vínculo N:N
  const animaisDoAquario = useMemo<Animal[]>(() => {
    return LocalDatabase.getAnimais(aquario.id);
  }, [aquario.id]);

  const [isGeral, setIsGeral] = useState<boolean>(
    alimentacaoParaEditar
      ? !alimentacaoParaEditar.animais_ids || alimentacaoParaEditar.animais_ids.length === 0
      : !animalPreSelecionadoId
  );

  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>(() => {
    if (alimentacaoParaEditar?.animais_ids && alimentacaoParaEditar.animais_ids.length > 0) {
      return alimentacaoParaEditar.animais_ids;
    }
    if (animalPreSelecionadoId) {
      return [animalPreSelecionadoId];
    }
    return [];
  });

  const toggleAnimal = (id: string) => {
    setSelectedAnimalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectByCategory = (categoria: string) => {
    const ids = animaisDoAquario.filter(a => a.categoria === categoria).map(a => a.id);
    setSelectedAnimalIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleSelectPreset = (item: { nome: string; qtd: string }) => {
    setAlimento(item.nome);
    setQuantidade(item.qtd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alimento.trim() || !quantidade.trim()) return;

    const alvosFinais = isGeral ? undefined : (selectedAnimalIds.length > 0 ? selectedAnimalIds : undefined);

    if (alimentacaoParaEditar) {
      const atualizada: Alimentacao = {
        ...alimentacaoParaEditar,
        data_hora: dataHora,
        alimento: alimento.trim(),
        quantidade: quantidade.trim(),
        observacao: observacao.trim() || undefined,
        animais_ids: alvosFinais
      };
      LocalDatabase.updateAlimentacao(atualizada);
      onSaved(atualizada);
    } else {
      const nova = LocalDatabase.addAlimentacao({
        aquario_id: aquario.id,
        data_hora: dataHora,
        alimento: alimento.trim(),
        quantidade: quantidade.trim(),
        observacao: observacao.trim() || undefined,
        animais_ids: alvosFinais
      });
      onSaved(nova);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="bg-[#11212b] border border-[#273741] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
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
              <p className="text-[10px] text-[#879390]">Dieta da fauna & nutrição de corais (Relação N:N)</p>
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

          {/* Vínculo N:N Alimentação ↔ Animais */}
          <div className="p-3 rounded-xl bg-[#0d1d26] border border-[#273741] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#77dcce] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">share</span>
                Destino da Alimentação
              </span>
              <span className="text-[10px] text-[#879390]">
                {isGeral ? 'Aquário Todo' : `${selectedAnimalIds.length} selecionado(s)`}
              </span>
            </div>

            {/* Alternância Geral vs Animais Específicos */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#04151e] rounded-lg border border-[#273741]">
              <button
                type="button"
                onClick={() => setIsGeral(true)}
                className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  isGeral
                    ? 'bg-[#1c2c35] text-[#77dcce] font-semibold shadow-sm'
                    : 'text-[#879390] hover:text-[#bdc9c6]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">public</span>
                Geral (Todo o tanque)
              </button>
              <button
                type="button"
                onClick={() => setIsGeral(false)}
                className={`py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  !isGeral
                    ? 'bg-[#1c2c35] text-[#77dcce] font-semibold shadow-sm'
                    : 'text-[#879390] hover:text-[#bdc9c6]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                Animais Específicos
              </button>
            </div>

            {/* Lista multi-seleção de animais quando não é geral */}
            {!isGeral && (
              <div className="space-y-2 pt-1">
                {animaisDoAquario.length === 0 ? (
                  <p className="text-[11px] text-[#879390] italic">
                    Nenhum animal cadastrado neste aquário para seleção.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      <span className="text-[10px] text-[#879390]">Atalhos:</span>
                      <button
                        type="button"
                        onClick={() => selectByCategory('peixe')}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#04151e] border border-[#273741] text-[#8bcff2] hover:bg-[#1c2c35]"
                      >
                        + Peixes
                      </button>
                      <button
                        type="button"
                        onClick={() => selectByCategory('coral')}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#04151e] border border-[#273741] text-[#77dcce] hover:bg-[#1c2c35]"
                      >
                        + Corais
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAnimalIds([])}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#04151e] border border-[#273741] text-[#879390] hover:text-[#ffb4ab]"
                      >
                        Limpar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {animaisDoAquario.map(an => {
                        const isChecked = selectedAnimalIds.includes(an.id);
                        return (
                          <button
                            key={an.id}
                            type="button"
                            onClick={() => toggleAnimal(an.id)}
                            className={`flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-colors ${
                              isChecked
                                ? 'bg-[#003732] border-[#77dcce] text-[#77dcce]'
                                : 'bg-[#04151e] border-[#273741] text-[#bdc9c6] hover:border-[#879390]'
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-1.5">
                              <p className="font-semibold truncate">{an.nome_popular}</p>
                              <p className="text-[9px] text-[#879390] truncate italic">{an.especie}</p>
                            </div>
                            <span className="material-symbols-outlined text-[16px] flex-shrink-0">
                              {isChecked ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
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
