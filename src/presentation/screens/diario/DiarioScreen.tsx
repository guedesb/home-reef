import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { runAnalyticalEngineTests, TestResult } from '../../../domain/analytics_engine.test';
import { Aquario, Diario, Manutencao } from '../../../domain/models';
import { NovaManutencaoModal } from './NovaManutencaoModal';

interface DiarioScreenProps {
  aquario: Aquario;
}

export const DiarioScreen: React.FC<DiarioScreenProps> = ({ aquario }) => {
  const [diarios, setDiarios] = useState<Diario[]>(LocalDatabase.getDiarios(aquario.id));
  const [manutencoes, setManutencoes] = useState<Manutencao[]>(LocalDatabase.getManutencoes(aquario.id));
  const [showNovoDiario, setShowNovoDiario] = useState(false);
  const [showNovaManutencao, setShowNovaManutencao] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [tagFiltro, setTagFiltro] = useState<string>('todas');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  const [texto, setTexto] = useState('');
  const [tagsInput, setTagsInput] = useState('Geral, Manutenção');

  const todasTags = Array.from(
    new Set(diarios.flatMap(d => d.tags || []))
  );

  const handleSalvarDiario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const novo = LocalDatabase.addDiario({
      aquario_id: aquario.id,
      data: new Date().toISOString().slice(0, 10),
      texto: texto.trim(),
      tags: tags.length > 0 ? tags : ['Geral']
    });
    setDiarios([novo, ...diarios]);
    setTexto('');
    setShowNovoDiario(false);
  };

  const handleAddTagToInput = (tag: string) => {
    const atuais = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (!atuais.includes(tag)) {
      setTagsInput([...atuais, tag].join(', '));
    }
  };

  const diariosFiltrados = diarios.filter(d => {
    const matchTag = tagFiltro === 'todas' || d.tags?.includes(tagFiltro);
    const matchBusca = !buscaTexto.trim() || 
      d.texto.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      d.tags?.some(t => t.toLowerCase().includes(buscaTexto.toLowerCase()));
    return matchTag && matchBusca;
  });

  const handleSavedManutencao = (nova: Manutencao) => {
    setManutencoes([nova, ...manutencoes]);
    setShowNovaManutencao(false);
  };

  const executarTestes = () => {
    const res = runAnalyticalEngineTests();
    setTestResults(res);
    setShowTestsModal(true);
  };

  // Filtragem de manutenções
  const manutencoesFiltradas = manutencoes.filter(m => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'tpa') return m.tipo === 'TPA';
    if (filtroTipo === 'equipamentos') return m.tipo !== 'TPA';
    return true;
  });

  // Estatísticas de TPA do aquário
  const totalTpaLitros = manutencoes
    .filter(m => m.tipo === 'TPA' && m.volume_tpa)
    .reduce((acc, m) => acc + (m.volume_tpa || 0), 0);
  const ultimaTpa = manutencoes.find(m => m.tipo === 'TPA');

  return (
    <div className="flex flex-col w-full px-3 gap-3 pb-24 pt-1 max-w-md mx-auto">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-sm font-semibold text-[#d3e5f2]">
            Diário & Manutenções
          </h2>
          <p className="text-xs text-[#879390]">Prontuário histórico do aquarista</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={executarTestes}
            title="Executar Testes do Motor Analítico"
            className="p-2 rounded-lg bg-[#0d1d26] border border-[#273741] hover:border-[#77dcce] text-[#77dcce] flex items-center justify-center text-xs"
          >
            <span className="material-symbols-outlined text-[18px]">bug_report</span>
          </button>
          <button
            onClick={() => setShowNovaManutencao(true)}
            className="flex items-center gap-1 bg-[#1c2c35] hover:bg-[#273741] border border-[#273741] text-[#77dcce] font-semibold text-xs px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">build</span>
            <span>+ Manutenção</span>
          </button>
          <button
            onClick={() => setShowNovoDiario(true)}
            className="flex items-center gap-1 bg-[#77dcce] hover:bg-[#5ac0b3] text-[#003732] font-semibold text-xs px-2.5 py-1.5 rounded-lg active:scale-95 transition-all shadow"
          >
            <span className="material-symbols-outlined text-[15px]">edit_note</span>
            <span>+ Diário</span>
          </button>
        </div>
      </div>

      {/* Painel de Estatística de TPA */}
      <div className="grid grid-cols-2 gap-2 bg-[#11212b] border border-[#273741] rounded-lg p-3">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] uppercase text-[#879390]">Última TPA</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-base font-semibold text-[#77dcce]">
              {ultimaTpa ? `${ultimaTpa.volume_tpa || 0}L` : 'Nenhuma'}
            </span>
            {ultimaTpa && (
              <span className="font-mono text-[10px] text-[#879390]">
                ({new Date(ultimaTpa.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#879390] truncate">
            {ultimaTpa?.sal_marca || 'Água deionizada'}
          </span>
        </div>

        <div className="flex flex-col border-l border-[#273741] pl-3">
          <span className="font-mono text-[9px] uppercase text-[#879390]">Volume Acumulado</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-base font-semibold text-[#8bcff2]">
              {totalTpaLitros}L
            </span>
            <span className="font-mono text-[10px] text-[#879390]">trocados</span>
          </div>
          <span className="text-[10px] text-[#879390]">
            {(totalTpaLitros / (aquario.volume_sistema || 1)).toFixed(1)}x vol. aquário
          </span>
        </div>
      </div>

      {/* Seção de Manutenções Recentes com Filtro */}
      <section className="bg-[#11212b] border border-[#273741] rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#77dcce] text-[18px]">build</span>
            <h3 className="font-sans text-xs font-semibold text-[#d3e5f2] uppercase tracking-wider">
              Registro de Manutenções
            </h3>
          </div>
          <div className="flex gap-1">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'tpa', label: 'TPA' },
              { id: 'equipamentos', label: 'Equip.' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors border ${
                  filtroTipo === f.id
                    ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-semibold'
                    : 'bg-[#0d1d26] border-[#273741] text-[#879390]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {manutencoesFiltradas.length === 0 ? (
            <div className="p-3 text-center text-xs text-[#879390] bg-[#0d1d26] rounded border border-[#273741]">
              Nenhuma manutenção encontrada para o filtro selecionado.
            </div>
          ) : (
            manutencoesFiltradas.map(m => {
              const isTpa = m.tipo === 'TPA';
              const icon = isTpa
                ? 'water_drop'
                : m.tipo.includes('Skimmer')
                ? 'cleaning_services'
                : m.tipo.includes('Perlon')
                ? 'filter_alt'
                : m.tipo.includes('Sonda')
                ? 'tune'
                : 'build';

              return (
                <div key={m.id} className="p-2.5 rounded-lg bg-[#0d1d26] border border-[#273741] flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isTpa ? 'bg-[#77dcce]/10 text-[#77dcce]' : 'bg-[#8bcff2]/10 text-[#8bcff2]'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-xs font-semibold text-[#d3e5f2]">{m.tipo}</span>
                      <span className="font-mono text-[10px] text-[#879390]">
                        {new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • {new Date(m.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#bdc9c6] mt-0.5">{m.descricao}</p>
                    
                    {/* Tags e metadados de TPA */}
                    {isTpa && m.volume_tpa && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#005e7d]/30 text-[#8bcff2] border border-[#005e7d]/50">
                          {m.volume_tpa}L ({(m.volume_tpa / aquario.volume_sistema * 100).toFixed(1)}% do sistema)
                        </span>
                        {m.sal_marca && (
                          <span className="font-sans text-[9px] px-1.5 py-0.2 rounded bg-[#1c2c35] text-[#bdc9c6] border border-[#273741]">
                            {m.sal_marca}
                          </span>
                        )}
                        {m.salinidade_preparada && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#1c2c35] text-[#77dcce] border border-[#273741]">
                            {m.salinidade_preparada} sg
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Seção do Diário Livre com Filtro de Tags e Busca */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#8bcff2] text-[18px]">edit_note</span>
            <h3 className="font-sans text-xs font-semibold text-[#d3e5f2] uppercase tracking-wider">
              Diário do Aquarista ({diariosFiltrados.length})
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[#879390]">
            Texto Livre & Tags
          </span>
        </div>

        {/* Barra de Busca rápida */}
        <div className="bg-[#0d1d26] border border-[#273741] rounded-lg px-2.5 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#879390]">search</span>
          <input
            type="text"
            value={buscaTexto}
            onChange={e => setBuscaTexto(e.target.value)}
            placeholder="Pesquisar anotações ou #tags..."
            className="w-full bg-transparent text-xs text-[#d3e5f2] placeholder-[#879390] outline-none"
          />
          {buscaTexto && (
            <button
              onClick={() => setBuscaTexto('')}
              className="text-[#879390] hover:text-[#d3e5f2]"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Carrossel de Tags para Filtragem */}
        {todasTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setTagFiltro('todas')}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] whitespace-nowrap transition-colors border ${
                tagFiltro === 'todas'
                  ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-bold'
                  : 'bg-[#0d1d26] border-[#273741] text-[#879390]'
              }`}
            >
              Todas as tags
            </button>
            {todasTags.map(tag => (
              <button
                key={tag}
                onClick={() => setTagFiltro(tag)}
                className={`px-2.5 py-1 rounded-md font-mono text-[10px] whitespace-nowrap transition-colors border flex items-center gap-1 ${
                  tagFiltro === tag
                    ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-bold'
                    : 'bg-[#0d1d26] border-[#273741] text-[#8bcff2]'
                }`}
              >
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}

        {/* Lista de Registros do Diário */}
        {diariosFiltrados.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#11212b] border border-[#273741] text-center text-xs text-[#879390]">
            Nenhuma anotação encontrada com os filtros atuais.
          </div>
        ) : (
          diariosFiltrados.map(d => (
            <div key={d.id} className="p-3 rounded-lg bg-[#11212b] border border-[#273741] space-y-2 hover:border-[#77dcce]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#77dcce] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {d.tags?.map(t => (
                    <button
                      key={t}
                      onClick={() => setTagFiltro(t)}
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#0d1d26] hover:bg-[#1c2c35] border border-[#273741] text-[#8bcff2] transition-colors"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#d3e5f2] whitespace-pre-line leading-relaxed">{d.texto}</p>
            </div>
          ))
        )}
      </section>

      {/* Modal Novo Diário com Tags Sugeridas */}
      {showNovoDiario && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-xl p-4 space-y-3.5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#273741] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#77dcce] text-[18px]">edit_note</span>
                <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">Nova Entrada no Diário</h3>
              </div>
              <button
                onClick={() => setShowNovoDiario(false)}
                className="w-7 h-7 rounded bg-[#1c2c35] text-[#bdc9c6] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSalvarDiario} className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Observações / Texto Livre
                </label>
                <textarea
                  rows={4}
                  required
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Ex: Pólipos das Acroporas muito abertos hoje. Blênio comeu ração com apetite..."
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg p-2.5 text-xs text-[#d3e5f2] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none"
                />

                {/* Tags Rápidas Pré-definidas */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="font-mono text-[9px] text-[#879390] mr-1 self-center">Sugestões:</span>
                  {['Corais', 'Peixes', 'Algas', 'TPA', 'Iluminação', 'Quarentena', 'Balling'].map(sugestao => (
                    <button
                      key={sugestao}
                      type="button"
                      onClick={() => handleAddTagToInput(sugestao)}
                      className="px-2 py-0.5 rounded bg-[#0d1d26] hover:bg-[#1c2c35] border border-[#273741] text-[9px] font-mono text-[#8bcff2]"
                    >
                      +{sugestao}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovoDiario(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1c2c35] hover:bg-[#273741] text-xs font-semibold text-[#d3e5f2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#77dcce] hover:bg-[#5ac0b3] text-[#003732] text-xs font-semibold shadow"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Manutenção (Com TPA detalhada) */}
      {showNovaManutencao && (
        <NovaManutencaoModal
          aquario={aquario}
          onClose={() => setShowNovaManutencao(false)}
          onSaved={handleSavedManutencao}
        />
      )}

      {/* Modal de Testes Unitários do Motor Analítico */}
      {showTestsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#273741] pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#77dcce] text-[20px]">verified</span>
                <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                  Validação do Motor Analítico (Unit Tests)
                </h3>
              </div>
              <button
                onClick={() => setShowTestsModal(false)}
                className="w-7 h-7 rounded bg-[#1c2c35] text-[#bdc9c6] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border text-xs ${
                    t.passed ? 'bg-[#003732]/20 border-[#77dcce]/40 text-[#d3e5f2]' : 'bg-[#93000a]/20 border-[#ffb4ab]/40 text-[#ffb4ab]'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>{t.title}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#04151e] uppercase">
                      {t.passed ? 'PASSED ✓' : 'FAILED ✗'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#879390] mt-1">{t.message}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowTestsModal(false)}
              className="w-full py-2 bg-[#1c2c35] text-[#d3e5f2] rounded-lg text-xs font-semibold"
            >
              Fechar Validação
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
