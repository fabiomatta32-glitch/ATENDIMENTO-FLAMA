
export enum Department {
  ACADEMIC = 'Secretaria Acadêmica',
  FINANCIAL = 'Financeiro',
  SUPPORT = 'Suporte Técnico',
  ADMISSIONS = 'Admissões e Matrículas',
  GENERAL = 'Informações Gerais'
}

export type MessageRole = 'user' | 'bot' | 'human' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  department?: Department;
  suggestedActions?: string[];
  metadata?: {
    isVoice?: boolean;
    audioTranscription?: string;
    audioBlobUrl?: string;
  };
}

export interface ChatSession {
  id: string;
  department: Department | null;
  messages: Message[];
  isHumanSupport: boolean;
  status: 'idle' | 'bot' | 'waiting_human' | 'human';
}

export interface AttendantConfig {
  department: Department;
  name: string;
  phone: string;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
}
