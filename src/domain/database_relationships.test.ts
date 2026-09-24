import { beforeEach, describe, expect, it } from 'vitest';
import { LocalDatabase } from '../data/database';
import { Animal, Aquario } from './models';

// Polyfill in-memory localStorage for Node test runner
const memoryStore = new Map<string, string>();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStore.get(key) ?? null,
    setItem: (key: string, val: string) => {
      memoryStore.set(key, String(val));
    },
    removeItem: (key: string) => {
      memoryStore.delete(key);
    },
    clear: () => {
      memoryStore.clear();
    }
  };
}

describe('Database Relationships & Isolation (Aquarium & N:N Alimentação)', () => {
  beforeEach(() => {
    localStorage.clear();
    LocalDatabase.init();
  });

  describe('1. Isolamento de Eventos de Animais por Aquário', () => {
    it('getEventosAnimal(undefined, aquarioId) deve retornar apenas eventos dos animais daquele aquário', () => {
      // Cria dois aquários
      const aq1: Aquario = {
        id: 'tank-a',
        nome: 'Tanque Alpha',
        data_montagem: '2024-01-01',
        volume_display: 200,
        volume_sistema: 250,
        tipo_sistema: 'SPS'
      };
      const aq2: Aquario = {
        id: 'tank-b',
        nome: 'Tanque Beta',
        data_montagem: '2024-02-01',
        volume_display: 100,
        volume_sistema: 120,
        tipo_sistema: 'Soft'
      };
      LocalDatabase.saveAquario(aq1);
      LocalDatabase.saveAquario(aq2);

      // Animal no Tanque A
      const peixeA: Animal = LocalDatabase.addAnimal({
        aquario_id: 'tank-a',
        tipo: 'individuo',
        categoria: 'peixe',
        especie: 'Paracanthurus hepatus',
        nome_popular: 'Blue Tang',
        data_entrada: '2024-01-10'
      });

      // Animal no Tanque B
      const peixeB: Animal = LocalDatabase.addAnimal({
        aquario_id: 'tank-b',
        tipo: 'individuo',
        categoria: 'peixe',
        especie: 'Gramma loreto',
        nome_popular: 'Royal Gramma',
        data_entrada: '2024-02-10'
      });

      // Evento para peixe A e evento para peixe B
      LocalDatabase.addEventoAnimal({
        animal_id: peixeA.id,
        tipo_evento: 'alimentacao',
        data: '2024-03-01',
        descricao: 'Comendo spirulina'
      });

      LocalDatabase.addEventoAnimal({
        animal_id: peixeB.id,
        tipo_evento: 'doenca',
        data: '2024-03-02',
        descricao: 'Quarentena preventiva'
      });

      // Busca filtrando pelo Tanque A
      const eventosTanqueA = LocalDatabase.getEventosAnimal(undefined, 'tank-a');
      expect(eventosTanqueA.every(e => e.animal_id === peixeA.id)).toBe(true);
      expect(eventosTanqueA.some(e => e.animal_id === peixeB.id)).toBe(false);

      // Busca filtrando pelo Tanque B
      const eventosTanqueB = LocalDatabase.getEventosAnimal(undefined, 'tank-b');
      expect(eventosTanqueB.every(e => e.animal_id === peixeB.id)).toBe(true);
      expect(eventosTanqueB.some(e => e.animal_id === peixeA.id)).toBe(false);
    });
  });

  describe('2. Relação N:N Alimentação ↔ Animais', () => {
    it('deve registrar alimentação direcionada a múltiplos animais específicos', () => {
      const an1 = LocalDatabase.addAnimal({
        aquario_id: 'tank-nn',
        tipo: 'individuo',
        categoria: 'peixe',
        especie: 'Zebrasoma',
        nome_popular: 'Yellow Tang',
        data_entrada: '2024-01-01'
      });

      const an2 = LocalDatabase.addAnimal({
        aquario_id: 'tank-nn',
        tipo: 'individuo',
        categoria: 'coral',
        especie: 'Acanthastrea lordhowensis',
        nome_popular: 'Micromussa Lord',
        data_entrada: '2024-01-05'
      });

      const alim = LocalDatabase.addAlimentacao({
        aquario_id: 'tank-nn',
        data_hora: '2025-03-25T18:00:00',
        alimento: 'Fauna Marin LPS pellets',
        quantidade: '5 pellets',
        animais_ids: [an1.id, an2.id]
      });

      expect(alim.animais_ids).toEqual([an1.id, an2.id]);

      // Consultar alimentações do animal 1
      const alimsAn1 = LocalDatabase.getAlimentacoesPorAnimal(an1.id);
      expect(alimsAn1.some(a => a.id === alim.id)).toBe(true);

      // Consultar alimentações do animal 2
      const alimsAn2 = LocalDatabase.getAlimentacoesPorAnimal(an2.id);
      expect(alimsAn2.some(a => a.id === alim.id)).toBe(true);
    });

    it('ao excluir um animal, deve remover o id do animal das alimentações vinculadas', () => {
      const anParaDeletar = LocalDatabase.addAnimal({
        aquario_id: 'tank-del',
        tipo: 'individuo',
        categoria: 'peixe',
        especie: 'Pygoplites',
        nome_popular: 'Regal Angel',
        data_entrada: '2024-01-01'
      });

      const anPermanente = LocalDatabase.addAnimal({
        aquario_id: 'tank-del',
        tipo: 'individuo',
        categoria: 'peixe',
        especie: 'Amphiprion',
        nome_popular: 'Ocellaris',
        data_entrada: '2024-01-01'
      });

      const alim = LocalDatabase.addAlimentacao({
        aquario_id: 'tank-del',
        data_hora: '2025-03-25T19:00:00',
        alimento: 'Mysis enriquecido',
        quantidade: '1 cubo',
        animais_ids: [anParaDeletar.id, anPermanente.id]
      });

      // Deletar animal
      LocalDatabase.deleteAnimal(anParaDeletar.id);

      // Verificar que a alimentação ainda existe, mas o ID deletado foi removido
      const todas = LocalDatabase.getAlimentacoes('tank-del');
      const alimAtualizada = todas.find(a => a.id === alim.id);
      expect(alimAtualizada).toBeDefined();
      expect(alimAtualizada?.animais_ids).toEqual([anPermanente.id]);
      expect(alimAtualizada?.animais_ids?.includes(anParaDeletar.id)).toBe(false);
    });
  });
});
