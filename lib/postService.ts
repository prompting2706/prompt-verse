import { supabase } from './supabase';

const PAGE_SIZE = 20;

const WITH_AUTHOR = `
  *,
  author:profiles!posts_author_id_fkey(name, avatar_url),
  post_comments(
    id, author_id, text, created_at,
    author:profiles!post_comments_author_id_fkey(name, avatar_url)
  )
`;

export const postService = {
  async getAll(page = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(WITH_AUTHOR)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    return data ?? [];
  },

  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(WITH_AUTHOR)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(post: { author_id: string; caption: string; image_url?: string | null; video_url?: string | null; tags: string[]; likes?: string[] }) {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: post.author_id,
        caption: post.caption,
        image_url: post.image_url ?? null,
        video_url: post.video_url ?? null,
        tags: post.tags,
        likes: post.likes ?? [],
      } as any)
      .select(WITH_AUTHOR)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  async update(id: string, updates: { caption?: string; tags?: string[] }): Promise<void> {
    const { error } = await supabase.from('posts').update(updates as any).eq('id', id);
    if (error) throw error;
  },

  async toggleLike(postId: string, userId: string, currentLikes: string[]): Promise<string[]> {
    const liked = currentLikes.includes(userId);
    const newLikes = liked
      ? currentLikes.filter(id => id !== userId)
      : [...currentLikes, userId];
    const { error } = await supabase
      .from('posts')
      .update({ likes: newLikes } as any)
      .eq('id', postId);
    if (error) throw error;
    return newLikes;
  },

  async addComment(postId: string, comment: { authorId: string; text: string }) {
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: comment.authorId,
        text: comment.text,
      } as any);
    if (error) throw error;
  },
};
