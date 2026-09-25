import { describe, expect, it } from 'vitest';
import {
  calcularEquilibrioIonico,
  calcularEstatisticasParametro,
  DIAS_LIMITE_ALERTA_SEM_TESTE,
  filtrarMedicoesAtivas,
  LIMIAR_PONTOS_INSUFICIENTES
} from './analytics_engine';
import { Medicao, Parametro } from './models';

describe('Analytical Engine (Motor Analítico do Recife de Casa)', () => {
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

  const paramCaMock: Parametro = {
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

  describe('1. Imutabilidade e Substituição Lógica', () => {
    it('deve preservar registro original e substituir pelo registro corretor ativo', () => {
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
      expect(ativas).toHaveLength(1);
      expect(ativas[0].id).toBe('m-2');
      expect(ativas[0].valor).toBe(8.1);
      expect(ativas[0].corrige_medicao_id).toBe('m-1');
    });

    it('deve lidar corretamente com múltiplas correções em cadeia', () => {
      const m1: Medicao = { id: 'm-1', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.0, data_hora: '2025-03-01T10:00:00Z', metodo: 'Salifert' };
      const m2: Medicao = { id: 'm-2', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.5, data_hora: '2025-03-01T10:05:00Z', metodo: 'Salifert', corrige_medicao_id: 'm-1' };
      const m3: Medicao = { id: 'm-3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-01T10:10:00Z', metodo: 'Salifert', corrige_medicao_id: 'm-2' };

      const ativasCadeia = filtrarMedicoesAtivas([m1, m2, m3]);
      expect(ativasCadeia).toHaveLength(1);
      expect(ativasCadeia[0].id).toBe('m-3');
      expect(ativasCadeia[0].valor).toBe(7.8);
    });
  });

  describe('2. Detecção de Dados Insuficientes', () => {
    it(`deve sinalizar dadosInsuficientes = true quando houver menos que ${LIMIAR_PONTOS_INSUFICIENTES} medições na janela`, () => {
      const tresMedicoes: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
        { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.9, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' },
        { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-28T10:00:00Z', metodo: 'Salifert' }
      ];

      const stats = calcularEstatisticasParametro(paramKhMock, tresMedicoes, 30, new Date('2025-03-28T12:00:00Z'));
      expect(stats.dadosInsuficientes).toBe(true);
      expect(stats.pontosValidosNaJanela).toBe(3);
    });

    it('deve retornar dadosInsuficientes = true e statusFaixa sem_dados para lista vazia de medições', () => {
      const statsVazio = calcularEstatisticasParametro(paramCaMock, [], 30, new Date('2025-03-28T12:00:00Z'));
      expect(statsVazio.dadosInsuficientes).toBe(true);
      expect(statsVazio.statusFaixa).toBe('sem_dados');
      expect(statsVazio.ultimaMedicao).toBeNull();
    });
  });

  describe('3. Cálculos Estatísticos (Média, Mín, Máx e Faixas)', () => {
    it('deve calcular corretamente média, mínimo e máximo com >= 4 pontos', () => {
      const quatroMedicoes: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.2, data_hora: '2025-03-20T10:00:00Z', metodo: 'Salifert' },
        { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' },
        { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
        { id: '4', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' }
      ];

      // Média esperada: (8.2 + 8.0 + 7.8 + 7.8) / 4 = 7.95
      const stats = calcularEstatisticasParametro(paramKhMock, quatroMedicoes, 30, new Date('2025-03-26T12:00:00Z'));
      expect(stats.dadosInsuficientes).toBe(false);
      expect(stats.media).toBeCloseTo(7.95, 2);
      expect(stats.minimo).toBe(7.8);
      expect(stats.maximo).toBe(8.2);
      expect(stats.statusFaixa).toBe('nominal');
    });

    it('deve classificar statusFaixa como critico quando valor está fora do alvo', () => {
      const medicoesBaixas: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 6.8, data_hora: '2025-03-26T10:00:00Z', metodo: 'Salifert' },
        { id: '2', aquario_id: 't1', parametro_id: 'param-kh', valor: 6.9, data_hora: '2025-03-24T10:00:00Z', metodo: 'Salifert' },
        { id: '3', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' },
        { id: '4', aquario_id: 't1', parametro_id: 'param-kh', valor: 7.1, data_hora: '2025-03-20T10:00:00Z', metodo: 'Salifert' }
      ];
      const statsBaixas = calcularEstatisticasParametro(paramKhMock, medicoesBaixas, 30, new Date('2025-03-26T12:00:00Z'));
      expect(statsBaixas.statusFaixa).toBe('critico');
    });

    it('deve calcular equilíbrio iônico KH / Cálcio', () => {
      const eqIdeal = calcularEquilibrioIonico(8.0, 420);
      expect(eqIdeal.status).toBe('Estável');
      expect(eqIdeal.score).toBeGreaterThanOrEqual(95);

      const eqDesbalanco = calcularEquilibrioIonico(12.0, 360);
      expect(eqDesbalanco.status).toBe('Atenção ao Consumo');
    });
  });

  describe('4. Alerta de Tempo Sem Medição', () => {
    it(`deve disparar requerTeste = true se sem medição há mais de ${DIAS_LIMITE_ALERTA_SEM_TESTE} dias`, () => {
      const medicaoAntiga: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-10T10:00:00Z', metodo: 'Salifert' }
      ];
      const statsAntiga = calcularEstatisticasParametro(paramKhMock, medicaoAntiga, 30, new Date('2025-03-24T10:00:00Z'));
      expect(statsAntiga.diasSemMedicao).toBe(14);
      expect(statsAntiga.requerTeste).toBe(true);
    });

    it('não deve disparar requerTeste se medição ocorreu recentemente (< 7 dias)', () => {
      const medicaoRecente: Medicao[] = [
        { id: '1', aquario_id: 't1', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-22T10:00:00Z', metodo: 'Salifert' }
      ];
      const statsRecente = calcularEstatisticasParametro(paramKhMock, medicaoRecente, 30, new Date('2025-03-24T10:00:00Z'));
      expect(statsRecente.diasSemMedicao).toBe(2);
      expect(statsRecente.requerTeste).toBe(false);
    });
  });
});
