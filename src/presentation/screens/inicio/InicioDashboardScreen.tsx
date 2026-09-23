import React, { useMemo, useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { calcularEstatisticasParametro, DIAS_LIMITE_ALERTA_SEM_TESTE, filtrarMedicoesAtivas } from '../../../domain/analytics_engine';
import { Alimentacao, Aquario, Parametro } from '../../../domain/models';
import { TabType } from '../../components/BottomNavBar';
import { NovaAlimentacaoModal } from '../diario/NovaAlimentacaoModal';

interface InicioDashboardScreenProps {
  aquario: Aquario;
  parametros: Parametro[];
  onOpenNovaMedicao: () => void;
  onSelectParametro: (p: Parametro) => void;
  onNavigateToTab: (tab: TabType) => void;
}

export const InicioDashboardScreen: React.FC<InicioDashboardScreenProps> = ({
  aquario,
  parametros,
  onOpenNovaMedicao,
  onSelectParametro,
  onNavigateToTab
}) => {
  const [showNovaAlimentacao, setShowNovaAlimentacao] = useState(false);
  const [alimentacoesLocais, setAlimentacoesLocais] = useState<Alimentacao[]>(
    LocalDatabase.getAlimentacoes(aquario.id)
  );

  const todasMedicoes = LocalDatabase.getMedicoes(aquario.id);
  const animais = LocalDatabase.getAnimais(aquario.id);
  const manutencoes = LocalDatabase.getManutencoes(aquario.id);
  const diarios = LocalDatabase.getDiarios(aquario.id);

  // Parâmetros com alerta de "Sem teste há mais de N dias"
  const parametrosEmAlerta = parametros.filter(p => {
    const stats = calcularEstatisticasParametro(p, todasMedicoes);
    return stats.requerTeste;
  });

  // Telemetria real: busca medição ativa mais recente de temperatura e salinidade
  const tempParam = parametros.find(p => p.codigo === 'TEMP' || p.codigo === 'Temp' || p.nome.toLowerCase().includes('temperatura'));
  const salParam = parametros.find(p => p.codigo === 'SAL' || p.codigo === 'Salinidade' || p.unidade_canonica === 'sg' || p.unidade_canonica === 'ppt');

  const ultMedicaoTemp = useMemo(() => {
    if (!tempParam) return null;
    const ativas = filtrarMedicoesAtivas(todasMedicoes.filter(m => m.parametro_id === tempParam.id));
    return ativas.length > 0 ? ativas[ativas.length - 1] : null;
  }, [tempParam, todasMedicoes]);

  const ultMedicaoSal = useMemo(() => {
    if (!salParam) return null;
    const ativas = filtrarMedicoesAtivas(todasMedicoes.filter(m => m.parametro_id === salParam.id));
    return ativas.length > 0 ? ativas[ativas.length - 1] : null;
  }, [salParam, todasMedicoes]);

  const tempStats = tempParam ? calcularEstatisticasParametro(tempParam, todasMedicoes) : null;
  const salStats = salParam ? calcularEstatisticasParametro(salParam, todasMedicoes) : null;

  // Contadores de fauna baseados na categoria explícita com fallback
  const peixesCount = useMemo(() => {
    return animais
      .filter(a => (a.categoria ? a.categoria === 'peixe' : a.tipo === 'individuo'))
      .reduce((acc, a) => acc + (a.quantidade || 1), 0);
  }, [animais]);

  const invertCount = useMemo(() => {
    return animais
      .filter(a => {
        if (a.categoria) return a.categoria === 'invertebrado';
        const txt = (a.nome_popular + ' ' + a.especie).toLowerCase();
        return txt.includes('limpeza') || txt.includes('snail') || txt.includes('nassarius') || txt.includes('camar') || txt.includes('turbo') || txt.includes('eremita');
      })
      .reduce((acc, a) => acc + (a.quantidade || 1), 0);
  }, [animais]);

  const coraisCount = useMemo(() => {
    return animais
      .filter(a => {
        if (a.categoria) return a.categoria === 'coral';
        const txt = (a.nome_popular + ' ' + a.especie).toLowerCase();
        return txt.includes('coral') || txt.includes('acropora') || txt.includes('zoanthus') || txt.includes('euphyllia');
      })
      .reduce((acc, a) => acc + (a.quantidade || 1), 0);
  }, [animais]);

  const gruposCount = useMemo(() => {
    return animais.filter(a => a.tipo === 'grupo').length;
  }, [animais]);

  // Últimos eventos consolidados 100% REAIS a partir das tabelas do modelo
  const eventosRecentes = useMemo(() => {
    const list: Array<{
      id: string;
      dataHora: string;
      titulo: string;
      subtitulo: string;
      data: string;
      icone: string;
      cor: string;
    }> = [];

    // 1. Manutenções reais
    manutencoes.forEach(m => {
      const isTpa = m.tipo === 'TPA';
      list.push({
        id: `man-${m.id}`,
        dataHora: m.data,
        titulo: isTpa && m.volume_tpa ? `TPA Realizada (${m.volume_tpa}L)` : m.tipo,
        subtitulo: isTpa && m.sal_marca ? `${m.descricao} • Sal: ${m.sal_marca}` : m.descricao,
        data: new Date(m.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        icone: isTpa ? 'water_drop' : 'build',
        cor: isTpa ? 'text-[#77dcce] bg-[#77dcce]/10' : 'text-[#8bcff2] bg-[#273741]'
      });
    });

    // 2. Alimentações reais
    alimentacoesLocais.forEach(al => {
      list.push({
        id: `alim-${al.id}`,
        dataHora: al.data_hora,
        titulo: 'Alimentação',
        subtitulo: `${al.alimento} • ${al.quantidade}`,
        data: new Date(al.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        icone: 'restaurant',
        cor: 'text-[#8bcff2] bg-[#8bcff2]/10'
      });
    });

    // 3. Medições ativas recentes
    const ativas = filtrarMedicoesAtivas(todasMedicoes);
    ativas.slice(-4).forEach(m => {
      const p = parametros.find(item => item.id === m.parametro_id);
      if (p) {
        list.push({
          id: `med-${m.id}`,
          dataHora: m.data_hora,
          titulo: `Medição de ${p.codigo}: ${m.valor} ${p.unidade_canonica}`,
          subtitulo: `Método: ${m.metodo}${m.observacao ? ` • ${m.observacao}` : ''}`,
          data: new Date(m.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          icone: 'speed',
          cor: 'text-[#77dcce] bg-[#77dcce]/10'
        });
      }
    });

    // 4. Diário recente
    diarios.forEach(d => {
      list.push({
        id: `dia-${d.id}`,
        dataHora: `${d.data}T12:00:00`,
        titulo: 'Nota no Diário',
        subtitulo: d.texto,
        data: new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        icone: 'edit_note',
        cor: 'text-[#8bcff2] bg-[#8bcff2]/10'
      });
    });

    // Ordenar do mais recente para o mais antigo e limitar a 4
    return list
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .slice(0, 4);
  }, [manutencoes, alimentacoesLocais, todasMedicoes, parametros, diarios]);

  return (
    <div className="flex flex-col w-full px-3 gap-3 pb-24 pt-1">
      {/* Tank Live Status Bar (Instrument Well) */}
      <section className="flex flex-col bg-[#11212b] border border-[#273741] rounded-lg p-3 gap-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#77dcce] animate-pulse flex-shrink-0" />
            <span className="font-sans text-sm font-semibold text-[#d3e5f2] truncate">
              {aquario.nome}
            </span>
            <span className="font-mono text-[10px] text-[#bdc9c6] uppercase px-1.5 py-0.5 rounded bg-[#0d1d26] border border-[#273741]">
              {aquario.tipo_sistema} • {aquario.volume_sistema}L
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#77dcce] font-semibold flex-shrink-0">
            SISTEMA ATIVO
          </span>
        </div>

        {/* Live Quick Telemetry Strip - Dados Reais da Base */}
        <div className="grid grid-cols-2 gap-2">
          {/* Temperatura */}
          <div className="flex items-center justify-between bg-[#0d1d26] border border-[#273741] rounded px-2.5 py-1.5">
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[9px] text-[#879390] uppercase">Temperatura</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-semibold text-[#d3e5f2]">
                  {ultMedicaoTemp ? ultMedicaoTemp.valor.toFixed(1) : '--'}
                </span>
                <span className="font-mono text-[10px] text-[#879390]">
                  {tempParam?.unidade_canonica || '°C'}
                </span>
              </div>
            </div>
            {tempStats ? (
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  tempStats.statusFaixa === 'nominal'
                    ? 'text-[#77dcce] bg-[#77dcce]/10'
                    : tempStats.statusFaixa === 'critico'
                    ? 'text-[#ffb4ab] bg-[#93000a]/30'
                    : 'text-[#ffbca0] bg-[#f49971]/10'
                }`}
              >
                {tempStats.statusFaixa === 'nominal' ? 'OK' : tempStats.statusFaixa}
              </span>
            ) : (
              <span className="font-mono text-[10px] text-[#879390] bg-[#1c2c35] px-1.5 py-0.5 rounded">
                S/D
              </span>
            )}
          </div>

          {/* Salinidade */}
          <div className="flex items-center justify-between bg-[#0d1d26] border border-[#273741] rounded px-2.5 py-1.5">
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[9px] text-[#879390] uppercase">Salinidade</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-semibold text-[#d3e5f2]">
                  {ultMedicaoSal ? ultMedicaoSal.valor.toFixed(3) : '--'}
                </span>
                <span className="font-mono text-[10px] text-[#879390]">
                  {salParam?.unidade_canonica || 'sg'}
                </span>
              </div>
            </div>
            {salStats ? (
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  salStats.statusFaixa === 'nominal'
                    ? 'text-[#77dcce] bg-[#77dcce]/10'
                    : salStats.statusFaixa === 'critico'
                    ? 'text-[#ffb4ab] bg-[#93000a]/30'
                    : 'text-[#ffbca0] bg-[#f49971]/10'
                }`}
              >
                {salStats.statusFaixa === 'nominal' ? 'OK' : salStats.statusFaixa}
              </span>
            ) : (
              <span className="font-mono text-[10px] text-[#879390] bg-[#1c2c35] px-1.5 py-0.5 rounded">
                S/D
              </span>
            )}
          </div>
        </div>

        {/* Barra de Ações Rápidas do Aquarista */}
        <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-[#1c2c35]">
          <button
            type="button"
            onClick={onOpenNovaMedicao}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0d1d26] hover:bg-[#162732] border border-[#273741] hover:border-[#77dcce]/50 text-[#77dcce] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">speed</span>
            <span className="font-mono text-[9px] font-semibold uppercase mt-0.5">+ Medição</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNovaAlimentacao(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0d1d26] hover:bg-[#162732] border border-[#273741] hover:border-[#8bcff2]/50 text-[#8bcff2] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">restaurant</span>
            <span className="font-mono text-[9px] font-semibold uppercase mt-0.5">+ Dieta</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('diario')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0d1d26] hover:bg-[#162732] border border-[#273741] hover:border-[#d3e5f2]/50 text-[#d3e5f2] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">build</span>
            <span className="font-mono text-[9px] font-semibold uppercase mt-0.5">+ TPA / Log</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('equipamentos')}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#0d1d26] hover:bg-[#162732] border border-[#273741] hover:border-[#ffbca0]/50 text-[#ffbca0] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
            <span className="font-mono text-[9px] font-semibold uppercase mt-0.5">Hardware</span>
          </button>
        </div>
      </section>

      {/* Section: Parâmetros de Água */}
      <section className="flex flex-col bg-[#11212b] border border-[#273741] rounded-lg p-3 gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#77dcce] text-[18px]">science</span>
            <h2 className="font-sans text-xs font-semibold text-[#d3e5f2] uppercase tracking-wider">
              Parâmetros de Água
            </h2>
          </div>
          <button
            onClick={onOpenNovaMedicao}
            type="button"
            className="flex items-center gap-1 bg-[#5ac0b3] hover:bg-[#77dcce] active:scale-95 transition-all text-[#004c45] px-2.5 py-1 rounded-lg font-sans text-xs font-bold shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ Medir</span>
          </button>
        </div>

        {/* Inline Alert Banner (se houver testes pendentes) */}
        {parametrosEmAlerta.length > 0 && (
          <div className="flex items-start gap-2 bg-[#f49971]/10 border border-[#f49971]/30 text-[#ffbca0] rounded p-2.5">
            <span className="material-symbols-outlined text-[#ffbca0] text-[18px] flex-shrink-0 mt-0.5">
              warning
            </span>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-semibold text-[#ffbca0]">
                Atenção: Testes Pendentes
              </span>
              <p className="text-xs text-[#bdc9c6] mt-0.5">
                {parametrosEmAlerta.map(p => p.codigo).join(', ')} sem medição registrada há mais de {DIAS_LIMITE_ALERTA_SEM_TESTE} dias.
              </p>
            </div>
          </div>
        )}

        {/* Telemetry Parameter Grid List */}
        <div className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded-lg divide-y divide-[#1c2c35]">
          {parametros.slice(0, 8).map(param => {
            const stats = calcularEstatisticasParametro(param, todasMedicoes);
            const ult = stats.ultimaMedicao;
            const pendente = stats.requerTeste;

            return (
              <div
                key={param.id}
                onClick={() => onSelectParametro(param)}
                className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#11212b] transition-colors ${
                  pendente ? 'bg-[#f49971]/5' : ''
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-xs font-medium text-[#d3e5f2]">
                      {param.codigo} {param.codigo !== param.nome ? `(${param.nome.split(' ')[0]})` : ''}
                    </span>
                    {pendente && (
                      <span className="font-mono text-[9px] text-[#ffbca0] px-1 py-0.2 rounded bg-[#ffbca0]/10 border border-[#ffbca0]/30">
                        {stats.diasSemMedicao >= 999 ? 'Sem dados' : `${stats.diasSemMedicao}d atrás`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[#879390]">
                    {pendente ? (
                      <span className="text-[#ffbca0]">? Medição pendente</span>
                    ) : stats.deltaRecente !== null ? (
                      <span className="text-[#8bcff2]">
                        {stats.deltaRecente >= 0 ? `+${stats.deltaRecente}` : stats.deltaRecente}
                      </span>
                    ) : (
                      <span>↔ estável</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <span className={`font-mono text-sm font-semibold ${pendente ? 'text-[#ffbca0]' : 'text-[#d3e5f2]'}`}>
                      {ult ? ult.valor : '--'}
                    </span>
                    <span className="font-mono text-[9px] text-[#879390] ml-0.5">
                      {param.unidade_canonica}
                    </span>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      pendente ? 'bg-[#f49971] animate-ping' : 'bg-[#77dcce]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Fauna & Corais (Resumo) */}
      <section className="flex flex-col bg-[#11212b] border border-[#273741] rounded-lg p-3 gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#8bcff2] text-[18px]">water_drop</span>
            <h2 className="font-sans text-xs font-semibold text-[#d3e5f2] uppercase tracking-wider">
              Fauna & Corais (Resumo)
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#77dcce] uppercase">Biomassa OK</span>
        </div>

        {/* 4-Column Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Peixes */}
          <div
            onClick={() => onNavigateToTab('animais')}
            className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded p-2.5 cursor-pointer hover:border-[#77dcce]/50 transition-colors"
          >
            <div className="flex items-center justify-between text-[#879390]">
              <span className="font-mono text-[9px] uppercase">Peixes</span>
              <span className="material-symbols-outlined text-[15px] text-[#77dcce]">set_meal</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{peixesCount}</span>
              <span className="font-mono text-[9px] text-[#879390]">indivíduos</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">
              {animais.filter(a => a.categoria === 'peixe' || (!a.categoria && a.tipo === 'individuo')).map(a => a.nome_popular).slice(0, 2).join(', ') || 'Nenhum peixe'}
            </span>
          </div>

          {/* Invert */}
          <div
            onClick={() => onNavigateToTab('animais')}
            className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded p-2.5 cursor-pointer hover:border-[#77dcce]/50 transition-colors"
          >
            <div className="flex items-center justify-between text-[#879390]">
              <span className="font-mono text-[9px] uppercase">Invert.</span>
              <span className="material-symbols-outlined text-[15px] text-[#8bcff2]">pest_control</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{invertCount}</span>
              <span className="font-mono text-[9px] text-[#879390]">limpeza</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">
              {animais.filter(a => a.categoria === 'invertebrado').map(a => a.nome_popular).slice(0, 2).join(', ') || 'Nenhum invertebrado'}
            </span>
          </div>

          {/* Corais */}
          <div
            onClick={() => onNavigateToTab('animais')}
            className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded p-2.5 cursor-pointer hover:border-[#77dcce]/50 transition-colors"
          >
            <div className="flex items-center justify-between text-[#879390]">
              <span className="font-mono text-[9px] uppercase">Corais</span>
              <span className="material-symbols-outlined text-[15px] text-[#ffbca0]">spa</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{coraisCount}</span>
              <span className="font-mono text-[9px] text-[#879390]">mudas/col.</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">
              {animais.filter(a => a.categoria === 'coral').map(a => a.nome_popular).slice(0, 2).join(', ') || 'Nenhum coral'}
            </span>
          </div>

          {/* Grupos */}
          <div
            onClick={() => onNavigateToTab('animais')}
            className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded p-2.5 cursor-pointer hover:border-[#77dcce]/50 transition-colors"
          >
            <div className="flex items-center justify-between text-[#879390]">
              <span className="font-mono text-[9px] uppercase">Grupos</span>
              <span className="material-symbols-outlined text-[15px] text-[#73d7ca]">diversity_2</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{gruposCount}</span>
              <span className="font-mono text-[9px] text-[#879390]">cardumes</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">
              {animais.filter(a => a.tipo === 'grupo').map(a => a.nome_popular).slice(0, 1).join(', ') || 'Nenhum grupo'}
            </span>
          </div>
        </div>
      </section>

      {/* Section: Últimos Eventos */}
      <section className="flex flex-col bg-[#11212b] border border-[#273741] rounded-lg p-3 gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#879390] text-[18px]">history</span>
            <h2 className="font-sans text-xs font-semibold text-[#d3e5f2] uppercase tracking-wider">
              Últimos Eventos
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('timeline')}
            className="font-mono text-xs text-[#77dcce] hover:underline flex items-center gap-0.5"
          >
            <span>Ver tudo</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {eventosRecentes.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#879390] bg-[#0d1d26] border border-[#273741] rounded-lg">
            Nenhum evento registrado ainda neste aquário.
          </div>
        ) : (
          <div className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded-lg divide-y divide-[#1c2c35]">
            {eventosRecentes.map(ev => (
              <div key={ev.id} className="flex items-start gap-2.5 p-2.5">
                <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.cor}`}>
                  <span className="material-symbols-outlined text-[16px]">{ev.icone}</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-sans text-xs font-medium text-[#d3e5f2] truncate">
                      {ev.titulo}
                    </span>
                    <span className="font-mono text-[10px] text-[#879390] flex-shrink-0">{ev.data}</span>
                  </div>
                  <p className="text-xs text-[#879390] mt-0.5 truncate">{ev.subtitulo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Registrar Alimentação */}
      {showNovaAlimentacao && (
        <NovaAlimentacaoModal
          aquario={aquario}
          onClose={() => setShowNovaAlimentacao(false)}
          onSaved={novaAlim => {
            setAlimentacoesLocais([novaAlim, ...alimentacoesLocais]);
            setShowNovaAlimentacao(false);
          }}
        />
      )}
    </div>
  );
};
