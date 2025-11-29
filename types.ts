export enum Sex {
  Male = 'Bărbat',
  Female = 'Femeie',
  Other = 'Altul'
}

export enum Lifestyle {
  Sedentary = 'Sedentar',
  Moderate = 'Moderat',
  Active = 'Activ',
  VeryActive = 'Foarte Activ'
}

export interface UserProfile {
  id?: string;
  name: string;
  sex: Sex;
  age: number;
  weight: number; // kg
  height: number; // cm
  lifestyle: Lifestyle;
  dietaryPreferences: string; // e.g., vegetarian, allergies
}

export interface AudioSettings {
  sensitivity: number; // 0 to 1 (0 = low sensitivity/high threshold, 1 = high sensitivity/low threshold)
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  sampleRate: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  sensitivity: 0.5,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  sampleRate: 16000,
};

export interface TranscriptItem {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type AppState = 'setup' | 'active';