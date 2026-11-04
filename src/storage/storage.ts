import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '../types';

const KEY = 'badminton_state_v1';

export const DEFAULT_STATE: AppState = {
  players: [
    { id: 'me', name: 'Me', isHost: true },
    { id: 'p2', name: 'Arun' },
    { id: 'p3', name: 'Bala' },
    { id: 'p4', name: 'Charan' },
  ],
  games: [],
  shuttlePacks: [],
  expenses: [],
  myPlayerId: 'me',
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}