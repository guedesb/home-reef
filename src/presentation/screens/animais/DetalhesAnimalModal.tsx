import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Animal, EventoAnimal } from '../../../domain/models';

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
  const [eventos, setEventos] = useState<EventoAnimal[]>(LocalDatabase.getEventosAnimal(animal.id));
  const [showNovoEvento, setShowNovoEvento] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
      <div className="bg-[#11212b] border border-[#273741] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header da Ficha */}
        <div className="p-4 border-b border-[#273741] bg-[#0d1d26] flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#04151e] border border-[#273741] flex items-center justify-center text-[#77dcce] flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                {animal.tipo === 'grupo' ? 'diversity_2' : 'set_meal'}
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
              <p className="text-xs text-[#879390] italic">{animal.especie}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditandoAnimal(!editandoAnimal)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                editandoAnimal
                  ? 'bg-[#77dcce] text-[#003732]'
                  : 'bg-[#1c2c35] text-[#8bcff2] hover:bg-[#273741]'
              }`}
              title="Editar ficha do animal"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
              onClick={handleDeleteAnimal}
              className="w-8 h-8 rounded-lg bg-[#93000a]/20 text-[#ffb4ab] hover:bg-[#93000a]/40 border border-[#ffb4ab]/30 flex items-center justify-center transition-colors"
              title="Excluir animal"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#bdc9c6] hover:text-[#d3e5f2] flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Formulário de Edição do Animal */}
        {editandoAnimal ? (
          <form onSubmit={handleSalvarEdicaoAnimal} className="p-4 border-b border-[#273741] bg-[#09151e] space-y-3 overflow-y-auto max-h-[60vh]">
            <div className="flex items-center justify-between pb-1 border-b border-[#273741]">
              <span className="font-sans text-xs font-semibold text-[#77dcce]">Editar Dados do Animal</span>
              <button
                type="button"
                onClick={() => setEditandoAnimal(false)}
                className="text-[11px] text-[#879390] hover:text-[#d3e5f2]"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Nome Popular</label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none focus:border-[#77dcce]"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Espécie Científica</label>
                <input
                  type="text"
                  value={editEspecie}
                  onChange={e => setEditEspecie(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none italic focus:border-[#77dcce]"
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
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Qtd</label>
                <input
                  type="number"
                  min="1"
                  disabled={editTipo === 'individuo'}
                  value={editQuantidade}
                  onChange={e => setEditQuantidade(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2 py-1.5 text-xs text-[#d3e5f2] outline-none font-mono disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Localização no Aquascaping</label>
                <input
                  type="text"
                  placeholder="Ex: Rocha central, Anêmona..."
                  value={editLocal}
                  onChange={e => setEditLocal(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] rounded px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase text-[#879390] mb-0.5">Origem / Procedência</label>
                <input
                  type="text"
                  placeholder="Ex: Loja Recife, Criação própria..."
                  value={editOrigem}
                  onChange={e => setEditOrigem(e.target.value)}
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

        {/* Linha do Tempo de Eventos do Animal */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-xs font-semibold text-[#d3e5f2] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#77dcce]">history</span>
              Prontuário & Linha do Tempo ({eventos.length})
            </h4>
            <button
              onClick={() => setShowNovoEvento(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#77dcce] text-[#003732] font-semibold text-xs active:scale-95 shadow"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Registrar Evento</span>
            </button>
          </div>

          {/* Form Modal / Inline para registrar evento */}
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
        </div>
      </div>
    </div>
  );
};
