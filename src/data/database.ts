// Local Database Storage (Local-First Offline SQLite / IndexedDB mirror)
// Emulates full Drift ORM schema behavior with zero cloud dependencies.

import { PARAMETROS_PADRAO } from '../core/default_parameters';
import {
  Alimentacao,
  Animal,
  Aquario,
  Diario,
  Equipamento,
  EquipamentoHistorico,
  EventoAnimal,
  Manutencao,
  Medicao,
  Parametro
} from '../domain/models';

const STORAGE_KEYS = {
  AQUARIOS: 'recife_aquarios',
  PARAMETROS: 'recife_parametros',
  MEDICOES: 'recife_medicoes',
  ANIMAIS: 'recife_animais',
  EVENTOS_ANIMAIS: 'recife_eventos_animais',
  DIARIOS: 'recife_diarios',
  MANUTENCOES: 'recife_manutencoes',
  ALIMENTACOES: 'recife_alimentacoes',
  EQUIPAMENTOS: 'recife_equipamentos',
  EQUIPAMENTOS_HIST: 'recife_equipamentos_hist',
  ACTIVE_AQUARIO_ID: 'recife_active_aquario_id'
};

// Seed initial aquarium according to Stitch mockup: "Tanque Principal (350L) - SPS/LPS"
const SEED_AQUARIO: Aquario = {
  id: 'aq-principal',
  nome: 'Tanque Principal',
  data_montagem: '2024-01-15',
  volume_display: 300,
  volume_sistema: 350,
  tipo_sistema: 'Misto (SPS/LPS)'
};

