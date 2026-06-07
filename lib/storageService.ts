import { supabase } from './supabase';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Desteklenmeyen görsel türü. Yalnızca JPG, PNG, GIF, WebP ve SVG yüklenebilir.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Görsel dosyası 5 MB\'ı aşamaz.');
  }
}

function validateMediaFile(file: File): void {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');
  if (!isImage && !isVideo) {
    throw new Error('Desteklenmeyen dosya türü. Görsel (JPG/PNG/GIF/WebP) veya video (MP4/WebM) yüklenebilir.');
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error('Görsel dosyası 5 MB\'ı aşamaz.');
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error('Video dosyası 50 MB\'ı aşamaz.');
  }
}

function safePath(userId: string, file: File): string {
  const ext = file.name.split('.').pop() ?? 'bin';
  return `${userId}/${Date.now()}.${ext}`;
}

export const storageService = {
  async uploadPostMedia(userId: string, file: File): Promise<string> {
    validateMediaFile(file);
    const path = safePath(userId, file);
    const { error } = await supabase.storage.from('post-media').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('post-media').getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadCampaignCreative(userId: string, file: File): Promise<string> {
    validateMediaFile(file);
    const path = safePath(userId, file);
    const { error } = await supabase.storage.from('campaign-creatives').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('campaign-creatives').getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadProductImage(userId: string, file: File): Promise<string> {
    validateImageFile(file);
    const path = safePath(userId, file);
    const { error } = await supabase.storage.from('product-covers').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-covers').getPublicUrl(path);
    return data.publicUrl;
  },

  // BUG-008: upload prompt output files to storage instead of using blob URLs
  async uploadPromptOutput(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('prompt-outputs').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('prompt-outputs').getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    validateImageFile(file);
    const path = safePath(userId, file);
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },
};
