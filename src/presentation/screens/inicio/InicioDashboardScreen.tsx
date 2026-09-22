import React from 'react';
import { LocalDatabase } from '../../../data/database';
import { calcularEstatisticasParametro } from '../../../domain/analytics_engine';
import { Aquario, Parametro } from '../../../domain/models';

interface InicioDashboardScreenProps {
  aquario: Aquario;
  parametros: Parametro[];
  onOpenNovaMedicao: () => void;
  onSelectParametro: (p: Parametro) => void;
  onNavigateToTab: (tab: 'inicio' | 'parametros' | 'animais' | 'diario') => void;
}

export const InicioDashboardScreen: React.FC<InicioDashboardScreenProps> = ({
  aquario,
  parametros,
  onOpenNovaMedicao,
  onSelectParametro,
  onNavigateToTab
}) => {
  const todasMedicoes = LocalDatabase.getMedicoes(aquario.id);
  const animais = LocalDatabase.getAnimais(aquario.id);
  const manutencoes = LocalDatabase.getManutencoes(aquario.id);
  const alimentacoes = LocalDatabase.getAlimentacoes(aquario.id);

  // Parâmetros com alerta de "Sem teste há mais de 10 dias"
  const parametrosEmAlerta = parametros.filter(p => {
    const stats = calcularEstatisticasParametro(p, todasMedicoes);
    return stats.requerTeste;
  });

  // Contadores de fauna
  const peixesCount = animais
    .filter(a => a.tipo === 'individuo')
    .reduce((acc, a) => acc + (a.quantidade || 1), 0);
  const invertCount = animais
    .filter(a => a.nome_popular.toLowerCase().includes('limpeza') || a.especie.toLowerCase().includes('nassarius'))
    .reduce((acc, a) => acc + (a.quantidade || 1), 0);
  const coraisCount = animais
    .filter(a => a.nome_popular.toLowerCase().includes('coral') || a.especie.toLowerCase().includes('acropora'))
    .reduce((acc, a) => acc + (a.quantidade || 1), 0);
  const gruposCount = animais.filter(a => a.tipo === 'grupo').length;

  // Últimos eventos consolidados
  const eventosRecentes: Array<{
    tipo: 'dosagem' | 'alimentacao' | 'manutencao';
    titulo: string;
    subtitulo: string;
    data: string;
    icone: string;
    cor: string;
  }> = [
    {
      tipo: 'dosagem',
      titulo: 'Dosagem de KH',
      subtitulo: 'Adicionado 15ml Balling Parte A (KH)',
      data: 'Hoje, 14:30',
      icone: 'vaccines',
      cor: 'text-[#77dcce] bg-[#77dcce]/10'
    },
    ...alimentacoes.slice(0, 1).map(al => ({
      tipo: 'alimentacao' as const,
      titulo: 'Alimentação Noturna',
      subtitulo: `${al.alimento} • ${al.quantidade}`,
      data: new Date(al.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      icone: 'restaurant',
      cor: 'text-[#8bcff2] bg-[#8bcff2]/10'
    })),
    ...manutencoes.slice(0, 2).map(man => ({
      tipo: 'manutencao' as const,
      titulo: man.tipo === 'TPA' ? `TPA Realizada (${man.volume_tpa || 0}L)` : man.tipo,
      subtitulo: man.tipo === 'TPA' && man.sal_marca 
        ? `${man.descricao} • Sal: ${man.sal_marca}` 
        : man.descricao,
      data: new Date(man.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      icone: man.tipo === 'TPA' ? 'water_drop' : 'build',
      cor: man.tipo === 'TPA' ? 'text-[#77dcce] bg-[#77dcce]/10' : 'text-[#8bcff2] bg-[#273741]'
    }))
  ];

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

        {/* Live Quick Telemetry Strip */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between bg-[#0d1d26] border border-[#273741] rounded px-2.5 py-1.5">
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[9px] text-[#879390] uppercase">Temperatura</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-semibold text-[#d3e5f2]">25.4</span>
                <span className="font-mono text-[10px] text-[#879390]">°C</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#77dcce] bg-[#77dcce]/10 px-1.5 py-0.5 rounded font-bold">
              OK
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0d1d26] border border-[#273741] rounded px-2.5 py-1.5">
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[9px] text-[#879390] uppercase">Salinidade</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-base font-semibold text-[#d3e5f2]">1.025</span>
                <span className="font-mono text-[10px] text-[#879390]">sg</span>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#77dcce] bg-[#77dcce]/10 px-1.5 py-0.5 rounded font-bold">
              OK
            </span>
          </div>
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
                {parametrosEmAlerta.map(p => p.codigo).join(', ')} sem medição registrada há mais de 10 dias.
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
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{peixesCount || 8}</span>
              <span className="font-mono text-[9px] text-[#879390]">indivíduos</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">Tang, Palhaços, Blênio</span>
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
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{invertCount || 14}</span>
              <span className="font-mono text-[9px] text-[#879390]">limpeza</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">Nassarius, Turbos, Lysmata</span>
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
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{coraisCount || 26}</span>
              <span className="font-mono text-[9px] text-[#879390]">mudas/col.</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">Acroporas, Euphyllias, Zoas</span>
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
              <span className="font-mono text-xl font-semibold text-[#d3e5f2]">{gruposCount || 2}</span>
              <span className="font-mono text-[9px] text-[#879390]">cardumes</span>
            </div>
            <span className="text-[11px] text-[#879390] mt-0.5 truncate">Chromis viridis (x5)</span>
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
            onClick={() => onNavigateToTab('diario')}
            className="font-mono text-xs text-[#77dcce] hover:underline flex items-center gap-0.5"
          >
            <span>Ver tudo</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex flex-col bg-[#0d1d26] border border-[#273741] rounded-lg divide-y divide-[#1c2c35]">
          {eventosRecentes.map((ev, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5">
              <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${ev.cor}`}>
                <span className="material-symbols-outlined text-[16px]">{ev.icone}</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-sans text-xs font-medium text-[#d3e5f2]">
                    {ev.titulo}
                  </span>
                  <span className="font-mono text-[10px] text-[#879390]">{ev.data}</span>
                </div>
                <p className="text-xs text-[#879390] mt-0.5">{ev.subtitulo}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
