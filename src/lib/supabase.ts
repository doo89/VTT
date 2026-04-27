import { createClient } from '@supabase/supabase-js';

export const getEnvUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    let url = params.get('sburl');
    if (url) {
      try { url = atob(decodeURIComponent(url)); } catch(e) {}
      sessionStorage.setItem('VTT_SB_URL_OVERRIDE', url);
      return url;
    }
    const sessionUrl = sessionStorage.getItem('VTT_SB_URL_OVERRIDE');
    if (sessionUrl) return sessionUrl;
    
    return localStorage.getItem('VTT_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
  } catch(e) { return null; }
};

export const getEnvKey = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    let key = params.get('sbkey');
    if (key) {
      try { key = atob(decodeURIComponent(key)); } catch(e) {}
      sessionStorage.setItem('VTT_SB_KEY_OVERRIDE', key);
      return key;
    }
    const sessionKey = sessionStorage.getItem('VTT_SB_KEY_OVERRIDE');
    if (sessionKey) return sessionKey;

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
  wiki: any;
  room: any;
};

export type JoinRequestPayload = {
  playerName: string;
};

/**
 * Uploads a file (image, PDF, etc.) to the Supabase Storage bucket 'images-all'
 * and returns its public URL.
 */
export const uploadFileToStorage = async (file: File): Promise<string | null> => {
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
      console.error("Error uploading file:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('images-all')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Unexpected error during file upload:", error);
    return null;
  }
};

/**
 * Deletes a file from Supabase Storage given its public URL.
 */
export const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
  if (!supabase || !fileUrl) return false;

  // Check if it's a Supabase URL and get the file name
  // Standard format: .../storage/v1/object/public/images-all/FILENAME
  if (!fileUrl.includes('/storage/v1/object/public/images-all/')) {
    return false; // Not a Supabase managed file or from another bucket
  }

  try {
    const fileName = fileUrl.split('/').pop();
    if (!fileName) return false;

    const { error } = await supabase.storage
      .from('images-all')
      .remove([fileName]);

    if (error) {
      console.error("Error deleting file from storage:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error during file deletion:", error);
    return false;
  }
};
