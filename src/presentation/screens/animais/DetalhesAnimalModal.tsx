import React, { useMemo, useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Alimentacao, Animal, Aquario, EventoAnimal } from '../../../domain/models';
import { NovaAlimentacaoModal } from '../diario/NovaAlimentacaoModal';

interface DetalhesAnimalModalProps {
  animal: Animal;
  onClose: () => void;
  onUpdate: (animalAtualizado: Animal) => void;
  onDelete: (animalId: string) => void;
}

const EVENTO_LABELS: Record<EventoAnimal['tipo_evento'], { label: string; icon: string; cor: string }> = {
  entrada: { label: 'Entrada / Aclimatação', icon: 'login', cor: 'text-[#77dcce] bg-[#77dcce]/10' },
  alimentacao: { label: 'Alimentação / Dieta', icon: 'restaurant', cor: 'text-[#8bcff2] bg-[#8bcff2]/10' },
  crescimento: { label: 'Crescimento / Desenvolvimento', icon: 'trending_up', cor: 'text-[#77dcce] bg-[#77dcce]/10' },
  reproducao: { label: 'Reprodução / Postura', icon: 'favorite', cor: 'text-[#ffb4ab] bg-[#ffb4ab]/10' },
  doenca: { label: 'Quarentena / Tratamento / Doença', icon: 'medical_services', cor: 'text-[#ffb4ab] bg-[#ffb4ab]/10' },
  obito: { label: 'Óbito / Perda', icon: 'sentiment_dissatisfied', cor: 'text-[#93000a] bg-[#93000a]/20' }
};

