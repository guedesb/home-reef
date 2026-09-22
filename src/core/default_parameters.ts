import { Parametro } from '../domain/models';

export const PARAMETROS_PADRAO: Parametro[] = [
  {
    id: 'param-kh',
    codigo: 'KH',
    nome: 'Reserva Alcalina (Alcalinidade)',
    unidade_canonica: 'dKH',
    personalizado: false,
    categoria: 'macro',
    alvo: 8.0,
    alvo_min: 7.5,
    alvo_max: 8.5,
    metodo_padrao: 'Titulação Salifert'
  },
  {
    id: 'param-ca',
    codigo: 'Ca',
    nome: 'Cálcio Iônico',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'macro',
    alvo: 430,
    alvo_min: 410,
    alvo_max: 440,
    metodo_padrao: 'Hanna Checker'
  },
  {
    id: 'param-mg',
    codigo: 'Mg',
    nome: 'Magnésio Bioativo',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'macro',
    alvo: 1350,
    alvo_min: 1300,
    alvo_max: 1400,
    metodo_padrao: 'Titulação Salifert'
  },
  {
    id: 'param-no3',
    codigo: 'NO3',
    nome: 'Nitrato',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'nutriente',
    alvo: 3.5,
    alvo_min: 2.0,
    alvo_max: 5.0,
    metodo_padrao: 'Salifert'
  },
  {
    id: 'param-po4',
    codigo: 'PO4',
    nome: 'Fosfato Ultra Baixo',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'nutriente',
    alvo: 0.03,
    alvo_min: 0.02,
    alvo_max: 0.05,
    metodo_padrao: 'Hanna Checker ULR'
  },
  {
    id: 'param-sal',
    codigo: 'Salinidade',
    nome: 'Densidade Específica',
    unidade_canonica: 'sg',
    personalizado: false,
    categoria: 'basico',
    alvo: 1.025,
    alvo_min: 1.024,
    alvo_max: 1.026,
    metodo_padrao: 'Refratômetro Óptico'
  },
  {
    id: 'param-temp',
    codigo: 'Temp',
    nome: 'Temperatura da Água',
    unidade_canonica: '°C',
    personalizado: false,
    categoria: 'basico',
    alvo: 25.5,
    alvo_min: 25.0,
    alvo_max: 26.0,
    metodo_padrao: 'Sonda Digital PID'
  },
  {
    id: 'param-ph',
    codigo: 'pH',
    nome: 'Potencial Hidrogeniônico',
    unidade_canonica: 'pH',
    personalizado: false,
    categoria: 'basico',
    alvo: 8.2,
    alvo_min: 8.1,
    alvo_max: 8.3,
    metodo_padrao: 'Eletrodo BNC'
  },
  // Parâmetros opcionais/adicionais
  {
    id: 'param-k',
    codigo: 'K',
    nome: 'Potássio',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'traco',
    alvo: 400,
    alvo_min: 390,
    alvo_max: 420,
    metodo_padrao: 'Titulação'
  },
  {
    id: 'param-i',
    codigo: 'I',
    nome: 'Iodo',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'traco',
    alvo: 0.06,
    alvo_min: 0.04,
    alvo_max: 0.08,
    metodo_padrao: 'Colorimétrico'
  },
  {
    id: 'param-fe',
    codigo: 'Fe',
    nome: 'Ferro',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'traco',
    alvo: 0.002,
    alvo_min: 0.001,
    alvo_max: 0.005,
    metodo_padrao: 'Colorimétrico'
  },
  {
    id: 'param-sr',
    codigo: 'Sr',
    nome: 'Estrôncio',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'traco',
    alvo: 8.0,
    alvo_min: 6.0,
    alvo_max: 10.0,
    metodo_padrao: 'Titulação'
  },
  {
    id: 'param-sio2',
    codigo: 'Silicato',
    nome: 'Silicato Dissolvido',
    unidade_canonica: 'ppm',
    personalizado: false,
    categoria: 'nutriente',
    alvo: 0.0,
    alvo_min: 0.0,
    alvo_max: 0.1,
    metodo_padrao: 'Salifert'
  }
];
