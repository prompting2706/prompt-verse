import { supabase } from './supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Desteklenmeyen dosya türü. Yalnızca JPG, PNG, GIF, WebP ve SVG yüklenebilir.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Dosya boyutu 5 MB\'ı aşamaz.');
  }
}

function safePath(userId: string, file: File): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  const ext = mimeToExt[file.type] ?? 'bin';
  return `${userId}/${Date.now()}.${ext}`;
}

export const storageService = {
  async uploadPostMedia(userId: string, file: File): Promise<string> {
    validateFile(file);
    const path = safePath(userId, file);
    const { error } = await supabase.storage.from('post-media').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('post-media').getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadCampaignCreative(userId: string, file: File): Promise<string> {
    validateFile(file);
    const path = safePath(userId, file);
    const { error } = await supabase.storage.from('campaign-creatives').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('campaign-creatives').getPublicUrl(path);
    return data.publicUrl;
  },
};
