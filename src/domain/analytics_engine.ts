// Analytical Engine for Recife de Casa
// Reusable, pure functional calculation of statistics, trends, and tolerances.

import { Medicao, Parametro, ParametroEstatisticas } from './models';

export const LIMIAR_PONTOS_INSUFICIENTES = 4;
export const DIAS_LIMITE_ALERTA_SEM_TESTE = 7; // Acima de 7 dias sem teste, requer atenção; 12+ crítico

/**
 * Filtra medições válidas (remove aquelas que foram marcadas como corrigidas por outro registro).
 * Garante a regra de negócio: Séries históricas imutáveis onde o valor ativo mais recente prevalece.
 */
export function filtrarMedicoesAtivas(medicoes: Medicao[]): Medicao[] {
  // Coletar todos os IDs que foram corrigidos por outro registro
  const idsCorrigidos = new Set<string>();
  for (const m of medicoes) {
    if (m.corrige_medicao_id) {
      idsCorrigidos.add(m.corrige_medicao_id);
    }
  }

  // Filtrar apenas medições que não foram substituídas
  return medicoes
    .filter(m => !idsCorrigidos.has(m.id))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
}

/**
 * Calcula todas as estatísticas analíticas de um parâmetro a partir de suas medições
 */
export function calcularEstatisticasParametro(
  parametro: Parametro,
  todasMedicoesDoParametro: Medicao[],
  diasJanela: number = 30,
  dataReferencia: Date = new Date()
): ParametroEstatisticas {
  const medicoesAtivas = filtrarMedicoesAtivas(todasMedicoesDoParametro);
  const totalPontos = medicoesAtivas.length;

  if (totalPontos === 0) {
    return {
      parametroId: parametro.id,
      totalPontos: 0,
      pontosValidosNaJanela: 0,
      dadosInsuficientes: true,
      media: null,
      minimo: null,
      minimoData: null,
      maximo: null,
      maximoData: null,
      variacaoPorDia: null,
      deltaRecente: null,
      deltaPeriodoHoras: null,
      ultimaMedicao: null,
      diasSemMedicao: 999,
      requerTeste: true,
      statusFaixa: 'sem_dados'
    };
  }

  const ultimaMedicao = medicoesAtivas[medicoesAtivas.length - 1];
  const dataUltima = new Date(ultimaMedicao.data_hora);
  const msPorDia = 1000 * 60 * 60 * 24;
  const diasSemMedicao = Math.max(0, Math.floor((dataReferencia.getTime() - dataUltima.getTime()) / msPorDia));
  const requerTeste = diasSemMedicao >= DIAS_LIMITE_ALERTA_SEM_TESTE;

  // Filtrar pontos na janela (ex: últimos 30 dias)
  const limiteTempo = dataReferencia.getTime() - (diasJanela * msPorDia);
  const pontosJanela = medicoesAtivas.filter(m => new Date(m.data_hora).getTime() >= limiteTempo);

  const pontosValidosNaJanela = pontosJanela.length;
  const dadosInsuficientes = pontosValidosNaJanela < LIMIAR_PONTOS_INSUFICIENTES;

  // Se a janela tiver poucos pontos mas houver histórico geral, usamos os dados disponíveis para cálculo
  const baseCalculo = pontosValidosNaJanela > 0 ? pontosJanela : medicoesAtivas;

  // 1. Média
  const soma = baseCalculo.reduce((acc, curr) => acc + curr.valor, 0);
  const media = parseFloat((soma / baseCalculo.length).toFixed(parametro.unidade_canonica === 'sg' ? 3 : 2));

  // 2. Mínimo e Máximo
  let minimo = baseCalculo[0].valor;
  let minimoData = baseCalculo[0].data_hora;
  let maximo = baseCalculo[0].valor;
  let maximoData = baseCalculo[0].data_hora;

  for (const m of baseCalculo) {
    if (m.valor < minimo) {
      minimo = m.valor;
      minimoData = m.data_hora;
    }
    if (m.valor > maximo) {
      maximo = m.valor;
      maximoData = m.data_hora;
    }
  }

  // 3. Variação máx por dia (se tiver 2 ou mais pontos)
  let variacaoPorDia: number | null = null;
  if (baseCalculo.length >= 2) {
    let maiorDeltaDiario = 0;
    for (let i = 1; i < baseCalculo.length; i++) {
      const pAnterior = baseCalculo[i - 1];
      const pAtual = baseCalculo[i];
      const horasDiff = Math.max(1, (new Date(pAtual.data_hora).getTime() - new Date(pAnterior.data_hora).getTime()) / (1000 * 60 * 60));
      const diasDiff = horasDiff / 24;
      const deltaValor = Math.abs(pAtual.valor - pAnterior.valor);
      const deltaDiarioNormalizado = deltaValor / Math.max(1, diasDiff);
      if (deltaDiarioNormalizado > maiorDeltaDiario) {
        maiorDeltaDiario = deltaDiarioNormalizado;
      }
    }
    variacaoPorDia = parseFloat(maiorDeltaDiario.toFixed(parametro.unidade_canonica === 'sg' ? 3 : 2));
  }

  // 4. Delta Recente (comparando a última medição com a penúltima)
  let deltaRecente: number | null = null;
  let deltaPeriodoHoras: number | null = null;
  if (medicoesAtivas.length >= 2) {
    const penultima = medicoesAtivas[medicoesAtivas.length - 2];
    deltaRecente = parseFloat((ultimaMedicao.valor - penultima.valor).toFixed(parametro.unidade_canonica === 'sg' ? 3 : 2));
    const diffMs = new Date(ultimaMedicao.data_hora).getTime() - new Date(penultima.data_hora).getTime();
    deltaPeriodoHoras = Math.round(diffMs / (1000 * 60 * 60));
  }

  // 5. Status da faixa segura
  let statusFaixa: 'nominal' | 'atencao' | 'critico' | 'sem_dados' = 'nominal';
  const val = ultimaMedicao.valor;
  if (val < parametro.alvo_min || val > parametro.alvo_max) {
    // Verificar quão distante está do limite
    const margem = (parametro.alvo_max - parametro.alvo_min) * 0.5;
    if (val < parametro.alvo_min - margem || val > parametro.alvo_max + margem) {
      statusFaixa = 'critico';
    } else {
      statusFaixa = 'atencao';
    }
  }

  return {
    parametroId: parametro.id,
    totalPontos,
    pontosValidosNaJanela,
    dadosInsuficientes,
    media,
    minimo,
    minimoData,
    maximo,
    maximoData,
    variacaoPorDia,
    deltaRecente,
    deltaPeriodoHoras,
    ultimaMedicao,
    diasSemMedicao,
    requerTeste,
    statusFaixa
  };
}

/**
 * Calcula balanço estequiométrico básico cálcio/alcalinidade (projeção teórica)
 */
export function calcularEquilibrioIonico(khValor: number | null, caValor: number | null): { score: number; status: string } {
  if (khValor === null || caValor === null) {
    return { score: 95, status: 'Estável' };
  }
  // Relação ideal natural: KH 7-8 dKH combina com Ca ~410-430 ppm
  // Cada 1 dKH consome ~20 ppm de Ca
  const caIdealEsperado = 420 + ((khValor - 8.0) * 18);
  const diferenca = Math.abs(caValor - caIdealEsperado);

  if (diferenca <= 15) {
    return { score: 98, status: 'Estável' };
  } else if (diferenca <= 35) {
    return { score: 91, status: 'Equilibrado' };
  } else {
    return { score: 82, status: 'Atenção ao Consumo' };
  }
}
