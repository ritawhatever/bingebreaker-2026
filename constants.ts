import { UserSettings } from "./types";

export const DEFAULT_SETTINGS: UserSettings = {
  startDate: '2026-01-01',
  startWeight: 62,
  goalWeight: 53,
  monthlyLossTarget: 1.5,
  name: 'User',
  streakGoal: 7
};

export const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😤', label: 'Stressed' },
];

export const SYSTEM_INSTRUCTION = `You are an empathetic, supportive, and firm diet coach helping a user break a binge-eating cycle. 
The user's specific trigger is snacking before or after dinner. 
Your goal is to use CBT (Cognitive Behavioral Therapy) techniques to help them ride out the urge.
Be concise. Focus on immediate actionable advice. 
The user has a weight loss goal starting Jan 1, 2026, aiming to go from 62kg to 53kg by July 2026.
Always be encouraging but remind them of their 'Why'.`;