import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { calcularEstatisticasParametro } from '../../../domain/analytics_engine';
import { Aquario, Parametro } from '../../../domain/models';

interface DetalheParametroScreenProps {
  aquario: Aquario;
  parametro: Parametro;
  onBack: () => void;
  onRefresh: () => void;
}

export const DetalheParametroScreen: React.FC<DetalheParametroScreenProps> = ({
  aquario,
  parametro,
  onBack,
  onRefresh
}) => {
  const [janelaDias, setJanelaDias] = useState<number>(7);
  const [showNovoRegistroModal, setShowNovoRegistroModal] = useState<boolean>(false);
  const [novoValor, setNovoValor] = useState<string>('');
  const [novoMetodo, setNovoMetodo] = useState<string>(parametro.metodo_padrao || 'Titulação Salifert');
  const [novaObservacao, setNovaObservacao] = useState<string>('');
  const [corrigirMedicaoId, setCorrigirMedicaoId] = useState<string | null>(null);

  const todasMedicoes = LocalDatabase.getMedicoes(aquario.id).filter(m => m.parametro_id === parametro.id);
  const stats = calcularEstatisticasParametro(parametro, todasMedicoes, janelaDias);

  // Ordenar para a lista de histórico (do mais recente para o mais antigo)
  const historicoOrdenado = [...todasMedicoes].sort(
    (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
  );

  // Pontos para o gráfico SVG
  const pontosAtivosParaGrafico = todasMedicoes
    .filter(m => !todasMedicoes.some(other => other.corrige_medicao_id === m.id))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  // Salvar registro novo ou corretor
  const handleSalvarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(novoValor);
    if (isNaN(val)) return;

    LocalDatabase.addMedicao({
      aquario_id: aquario.id,
      parametro_id: parametro.id,
      valor: val,
      data_hora: new Date().toISOString().slice(0, 19),
      metodo: novoMetodo,
      observacao: novaObservacao.trim() || undefined,
      corrige_medicao_id: corrigirMedicaoId
    });

    setShowNovoRegistroModal(false);
    setNovoValor('');
    setNovaObservacao('');
    setCorrigirMedicaoId(null);
    onRefresh();
  };

  const abrirCorrecao = (m: any) => {
    setCorrigirMedicaoId(m.id);
    setNovoValor(m.valor.toString());
    setNovoMetodo(m.metodo || parametro.metodo_padrao || '');
    setNovaObservacao(`Correção do registro anterior (${m.valor} ${parametro.unidade_canonica})`);
    setShowNovoRegistroModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#04151e] text-[#d3e5f2] pb-24">
      <div className="p-3 space-y-3 max-w-md mx-auto w-full">
        {/* Summary Card (Top Metric) */}
        <section className="bg-[#11212b] border border-[#273741] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#77dcce] animate-pulse" />
              <span className="font-mono text-[10px] text-[#bdc9c6] uppercase tracking-wider">
                CANAL • {parametro.nome.toUpperCase()}
              </span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#77dcce]/10 border border-[#77dcce]/30 text-[#77dcce] uppercase font-semibold">
              {stats.statusFaixa === 'nominal' ? 'ESTÁVEL' : stats.statusFaixa === 'critico' ? 'FORA DA FAIXA' : 'ATENÇÃO'}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-[42px] leading-tight font-semibold tracking-tight text-[#d3e5f2]">
              {stats.ultimaMedicao ? stats.ultimaMedicao.valor : '--'}
            </span>
            <span className="font-mono text-[16px] text-[#77dcce] font-medium">
              {parametro.unidade_canonica}
            </span>
          </div>

          {/* Sub-bar */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0d1d26] border border-[#273741] text-[#d3e5f2]">
              <span className="material-symbols-outlined text-[14px] text-[#77dcce]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="text-xs font-medium">
                Faixa segura ({parametro.alvo_min} - {parametro.alvo_max} {parametro.unidade_canonica})
              </span>
            </div>
            {stats.deltaRecente !== null && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#005e7d]/30 border border-[#005e7d]/50 text-[#8bcff2]">
                <span className="material-symbols-outlined text-[14px]">
                  {stats.deltaRecente >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                <span className="font-mono text-xs">
                  {stats.deltaRecente >= 0 ? `+${stats.deltaRecente}` : stats.deltaRecente} {parametro.unidade_canonica}
                  {stats.deltaPeriodoHoras ? ` (${stats.deltaPeriodoHoras}h)` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Biological / Statistical Advisory (Aviso de dados insuficientes) */}
          {stats.dadosInsuficientes ? (
            <div className="mt-3 p-2.5 rounded bg-[#011019] border border-[#f49971]/30 text-[#bdc9c6] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#ffbca0] text-[18px] flex-shrink-0 mt-0.5">
                warning
              </span>
              <p className="text-xs leading-relaxed">
                <strong className="text-[#ffbca0] font-semibold">Atenção:</strong> Apenas {stats.pontosValidosNaJanela} {stats.pontosValidosNaJanela === 1 ? 'medição registrada' : 'medições registradas'} no período. O cálculo de tendência requer no mínimo 4 pontos para maior precisão estequiométrica.
              </p>
            </div>
          ) : null}
        </section>

        {/* Time Horizon Selector */}
        <section className="flex p-1 bg-[#0d1d26] border border-[#273741] rounded-lg gap-1">
          {[
            { dias: 7, label: '7 Dias' },
            { dias: 30, label: '30 Dias' },
            { dias: 90, label: '90 Dias' },
            { dias: 365, label: '1 Ano' },
            { dias: 9999, label: 'Tudo' }
          ].map(opt => (
            <button
              key={opt.dias}
              onClick={() => setJanelaDias(opt.dias)}
              className={`flex-1 py-1.5 rounded text-center font-mono text-xs transition-all ${
                janelaDias === opt.dias
                  ? 'bg-[#5ac0b3] text-[#004c45] font-bold shadow'
                  : 'text-[#bdc9c6] hover:text-[#d3e5f2]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </section>

        {/* Telemetry Chart */}
        <section className="bg-[#11212b] border border-[#273741] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#879390] text-[16px]">show_chart</span>
              <h2 className="font-mono text-[10px] text-[#879390] uppercase tracking-widest">
                CURVA DE DENSIDADE IÔNICA
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-[10px] text-[#879390]">
                <span className="w-2.5 h-1 bg-[#77dcce]/40 rounded-sm"></span> Faixa {parametro.alvo_min}-{parametro.alvo_max}
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-[#8bcff2]">
                <span className="w-2 h-0.5 bg-[#8bcff2]"></span> Alvo {parametro.alvo}
              </span>
            </div>
          </div>

          {/* SVG Matrix Plot */}
          <div className="relative w-full h-44 bg-[#011019] border border-[#273741] rounded-lg p-2 overflow-hidden flex flex-col justify-between">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 320 140">
              <defs>
                <linearGradient id="paramGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#77dcce" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#77dcce" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas de grade de fundo */}
              <line x1="28" y1="20" x2="315" y2="20" stroke="#273741" strokeDasharray="2,2" strokeWidth="1" />
              <line x1="28" y1="50" x2="315" y2="50" stroke="#273741" strokeDasharray="2,2" strokeWidth="1" />
              <line x1="28" y1="80" x2="315" y2="80" stroke="#273741" strokeDasharray="2,2" strokeWidth="1" />
              <line x1="28" y1="110" x2="315" y2="110" stroke="#273741" strokeDasharray="2,2" strokeWidth="1" />

              {/* Faixa segura colorida */}
              <rect x="28" y="30" width="287" height="65" fill="#77dcce" fillOpacity="0.07" />

              {/* Linha Alvo Ideal */}
              <line x1="28" y1="62" x2="315" y2="62" stroke="#8bcff2" strokeDasharray="4,3" strokeWidth="1.2" />

              {/* Plot da curva de dados com pontos reais */}
              {pontosAtivosParaGrafico.length >= 2 ? (
                (() => {
                  const minV = Math.min(...pontosAtivosParaGrafico.map(p => p.valor), parametro.alvo_min * 0.95);
                  const maxV = Math.max(...pontosAtivosParaGrafico.map(p => p.valor), parametro.alvo_max * 1.05);
                  const range = maxV - minV || 1;

                  const coords = pontosAtivosParaGrafico.map((pt, idx) => {
                    const x = 35 + (idx / (pontosAtivosParaGrafico.length - 1)) * 270;
                    const y = 120 - ((pt.valor - minV) / range) * 95;
                    return { x, y, val: pt.valor, data: pt.data_hora };
                  });

                  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                  const areaD = `${pathD} L ${coords[coords.length - 1].x} 128 L ${coords[0].x} 128 Z`;

                  return (
                    <g>
                      <path d={areaD} fill="url(#paramGrad)" />
                      <path d={pathD} fill="none" stroke="#77dcce" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {coords.map((c, i) => (
                        <circle
                          key={i}
                          cx={c.x}
                          cy={c.y}
                          r={i === coords.length - 1 ? 4.5 : 3.5}
                          fill={i === coords.length - 1 ? '#77dcce' : '#04151e'}
                          stroke="#77dcce"
                          strokeWidth="2"
                        />
                      ))}
                    </g>
                  );
                })()
              ) : (
                <text x="160" y="70" fill="#879390" textAnchor="middle" className="font-mono text-xs">
                  Aguardando mais medições para traçar curva
                </text>
              )}

              {/* Escala vertical */}
              <text x="2" y="24" fill="#879390" fontSize="8" className="font-mono">
                {parametro.alvo_max}
              </text>
              <text x="2" y="64" fill="#8bcff2" fontSize="8" className="font-mono">
                {parametro.alvo}
              </text>
              <text x="2" y="104" fill="#879390" fontSize="8" className="font-mono">
                {parametro.alvo_min}
              </text>
            </svg>

            {/* Eixo de datas inferior */}
            <div className="flex justify-between pl-7 pr-1 text-[9px] font-mono text-[#879390]">
              {pontosAtivosParaGrafico.slice(-5).map((pt, i) => (
                <span key={i} className={i === pontosAtivosParaGrafico.slice(-5).length - 1 ? 'text-[#77dcce] font-bold' : ''}>
                  {new Date(pt.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 2x2 Analytical Statistics Grid */}
        <section className="grid grid-cols-2 gap-2">
          <div className="bg-[#11212b] border border-[#273741] rounded-lg p-3 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-[#879390] uppercase tracking-wider">
              MÉDIA ({janelaDias >= 999 ? 'GERAL' : `${janelaDias} DIAS`})
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">
                {stats.media !== null ? stats.media : '--'}
              </span>
              <span className="font-mono text-xs text-[#879390]">{parametro.unidade_canonica}</span>
            </div>
            <span className="text-xs text-[#77dcce] mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">balance</span>
              Referência ideal
            </span>
          </div>

          <div className="bg-[#11212b] border border-[#273741] rounded-lg p-3 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-[#879390] uppercase tracking-wider">
              VARIAÇÃO MÁX/DIA
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">
                {stats.variacaoPorDia !== null ? `±${stats.variacaoPorDia}` : '±0.00'}
              </span>
              <span className="font-mono text-xs text-[#879390]">{parametro.unidade_canonica}</span>
            </div>
            <span className="text-xs text-[#8bcff2] mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">speed</span>
              Taxa sob controle
            </span>
          </div>

          <div className="bg-[#11212b] border border-[#273741] rounded-lg p-3 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-[#879390] uppercase tracking-wider">
              MÍNIMO REGISTRADO
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">
                {stats.minimo !== null ? stats.minimo : '--'}
              </span>
              <span className="font-mono text-xs text-[#879390]">{parametro.unidade_canonica}</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-1">
              {stats.minimoData ? new Date(stats.minimoData).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem histórico'}
            </span>
          </div>

          <div className="bg-[#11212b] border border-[#273741] rounded-lg p-3 flex flex-col justify-between">
            <span className="font-mono text-[10px] text-[#879390] uppercase tracking-wider">
              MÁXIMO REGISTRADO
            </span>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">
                {stats.maximo !== null ? stats.maximo : '--'}
              </span>
              <span className="font-mono text-xs text-[#879390]">{parametro.unidade_canonica}</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-1">
              {stats.maximoData ? new Date(stats.maximoData).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem histórico'}
            </span>
          </div>
        </section>

        {/* Laboratory Log: Historical Test Records */}
        <section className="bg-[#11212b] border border-[#273741] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#77dcce] text-[18px]">biotech</span>
              <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                Histórico de medições recentes
              </h3>
            </div>
            <button
              onClick={() => {
                setCorrigirMedicaoId(null);
                setNovoValor('');
                setNovaObservacao('');
                setShowNovoRegistroModal(true);
              }}
              className="flex items-center gap-1 font-mono text-xs text-[#77dcce] hover:text-[#8ff4e6] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Adicionar</span>
            </button>
          </div>

          <div className="space-y-2">
            {historicoOrdenado.length === 0 ? (
              <p className="text-xs text-[#879390] py-3 text-center">Nenhuma medição registrada ainda.</p>
            ) : (
              historicoOrdenado.map(m => {
                const foiCorrigido = todasMedicoes.some(other => other.corrige_medicao_id === m.id);
                const ehCorrecao = !!m.corrige_medicao_id;

                return (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded border transition-all ${
                      foiCorrigido
                        ? 'bg-[#0d1d26]/40 border-[#273741]/50 opacity-60'
                        : 'bg-[#011019] border-[#273741] hover:border-[#77dcce]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-[#d3e5f2]">
                            {new Date(m.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[#879390] font-mono text-[11px]">
                            {new Date(m.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#273741] text-[#bdc9c6]">
                            {m.metodo || 'Laboratório'}
                          </span>
                          {foiCorrigido && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/30">
                              Corrigido
                            </span>
                          )}
                          {ehCorrecao && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#77dcce]/20 text-[#77dcce] border border-[#77dcce]/30">
                              Retificação
                            </span>
                          )}
                        </div>
                        {m.observacao && (
                          <p className="text-xs text-[#879390] mt-1">{m.observacao}</p>
                        )}
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-baseline">
                          <span className={`font-mono text-base font-semibold ${foiCorrigido ? 'line-through text-[#879390]' : 'text-[#77dcce]'}`}>
                            {m.valor}
                          </span>
                          <span className="font-mono text-[10px] text-[#879390] ml-0.5">
                            {parametro.unidade_canonica}
                          </span>
                        </div>

                        {!foiCorrigido && (
                          <button
                            onClick={() => abrirCorrecao(m)}
                            className="mt-1 text-[10px] font-mono text-[#8bcff2] hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[12px]">edit</span>
                            Corrigir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Action Bar */}
        <section className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onBack}
            className="w-full py-3 px-3 rounded-lg bg-[#1c2c35] border border-[#273741] text-[#d3e5f2] font-sans text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#273741] active:scale-[0.99] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Voltar ao Console</span>
          </button>
          <button
            onClick={() => {
              setCorrigirMedicaoId(null);
              setNovoValor('');
              setNovaObservacao('');
              setShowNovoRegistroModal(true);
            }}
            className="w-full py-3 px-3 rounded-lg bg-[#77dcce] text-[#003732] font-sans text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#5ac0b3] active:scale-[0.99] transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">science</span>
            <span>Novo Registro</span>
          </button>
        </section>
      </div>

      {/* Modal para Novo Registro / Correção */}
      {showNovoRegistroModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#11212b] border border-[#273741] w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-3.5 border-b border-[#273741] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#77dcce] text-[20px]">
                  {corrigirMedicaoId ? 'change_circle' : 'add_chart'}
                </span>
                <h3 className="font-sans text-sm font-semibold text-[#d3e5f2]">
                  {corrigirMedicaoId ? `Corrigir Medição (${parametro.codigo})` : `Registrar Medição de ${parametro.codigo}`}
                </h3>
              </div>
              <button
                onClick={() => setShowNovoRegistroModal(false)}
                className="w-8 h-8 rounded-lg bg-[#1c2c35] text-[#bdc9c6] hover:text-[#d3e5f2] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSalvarRegistro} className="p-4 space-y-3">
              {corrigirMedicaoId && (
                <div className="p-2.5 rounded bg-[#011019] border border-[#77dcce]/30 text-xs text-[#8bcff2]">
                  <strong>Regra de Imutabilidade:</strong> O valor original não será apagado, mas sim preservado no histórico e associado a esta retificação.
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Valor ({parametro.unidade_canonica})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder={`Ex: ${parametro.alvo}`}
                  value={novoValor}
                  onChange={e => setNovoValor(e.target.value)}
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-base text-[#d3e5f2] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Método / Teste Usado
                </label>
                <input
                  type="text"
                  value={novoMetodo}
                  onChange={e => setNovoMetodo(e.target.value)}
                  placeholder="Ex: Salifert, Hanna Checker, Sonda Digital"
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[#bdc9c6] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={novaObservacao}
                  onChange={e => setNovaObservacao(e.target.value)}
                  placeholder="Ex: Teste feito 30 min após dosagem..."
                  className="w-full bg-[#04151e] border border-[#273741] focus:border-[#77dcce] rounded-lg px-3 py-2 text-xs text-[#d3e5f2] outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovoRegistroModal(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#1c2c35] text-[#d3e5f2] font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-[#77dcce] text-[#003732] font-semibold text-xs"
                >
                  {corrigirMedicaoId ? 'Salvar Correção' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