export const DetalhesAnimalModal: React.FC<DetalhesAnimalModalProps> = ({
  animal,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'eventos' | 'alimentacao'>('eventos');
  const [eventos, setEventos] = useState<EventoAnimal[]>(LocalDatabase.getEventosAnimal(animal.id));
  const [alimentacoes, setAlimentacoes] = useState<Alimentacao[]>(
    LocalDatabase.getAlimentacoesPorAnimal(animal.id)
  );
  const [showNovoEvento, setShowNovoEvento] = useState(false);
  const [showNovaAlimentacao, setShowNovaAlimentacao] = useState(false);

  // Form novo evento
  const [tipoEvento, setTipoEvento] = useState<EventoAnimal['tipo_evento']>('alimentacao');
  const [dataEvento, setDataEvento] = useState(new Date().toISOString().slice(0, 10));
  const [descricaoEvento, setDescricaoEvento] = useState('');

  // Edição completa do animal
  const [editandoAnimal, setEditandoAnimal] = useState(false);
  const [editNome, setEditNome] = useState(animal.nome_popular);
  const [editEspecie, setEditEspecie] = useState(animal.especie || '');
  const [editTipo, setEditTipo] = useState<'individuo' | 'grupo'>(animal.tipo);
  const [editCategoria, setEditCategoria] = useState(animal.categoria);
  const [editQuantidade, setEditQuantidade] = useState(String(animal.quantidade || 1));
  const [editLocal, setEditLocal] = useState(animal.localizacao_habitual || '');
  const [editOrigem, setEditOrigem] = useState(animal.origem || '');
  const [editDataEntrada, setEditDataEntrada] = useState(animal.data_entrada.slice(0, 10));

  const aquario = useMemo<Aquario>(() => {
    const list = LocalDatabase.getAquarios();
    return list.find(a => a.id === animal.aquario_id) || list[0];
  }, [animal.aquario_id]);

  const handleSalvarEdicaoAnimal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim()) return;

    const atualizado: Animal = {
      ...animal,
      nome_popular: editNome.trim(),
      especie: editEspecie.trim() || 'Espécie não descrita',
      tipo: editTipo,
      categoria: editCategoria,
      quantidade: editTipo === 'grupo' ? parseInt(editQuantidade) || 1 : 1,
      localizacao_habitual: editLocal.trim() || undefined,
      origem: editOrigem.trim() || undefined,
      data_entrada: editDataEntrada
    };

    LocalDatabase.updateAnimal(atualizado);
    onUpdate(atualizado);
    setEditandoAnimal(false);
  };

  const handleDeleteAnimal = () => {
    if (!window.confirm(`Tem certeza que deseja excluir "${animal.nome_popular}"? O histórico de eventos também será removido.`)) {
      return;
    }
    LocalDatabase.deleteAnimal(animal.id);
    onDelete(animal.id);
    onClose();
  };

  const handleSalvarEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoEvento.trim()) return;

    const novo = LocalDatabase.addEventoAnimal({
      animal_id: animal.id,
      tipo_evento: tipoEvento,
      data: dataEvento,
      descricao: descricaoEvento.trim()
    });

    setEventos([novo, ...eventos]);
    setDescricaoEvento('');
    setShowNovoEvento(false);
  };

  const handleDeleteEvento = (id: string) => {
    if (!window.confirm('Deseja excluir este registro de evento?')) return;
    LocalDatabase.deleteEventoAnimal(id);
    setEventos(eventos.filter(e => e.id !== id));
  };

  const handleDeleteAlimentacao = (id: string) => {
    if (!window.confirm('Deseja excluir este registro de alimentação?')) return;
    LocalDatabase.deleteAlimentacao(id);
    setAlimentacoes(alimentacoes.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="bg-[#11212b] border border-[#273741] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header da Ficha */}
        <div className="p-4 border-b border-[#273741] bg-[#0d1d26] flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#04151e] border border-[#273741] flex items-center justify-center text-[#77dcce] flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                {animal.tipo === 'grupo' ? 'diversity_2' : animal.categoria === 'coral' ? 'water' : 'set_meal'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base font-bold text-[#d3e5f2]">
                  {animal.nome_popular}
                </h3>
                <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#1c2c35] border border-[#273741] text-[#8bcff2]">
                  {animal.tipo === 'grupo' ? `Lote (${animal.quantidade || 1}x)` : 'Indivíduo'}
                </span>
                <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#04151e] border border-[#273741] text-[#77dcce]">
                  {animal.categoria}
                </span>
              </div>
              <p className="font-sans text-xs italic text-[#879390]">
                {animal.especie}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDeleteAnimal}
              className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#ffb4ab] hover:bg-[#93000a]/30 flex items-center justify-center transition-colors"
              title="Excluir animal do sistema"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#bdc9c6] hover:text-[#d3e5f2] flex items-center justify-center transition-colors"
              title="Fechar ficha"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Formulário de Edição do Animal */}
        {editandoAnimal ? (
          <form onSubmit={handleSalvarEdicaoAnimal} className="p-4 border-b border-[#273741] bg-[#0d1d26] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[#77dcce] font-semibold">Editar Cadastro</span>
              <button
                type="button"
                onClick={() => setEditandoAnimal(false)}
                className="text-xs text-[#879390] hover:text-[#d3e5f2]"
              >
                ✕ Cancelar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Nome Popular</label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Espécie Científica</label>
                <input
                  type="text"
                  value={editEspecie}
                  onChange={e => setEditEspecie(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none italic"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Tipo</label>
                <select
                  value={editTipo}
                  onChange={e => setEditTipo(e.target.value as any)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2 py-1.5 text-xs text-[#d3e5f2] outline-none"
                >
                  <option value="individuo">Indivíduo</option>
                  <option value="grupo">Grupo / Lote</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Categoria</label>
                <select
                  value={editCategoria}
                  onChange={e => setEditCategoria(e.target.value as any)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2 py-1.5 text-xs text-[#d3e5f2] outline-none"
                >
                  <option value="peixe">Peixe</option>
                  <option value="coral">Coral</option>
                  <option value="invertebrado">Invertebrado</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Qtd (Grupo)</label>
                <input
                  type="number"
                  min={1}
                  disabled={editTipo !== 'grupo'}
                  value={editQuantidade}
                  onChange={e => setEditQuantidade(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2 py-1.5 text-xs text-[#d3e5f2] outline-none disabled:opacity-40 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Local Habitual</label>
                <input
                  type="text"
                  value={editLocal}
                  onChange={e => setEditLocal(e.target.value)}
                  placeholder="Ex: Topo rochoso, vidro"
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Origem</label>
                <input
                  type="text"
                  value={editOrigem}
                  onChange={e => setEditOrigem(e.target.value)}
                  placeholder="Ex: Criatório nacional"
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Data de Entrada</label>
              <input
                type="date"
                value={editDataEntrada}
                onChange={e => setEditDataEntrada(e.target.value)}
                className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditandoAnimal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1c2c35] text-xs font-semibold text-[#bdc9c6]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#77dcce] text-[#003732] text-xs font-semibold shadow hover:bg-[#5ac0b3]"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          /* Informações Básicas & Metadados */
          <div className="p-4 border-b border-[#273741] grid grid-cols-2 gap-3 text-xs bg-[#11212b]">
            <div className="p-2 rounded-lg bg-[#0d1d26] border border-[#273741]">
              <span className="font-mono text-[10px] text-[#879390] uppercase block">Data de Entrada</span>
              <span className="font-mono text-xs font-semibold text-[#d3e5f2]">
                {new Date(animal.data_entrada).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#0d1d26] border border-[#273741]">
              <span className="font-mono text-[10px] text-[#879390] uppercase block">Origem / Procedência</span>
              <span className="text-xs font-medium text-[#d3e5f2]">
                {animal.origem || 'Não especificada'}
              </span>
            </div>

            <div className="col-span-2 p-2 rounded-lg bg-[#0d1d26] border border-[#273741] flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#879390] uppercase block">Localização no Aquascaping</span>
                <span className="text-xs text-[#77dcce] flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">place</span>
                  {animal.localizacao_habitual || 'Não mapeado'}
                </span>
              </div>
              <button
                onClick={() => setEditandoAnimal(true)}
                className="text-xs text-[#8bcff2] hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                <span>Editar</span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-Tabs: Prontuário & Eventos vs Alimentação Direcionada */}
        <div className="px-4 pt-2 border-b border-[#273741] bg-[#0d1d26] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('eventos')}
            className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeSubTab === 'eventos'
                ? 'border-[#77dcce] text-[#77dcce]'
                : 'border-transparent text-[#879390] hover:text-[#bdc9c6]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            Prontuário & Eventos ({eventos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('alimentacao')}
            className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeSubTab === 'alimentacao'
                ? 'border-[#77dcce] text-[#77dcce]'
                : 'border-transparent text-[#879390] hover:text-[#bdc9c6]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">restaurant</span>
            Alimentação Direcionada ({alimentacoes.length})
          </button>
        </div>

        {/* Conteúdo da Tab Ativa */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeSubTab === 'eventos' && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#879390] uppercase">
                  Histórico Clínico e Manejo
                </span>
                <button
                  onClick={() => setShowNovoEvento(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#77dcce] text-[#003732] font-semibold text-xs active:scale-95 shadow"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Registrar Evento</span>
                </button>
              </div>

              {/* Form Inline para registrar evento */}
              {showNovoEvento && (
                <form onSubmit={handleSalvarEvento} className="p-3 rounded-xl bg-[#0d1d26] border border-[#77dcce]/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs font-semibold text-[#77dcce]">Novo Evento Clínico / Manejo</span>
                    <button
                      type="button"
                      onClick={() => setShowNovoEvento(false)}
                      className="text-[#879390] hover:text-[#d3e5f2] text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Tipo de Evento</label>
                      <select
                        value={tipoEvento}
                        onChange={e => setTipoEvento(e.target.value as any)}
                        className="w-full bg-[#04151e] border border-[#273741] rounded p-1.5 text-xs text-[#d3e5f2] outline-none"
                      >
                        <option value="alimentacao">Alimentação / Dieta</option>
                        <option value="crescimento">Crescimento / Pólipos</option>
                        <option value="reproducao">Reprodução / Postura</option>
                        <option value="doenca">Doença / Tratamento</option>
                        <option value="entrada">Aclimatação / Entrada</option>
                        <option value="obito">Óbito / Perda</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Data</label>
                      <input
                        type="date"
                        value={dataEvento}
                        onChange={e => setDataEvento(e.target.value)}
                        className="w-full bg-[#04151e] border border-[#273741] rounded p-1.5 text-xs text-[#d3e5f2] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Descrição do Ocorrido</label>
                    <textarea
                      rows={2}
                      required
                      value={descricaoEvento}
                      onChange={e => setDescricaoEvento(e.target.value)}
                      placeholder="Ex: Aceitou nori com apetite; nadando ativamente; sem pontos brancos..."
                      className="w-full bg-[#04151e] border border-[#273741] rounded p-1.5 text-xs text-[#d3e5f2] outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNovoEvento(false)}
                      className="px-3 py-1 rounded bg-[#1c2c35] text-xs font-semibold text-[#bdc9c6]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-[#77dcce] text-[#003732] text-xs font-semibold shadow"
                    >
                      Salvar Evento
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Eventos */}
              {eventos.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#0d1d26] border border-[#273741] text-center text-xs text-[#879390]">
                  Nenhum evento clínico ou comportamental registrado ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {eventos.map(ev => {
                    const config = EVENTO_LABELS[ev.tipo_evento] || {
                      label: ev.tipo_evento,
                      icon: 'event',
                      cor: 'text-[#d3e5f2] bg-[#273741]'
                    };

                    return (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-[#0d1d26] border border-[#273741] flex items-start gap-2.5 group"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${config.cor}`}>
                          <span className="material-symbols-outlined text-[16px]">{config.icon}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-xs font-semibold text-[#d3e5f2]">
                              {config.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-[#879390]">
                                {new Date(ev.data).toLocaleDateString('pt-BR')}
                              </span>
                              <button
                                onClick={() => handleDeleteEvento(ev.id)}
                                className="text-[#879390] hover:text-[#ffb4ab] transition-colors p-0.5 rounded"
                                title="Excluir evento"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[#bdc9c6] mt-1 leading-relaxed">
                            {ev.descricao}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeSubTab === 'alimentacao' && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#879390] uppercase">
                  Nutrição Específica (N:N)
                </span>
                <button
                  onClick={() => setShowNovaAlimentacao(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8bcff2] text-[#002b40] font-semibold text-xs active:scale-95 shadow"
                >
                  <span className="material-symbols-outlined text-[15px]">restaurant</span>
                  <span>+ Alimentar este Animal</span>
                </button>
              </div>

              {alimentacoes.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#0d1d26] border border-[#273741] text-center text-xs text-[#879390]">
                  Nenhum registro de alimentação direcionada para este animal ainda. Clique acima para registrar.
                </div>
              ) : (
                <div className="space-y-2">
                  {alimentacoes.map(al => (
                    <div
                      key={al.id}
                      className="p-3 rounded-xl bg-[#0d1d26] border border-[#273741] flex items-start gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#8bcff2]/10 text-[#8bcff2] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">restaurant</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-xs font-semibold text-[#d3e5f2]">
                            {al.alimento}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-[#879390]">
                              {new Date(al.data_hora).toLocaleDateString('pt-BR')} • {new Date(al.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleDeleteAlimentacao(al.id)}
                              className="text-[#879390] hover:text-[#ffb4ab] transition-colors p-0.5 rounded"
                              title="Excluir alimentação"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-[#77dcce] px-1.5 py-0.2 rounded bg-[#1c2c35]">
                            Porção: {al.quantidade}
                          </span>
                          {al.observacao && (
                            <span className="text-xs text-[#879390] truncate">
                              • {al.observacao}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal para Adicionar Alimentação com animal pré-selecionado */}
        {showNovaAlimentacao && (
          <NovaAlimentacaoModal
            aquario={aquario}
            animalPreSelecionadoId={animal.id}
            onClose={() => setShowNovaAlimentacao(false)}
            onSaved={() => {
              setAlimentacoes(LocalDatabase.getAlimentacoesPorAnimal(animal.id));
              setShowNovaAlimentacao(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
