import React, { useState } from 'react';
import { PARAMETROS_PADRAO } from '../../../core/default_parameters';
import { LocalDatabase } from '../../../data/database';
import { calcularEquilibrioIonico } from '../../../domain/analytics_engine';
import { Aquario, Parametro } from '../../../domain/models';

interface NovaMedicaoScreenProps {
  aquario: Aquario;
  parametros: Parametro[];
  onBack: () => void;
  onSaved: () => void;
}

export const NovaMedicaoScreen: React.FC<NovaMedicaoScreenProps> = ({
  aquario,
  parametros,
  onBack,
  onSaved
}) => {
  // Inicializa valores com base nas medições anteriores mais recentes
  const ultimasMedicoes = LocalDatabase.getMedicoes(aquario.id);
  
  // Mapeia valor anterior para cada parâmetro
  const anterioresMap: Record<string, number> = {};
  parametros.forEach(p => {
    const list = ultimasMedicoes
      .filter(m => m.parametro_id === p.id)
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    if (list.length > 0) {
      anterioresMap[p.id] = list[list.length - 1].valor;
    } else {
      anterioresMap[p.id] = p.alvo;
    }
  });

  // Lista dos IDs visíveis na bateria inicial (os 8 principais)
  const [visiveisIds, setVisiveisIds] = useState<string[]>([
    'param-kh',
    'param-ca',
    'param-mg',
    'param-no3',
    'param-po4',
    'param-sal',
    'param-temp',
    'param-ph'
  ]);

  // Valores preenchidos
  const [valores, setValores] = useState<Record<string, string>>({
    'param-kh': (anterioresMap['param-kh'] ?? 7.9).toString(),
    'param-ca': (anterioresMap['param-ca'] ?? 430).toString(),
    'param-mg': (anterioresMap['param-mg'] ?? 1350).toString(),
    'param-no3': (anterioresMap['param-no3'] ?? 4.0).toString(),
    'param-po4': (anterioresMap['param-po4'] ?? 0.04).toString(),
    'param-sal': (anterioresMap['param-sal'] ?? 1.025).toString(),
    'param-temp': (anterioresMap['param-temp'] ?? 25.4).toString(),
    'param-ph': (anterioresMap['param-ph'] ?? 8.20).toString()
  });

  const [observacoes, setObservacoes] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Replicar valores anteriores
  const handleReplicar = () => {
    const novos: Record<string, string> = {};
    visiveisIds.forEach(id => {
      if (anterioresMap[id] !== undefined) {
        novos[id] = anterioresMap[id].toString();
      }
    });
    setValores(prev => ({ ...prev, ...novos }));
    showToast('Valores da última medição replicados');
  };

  // Adicionar outros parâmetros (K, I, Fe, etc.)
  const handleAdicionarExtras = () => {
    const todosParamIds = PARAMETROS_PADRAO.map(p => p.id);
    const faltantes = todosParamIds.filter(id => !visiveisIds.includes(id));
    if (faltantes.length > 0) {
      setVisiveisIds(todosParamIds);
      const novosValores = { ...valores };
      faltantes.forEach(id => {
        const param = PARAMETROS_PADRAO.find(p => p.id === id);
        if (param) novosValores[id] = param.alvo.toString();
      });
      setValores(novosValores);
      showToast('Canais Potássio (K), Iodo (I) e micronutrientes adicionados!');
    }
  };

  // Salvar bateria
  const handleSalvar = () => {
    const entradasValidas: Array<{ parametroId: string; valor: number; metodo?: string }> = [];

    visiveisIds.forEach(id => {
      const valStr = valores[id];
      if (valStr !== undefined && valStr.trim() !== '') {
        const num = parseFloat(valStr);
        if (!isNaN(num)) {
          const param = parametros.find(p => p.id === id);
          entradasValidas.push({
            parametroId: id,
            valor: num,
            metodo: param?.metodo_padrao || 'Laboratório / Fotômetro'
          });
        }
      }
    });

    if (entradasValidas.length === 0) {
      showToast('Preencha ao menos um parâmetro!');
      return;
    }

    LocalDatabase.addBateriaMedicoes(
      aquario.id,
      entradasValidas,
      observacoes.trim() || undefined
    );

    showToast(`${entradasValidas.length} parâmetros persistidos no histórico!`);
    setTimeout(() => {
      onSaved();
    }, 1000);
  };

  // Cálculo de equilíbrio iônico em tempo real
  const khAtual = parseFloat(valores['param-kh']) || null;
  const caAtual = parseFloat(valores['param-ca']) || null;
  const ionBalance = calcularEquilibrioIonico(khAtual, caAtual);

  const totalPreenchidos = visiveisIds.filter(id => valores[id] && valores[id].trim() !== '').length;

  return (
    <div className="flex flex-col min-h-screen bg-[#04151e] text-[#d3e5f2] pb-32">
      {/* Context Strip */}
      <div className="bg-[#0d1d26] px-4 py-2 flex items-center justify-between border-b border-[#1c2c35]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full bg-[#77dcce] animate-pulse flex-shrink-0" />
          <span className="font-mono text-xs text-[#d3e5f2] truncate">Bateria de Testes</span>
          <span className="font-mono text-xs text-[#879390]">
            • {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-[#273741] px-2 py-0.5 rounded border border-[#3d4947]">
          <span className="material-symbols-outlined text-[13px] text-[#77dcce]">sensors</span>
          <span className="font-mono text-[10px] text-[#77dcce] uppercase tracking-wider font-semibold">
            Lab Ready
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-md mx-auto w-full">
        {/* Top HUD: Quick Fill Presets */}
        <div className="bg-[#11212b] border border-[#273741] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d1d26] border border-[#273741] flex items-center justify-center text-[#8bcff2]">
              <span className="material-symbols-outlined text-[18px]">science</span>
            </div>
            <div>
              <p className="font-sans text-[14px] font-semibold text-[#d3e5f2] leading-tight">
                Entrada Rápida Multicanal
              </p>
              <p className="text-xs text-[#879390]">
                Fotômetro & salinômetro óptico
              </p>
            </div>
          </div>
          <button
            onClick={handleReplicar}
            type="button"
            className="bg-[#1c2c35] active:bg-[#2b3b45] text-[#8bcff2] border border-[#3d4947] font-mono text-xs px-2.5 py-1.5 rounded flex items-center gap-1 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>Replicar</span>
          </button>
        </div>

        {/* Matrix Table */}
        <div className="bg-[#11212b] border border-[#273741] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#1c2c35] px-3 py-2 grid grid-cols-12 items-center text-[#879390] font-mono text-[10px] uppercase tracking-wider border-b border-[#273741]">
            <span className="col-span-6">Parâmetro / Alvo</span>
            <span className="col-span-2 text-right">Anterior</span>
            <span className="col-span-4 text-right">Novo Valor</span>
          </div>

          <div className="divide-y divide-[#1c2c35]">
            {visiveisIds.map(paramId => {
              const param = parametros.find(p => p.id === paramId);
              if (!param) return null;
              const anterior = anterioresMap[param.id] ?? param.alvo;
              const valorAtual = valores[param.id] || '';

              return (
                <div
                  key={param.id}
                  className="px-3 py-2.5 bg-[#11212b] hover:bg-[#1c2c35]/40 grid grid-cols-12 items-center gap-1 transition-colors"
                >
                  <div className="col-span-6 flex flex-col min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-[14px] font-semibold text-[#d3e5f2]">
                        {param.codigo}
                      </span>
                      <span className="bg-[#77dcce]/10 text-[#77dcce] font-mono text-[10px] px-1.5 py-0.2 rounded border border-[#77dcce]/20">
                        Alvo: {param.alvo_min === param.alvo_max ? param.alvo : `${param.alvo_min}-${param.alvo_max}`}
                      </span>
                    </div>
                    <span className="text-xs text-[#879390] truncate">
                      {param.nome}
                    </span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className="font-mono text-xs text-[#879390]">
                      {anterior}
                    </span>
                  </div>

                  <div className="col-span-4 flex items-center justify-end">
                    <div className="bg-[#011019] border border-[#273741] focus-within:border-[#77dcce] rounded px-2 py-1 flex items-center justify-end w-full max-w-[104px] transition-colors">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={valorAtual}
                        onChange={e => {
                          const val = e.target.value;
                          setValores(prev => ({ ...prev, [param.id]: val }));
                        }}
                        className="w-12 bg-transparent text-right font-mono text-sm text-[#d3e5f2] focus:text-[#77dcce] outline-none"
                      />
                      <span className="font-mono text-[10px] text-[#879390] ml-1 flex-shrink-0">
                        {param.unidade_canonica}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Extra Button */}
        {visiveisIds.length < PARAMETROS_PADRAO.length && (
          <button
            onClick={handleAdicionarExtras}
            type="button"
            className="w-full py-2.5 px-3 rounded-lg bg-[#11212b] hover:bg-[#1c2c35] border border-[#273741] text-[#bdc9c6] hover:text-[#77dcce] flex items-center justify-center gap-2 transition-all active:scale-[0.99] font-sans text-xs font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Adicionar outros parâmetros (K, I, Fe, Sr, Silicato)</span>
          </button>
        )}

        {/* Observations */}
        <div className="bg-[#11212b] border border-[#273741] rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[10px] uppercase text-[#879390] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
              Observações da Bateria
            </label>
            <span className="font-mono text-[10px] text-[#879390]">Opcional</span>
          </div>
          <div className="bg-[#011019] border border-[#273741] rounded p-1.5">
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: Medição pós TPA de 40L, troca de carvão ativado e ajuste na dosadora de KH..."
              className="w-full bg-transparent text-[#d3e5f2] placeholder:text-[#879390]/70 text-xs resize-none outline-none px-1 py-0.5"
            />
          </div>
          {/* Quick Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {['Pós-TPA 15%', 'Troca de Resina/Carvão', 'Fotoperíodo Pleno', 'Pós Dosagem'].map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setObservacoes(prev => (prev ? `${prev} • ${chip}` : chip));
                }}
                className="bg-[#1c2c35] border border-[#273741] hover:border-[#77dcce]/40 text-[#8bcff2] hover:text-[#d3e5f2] font-mono text-[10px] px-2 py-0.5 rounded transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Live Telemetry Ionic Balance Score */}
        <div className="bg-[#0d1d26] border border-[#273741] rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#77dcce]/20 border border-[#77dcce]/30 flex items-center justify-center text-[#77dcce]">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </div>
            <div>
              <p className="font-sans text-xs font-semibold text-[#d3e5f2]">
                Equilíbrio Iônico Projetado
              </p>
              <p className="text-xs text-[#879390]">
                Relação Ca/Alk: <span className="font-mono text-[#77dcce]">{ionBalance.status}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-semibold text-[#77dcce]">
              {ionBalance.score}%
            </span>
            <span className="block font-mono text-[9px] text-[#879390] uppercase">Score</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-[#011019]/95 backdrop-blur-md border-t border-[#1c2c35] px-4 py-3 flex flex-col gap-2 z-40 max-w-md mx-auto pb-safe">
        <div className="flex items-center justify-between text-[#879390] font-mono text-[10px] px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#77dcce]"></span>
            <span>{totalPreenchidos} parâmetros preenchidos</span>
          </span>
          <span className="text-[#8bcff2]">Delta Médio Estável</span>
        </div>
        <div className="grid grid-cols-12 gap-2">
          <button
            type="button"
            onClick={onBack}
            className="col-span-4 bg-[#11212b] hover:bg-[#1c2c35] border border-[#273741] text-[#d3e5f2] font-sans text-xs font-semibold py-3 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>Descartar</span>
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="col-span-8 bg-[#77dcce] hover:bg-[#5ac0b3] active:scale-[0.98] text-[#003732] font-sans text-xs font-semibold py-3 px-4 rounded-lg flex items-center justify-between transition-all shadow-lg"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span>Salvar Bateria</span>
            </span>
            <span className="font-mono text-[11px] bg-[#003732]/20 text-[#003732] px-2 py-0.5 rounded font-bold">
              {totalPreenchidos} canais
            </span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 inset-x-4 max-w-sm mx-auto bg-[#273741] border border-[#77dcce] text-[#d3e5f2] p-3 rounded-lg shadow-2xl flex items-center justify-between z-50 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#77dcce] text-[20px]">task_alt</span>
            <span className="font-sans text-xs font-medium">{toastMsg}</span>
          </div>
          <span className="font-mono text-[10px] text-[#77dcce] uppercase font-bold">Lab Sync</span>
        </div>
      )}
    </div>
  );
};
