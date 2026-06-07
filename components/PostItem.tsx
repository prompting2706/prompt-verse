
import React, { useState, useMemo } from 'react';
import { type Post, type User, type View } from '../types';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from './icons/Icons';
import { toast } from '../utils/toast';

const AUDIENCES = [
  { id: 'general',   label: 'Genel Kitle',      cpm: 2.0,  desc: 'Tüm kullanıcılar' },
  { id: 'creators',  label: 'İçerik Üreticileri', cpm: 3.5,  desc: 'Sosyal medya & içerik odaklı' },
  { id: 'marketers', label: 'Pazarlamacılar',    cpm: 4.5,  desc: 'Dijital pazarlama profesyonelleri' },
  { id: 'devs',      label: 'Geliştiriciler',    cpm: 5.5,  desc: 'Yazılım & teknoloji topluluğu' },
  { id: 'founders',  label: 'Girişimciler',      cpm: 6.0,  desc: 'Startup & iş dünyası' },
  { id: 'artists',   label: 'AI Sanatçıları',    cpm: 7.5,  desc: 'AI görsel & yaratıcı topluluk' },
];

interface PostItemProps {
  post: Post;
  currentUser: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, commentText: string) => void;
  onFollow: (userId: string) => void;
  onFavorite: (postId: string) => void;
  onNavigate: (view: View) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string, newCaption: string, newTags: string[]) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUser, onLike, onComment, onFollow, onFavorite, onNavigate, onDelete, onEdit }) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [editTags, setEditTags] = useState('');
  const [boostBudget, setBoostBudget] = useState('10');
  const [boostAudience, setBoostAudience] = useState('general');
  const [boostDuration, setBoostDuration] = useState(7);

  const boostEstimate = useMemo(() => {
    const budget = parseFloat(boostBudget) || 0;
    const audience = AUDIENCES.find(a => a.id === boostAudience) ?? AUDIENCES[0];
    const impressions = budget > 0 ? Math.round((budget / audience.cpm) * 1000) : 0;
    const low = Math.round(impressions * 0.8);
    const high = Math.round(impressions * 1.2);
    const dailyLow = Math.round(low / boostDuration);
    const dailyHigh = Math.round(high / boostDuration);
    return { impressions, low, high, dailyLow, dailyHigh };
  }, [boostBudget, boostAudience, boostDuration]);

  const isLiked = post.likes.includes(currentUser.id);
  const isFollowing = currentUser.following?.includes(post.authorId);
  const isOwnPost = post.authorId === currentUser.id;
  const isFavorited = currentUser.favorites?.includes(post.id);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText('');
    }
  };

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
  }
  
  const renderCommentText = (text: string) => {
      const parts = text.split(/(@\w+\s*\w*)/g);
      return parts.map((part, index) => 
          part.startsWith('@') ? 
          <span key={index} className="font-semibold text-brand-orange">{part}</span> : 
          part
      );
  };
  
  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate({ type: 'profile', payload: { userId: post.authorId } });
  };


  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <button onClick={handleViewProfile} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange">
          <img src={post.authorAvatar} alt={post.authorName} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-bold">{post.authorName}</p>
            <p className="text-xs text-gray-500">{timeSince(post.createdAt)} ago</p>
          </div>
        </button>
        {isOwnPost && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={() => { setEditCaption(post.caption); setEditTags(post.tags.join(', ')); setShowEditModal(true); }}
                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-colors"
                title="Edit post"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Delete post"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
        {!isOwnPost && (
          <button
            onClick={() => onFollow(post.authorId)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              isFollowing
                ? 'bg-gray-200 text-gray-700'
                : 'bg-brand-green text-white hover:bg-green-600'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Media */}
      {post.videoUrl && (
        <video src={post.videoUrl} controls className="w-full max-h-96 object-contain bg-black" />
      )}
      {!post.videoUrl && post.imageUrl && (
        <img src={post.imageUrl} alt="Post content" className="w-full" />
      )}

      {/* Own-post analytics strip */}
      {isOwnPost && (post.viewsCount !== undefined || post.sharesCount !== undefined || post.savesCount !== undefined) && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          {post.viewsCount !== undefined && <span>👁 {post.viewsCount} görüntüleme</span>}
          {post.sharesCount !== undefined && <span>↗ {post.sharesCount} paylaşım</span>}
          {post.savesCount !== undefined && <span>🔖 {post.savesCount} kayıt</span>}
        </div>
      )}

      {/* Content & Actions */}
      <div className="p-4">
        <p className="mb-4 text-sm">{renderCommentText(post.caption)}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">#{tag}</span>
          ))}
        </div>

        <div className="flex justify-between items-center">
            <div className="flex items-center gap-6 text-gray-600">
                <button onClick={() => onLike(post.id)} className="flex items-center gap-2 hover:text-brand-orange">
                    <HeartIcon className={`w-6 h-6 ${isLiked ? 'text-brand-orange fill-current' : ''}`} />
                    <span className="text-sm font-semibold">{post.likes.length}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-brand-green">
                    <CommentIcon className="w-6 h-6" />
                    <span className="text-sm font-semibold">{post.comments.length}</span>
                </button>
                <button
                    onClick={() => {
                      // BUG: was copying generic #explore URL; now copies post-specific deep link
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname + `#post/${post.id}`).then(() => {
                        toast.success('Link kopyalandı!');
                      }).catch(() => {
                        toast.info('Paylaşmak için linki kopyalayın.');
                      });
                    }}
                    className="flex items-center gap-2 hover:text-brand-orange"
                >
                    <ShareIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-center gap-2">
              {isOwnPost && (
                <button
                  onClick={() => setShowBoostModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-orange bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-full transition-colors"
                >
                  🚀 Öne Çıkart
                </button>
              )}
              <button onClick={() => onFavorite(post.id)} className="text-gray-600 hover:text-brand-green">
                <BookmarkIcon className={`w-6 h-6 ${isFavorited ? 'text-brand-green fill-current' : ''}`} />
              </button>
            </div>
        </div>
      </div>

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Gönderiyi Düzenle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border-gray-300 focus:ring-brand-orange focus:border-brand-orange text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler (virgülle ayır)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full rounded-xl border-gray-300 focus:ring-brand-orange focus:border-brand-orange text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">İptal</button>
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit(post.id, editCaption, editTags.split(',').map(t => t.trim()).filter(Boolean));
                    setShowEditModal(false);
                  }
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-orange rounded-xl hover:bg-orange-600"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boost Post Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowBoostModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold">🚀 Gönderiyi Öne Çıkart</h3>
              <p className="text-sm text-gray-500 mt-0.5">Bütçe ve hedef kitlenizi girin, tahmini gösterimi görün.</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bütçe ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    min="3"
                    step="1"
                    value={boostBudget}
                    onChange={e => setBoostBudget(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-brand-orange focus:border-brand-orange"
                    placeholder="10"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Minimum $3</p>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hedef Kitle</label>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCES.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setBoostAudience(a.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 transition-colors ${
                        boostAudience === a.id
                          ? 'border-brand-orange bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-800">{a.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Süre</label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBoostDuration(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        boostDuration === d
                          ? 'border-brand-orange bg-orange-50 text-brand-orange'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {d}g
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated Impressions */}
              <div className={`rounded-xl p-4 ${boostEstimate.impressions > 0 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100' : 'bg-gray-50 border border-gray-100'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tahmini Gösterim</p>
                {boostEstimate.impressions > 0 ? (
                  <>
                    <p className="text-2xl font-bold text-brand-orange">
                      {boostEstimate.low.toLocaleString()} – {boostEstimate.high.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Günlük ~{boostEstimate.dailyLow.toLocaleString()}–{boostEstimate.dailyHigh.toLocaleString()} kişiye ulaşır · {boostDuration} gün boyunca
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      * Tahminler hedef kitleye ve içerik kalitesine göre ±%20 değişebilir.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Bütçe girin ve hedef kitle seçin</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowBoostModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (!boostBudget || parseFloat(boostBudget) < 3) {
                    toast.error('Minimum bütçe $3 olmalıdır.');
                    return;
                  }
                  // BUG: boost was silently doing nothing — now clearly marked as coming soon
                  toast.info(`Bu özellik yakında geliyor! Ödeme entegrasyonu tamamlandığında $${boostBudget} bütçeyle ${boostDuration} gün boost aktif olacak.`);
                  setShowBoostModal(false);
                }}
                disabled={!boostBudget || parseFloat(boostBudget) < 3}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-orange rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🚀 Öne Çıkart — ${boostBudget || '0'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Comments */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="space-y-3">
            {post.comments.slice(0, showAllComments ? post.comments.length : 2).map(comment => (
                <div key={comment.id} className="flex items-start gap-2.5 text-sm">
                    <img src={comment.authorAvatar} alt={comment.authorName} className="w-7 h-7 rounded-full mt-0.5" />
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg">
                        <span className="font-bold mr-2">{comment.authorName}</span>
                        <span>{renderCommentText(comment.text)}</span>
                    </div>
                </div>
            ))}
        </div>
        {post.comments.length > 2 && !showAllComments && (
            <button onClick={() => setShowAllComments(true)} className="text-sm font-semibold text-gray-500 mt-3 hover:text-gray-800">
                View all {post.comments.length} comments
            </button>
        )}
        
        {/* Add Comment Form */}
        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mt-4">
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full" />
            <input 
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full text-sm border-gray-300 rounded-full px-4 py-1.5 bg-white focus:ring-brand-orange focus:border-brand-orange"
            />
            <button type="submit" className="text-sm font-semibold text-brand-green hover:text-green-600 disabled:text-gray-400" disabled={!commentText.trim()}>Post</button>
        </form>
      </div>
    </div>
  );
};

export default PostItem;
