export interface DailyEntry {
  date: string; // ISO date string YYYY-MM-DD
  snacked: boolean;
  snackDetails?: string;
  mood: string;
  notes: string;
}

export interface WeightEntry {
  date: string; // ISO date string YYYY-MM-DD
  weight: number;
}

export interface UserSettings {
  startDate: string;
  startWeight: number;
  goalWeight: number;
  monthlyLossTarget: number;
  name: string;
  streakGoal: number;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TRACKER = 'TRACKER',
  WEIGHT = 'WEIGHT',
  WEIGHT_HISTORY = 'WEIGHT_HISTORY',
  COACH = 'COACH',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}