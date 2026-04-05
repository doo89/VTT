import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

// Prevent crashing if the env vars are missing (useful for local dev without connection)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Realtime Channel Type Defs
export type SyncStatePayload = {
  players: any[];
  roles: any[];
  teams: any[];
  tags: any[];
  handouts: any[];
  isNight: boolean;
  cycleMode: 'dayNight' | 'turns' | 'none';
};

export type JoinRequestPayload = {
  playerName: string;
};

/**
 * Uploads an image file to the Supabase Storage bucket 'images-all'
 * and returns its public URL.
 */
export const uploadImageToStorage = async (file: File): Promise<string | null> => {
  if (!supabase) {
    console.error("Supabase is not initialized.");
    return null;
  }

  try {
    // Create a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images-all')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('images-all')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Unexpected error during image upload:", error);
    return null;
  }
};
