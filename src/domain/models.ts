// Types and Domain Models for "Recife de Casa"

export type TipoSistema = 'SPS' | 'LPS' | 'Misto (SPS/LPS)' | 'Soft' | 'Fish Only';

export interface Aquario {
  id: string;
  nome: string;
  data_montagem: string; // ISO date YYYY-MM-DD
  volume_display: number; // Litros
  volume_sistema: number; // Litros total com sump
  tipo_sistema: TipoSistema;
}

export interface Equipamento {
  id: string;
  aquario_id: string;
  tipo: string; // Skimmer, Bomba de Retorno, Iluminação, etc.
  descricao: string;
}

export interface EquipamentoHistorico {
  id: string;
  equipamento_id: string;
  data: string;
  alteracao: string;
}

export interface Parametro {
  id: string;
  codigo: string; // KH, Ca, Mg, NO3, PO4, Salinidade, Temp, pH, K, I, Fe, Sr, Silicato
  nome: string;
  unidade_canonica: string; // dKH, ppm, sg, °C, pH
  personalizado: boolean;
  categoria: 'macro' | 'basico' | 'nutriente' | 'traco';
  alvo: number;
  alvo_min: number;
  alvo_max: number;
  metodo_padrao?: string;
}

export interface Medicao {
  id: string;
  aquario_id: string;
  parametro_id: string;
  valor: number;
  data_hora: string; // ISO String: YYYY-MM-DDTHH:mm:ss
  metodo: string; // ex: Salifert, Hanna Checker, Eletrodo BNC, Sonda Digital, Titulação
  observacao?: string;
  corrige_medicao_id?: string | null; // NUNCA sobrescrever ou apagar: cria novo referenciando o anterior
  is_corrigido?: boolean;
}

export type TipoAnimal = 'individuo' | 'grupo';

export interface Animal {
  id: string;
  aquario_id: string;
  tipo: TipoAnimal;
  especie: string;
  nome_popular: string;
  data_entrada: string;
  origem?: string;
  sexo?: string;
  localizacao_habitual?: string;
  quantidade?: number; // Relevante para grupos/lotes (ex: cardume x5, equipe de limpeza x14)
}

export interface EventoAnimal {
  id: string;
  animal_id: string;
  tipo_evento: 'entrada' | 'alimentacao' | 'doenca' | 'reproducao' | 'crescimento' | 'obito';
  data: string;
  descricao: string;
}

export interface Diario {
  id: string;
  aquario_id: string;
  data: string;
  texto: string;
  tags: string[];
}

export interface Manutencao {
  id: string;
  aquario_id: string;
  tipo: string; // TPA, Limpeza de Skimmer, Troca de Perlon, Calibração de Sonda, Limpeza de Bombas, etc.
  data: string; // ISO date-time
  descricao: string;
  volume_tpa?: number | null; // Volume em Litros (para TPAs)
  sal_marca?: string; // ex: Tropic Marin Pro Reef, Red Sea Coral Pro
  salinidade_preparada?: number; // ex: 1.025 sg
}

export interface Alimentacao {
  id: string;
  aquario_id: string;
  data_hora: string;
  alimento: string;
  quantidade: string;
  observacao?: string;
}

// Modelos do Motor Analítico
export interface ParametroEstatisticas {
  parametroId: string;
  totalPontos: number;
  pontosValidosNaJanela: number;
  dadosInsuficientes: boolean; // Menos de 4 pontos
  media: number | null;
  minimo: number | null;
  minimoData: string | null;
  maximo: number | null;
  maximoData: string | null;
  variacaoPorDia: number | null; // Variação média ou máxima diária
  deltaRecente: number | null;
  deltaPeriodoHoras: number | null;
  ultimaMedicao: Medicao | null;
  diasSemMedicao: number;
  requerTeste: boolean; // Alerta de sem teste há mais de N dias
  statusFaixa: 'nominal' | 'atencao' | 'critico' | 'sem_dados';
}
