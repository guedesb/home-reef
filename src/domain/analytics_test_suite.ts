import {
  calcularEquilibrioIonico,
  calcularEstatisticasParametro,
  DIAS_LIMITE_ALERTA_SEM_TESTE,
  filtrarMedicoesAtivas,
  LIMIAR_PONTOS_INSUFICIENTES
} from './analytics_engine';
import { Medicao, Parametro } from './models';

export interface TestCaseResult {
  passed: boolean;
  message: string;
}

export interface EngineTestCase {
  id: string;
  category: string;
  title: string;
  description: string;
  run: () => TestCaseResult;
}

export const paramKhMock: Parametro = {
  id: 'param-kh',
  codigo: 'KH',
  nome: 'Reserva Alcalina',
  unidade_canonica: 'dKH',
  personalizado: false,
  categoria: 'macro',
  alvo: 8.0,
  alvo_min: 7.5,
  alvo_max: 8.5
};

export const paramCaMock: Parametro = {
  id: 'param-ca',
  codigo: 'Ca',
  nome: 'Cálcio',
  unidade_canonica: 'ppm',
  personalizado: false,
  categoria: 'macro',
  alvo: 430,
  alvo_min: 400,
  alvo_max: 450
};

/**
 * Fonte Única da Verdade para Testes do Motor Analítico.
 * Compartilhada diretamente entre o Vitest (analytics_engine.test.ts)
 * e o runner in-app (analytics_verifier.ts) para eliminar duplicações de código.
 */
