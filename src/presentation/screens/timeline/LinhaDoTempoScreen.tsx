import React, { useMemo, useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { Alimentacao, Animal, Aquario, Diario, EventoAnimal, Manutencao, Medicao, Parametro } from '../../../domain/models';
import { NovaAlimentacaoModal } from '../diario/NovaAlimentacaoModal';
import { NovaManutencaoModal } from '../diario/NovaManutencaoModal';

export interface TimelineEventItem {
  id: string;
  categoria: 'parametro' | 'manutencao' | 'alimentacao' | 'diario' | 'animal';
  timestamp: string; // ISO date
  titulo: string;
  subtitulo: string;
  icone: string;
  corIcone: string;
  tags?: string[];
  detalheBadge?: string;
  badgeCor?: string;
}

interface LinhaDoTempoScreenProps {
  aquario: Aquario;
  parametros: Parametro[];
  onOpenNovaMedicao?: () => void;
}

export const LinhaDoTempoScreen: React.FC<LinhaDoTempoScreenProps> = ({
  aquario,
  parametros,
  onOpenNovaMedicao
}) => {
  const [medicoes, setMedicoes] = useState<Medicao[]>(() => LocalDatabase.getMedicoes(aquario.id));
  const [manutencoes, setManutencoes] = useState<Manutencao[]>(() => LocalDatabase.getManutencoes(aquario.id));
  const [alimentacoes, setAlimentacoes] = useState<Alimentacao[]>(() => LocalDatabase.getAlimentacoes(aquario.id));
  const [diarios, setDiarios] = useState<Diario[]>(() => LocalDatabase.getDiarios(aquario.id));
  const [eventosAnimais, setEventosAnimais] = useState<EventoAnimal[]>(() => LocalDatabase.getEventosAnimal(undefined, aquario.id));
  const [animais, setAnimais] = useState<Animal[]>(() => LocalDatabase.getAnimais(aquario.id));

  // Sincronizar dados caso o aquário ativo mude
  React.useEffect(() => {
    setMedicoes(LocalDatabase.getMedicoes(aquario.id));
    setManutencoes(LocalDatabase.getManutencoes(aquario.id));
    setAlimentacoes(LocalDatabase.getAlimentacoes(aquario.id));
    setDiarios(LocalDatabase.getDiarios(aquario.id));
    setAnimais(LocalDatabase.getAnimais(aquario.id));
    setEventosAnimais(LocalDatabase.getEventosAnimal(undefined, aquario.id));
  }, [aquario.id]);

  // Modais de inclusão rápida
  const [showNovaAlimentacao, setShowNovaAlimentacao] = useState(false);
  const [showNovaManutencao, setShowNovaManutencao] = useState(false);
  const [showNovoDiario, setShowNovoDiario] = useState(false);

  // Form rápido de diário
  const [diarioTexto, setDiarioTexto] = useState('');
  const [diarioTags, setDiarioTags] = useState('Geral, Observação');

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');

  const paramMap = useMemo(() => {
    return new Map<string, Parametro>(parametros.map(p => [p.id, p]));
  }, [parametros]);

  const animalMap = useMemo(() => {
    return new Map<string, Animal>(animais.map((a: Animal) => [a.id, a]));
  }, [animais]);

  // Consolidar e ordenar decrescente todos os eventos
  const todosEventos: TimelineEventItem[] = useMemo(() => {
    const list: TimelineEventItem[] = [];

    // 1. Medições de Parâmetros
    medicoes.forEach(m => {
      const param = paramMap.get(m.parametro_id);
      const paramNome = param ? param.codigo : 'Parâmetro';
      const unidade = param ? param.unidade_canonica : '';
      list.push({
        id: `med-${m.id}`,
        categoria: 'parametro',
        timestamp: m.data_hora,
        titulo: `Medição: ${paramNome} = ${m.valor} ${unidade}`,
        subtitulo: `Método: ${m.metodo}${m.observacao ? ` • ${m.observacao}` : ''}`,
        icone: 'speed',
        corIcone: 'text-[#77dcce] bg-[#77dcce]/10',
        detalheBadge: paramNome,
        badgeCor: 'text-[#77dcce] bg-[#003732] border-[#77dcce]/40'
      });
    });

    // 2. Manutenções & TPAs
    manutencoes.forEach(man => {
      const isTpa = man.tipo === 'TPA';
      list.push({
        id: `man-${man.id}`,
        categoria: 'manutencao',
        timestamp: man.data,
        titulo: isTpa && man.volume_tpa ? `TPA Realizada (${man.volume_tpa}L)` : man.tipo,
        subtitulo: man.descricao + (man.sal_marca ? ` • Sal: ${man.sal_marca}` : ''),
        icone: isTpa ? 'water_drop' : 'build',
        corIcone: isTpa ? 'text-[#77dcce] bg-[#77dcce]/10' : 'text-[#8bcff2] bg-[#8bcff2]/10',
        detalheBadge: isTpa ? `${man.volume_tpa}L` : 'Manutenção',
        badgeCor: isTpa ? 'text-[#77dcce] bg-[#003732] border-[#77dcce]/40' : 'text-[#8bcff2] bg-[#002b40] border-[#8bcff2]/40'
      });
    });

    // 3. Alimentações
    alimentacoes.forEach(alim => {
      const animaisDestino = alim.animais_ids && alim.animais_ids.length > 0
        ? (alim.animais_ids.map(id => animalMap.get(id)?.nome_popular).filter(Boolean) as string[])
        : [];
      const isDirecionada = animaisDestino.length > 0;
      const descricaoAlvos = isDirecionada ? `Alvo: ${animaisDestino.join(', ')}` : 'Geral (Aquário todo)';

      list.push({
        id: `alim-${alim.id}`,
        categoria: 'alimentacao',
        timestamp: alim.data_hora,
        titulo: `Alimentação: ${alim.alimento}`,
        subtitulo: `Porção: ${alim.quantidade} • ${descricaoAlvos}${alim.observacao ? ` • ${alim.observacao}` : ''}`,
        icone: 'restaurant',
        corIcone: 'text-[#8bcff2] bg-[#8bcff2]/10',
        tags: isDirecionada ? animaisDestino : ['Geral', 'Fauna'],
        detalheBadge: isDirecionada ? (animaisDestino.length === 1 ? animaisDestino[0] : `${animaisDestino.length} animais`) : 'Geral',
        badgeCor: isDirecionada ? 'text-[#77dcce] bg-[#003732] border-[#77dcce]/40' : 'text-[#8bcff2] bg-[#002b40] border-[#8bcff2]/40'
      });
    });

    // 4. Diário & Observações
    diarios.forEach(dia => {
      list.push({
        id: `dia-${dia.id}`,
        categoria: 'diario',
        timestamp: `${dia.data}T12:00:00`,
        titulo: 'Registro no Diário',
        subtitulo: dia.texto,
        icone: 'edit_note',
        corIcone: 'text-[#8bcff2] bg-[#8bcff2]/10',
        tags: dia.tags,
        detalheBadge: 'Diário',
        badgeCor: 'text-[#d3e5f2] bg-[#1c2c35] border-[#273741]'
      });
    });

    // 5. Eventos da Fauna e Corais (Apenas animais do aquário ativo)
    eventosAnimais.forEach(ev => {
      const an = animalMap.get(ev.animal_id);
      if (!an) return; // NUNCA exibe eventos órfãos ou de animais pertencentes a outros aquários
      const nomeAnimal = an.nome_popular;
      list.push({
        id: `ev-an-${ev.id}`,
        categoria: 'animal',
        timestamp: `${ev.data}T10:00:00`,
        titulo: `${nomeAnimal}: ${ev.tipo_evento.toUpperCase()}`,
        subtitulo: ev.descricao,
        icone: ev.tipo_evento === 'reproducao' ? 'favorite' : ev.tipo_evento === 'doenca' ? 'medical_services' : 'set_meal',
        corIcone: ev.tipo_evento === 'doenca' ? 'text-[#ffb4ab] bg-[#ffb4ab]/10' : 'text-[#77dcce] bg-[#77dcce]/10',
        detalheBadge: nomeAnimal,
        badgeCor: 'text-[#77dcce] bg-[#003732] border-[#77dcce]/40'
      });
    });

    // Ordenar pelo mais recente primeiro
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [medicoes, manutencoes, alimentacoes, diarios, eventosAnimais, paramMap, animalMap]);

  // Filtragem
  const eventosFiltrados = useMemo(() => {
    return todosEventos.filter(ev => {
      const matchCat = filtroCategoria === 'todos' || ev.categoria === filtroCategoria;
      const q = busca.toLowerCase().trim();
      const matchBusca =
        !q ||
        ev.titulo.toLowerCase().includes(q) ||
        ev.subtitulo.toLowerCase().includes(q) ||
        ev.tags?.some(t => t.toLowerCase().includes(q));
      return matchCat && matchBusca;
    });
  }, [todosEventos, filtroCategoria, busca]);

  const handleSalvarDiario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diarioTexto.trim()) return;
    const tags = diarioTags.split(',').map(t => t.trim()).filter(Boolean);
    const novo = LocalDatabase.addDiario({
      aquario_id: aquario.id,
      data: new Date().toISOString().slice(0, 10),
      texto: diarioTexto.trim(),
      tags: tags.length ? tags : ['Geral']
    });
    setDiarios([novo, ...diarios]);
    setDiarioTexto('');
    setShowNovoDiario(false);
  };

  return (
    <div className="flex flex-col w-full px-3 gap-3 pb-24 pt-1 max-w-md mx-auto">
      {/* Header com Ações Rápidas de Inserção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-sm font-semibold text-[#d3e5f2] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#77dcce] text-[18px]">timeline</span>
            Linha do Tempo Geral
          </h2>
          <p className="text-xs text-[#879390]">Feed unificado de parâmetros, manejo e biologia</p>
        </div>
      </div>

      {/* Botões Rápidos de Registro */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={onOpenNovaMedicao}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#11212b] border border-[#273741] hover:border-[#77dcce] active:scale-95 transition-all text-center"
        >
          <span className="material-symbols-outlined text-[18px] text-[#77dcce]">speed</span>
          <span className="font-mono text-[9px] uppercase mt-1 text-[#d3e5f2]">Medição</span>
        </button>

        <button
          onClick={() => setShowNovaAlimentacao(true)}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#11212b] border border-[#273741] hover:border-[#8bcff2] active:scale-95 transition-all text-center"
        >
          <span className="material-symbols-outlined text-[18px] text-[#8bcff2]">restaurant</span>
          <span className="font-mono text-[9px] uppercase mt-1 text-[#d3e5f2]">Alimentar</span>
        </button>

        <button
          onClick={() => setShowNovaManutencao(true)}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#11212b] border border-[#273741] hover:border-[#77dcce] active:scale-95 transition-all text-center"
        >
          <span className="material-symbols-outlined text-[18px] text-[#77dcce]">build</span>
          <span className="font-mono text-[9px] uppercase mt-1 text-[#d3e5f2]">Manutenção</span>
        </button>

        <button
          onClick={() => setShowNovoDiario(true)}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#11212b] border border-[#273741] hover:border-[#8bcff2] active:scale-95 transition-all text-center"
        >
          <span className="material-symbols-outlined text-[18px] text-[#8bcff2]">edit_note</span>
          <span className="font-mono text-[9px] uppercase mt-1 text-[#d3e5f2]">Diário</span>
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="space-y-2">
        <div className="bg-[#0d1d26] border border-[#273741] rounded-lg px-2.5 py-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#879390]">search</span>
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Pesquisar em toda a linha do tempo..."
            className="w-full bg-transparent text-xs text-[#d3e5f2] placeholder-[#879390] outline-none"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-[#879390]">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Chips de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'todos', label: 'Tudo' },
            { id: 'parametro', label: 'Parâmetros' },
            { id: 'alimentacao', label: 'Alimentação' },
            { id: 'manutencao', label: 'Manutenção / TPA' },
            { id: 'diario', label: 'Diário' },
            { id: 'animal', label: 'Fauna & Corais' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroCategoria(f.id)}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] whitespace-nowrap transition-colors border ${
                filtroCategoria === f.id
                  ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-semibold'
                  : 'bg-[#0d1d26] border-[#273741] text-[#879390]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista da Linha do Tempo Estilo Feed */}
      <div className="space-y-2 mt-1">
        <div className="flex items-center justify-between text-[11px] text-[#879390] px-1 font-mono">
          <span>{eventosFiltrados.length} acontecimentos</span>
          <span>Ordem cronológica</span>
        </div>

        {eventosFiltrados.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#879390] bg-[#11212b] rounded-xl border border-[#273741]">
            Nenhum evento registrado nesta categoria.
          </div>
        ) : (
          <div className="relative pl-4 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#273741]">
            {eventosFiltrados.map(ev => {
              const dateObj = new Date(ev.timestamp);
              const dataFormatada = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
              const horaFormatada = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={ev.id} className="relative group">
                  {/* Ponto indicador na linha */}
                  <span className="absolute -left-[19px] top-3.5 w-2.5 h-2.5 rounded-full bg-[#11212b] border-2 border-[#77dcce] group-hover:scale-125 transition-transform" />

                  <div className="p-3 bg-[#11212b] border border-[#273741] hover:border-[#77dcce]/50 rounded-xl transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.corIcone}`}>
                          <span className="material-symbols-outlined text-[16px]">{ev.icone}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-sans text-xs font-semibold text-[#d3e5f2]">
                              {ev.titulo}
                            </span>
                            {ev.detalheBadge && (
                              <span className={`font-mono text-[9px] uppercase px-1.5 py-0.2 rounded border ${ev.badgeCor || 'text-[#879390] border-[#273741]'}`}>
                                {ev.detalheBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#bdc9c6] mt-0.5 leading-relaxed break-words">
                            {ev.subtitulo}
                          </p>

                          {ev.tags && ev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {ev.tags.map(t => (
                                <span key={t} className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#0d1d26] border border-[#273741] text-[#8bcff2]">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="font-mono text-[10px] text-[#77dcce] font-semibold">
                          {dataFormatada}
                        </span>
                        <span className="font-mono text-[9px] text-[#879390]">
                          {horaFormatada}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Nova Alimentação */}
      {showNovaAlimentacao && (
        <NovaAlimentacaoModal
          aquario={aquario}
          onClose={() => setShowNovaAlimentacao(false)}
          onSaved={(nova: Alimentacao) => {
            setAlimentacoes([nova, ...alimentacoes]);
            setShowNovaAlimentacao(false);
          }}
        />
      )}

      {/* Modal de Nova Manutenção / TPA */}
      {showNovaManutencao && (
        <NovaManutencaoModal
          aquario={aquario}
          onClose={() => setShowNovaManutencao(false)}
          onSaved={(nova: Manutencao) => {
            setManutencoes([nova, ...manutencoes]);
            setShowNovaManutencao(false);
          }}
        />
      )}

      {/* Modal de Novo Diário */}
      {showNovoDiario && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#273741] pb-2">
              <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">Nova Entrada no Diário</h3>
              <button onClick={() => setShowNovoDiario(false)} className="text-[#879390]">✕</button>
            </div>
            <form onSubmit={handleSalvarDiario} className="space-y-3">
              <textarea
                rows={3}
                required
                value={diarioTexto}
                onChange={e => setDiarioTexto(e.target.value)}
                placeholder="Observações de rotina, comportamento..."
                className="w-full bg-[#04151e] border border-[#273741] rounded-lg p-2 text-xs text-[#d3e5f2] outline-none"
              />
              <input
                type="text"
                value={diarioTags}
                onChange={e => setDiarioTags(e.target.value)}
                placeholder="Tags separadas por vírgula..."
                className="w-full bg-[#04151e] border border-[#273741] rounded-lg px-2.5 py-1.5 text-xs text-[#d3e5f2] outline-none font-mono"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNovoDiario(false)}
                  className="flex-1 py-2 rounded-lg bg-[#1c2c35] text-xs font-semibold text-[#bdc9c6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-[#77dcce] text-[#003732] text-xs font-semibold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
