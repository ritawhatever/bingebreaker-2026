import { DailyEntry, WeightEntry, UserSettings, ChatMessage } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

const STORAGE_KEYS = {
  DAILY_LOGS: 'bb_daily_logs',
  WEIGHT_LOGS: 'bb_weight_logs',
  SETTINGS: 'bb_settings',
  CHAT_HISTORY: 'bb_chat_history'
};

export const getDailyLogs = (): DailyEntry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveDailyLog = (entry: DailyEntry): void => {
  const logs = getDailyLogs();
  const existingIndex = logs.findIndex(l => l.date === entry.date);
  
  if (existingIndex >= 0) {
    logs[existingIndex] = entry;
  } else {
    logs.push(entry);
  }
  localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
};

export const deleteDailyLog = (date: string): void => {
  const logs = getDailyLogs();
  const filtered = logs.filter(l => l.date !== date);
  localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs.length !== filtered.length ? filtered : logs));
};

export const getWeightLogs = (): WeightEntry[] => {
  const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
  return data ? JSON.parse(data) : [];
};

export const saveWeightLog = (entry: WeightEntry): void => {
  const logs = getWeightLogs();
  // Filter out existing entry for same date if any, then add new
  const filtered = logs.filter(l => l.date !== entry.date);
  filtered.push(entry);
  // Sort by date
  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(filtered));
};

export const deleteWeightLog = (date: string): void => {
  const logs = getWeightLogs();
  const filtered = logs.filter(l => l.date !== date);
  localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(filtered));
};

export const getSettings = (): UserSettings => {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: UserSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const updateUserSetting = (key: keyof UserSettings, value: any): void => {
  const settings = getSettings();
  const newSettings = { ...settings, [key]: value };
  saveSettings(newSettings);
};

export const getChatHistory = (): ChatMessage[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  return data ? JSON.parse(data) : [];
};

export const saveChatHistory = (history: ChatMessage[]): void => {
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
};

// Backup and Restore
export const getAllData = () => {
  return {
    dailyLogs: getDailyLogs(),
    weightLogs: getWeightLogs(),
    settings: getSettings(),
    chatHistory: getChatHistory()
  };
};

export const restoreData = (data: any) => {
  if (data.dailyLogs) localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(data.dailyLogs));
  if (data.weightLogs) localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(data.weightLogs));
  if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
  if (data.chatHistory) localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(data.chatHistory));
};