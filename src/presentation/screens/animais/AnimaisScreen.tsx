import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Animal, Aquario } from '../../../domain/models';
import { DetalhesAnimalModal } from './DetalhesAnimalModal';

interface AnimaisScreenProps {
  aquario: Aquario;
}

export const AnimaisScreen: React.FC<AnimaisScreenProps> = ({ aquario }) => {
  const [animais, setAnimais] = useState<Animal[]>(LocalDatabase.getAnimais(aquario.id));
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'individuo' | 'grupo'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [animalSelecionado, setAnimalSelecionado] = useState<Animal | null>(null);

  const [tipo, setTipo] = useState<'individuo' | 'grupo'>('individuo');
  const [categoria, setCategoria] = useState<'peixe' | 'invertebrado' | 'coral' | 'outro'>('peixe');
  const [nomePopular, setNomePopular] = useState('');
  const [especie, setEspecie] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [localizacao, setLocalizacao] = useState('');
  const [origem, setOrigem] = useState('');

  const filtrados = animais.filter(a => (tipoFiltro === 'todos' ? true : a.tipo === tipoFiltro));

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novo = LocalDatabase.addAnimal({
      aquario_id: aquario.id,
      tipo,
      categoria,
      nome_popular: nomePopular,
      especie: especie || 'Espécie não descrita',
      quantidade: tipo === 'grupo' ? parseInt(quantidade) || 1 : 1,
      localizacao_habitual: localizacao,
      origem,
      data_entrada: new Date().toISOString().slice(0, 10)
    });
    setAnimais([...animais, novo]);
    setShowModal(false);
    setNomePopular('');
    setEspecie('');
  };

  return (
    <div className="flex flex-col w-full px-3 gap-3 pb-24 pt-1 max-w-md mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-sm font-semibold text-[#d3e5f2]">
            Fauna e Corais do Aquário
          </h2>
          <p className="text-xs text-[#879390]">Fichas de indivíduos e grupos/lotes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 bg-[#77dcce] text-[#003732] font-semibold text-xs px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Cadastrar</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'individuo', label: 'Indivíduos' },
          { id: 'grupo', label: 'Grupos / Cardumes' }
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setTipoFiltro(chip.id as any)}
            className={`px-3 py-1 rounded-lg font-mono text-xs border transition-colors ${
              tipoFiltro === chip.id
                ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-semibold'
                : 'bg-[#0d1d26] border-[#273741] text-[#bdc9c6]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Animal Cards */}
      <div className="space-y-2">
        {filtrados.map(animal => (
          <div
            key={animal.id}
            onClick={() => setAnimalSelecionado(animal)}
            className="p-3 bg-[#11212b] border border-[#273741] hover:border-[#77dcce] rounded-xl cursor-pointer transition-all duration-150 flex items-start justify-between group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#0d1d26] border border-[#273741] group-hover:border-[#77dcce]/50 flex items-center justify-center text-[#77dcce] mt-0.5 transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  {animal.tipo === 'grupo' ? 'diversity_2' : 'set_meal'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans text-sm font-semibold text-[#d3e5f2] group-hover:text-[#77dcce] transition-colors">
                    {animal.nome_popular}
                  </span>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#0d1d26] border border-[#273741] text-[#8bcff2]">
                    {animal.tipo === 'grupo' ? `Lote (${animal.quantidade || 1}x)` : 'Indivíduo'}
                  </span>
                </div>
                <p className="text-xs text-[#879390] italic mt-0.5">{animal.especie}</p>
                {animal.localizacao_habitual && (
                  <p className="text-[11px] text-[#bdc9c6] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px] text-[#77dcce]">place</span>
                    {animal.localizacao_habitual}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-mono text-[10px] text-[#879390]">
                {new Date(animal.data_entrada).toLocaleDateString('pt-BR')}
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#879390] group-hover:text-[#77dcce] transition-colors">
                chevron_right
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalhes e Prontuário do Animal */}
      {animalSelecionado && (
        <DetalhesAnimalModal
          animal={animalSelecionado}
          onClose={() => setAnimalSelecionado(null)}
          onUpdate={atualizado => {
            setAnimais(animais.map(a => (a.id === atualizado.id ? atualizado : a)));
            setAnimalSelecionado(atualizado);
          }}
          onDelete={idDeletado => {
            setAnimais(animais.filter(a => a.id !== idDeletado));
            setAnimalSelecionado(null);
          }}
        />
      )}

      {/* Modal Cadastro */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-3.5 border-b border-[#273741] flex items-center justify-between">
              <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                Cadastrar Animal ou Grupo
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#bdc9c6] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Classificação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('individuo')}
                    className={`py-2 rounded-lg font-sans text-xs border ${
                      tipo === 'individuo'
                        ? 'bg-[#1c2c35] border-[#77dcce] text-[#77dcce] font-bold'
                        : 'bg-[#0d1d26] border-[#273741] text-[#bdc9c6]'
                    }`}
                  >
                    Indivíduo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('grupo')}
                    className={`py-2 rounded-lg font-sans text-xs border ${
                      tipo === 'grupo'
                        ? 'bg-[#1c2c35] border-[#77dcce] text-[#77dcce] font-bold'
                        : 'bg-[#0d1d26] border-[#273741] text-[#bdc9c6]'
                    }`}
                  >
                    Grupo / Lote / Cardume
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Categoria Biológica
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['peixe', 'invertebrado', 'coral', 'outro'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoria(cat)}
                      className={`py-1.5 rounded-lg font-mono text-[10px] uppercase border transition-colors ${
                        categoria === cat
                          ? 'bg-[#1c2c35] border-[#77dcce] text-[#77dcce] font-bold'
                          : 'bg-[#0d1d26] border-[#273741] text-[#879390]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Nome Popular
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tang Amarelo, Cardume de Chromis..."
                  value={nomePopular}
                  onChange={e => setNomePopular(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                    Espécie Científica
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Zebrasoma flavescens"
                    value={especie}
                    onChange={e => setEspecie(e.target.value)}
                    className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none italic"
                  />
                </div>
                {tipo === 'grupo' && (
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={quantidade}
                      onChange={e => setQuantidade(e.target.value)}
                      className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Localização Habitual no Aquascape
                </label>
                <input
                  type="text"
                  placeholder="Ex: Coluna d'água livre, Anêmona, Rochas..."
                  value={localizacao}
                  onChange={e => setLocalizacao(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1c2c35] text-[#d3e5f2] font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#77dcce] text-[#003732] font-semibold text-xs"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