// Seed historical measurements from Stitch screens
const SEED_MEDICOES: Medicao[] = [
  // KH Historical
  { id: 'm-kh-1', aquario_id: 'aq-principal', parametro_id: 'param-kh', valor: 8.2, data_hora: '2025-03-20T18:45:00', metodo: 'Salifert Titration', observacao: 'Troca da solução de KH do dosador' },
  { id: 'm-kh-2', aquario_id: 'aq-principal', parametro_id: 'param-kh', valor: 8.0, data_hora: '2025-03-24T10:15:00', metodo: 'Hanna Checker', observacao: 'Antes da TPA semanal' },
  { id: 'm-kh-3', aquario_id: 'aq-principal', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-26T19:00:00', metodo: 'Salifert Titration', observacao: 'Após dosagem diária de Balling' },
  { id: 'm-kh-4', aquario_id: 'aq-principal', parametro_id: 'param-kh', valor: 7.8, data_hora: '2025-03-28T16:30:00', metodo: 'Salifert Titration', observacao: 'Teste de rotina. Consumo estável.' },

  // Ca
  { id: 'm-ca-1', aquario_id: 'aq-principal', parametro_id: 'param-ca', valor: 435, data_hora: '2025-03-20T18:45:00', metodo: 'Hanna Checker' },
  { id: 'm-ca-2', aquario_id: 'aq-principal', parametro_id: 'param-ca', valor: 425, data_hora: '2025-03-24T10:15:00', metodo: 'Hanna Checker' },

  // Mg (sem medição há 14 dias para acionar o alerta do Stitch)
  { id: 'm-mg-1', aquario_id: 'aq-principal', parametro_id: 'param-mg', valor: 1340, data_hora: '2025-03-14T10:00:00', metodo: 'Titulação Salifert' },

  // NO3
  { id: 'm-no3-1', aquario_id: 'aq-principal', parametro_id: 'param-no3', valor: 3.2, data_hora: '2025-03-18T12:00:00', metodo: 'Salifert' },
  { id: 'm-no3-2', aquario_id: 'aq-principal', parametro_id: 'param-no3', valor: 4.2, data_hora: '2025-03-23T11:00:00', metodo: 'Salifert' },

  // PO4 (sem medição há 12 dias para acionar o alerta do Stitch)
  { id: 'm-po4-1', aquario_id: 'aq-principal', parametro_id: 'param-po4', valor: 0.03, data_hora: '2025-03-16T15:00:00', metodo: 'Hanna Checker ULR' },

  // Salinidade
  { id: 'm-sal-1', aquario_id: 'aq-principal', parametro_id: 'param-sal', valor: 1.025, data_hora: '2025-03-28T09:00:00', metodo: 'Refratômetro Óptico' },

  // Temp
  { id: 'm-temp-1', aquario_id: 'aq-principal', parametro_id: 'param-temp', valor: 25.4, data_hora: '2025-03-28T16:00:00', metodo: 'Sonda Digital PID' },

  // pH
  { id: 'm-ph-1', aquario_id: 'aq-principal', parametro_id: 'param-ph', valor: 8.13, data_hora: '2025-03-27T15:40:00', metodo: 'Eletrodo BNC' },
  { id: 'm-ph-2', aquario_id: 'aq-principal', parametro_id: 'param-ph', valor: 8.18, data_hora: '2025-03-28T15:40:00', metodo: 'Eletrodo BNC' }
];

// Seed Animals matching Stitch dashboard: 8 peixes, 14 invert, 26 corais, 2 cardumes
const SEED_ANIMAIS: Animal[] = [
  { id: 'an-1', aquario_id: 'aq-principal', tipo: 'individuo', especie: 'Zebrasoma flavescens', nome_popular: 'Yellow Tang', data_entrada: '2024-02-10', origem: 'Criatório Certificado', localizacao_habitual: 'Coluna d\'água livre' },
  { id: 'an-2', aquario_id: 'aq-principal', tipo: 'individuo', especie: 'Amphiprion ocellaris', nome_popular: 'Casal Palhaço Ocellaris', data_entrada: '2024-01-20', origem: 'Nacional', localizacao_habitual: 'Anêmona BBT' },
  { id: 'an-3', aquario_id: 'aq-principal', tipo: 'individuo', especie: 'Salarias fasciatus', nome_popular: 'Blênio Macaco', data_entrada: '2024-03-01', origem: 'Importado', localizacao_habitual: 'Rochas basais' },
  { id: 'an-4', aquario_id: 'aq-principal', tipo: 'grupo', especie: 'Chromis viridis', nome_popular: 'Cardume Green Chromis', data_entrada: '2024-02-15', quantidade: 5, localizacao_habitual: 'Topo do rochedo' },
  { id: 'an-5', aquario_id: 'aq-principal', tipo: 'grupo', especie: 'Nassarius & Turbo', nome_popular: 'Equipe de Limpeza (Snails)', data_entrada: '2024-01-18', quantidade: 14, localizacao_habitual: 'Substrato e vidros' },
  { id: 'an-6', aquario_id: 'aq-principal', tipo: 'grupo', especie: 'Acropora & Zoanthus', nome_popular: 'Mudas de Corais Variados', data_entrada: '2024-03-05', quantidade: 26, localizacao_habitual: 'Aquarscape' }
];

// Seed recent maintenance & events
const SEED_MANUTENCOES: Manutencao[] = [
  { id: 'man-1', aquario_id: 'aq-principal', tipo: 'Manutenção Semanal', data: '2025-03-24T10:00:00', descricao: 'Troca do refil de perlon e limpeza do copo do skimmer' },
  { id: 'man-2', aquario_id: 'aq-principal', tipo: 'TPA', data: '2025-03-20T09:30:00', descricao: 'TPA preventiva de 40L com água RO/DI e sal Tropic Marin', volume_tpa: 40 }
];

const SEED_ALIMENTACOES: Alimentacao[] = [
  { id: 'alim-1', aquario_id: 'aq-principal', data_hora: '2025-03-27T19:15:00', alimento: 'Mysis enriquecido + Fitoplâncton vivo', quantidade: '1 cubo + 10ml', observacao: 'Todos os corais com pólipos abertos' }
];

const SEED_EVENTOS_ANIMAIS: EventoAnimal[] = [
  { id: 'ev-an-1', animal_id: 'an-1', tipo_evento: 'entrada', data: '2024-02-10', descricao: 'Introduzido após 3 semanas em quarentena profilática. Ativo e comendo nori.' },
  { id: 'ev-an-2', animal_id: 'an-1', tipo_evento: 'alimentacao', data: '2024-02-15', descricao: 'Adaptação excelente ao nori com alho e Spirulina flake.' },
  { id: 'ev-an-3', animal_id: 'an-2', tipo_evento: 'reproducao', data: '2024-03-12', descricao: 'Casal efetuou postura de ovos sob a base rochosa da anêmona.' },
  { id: 'ev-an-4', animal_id: 'an-6', tipo_evento: 'crescimento', data: '2024-03-22', descricao: 'Crescimento visível nas pontas das Acroporas (base encrustando).' }
];

const SEED_DIARIOS: Diario[] = [
  {
    id: 'dia-1',
    aquario_id: 'aq-principal',
    data: '2025-03-27',
    texto: 'Pólipos das Acroporas com extensão fantástica nesta noite. Blênio macaco limpou grande parte das algas filamentosas na rocha central. KH estabilizado em 7.8 dKH.',
    tags: ['Corais', 'Algas', 'KH', 'Fauna']
  },
  {
    id: 'dia-2',
    aquario_id: 'aq-principal',
    data: '2025-03-20',
    texto: 'Realizada TPA de 40L com água RO/DI e sal Tropic Marin. Skimmer regulado para espuma mais seca. Todos os peixes ativos.',
    tags: ['TPA', 'Skimmer', 'Manutenção']
  }
];

export class LocalDatabase {
  private static getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private static setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // Inicialização com dados padrão caso vazio
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.AQUARIOS)) {
      this.setItem(STORAGE_KEYS.AQUARIOS, [SEED_AQUARIO]);
      this.setItem(STORAGE_KEYS.ACTIVE_AQUARIO_ID, SEED_AQUARIO.id);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARAMETROS)) {
      this.setItem(STORAGE_KEYS.PARAMETROS, PARAMETROS_PADRAO);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDICOES)) {
      this.setItem(STORAGE_KEYS.MEDICOES, SEED_MEDICOES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANIMAIS)) {
      this.setItem(STORAGE_KEYS.ANIMAIS, SEED_ANIMAIS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MANUTENCOES)) {
      this.setItem(STORAGE_KEYS.MANUTENCOES, SEED_MANUTENCOES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALIMENTACOES)) {
      this.setItem(STORAGE_KEYS.ALIMENTACOES, SEED_ALIMENTACOES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTOS_ANIMAIS)) {
      this.setItem(STORAGE_KEYS.EVENTOS_ANIMAIS, SEED_EVENTOS_ANIMAIS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIARIOS)) {
      this.setItem(STORAGE_KEYS.DIARIOS, SEED_DIARIOS);
    }
  }

  // --- AQUÁRIOS ---
  public static getAquarios(): Aquario[] {
    return this.getItem<Aquario[]>(STORAGE_KEYS.AQUARIOS, [SEED_AQUARIO]);
  }

  public static getActiveAquarioId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_AQUARIO_ID) || SEED_AQUARIO.id;
  }

  public static setActiveAquarioId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_AQUARIO_ID, id);
  }

  public static saveAquario(aquario: Aquario): void {
    const list = this.getAquarios();
    const index = list.findIndex(a => a.id === aquario.id);
    if (index >= 0) {
      list[index] = aquario;
    } else {
      list.push(aquario);
    }
    this.setItem(STORAGE_KEYS.AQUARIOS, list);
  }

  // --- PARÂMETROS ---
  public static getParametros(): Parametro[] {
    return this.getItem<Parametro[]>(STORAGE_KEYS.PARAMETROS, PARAMETROS_PADRAO);
  }

  public static saveParametro(parametro: Parametro): void {
    const list = this.getParametros();
    const idx = list.findIndex(p => p.id === parametro.id);
    if (idx >= 0) {
      list[idx] = parametro;
    } else {
      list.push(parametro);
    }
    this.setItem(STORAGE_KEYS.PARAMETROS, list);
  }

  // --- MEDIÇÕES (IMUTÁVEIS) ---
  public static getMedicoes(aquarioId?: string): Medicao[] {
    const list = this.getItem<Medicao[]>(STORAGE_KEYS.MEDICOES, SEED_MEDICOES);
    if (!aquarioId) return list;
    return list.filter(m => m.aquario_id === aquarioId);
  }

  /**
   * Adiciona nova medição.
   * REGRA DE NEGÓCIO: Se for uma correção, NUNCA sobrescreve. Salva com corrige_medicao_id apontando para o id anterior.
   */
  public static addMedicao(medicao: Omit<Medicao, 'id'> & { id?: string }): Medicao {
    const list = this.getItem<Medicao[]>(STORAGE_KEYS.MEDICOES, SEED_MEDICOES);
    const newMedicao: Medicao = {
      ...medicao,
      id: medicao.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    list.push(newMedicao);
    this.setItem(STORAGE_KEYS.MEDICOES, list);
    return newMedicao;
  }

  /**
   * Adiciona bateria rápida de medições
   */
  public static addBateriaMedicoes(
    aquarioId: string,
    medicoes: Array<{ parametroId: string; valor: number; metodo?: string }>,
    observacao?: string,
    dataHora?: string
  ): Medicao[] {
    const timestamp = dataHora || new Date().toISOString().slice(0, 19);
    const list = this.getItem<Medicao[]>(STORAGE_KEYS.MEDICOES, SEED_MEDICOES);
    const criadas: Medicao[] = [];

    for (const item of medicoes) {
      const nova: Medicao = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        aquario_id: aquarioId,
        parametro_id: item.parametroId,
        valor: item.valor,
        data_hora: timestamp,
        metodo: item.metodo || 'Laboratório / Fotômetro',
        observacao
      };
      list.push(nova);
      criadas.push(nova);
    }

    this.setItem(STORAGE_KEYS.MEDICOES, list);
    return criadas;
  }

  // --- ANIMAIS ---
  public static getAnimais(aquarioId?: string): Animal[] {
    const list = this.getItem<Animal[]>(STORAGE_KEYS.ANIMAIS, SEED_ANIMAIS);
    if (!aquarioId) return list;
    return list.filter(a => a.aquario_id === aquarioId);
  }

  public static addAnimal(animal: Omit<Animal, 'id'>): Animal {
    const list = this.getItem<Animal[]>(STORAGE_KEYS.ANIMAIS, SEED_ANIMAIS);
    const novo: Animal = {
      ...animal,
      id: `an-${Date.now()}`
    };
    list.push(novo);
    this.setItem(STORAGE_KEYS.ANIMAIS, list);
    return novo;
  }

  public static updateAnimal(animal: Animal): void {
    const list = this.getItem<Animal[]>(STORAGE_KEYS.ANIMAIS, SEED_ANIMAIS);
    const idx = list.findIndex(a => a.id === animal.id);
    if (idx >= 0) {
      list[idx] = animal;
      this.setItem(STORAGE_KEYS.ANIMAIS, list);
    }
  }

  // --- EVENTOS DE ANIMAIS ---
  public static getEventosAnimal(animalId?: string): EventoAnimal[] {
    const list = this.getItem<EventoAnimal[]>(STORAGE_KEYS.EVENTOS_ANIMAIS, SEED_EVENTOS_ANIMAIS);
    if (!animalId) return list;
    return list.filter(e => e.animal_id === animalId);
  }

  public static addEventoAnimal(evento: Omit<EventoAnimal, 'id'>): EventoAnimal {
    const list = this.getItem<EventoAnimal[]>(STORAGE_KEYS.EVENTOS_ANIMAIS, SEED_EVENTOS_ANIMAIS);
    const novo: EventoAnimal = {
      ...evento,
      id: `ev-${Date.now()}`
    };
    list.unshift(novo);
    this.setItem(STORAGE_KEYS.EVENTOS_ANIMAIS, list);
    return novo;
  }

  // --- MANUTENÇÕES ---
  public static getManutencoes(aquarioId?: string): Manutencao[] {
    const list = this.getItem<Manutencao[]>(STORAGE_KEYS.MANUTENCOES, SEED_MANUTENCOES);
    if (!aquarioId) return list;
    return list.filter(m => m.aquario_id === aquarioId);
  }

  public static addManutencao(manutencao: Omit<Manutencao, 'id'>): Manutencao {
    const list = this.getItem<Manutencao[]>(STORAGE_KEYS.MANUTENCOES, SEED_MANUTENCOES);
    const nova: Manutencao = {
      ...manutencao,
      id: `man-${Date.now()}`
    };
    list.push(nova);
    this.setItem(STORAGE_KEYS.MANUTENCOES, list);
    return nova;
  }

  // --- ALIMENTAÇÕES ---
  public static getAlimentacoes(aquarioId?: string): Alimentacao[] {
    const list = this.getItem<Alimentacao[]>(STORAGE_KEYS.ALIMENTACOES, SEED_ALIMENTACOES);
    if (!aquarioId) return list;
    return list.filter(a => a.aquario_id === aquarioId);
  }

  // --- DIÁRIOS ---
  public static getDiarios(aquarioId?: string): Diario[] {
    return this.getItem<Diario[]>(STORAGE_KEYS.DIARIOS, []);
  }

  public static addDiario(diario: Omit<Diario, 'id'>): Diario {
    const list = this.getDiarios();
    const novo: Diario = {
      ...diario,
      id: `dia-${Date.now()}`
    };
    list.push(novo);
    this.setItem(STORAGE_KEYS.DIARIOS, list);
    return novo;
  }
}