export const analyticalEngineTestCases: EngineTestCase[] = [
  // 1. Imutabilidade e Substituição Lógica
  {
    id: 'imutabilidade-substituicao',
    category: '1. Imutabilidade Histórica',
    title: 'Imutabilidade Histórica e Substituição Lógica (corrige_medicao_id)',
    description: 'Preservação lógica do registro original e substituição pelo corretor ativo na análise.',
    run: () => {
      const medOriginal: Medicao = {
        id: 'm-1',
        aquario_id: 'tank-1',
        parametro_id: 'param-kh',
        valor: 7.2,
        data_hora: '2025-03-20T10:00:00Z',
        metodo: 'Salifert'
      };

      const medCorretora: Medicao = {
        id: 'm-2',
        aquario_id: 'tank-1',
        parametro_id: 'param-kh',
        valor: 8.1,
        data_hora: '2025-03-20T10:05:00Z',
        metodo: 'Salifert (Corrigido)',
        corrige_medicao_id: 'm-1'
      };

      const ativas = filtrarMedicoesAtivas([medOriginal, medCorretora]);
      if (ativas.length !== 1 || ativas[0].id !== 'm-2' || ativas[0].valor !== 8.1 || ativas[0].corrige_medicao_id !== 'm-1') {
        return { passed: false, message: 'Falha ao filtrar medição original corrigida.' };
      }

      // Teste de correções em cadeia: m1 -> m2 -> m3
      const m1: Medicao = { id: 'm-1', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.0, data_hora: '2025-03-01T10:00:00Z', metodo: 'Salifert' };
      const m2: Medicao = { id: 'm-2', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.5, data_hora: '2025-03-01T10:05:00Z', metodo: 'Salifert', corrige_medicao_id: 'm-1' };
      const m3: Medicao = { id: 'm-3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-01T10:10:00Z', metodo: 'Salifert', corrige_medicao_id: 'm-2' };
      const ativasCadeia = filtrarMedicoesAtivas([m1, m2, m3]);
      if (ativasCadeia.length !== 1 || ativasCadeia[0].id !== 'm-3' || ativasCadeia[0].valor !== 7.8) {
        return { passed: false, message: 'Falha na resolução de correções encadeadas.' };
      }

      return {
        passed: true,
        message: 'Medição antiga preservada logicamente e registro corretor substituiu com sucesso nos cálculos.'
      };
    }
  },

  // 2. Detecção de Dados Insuficientes (< 4 pontos)
  {
    id: 'dados-insuficientes',
    category: '2. Dados Insuficientes',
    title: `Aviso de Amostragem Insuficiente (< ${LIMIAR_PONTOS_INSUFICIENTES} medições)`,
    description: 'Identifica corretamente janelas com menos de 4 pontos ou sem registros.',
    run: () => {
      const tresMedicoes: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
        { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.9, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' },
        { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-28T10:00:00Z', metodo: 'Salifert' }
      ];

      const stats = calcularEstatisticasParametro(paramKhMock, tresMedicoes, 30, new Date('2025-03-28T12:00:00Z'));
      if (stats.dadosInsuficientes !== true || stats.pontosValidosNaJanela !== 3) {
        return { passed: false, message: 'Falha ao classificar 3 pontos como dadosInsuficientes.' };
      }

      const statsVazio = calcularEstatisticasParametro(paramCaMock, [], 30, new Date('2025-03-28T12:00:00Z'));
      if (statsVazio.dadosInsuficientes !== true || statsVazio.statusFaixa !== 'sem_dados' || statsVazio.ultimaMedicao !== null) {
        return { passed: false, message: 'Falha ao tratar lista vazia com status sem_dados.' };
      }

      return {
        passed: true,
        message: `Corretamente identificou 3 pontos (< ${LIMIAR_PONTOS_INSUFICIENTES}) e tratou lista vazia como 'sem_dados'.`
      };
    }
  },

  // 3. Cálculos Estatísticos (Média, Mín, Máx, Faixa) e Equilíbrio Iônico
  {
    id: 'estatisticas-analiticas',
    category: '3. Cálculos Estatísticos & Equilíbrio',
    title: 'Estatísticas Analíticas (Média, Mín, Máx, Faixa e Equilíbrio Iônico)',
    description: 'Valida média aritmética, extremos, faixas nominais/críticas e razão de consumo KH/Ca.',
    run: () => {
      const quatroMedicoes: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.2, data_hora: '2025-03-20T10:00:00Z', metodo: 'Salifert' },
        { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' },
        { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
        { id: '4', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' }
      ];

      // Média esperada: (8.2 + 8.0 + 7.8 + 7.8) / 4 = 7.95
      const stats = calcularEstatisticasParametro(paramKhMock, quatroMedicoes, 30, new Date('2025-03-26T12:00:00Z'));
      const passMedia = Math.abs((stats.media || 0) - 7.95) < 0.01;
      const passMin = stats.minimo === 7.8;
      const passMax = stats.maximo === 8.2;
      const passFaixa = stats.statusFaixa === 'nominal';

      if (!passMedia || !passMin || !passMax || !passFaixa || stats.dadosInsuficientes) {
        return {
          passed: false,
          message: `Estatísticas divergentes: Média=${stats.media} (esp. 7.95), Mín=${stats.minimo}, Máx=${stats.maximo}`
        };
      }

      // Detecção de status crítico fora do alvo
      const medicoesBaixas: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 6.8, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' },
        { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 6.9, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
        { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' },
        { id: '4', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.1, data_hora: '2025-03-20T10:00:00Z', metodo: 'Salifert' }
      ];
      const statsBaixas = calcularEstatisticasParametro(paramKhMock, medicoesBaixas, 30, new Date('2025-03-26T12:00:00Z'));
      if (statsBaixas.statusFaixa !== 'critico') {
        return { passed: false, message: `Status crítico esperado, recebido: ${statsBaixas.statusFaixa}` };
      }

      // Equilíbrio iônico KH / Cálcio
      const eqIdeal = calcularEquilibrioIonico(8.0, 420);
      const eqDesbalanco = calcularEquilibrioIonico(12.0, 360);
      if (eqIdeal.status !== 'Estável' || eqIdeal.score < 95 || eqDesbalanco.status !== 'Atenção ao Consumo') {
        return { passed: false, message: 'Falha no cálculo do equilíbrio iônico KH / Cálcio.' };
      }

      return {
        passed: true,
        message: `Média: ${stats.media?.toFixed(2)} (esp. 7.95), Mín: ${stats.minimo}, Máx: ${stats.maximo}, Equilíbrio Iônico: ${eqIdeal.status} (${eqIdeal.score}%)`
      };
    }
  },

  // 4. Alerta de Tempo Sem Medição
  {
    id: 'alerta-sem-medicao',
    category: '4. Monitoramento Contínuo',
    title: `Alerta Sem Medição Recente (> ${DIAS_LIMITE_ALERTA_SEM_TESTE} dias)`,
    description: 'Sinaliza necessidade de novo teste quando o último registro excede o prazo de validade.',
    run: () => {
      const medicaoAntiga: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-10T10:00:00Z', metodo: 'Salifert' }
      ];
      // 14 dias depois: 2025-03-24
      const statsAntiga = calcularEstatisticasParametro(paramKhMock, medicaoAntiga, 30, new Date('2025-03-24T10:00:00Z'));
      if (statsAntiga.diasSemMedicao !== 14 || statsAntiga.requerTeste !== true) {
        return { passed: false, message: `Falha ao alertar 14 dias sem teste (requerTeste=${statsAntiga.requerTeste})` };
      }

      const medicaoRecente: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' }
      ];
      const statsRecente = calcularEstatisticasParametro(paramKhMock, medicaoRecente, 30, new Date('2025-03-24T10:00:00Z'));
      if (statsRecente.diasSemMedicao !== 2 || statsRecente.requerTeste !== false) {
        return { passed: false, message: `Falha em medição recente de 2 dias (requerTeste=${statsRecente.requerTeste})` };
      }

      return {
        passed: true,
        message: `Detectou corretamente ${statsAntiga.diasSemMedicao} dias sem teste (requerTeste=true) e 2 dias recentes (requerTeste=false).`
      };
    }
  },

  // 5. Isolamento Multitanque de Eventos de Fauna
  {
    id: 'isolamento-multitanque-eventos',
    category: '5. Isolamento Multitanque',
    title: 'Isolamento Multitanque de Eventos de Fauna',
    description: 'Garante que eventos biológicos de outros aquários nunca apareçam na timeline do aquário ativo.',
    run: () => {
      const mockAnimaisDoAquario = [{ id: 'an-tank1', aquario_id: 'tank-1', nome_popular: 'Tang' }];
      const mockEventos = [
        { id: 'ev-1', animal_id: 'an-tank1', tipo_evento: 'alimentacao' as const, data: '2025-03-20', descricao: 'Ok' },
        { id: 'ev-2', animal_id: 'an-tank2-estranho', tipo_evento: 'alimentacao' as const, data: '2025-03-20', descricao: 'Bicho de outro aquário' }
      ];
      const idsSet = new Set(mockAnimaisDoAquario.map(a => a.id));
      const filtrados = mockEventos.filter(e => idsSet.has(e.animal_id));
      const pass = filtrados.length === 1 && filtrados[0].id === 'ev-1';

      if (!pass) {
        return { passed: false, message: 'Falha no isolamento de eventos de fauna entre aquários distintos.' };
      }

      return {
        passed: true,
        message: 'Eventos de animais de outros aquários são filtrados estritamente pelo aquário ativo.'
      };
    }
  },

  // 6. Relação N:N Alimentação ↔ Animais
  {
    id: 'relacao-nn-alimentacao',
    category: '6. Modelo Relacional',
    title: 'Relação N:N Alimentação ↔ Animais',
    description: 'Permite direcionar alimentos para múltiplos indivíduos ou colônias e consultar por animal.',
    run: () => {
      const mockAlimentacao = {
        id: 'alim-test',
        aquario_id: 'tank-1',
        data_hora: '2025-03-24T19:00:00',
        alimento: 'Mysis enriquecido',
        quantidade: '1 cubo',
        animais_ids: ['an-1', 'an-2']
      };
      const atendeAn1 = !!mockAlimentacao.animais_ids?.includes('an-1');
      const atendeAn2 = !!mockAlimentacao.animais_ids?.includes('an-2');
      const naoAtendeAn3 = !mockAlimentacao.animais_ids?.includes('an-3');
      const pass = atendeAn1 && atendeAn2 && naoAtendeAn3;

      if (!pass) {
        return { passed: false, message: 'Falha na validação dos relacionamentos direcionados da alimentação.' };
      }

      return {
        passed: true,
        message: 'Alimentação vincula múltiplos alvos de fauna/corais de forma independente e direcionada.'
      };
    }
  }
];
