import { createClient } from '@supabase/supabase-js';
import { GameState } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createRoom(roomCode: string, state: GameState): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('horse_racing_rooms')
    .insert({ room_code: roomCode, state: state as unknown as Record<string, unknown> });
  return !error;
}

export async function joinRoom(roomCode: string): Promise<GameState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('horse_racing_rooms')
    .select('state')
    .eq('room_code', roomCode)
    .single();
  if (error || !data) return null;
  return data.state as unknown as GameState;
}

export async function pushState(roomCode: string, state: GameState): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('horse_racing_rooms')
    .update({ state: state as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
    .eq('room_code', roomCode);
}

export function subscribeToRoom(
  roomCode: string,
  onUpdate: (state: GameState) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`room:${roomCode}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'horse_racing_rooms', filter: `room_code=eq.${roomCode}` },
      (payload) => {
        if (payload.new && (payload.new as Record<string, unknown>).state) {
          onUpdate((payload.new as Record<string, unknown>).state as GameState);
        }
      },
    )
    .subscribe();
  return () => { supabase!.removeChannel(channel); };
}
