import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Aquario, Equipamento, EquipamentoHistorico } from '../../../domain/models';

interface EquipamentosScreenProps {
  aquario: Aquario;
}

const TIPOS_EQUIPAMENTO = [
  'Skimmer',
  'Iluminação',
  'Circulação',
  'Retorno',
  'Aquecimento / Resfriamento',
  'Dosadora',
  'Filtro / Reator',
  'Controlador / Sonda',
  'Reposição de Água (ATO)',
  'Outro'
];

export const EquipamentosScreen: React.FC<EquipamentosScreenProps> = ({ aquario }) => {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>(
    LocalDatabase.getEquipamentos(aquario.id)
  );
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null);
  const [historico, setHistorico] = useState<EquipamentoHistorico[]>([]);

  // Modais
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showNovoHistModal, setShowNovoHistModal] = useState(false);

  // Form novo equipamento
  const [tipo, setTipo] = useState(TIPOS_EQUIPAMENTO[0]);
  const [descricao, setDescricao] = useState('');

  // Form novo histórico
  const [dataAlteracao, setDataAlteracao] = useState(new Date().toISOString().slice(0, 10));
  const [textoAlteracao, setTextoAlteracao] = useState('');

  // Busca e filtro
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  const handleSelectEquipamento = (eq: Equipamento) => {
    setSelectedEquipamento(eq);
    setHistorico(LocalDatabase.getEquipamentoHistorico(eq.id));
  };

  const handleSalvarEquipamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    const novo = LocalDatabase.addEquipamento({
      aquario_id: aquario.id,
      tipo,
      descricao: descricao.trim()
    });

    setEquipamentos([...equipamentos, novo]);
    setDescricao('');
    setShowNovoModal(false);
  };

  const handleExcluirEquipamento = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja remover este equipamento do setup?')) {
      LocalDatabase.deleteEquipamento(id);
      setEquipamentos(equipamentos.filter(eq => eq.id !== id));
      if (selectedEquipamento?.id === id) {
        setSelectedEquipamento(null);
      }
    }
  };

  const handleSalvarHistorico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipamento || !textoAlteracao.trim()) return;

    const novoHist = LocalDatabase.addEquipamentoHistorico({
      equipamento_id: selectedEquipamento.id,
      data: dataAlteracao,
      alteracao: textoAlteracao.trim()
    });

    setHistorico([novoHist, ...historico]);
    setTextoAlteracao('');
    setShowNovoHistModal(false);
  };

  const equipamentosFiltrados = equipamentos.filter(eq => {
    const matchTipo = filtroTipo === 'todos' || eq.tipo === filtroTipo;
    const matchBusca =
      !busca.trim() ||
      eq.tipo.toLowerCase().includes(busca.toLowerCase()) ||
      eq.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchBusca;
  });

  const getIconeTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'skimmer':
        return 'cyclone';
      case 'iluminação':
        return 'light_mode';
      case 'circulação':
        return 'waves';
      case 'retorno':
        return 'upgrade';
      case 'aquecimento / resfriamento':
        return 'thermostat';
      case 'dosadora':
        return 'vaccines';
      case 'controlador / sonda':
        return 'precision_manufacturing';
      case 'reposição de água (ato)':
        return 'water_drop';
      default:
        return 'build';
    }
  };

  return (
    <div className="flex flex-col w-full px-3 gap-3 pb-24 pt-1 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-sm font-semibold text-[#d3e5f2]">
            Hardware & Equipamentos
          </h2>
          <p className="text-xs text-[#879390]">
            {equipamentos.length} dispositivos monitorados no setup
          </p>
        </div>
        <button
          onClick={() => setShowNovoModal(true)}
          className="flex items-center gap-1 bg-[#77dcce] hover:bg-[#5ac0b3] text-[#003732] font-semibold text-xs px-2.5 py-1.5 rounded-lg active:scale-95 transition-all shadow"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>+ Equipamento</span>
        </button>
      </div>

      {/* Busca rápida */}
      <div className="flex items-center bg-[#0d1d26] border border-[#273741] rounded-lg px-2.5 py-1.5 gap-2">
        <span className="material-symbols-outlined text-[#879390] text-[18px]">search</span>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar modelo, skimmer, bomba..."
          className="bg-transparent border-none text-xs text-[#d3e5f2] placeholder-[#879390] focus:outline-none w-full"
        />
        {busca && (
          <button onClick={() => setBusca('')} className="text-[#879390] hover:text-[#d3e5f2]">
            ✕
          </button>
        )}
      </div>

      {/* Lista de Equipamentos */}
      <div className="flex flex-col gap-2">
        {equipamentosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#879390] bg-[#11212b] border border-[#273741] rounded-xl flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-[#273741]">build_circle</span>
            <p>Nenhum equipamento cadastrado ou encontrado com este filtro.</p>
          </div>
        ) : (
          equipamentosFiltrados.map(eq => {
            const histList = LocalDatabase.getEquipamentoHistorico(eq.id);
            return (
              <div
                key={eq.id}
                onClick={() => handleSelectEquipamento(eq)}
                className="bg-[#11212b] border border-[#273741] hover:border-[#77dcce]/50 transition-all rounded-xl p-3 flex flex-col gap-2 cursor-pointer shadow-sm group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0d1d26] border border-[#273741] text-[#77dcce] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-[#77dcce]/40 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        {getIconeTipo(eq.tipo)}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#8bcff2]">
                        {eq.tipo}
                      </span>
                      <h3 className="font-sans text-xs font-semibold text-[#d3e5f2] leading-snug">
                        {eq.descricao}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => handleExcluirEquipamento(eq.id, e)}
                      title="Excluir equipamento"
                      className="p-1 rounded text-[#879390] hover:text-[#ffb4ab] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                    <span className="material-symbols-outlined text-[#879390] text-[18px] group-hover:text-[#77dcce] transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>

                {/* Footer do item com histórico rápido */}
                <div className="flex items-center justify-between border-t border-[#1c2c35] pt-2 text-[10px] font-mono text-[#879390]">
                  <span>
                    {histList.length > 0
                      ? `${histList.length} alteraç${histList.length === 1 ? 'ão' : 'ões'} / calibrações`
                      : 'Sem histórico registrado'}
                  </span>
                  {histList.length > 0 && (
                    <span className="text-[#bdc9c6]">
                      Última: {new Date(histList[0].data).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Novo Equipamento */}
      {showNovoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#273741] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#77dcce]">build</span>
                <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                  Cadastrar Equipamento
                </h3>
              </div>
              <button
                onClick={() => setShowNovoModal(false)}
                className="text-[#879390] hover:text-[#d3e5f2]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEquipamento} className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Tipo de Equipamento
                </label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  className="w-full bg-[#0d1d26] border border-[#273741] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] focus:outline-none focus:border-[#77dcce]"
                >
                  {TIPOS_EQUIPAMENTO.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Marca, Modelo e Especificações
                </label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Bubble Magus Curve 7 - Bomba Rock SP2000"
                  rows={3}
                  required
                  className="w-full bg-[#0d1d26] border border-[#273741] rounded-lg p-3 text-xs text-[#d3e5f2] placeholder-[#879390] focus:outline-none focus:border-[#77dcce]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#273741]">
                <button
                  type="button"
                  onClick={() => setShowNovoModal(false)}
                  className="px-3 py-1.5 text-xs text-[#879390] hover:text-[#d3e5f2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#77dcce] hover:bg-[#5ac0b3] text-[#003732] rounded-lg font-semibold text-xs transition-colors shadow"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Drawer: Detalhes do Equipamento & Prontuário de Histórico */}
      {selectedEquipamento && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-3.5 border-b border-[#273741] bg-[#0d1d26] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#77dcce]/10 text-[#77dcce] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    {getIconeTipo(selectedEquipamento.tipo)}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-[9px] uppercase font-bold text-[#8bcff2]">
                    {selectedEquipamento.tipo}
                  </span>
                  <h3 className="font-sans text-xs font-semibold text-[#d3e5f2] truncate">
                    {selectedEquipamento.descricao}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedEquipamento(null)}
                className="text-[#879390] hover:text-[#d3e5f2] p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto space-y-3">
              {/* Botão para novo histórico */}
              <div className="flex items-center justify-between bg-[#0d1d26] border border-[#273741] p-2.5 rounded-xl">
                <div>
                  <h4 className="text-xs font-semibold text-[#d3e5f2]">
                    Prontuário de Manutenções & Calibrações
                  </h4>
                  <p className="text-[10px] text-[#879390]">
                    Registros de trocas de peças, regulagens e limpezas
                  </p>
                </div>
                <button
                  onClick={() => setShowNovoHistModal(true)}
                  className="flex items-center gap-1 bg-[#1c2c35] hover:bg-[#273741] border border-[#273741] text-[#77dcce] px-2 py-1 rounded-lg text-xs font-bold active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>+ Registro</span>
                </button>
              </div>

              {/* Linha do tempo de histórico deste equipamento */}
              {historico.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#879390] bg-[#0d1d26] border border-[#273741] rounded-xl">
                  Nenhuma alteração ou calibração registrada ainda para este equipamento.
                </div>
              ) : (
                <div className="space-y-2">
                  {historico.map(h => (
                    <div
                      key={h.id}
                      className="bg-[#0d1d26] border border-[#273741] rounded-xl p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#8bcff2] font-semibold">
                          {new Date(h.data).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[#879390]">Histórico de Setup</span>
                      </div>
                      <p className="text-xs text-[#bdc9c6] leading-relaxed">{h.alteracao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Adicionar Registro de Histórico no Equipamento */}
      {showNovoHistModal && selectedEquipamento && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#273741] pb-2">
              <h3 className="font-sans text-xs font-semibold text-[#d3e5f2]">
                Registrar Calibração / Ajuste
              </h3>
              <button
                onClick={() => setShowNovoHistModal(false)}
                className="text-[#879390] hover:text-[#d3e5f2]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarHistorico} className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={dataAlteracao}
                  onChange={e => setDataAlteracao(e.target.value)}
                  className="w-full bg-[#0d1d26] border border-[#273741] rounded-lg px-3 py-1.5 text-xs text-[#d3e5f2] focus:outline-none focus:border-[#77dcce]"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  O que foi feito / calibrado?
                </label>
                <textarea
                  value={textoAlteracao}
                  onChange={e => setTextoAlteracao(e.target.value)}
                  placeholder="Ex: Troca de impeller, calibração com proveta, limpeza com vinagre..."
                  rows={3}
                  required
                  className="w-full bg-[#0d1d26] border border-[#273741] rounded-lg p-2.5 text-xs text-[#d3e5f2] placeholder-[#879390] focus:outline-none focus:border-[#77dcce]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#273741]">
                <button
                  type="button"
                  onClick={() => setShowNovoHistModal(false)}
                  className="px-3 py-1.5 text-xs text-[#879390] hover:text-[#d3e5f2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#77dcce] text-[#003732] rounded-lg font-semibold text-xs"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
