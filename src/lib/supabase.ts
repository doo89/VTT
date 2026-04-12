import { createClient } from '@supabase/supabase-js';

export const getEnvUrl = () => {
  try {
    return localStorage.getItem('VTT_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  } catch(e) { return null; }
};

export const getEnvKey = () => {
  try {
    return localStorage.getItem('VTT_SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } catch(e) { return null; }
};

const supabaseUrl = getEnvUrl() as string;
const supabaseAnonKey = getEnvKey() as string;

let sbClient = null;
try {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    sbClient = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error("Invalid Supabase configuration", error);
}

// Prevent crashing if the env vars are missing (useful for local dev without connection)
export const supabase = sbClient;

// Realtime Channel Type Defs
export type SyncStatePayload = {
  players: any[];
  roles: any[];
  teams: any[];
  tags: any[];
  handouts: any[];
  isNight: boolean;
  cycleMode: 'dayNight' | 'turns' | 'none';
  displaySettings: any;
  room: any;
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

/**
 * Deletes an image from Supabase Storage given its public URL.
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  if (!supabase || !imageUrl) return false;

  // Check if it's a Supabase URL and get the file name
  // Standard format: .../storage/v1/object/public/images-all/FILENAME
  if (!imageUrl.includes('/storage/v1/object/public/images-all/')) {
    return false; // Not a Supabase managed image or from another bucket
  }

  try {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return false;

    const { error } = await supabase.storage
      .from('images-all')
      .remove([fileName]);

    if (error) {
      console.error("Error deleting image from storage:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error during image deletion:", error);
    return false;
  }
};
