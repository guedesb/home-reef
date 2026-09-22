import React, { useState } from 'react';
import { LocalDatabase } from '../../../data/database';
import { calcularEstatisticasParametro } from '../../../domain/analytics_engine';
import { Aquario, Parametro } from '../../../domain/models';

interface ParametrosConsoleScreenProps {
  aquario: Aquario;
  parametros: Parametro[];
  onSelectParametro: (p: Parametro) => void;
  onOpenNovaBateria: () => void;
}

export const ParametrosConsoleScreen: React.FC<ParametrosConsoleScreenProps> = ({
  aquario,
  parametros,
  onSelectParametro,
  onOpenNovaBateria
}) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const todasMedicoes = LocalDatabase.getMedicoes(aquario.id);

  // Filtro por categorias
  const parametrosFiltrados = parametros.filter(p => {
    if (categoriaFiltro === 'todos') return true;
    if (categoriaFiltro === 'basicos') return p.categoria === 'basico';
    if (categoriaFiltro === 'macro') return p.categoria === 'macro';
    if (categoriaFiltro === 'nutrientes') return p.categoria === 'nutriente';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-24">
      {/* System Status Strip / Quick Metrics Insight */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-[#1c2c35] bg-[#0d1d26]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#77dcce] animate-pulse" />
          <span className="font-mono text-[10px] text-[#bdc9c6] uppercase tracking-wider">
            Console de Telemetria
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#77dcce] px-2 py-0.5 rounded bg-[#1c2c35] border border-[#273741]">
          {parametros.length} Parâmetros Monitorados
        </span>
      </div>

      {/* Primary Action Bar */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <button
          onClick={onOpenNovaBateria}
          type="button"
          className="flex-1 h-11 rounded-lg bg-[#77dcce] hover:bg-[#5ac0b3] text-[#003732] font-sans text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">add_chart</span>
          <span>+ Nova Medição (Bateria)</span>
        </button>
        <button
          onClick={() => {
            const primeiro = parametros[0];
            if (primeiro) onSelectParametro(primeiro);
          }}
          type="button"
          className="h-11 px-3 rounded-lg bg-[#1c2c35] hover:bg-[#273741] border border-[#273741] text-[#d3e5f2] font-sans text-xs font-medium flex items-center justify-center gap-1.5 active:bg-[#11212b] transition-all"
        >
          <span className="material-symbols-outlined text-[18px] text-[#8bcff2]">history</span>
          <span>Histórico</span>
        </button>
      </div>

      {/* Filter Carousel */}
      <div className="px-3 pt-1 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'todos', label: `Todos (${parametros.length})` },
          { id: 'basicos', label: 'Básicos (3)' },
          { id: 'macro', label: 'Macroelementos (3)' },
          { id: 'nutrientes', label: 'Nutrientes (2)' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setCategoriaFiltro(filter.id)}
            type="button"
            className={`px-3 py-1 rounded-lg font-mono text-[11px] flex-shrink-0 flex items-center gap-1 transition-colors border ${
              categoriaFiltro === filter.id
                ? 'bg-[#273741] border-[#77dcce] text-[#77dcce] font-semibold'
                : 'bg-[#0d1d26] border-[#273741] text-[#bdc9c6] hover:text-[#d3e5f2]'
            }`}
          >
            {categoriaFiltro === filter.id && <span className="w-1.5 h-1.5 rounded-full bg-[#77dcce]" />}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Parameter Stacked Rows (Stitch Image 5 layout) */}
      <div className="flex flex-col mt-1 bg-[#011019] divide-y divide-[#1c2c35]">
        {parametrosFiltrados.map(param => {
          const stats = calcularEstatisticasParametro(param, todasMedicoes, 30);
          const ult = stats.ultimaMedicao;
          const valorFormatado = ult ? ult.valor : '--';
          const alertaTestePendente = stats.requerTeste;

          // Cálculo do percentual do Gauge (mini range well)
          let gaugePercent = 50;
          if (ult && param.alvo_max > param.alvo_min) {
            const ratio = (ult.valor - param.alvo_min) / (param.alvo_max - param.alvo_min);
            gaugePercent = Math.min(95, Math.max(5, ratio * 100));
          }

          return (
            <div
              key={param.id}
              onClick={() => onSelectParametro(param)}
              className="group flex flex-col p-3.5 bg-[#04151e] hover:bg-[#0d1d26] active:bg-[#11212b] transition-all cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-semibold text-[#d3e5f2]">
                      {param.codigo} {param.codigo !== param.nome ? `(${param.nome.split(' ')[0]})` : ''}
                    </span>
                    {alertaTestePendente ? (
                      <span className="px-1.5 py-0.5 rounded bg-[#f49971]/20 border border-[#f49971]/40 text-[#ffbca0] font-mono text-[9px] uppercase font-semibold">
                        Requer Teste
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-[#1c2c35] text-[#bdc9c6] font-mono text-[9px] uppercase">
                        {param.categoria}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#879390] mt-0.5">
                    Faixa segura: {param.alvo_min} - {param.alvo_max} {param.unidade_canonica}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className={`font-mono text-xl font-semibold tracking-tight ${
                        alertaTestePendente ? 'text-[#ffbca0]' : 'text-[#d3e5f2]'
                      }`}>
                        {valorFormatado}
                      </span>
                      <span className="font-mono text-[10px] text-[#879390]">
                        {param.unidade_canonica}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      {alertaTestePendente ? (
                        <>
                          <span className="material-symbols-outlined text-[13px] text-[#ffbca0]">warning</span>
                          <span className="font-mono text-[10px] text-[#ffbca0]">
                            {stats.diasSemMedicao >= 999 ? 'Sem dados' : 'Atrasado'}
                          </span>
                        </>
                      ) : stats.deltaRecente !== null ? (
                        <>
                          <span className="material-symbols-outlined text-[13px] text-[#8bcff2]">
                            {stats.deltaRecente >= 0 ? 'trending_up' : 'trending_down'}
                          </span>
                          <span className="font-mono text-[10px] text-[#8bcff2]">
                            {stats.deltaRecente >= 0 ? `+${stats.deltaRecente}` : stats.deltaRecente} ({stats.deltaPeriodoHoras ? `${Math.round(stats.deltaPeriodoHoras / 24)}d` : 'rec'})
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-[10px] text-[#77dcce]">estável</span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[20px] text-[#879390] group-hover:text-[#77dcce] group-hover:translate-x-0.5 transition-all">
                    chevron_right
                  </span>
                </div>
              </div>

              {/* Warning Notification Callout or Mini Range Gauge Well */}
              {alertaTestePendente ? (
                <div className="mt-2.5 p-2 rounded-lg bg-[#1c2c35] border border-[#f49971]/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[15px] text-[#ffbca0] flex-shrink-0">
                      schedule
                    </span>
                    <span className="text-xs text-[#ffbca0] truncate">
                      {stats.diasSemMedicao >= 999 ? 'Sem medições cadastradas' : `Sem teste há ${stats.diasSemMedicao} dias — Faça uma medição`}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNovaBateria();
                    }}
                    type="button"
                    className="px-2.5 py-1 rounded bg-[#ffbca0] text-[#581e01] font-mono text-[10px] font-bold flex-shrink-0 hover:opacity-90 active:scale-95"
                  >
                    Medir
                  </button>
                </div>
              ) : (
                <div className="mt-2.5 pt-1">
                  <div className="h-1.5 w-full bg-[#1c2c35] rounded-full overflow-hidden flex relative">
                    <div className="absolute inset-y-0 left-[20%] w-[60%] bg-[#273741]" />
                    <div
                      className="absolute inset-y-0 w-2.5 rounded-full bg-[#77dcce] ring-2 ring-[#04151e] shadow-sm -ml-1 transition-all"
                      style={{ left: `${gaugePercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px]">
                    <span className="text-[#879390]">
                      Último teste: {ult ? `${new Date(ult.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} • ${ult.metodo || 'Lab'}` : 'Nunca'}
                    </span>
                    <span className="text-[#77dcce] font-medium">Zona Nominal</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Calibration Footnote */}
      <div className="p-3.5 mt-2 flex items-center justify-between text-[#879390] bg-[#011019] border-t border-[#1c2c35]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#77dcce]">tune</span>
          <span className="text-xs">Sondas calibradas • Motor analítico v1.0 ativo</span>
        </div>
        <span className="font-mono text-[10px] uppercase text-[#77dcce]">Sincronizado</span>
      </div>
    </div>
  );
};
