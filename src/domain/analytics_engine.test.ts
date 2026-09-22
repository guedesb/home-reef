// Unit Tests for Recife de Casa Analytical Engine
// Verifies calculations for:
// 1. Imutabilidade de medições (substituição lógica via corrige_medicao_id)
// 2. Média, Mínimo, Máximo e Variação por dia
// 3. Aviso de dados insuficientes (< 4 medições)
// 4. Alerta de dias sem teste

import {
  calcularEstatisticasParametro,
  filtrarMedicoesAtivas,
  LIMIAR_PONTOS_INSUFICIENTES
} from './analytics_engine';
import { Medicao, Parametro } from './models';

export interface TestResult {
  title: string;
  passed: boolean;
  message: string;
}

export function runAnalyticalEngineTests(): TestResult[] {
  const results: TestResult[] = [];

  const paramKhMock: Parametro = {
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

  // Test 1: Imutabilidade - Registro corrigido é substituído pelo novo registro referenciador
  try {
    const medicaoOriginal: Medicao = {
      id: 'm-1',
      aquario_id: 'tank-1',
      parametro_id: 'param-kh',
      valor: 7.2,
      data_hora: '2025-03-20T10:00:00Z',
      metodo: 'Salifert'
    };

    const medicaoCorretora: Medicao = {
      id: 'm-2',
      aquario_id: 'tank-1',
      parametro_id: 'param-kh',
      valor: 8.1,
      data_hora: '2025-03-20T10:05:00Z',
      metodo: 'Salifert (Corrigido)',
      corrige_medicao_id: 'm-1' // aponta para m-1
    };

    const ativas = filtrarMedicoesAtivas([medicaoOriginal, medicaoCorretora]);
    const pass = ativas.length === 1 && ativas[0].id === 'm-2' && ativas[0].valor === 8.1;
    results.push({
      title: 'Imutabilidade Histórica (corrige_medicao_id)',
      passed: pass,
      message: pass ? 'Medição antiga preservada logicamente e registro corretor substituiu no cálculo ativo.' : 'Falha ao filtrar medição corrigida.'
    });
  } catch (e: any) {
    results.push({ title: 'Imutabilidade Histórica', passed: false, message: e.message });
  }

  // Test 2: Aviso de dados insuficientes (< 4 pontos)
  try {
    const tresMedicoes: Medicao[] = [
      { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
      { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.9, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' },
      { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-28T10:00:00Z', metodo: 'Salifert' }
    ];

    const stats = calcularEstatisticasParametro(paramKhMock, tresMedicoes, 30, new Date('2025-03-28T12:00:00Z'));
    const pass = stats.dadosInsuficientes === true && stats.pontosValidosNaJanela === 3;
    results.push({
      title: 'Aviso de Dados Insuficientes (< 4 medições)',
      passed: pass,
      message: pass ? `Corretamente identificou ${stats.pontosValidosNaJanela} pontos (< limiar ${LIMIAR_PONTOS_INSUFICIENTES}).` : 'Falha no limiar.'
    });
  } catch (e: any) {
    results.push({ title: 'Aviso de Dados Insuficientes', passed: false, message: e.message });
  }

  // Test 3: Cálculos estatísticos (Média, Mínimo, Máximo e Variação) com >= 4 pontos
  try {
    const quatroMedicoes: Medicao[] = [
      { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.2, data_hora: '2025-03-20T10:00:00Z', metodo: 'Salifert' },
      { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' },
      { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
      { id: '4', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' }
    ];

    // Média esperada: (8.2 + 8.0 + 7.8 + 7.8) / 4 = 31.8 / 4 = 7.95
    const stats = calcularEstatisticasParametro(paramKhMock, quatroMedicoes, 30, new Date('2025-03-26T12:00:00Z'));
    const passMedia = Math.abs((stats.media || 0) - 7.95) < 0.01;
    const passMin = stats.minimo === 7.8;
    const passMax = stats.maximo === 8.2;
    const passInsuficiente = stats.dadosInsuficientes === false;

    const pass = passMedia && passMin && passMax && passInsuficiente;
    results.push({
      title: 'Estatísticas Analíticas (Média, Mín, Máx)',
      passed: pass,
      message: pass ? `Média: ${stats.media} (esperado 7.95), Mín: ${stats.minimo}, Máx: ${stats.maximo}` : 'Valores estatísticos divergentes.'
    });
  } catch (e: any) {
    results.push({ title: 'Estatísticas Analíticas', passed: false, message: e.message });
  }

  // Test 4: Alerta de "Sem medição há N dias"
  try {
    const medicaoAntiga: Medicao[] = [
      { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 1340, data_hora: '2025-03-10T10:00:00Z', metodo: 'Salifert' }
    ];
    // Data de referência 14 dias depois: 2025-03-24
    const stats = calcularEstatisticasParametro(paramKhMock, medicaoAntiga, 30, new Date('2025-03-24T10:00:00Z'));
    const pass = stats.diasSemMedicao === 14 && stats.requerTeste === true;
    results.push({
      title: 'Alerta Sem Medição há N Dias',
      passed: pass,
      message: pass ? `Detectou ${stats.diasSemMedicao} dias sem teste e marcou requerTeste = true.` : 'Falha ao alertar tempo sem teste.'
    });
  } catch (e: any) {
    results.push({ title: 'Alerta Sem Medição', passed: false, message: e.message });
  }

  return results;
}
