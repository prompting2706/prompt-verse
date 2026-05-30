import React from 'react';
import { type Post } from '../types';

interface PostAnalyticsViewProps {
  posts: Post[];
}

const PostAnalyticsView: React.FC<PostAnalyticsViewProps> = ({ posts }) => {
  const sorted = [...posts].sort((a, b) => b.likes.length - a.likes.length);

  const totalLikes = posts.reduce((s, p) => s + p.likes.length, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments.length, 0);
  const totalViews = posts.reduce((s, p) => s + (p.viewsCount ?? 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.sharesCount ?? 0), 0);
  const totalSaves = posts.reduce((s, p) => s + (p.savesCount ?? 0), 0);

  const StatCard = ({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) => (
    <div className={`${color} rounded-2xl p-5 flex flex-col gap-1`}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-4xl mb-3">📊</p>
        <h3 className="text-lg font-semibold text-gray-700">Henüz gönderi yok</h3>
        <p className="text-sm text-gray-500 mt-1">Gönderi paylaştıktan sonra analitikler burada görünür.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Toplam İstatistikler</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard emoji="❤️" label="Beğeni" value={totalLikes} color="bg-red-50" />
          <StatCard emoji="💬" label="Yorum" value={totalComments} color="bg-blue-50" />
          <StatCard emoji="🔖" label="Kaydeden" value={totalSaves} color="bg-green-50" />
          <StatCard emoji="↗️" label="Paylaşım" value={totalShares} color="bg-purple-50" />
          <StatCard emoji="👁️" label="Görüntüleme" value={totalViews} color="bg-orange-50" />
        </div>
      </div>

      {/* Per-post table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Gönderi Bazlı Performans</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">Gönderi</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">❤️</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">💬</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">🔖</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">👁️</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">📝</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-800 line-clamp-2 max-w-xs">{post.caption}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{post.likes.length}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{post.comments.length}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{post.savesCount ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{post.viewsCount ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Engagement rate */}
      {totalLikes + totalComments > 0 && posts.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 Etkileşim Özeti</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Post başına ort. beğeni</p>
              <p className="font-bold text-gray-800 text-lg">{(totalLikes / posts.length).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-gray-500">Post başına ort. yorum</p>
              <p className="font-bold text-gray-800 text-lg">{(totalComments / posts.length).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-gray-500">En iyi gönderi</p>
              <p className="font-bold text-gray-800 text-lg truncate">{sorted[0]?.caption?.slice(0, 30) ?? '—'}…</p>
            </div>
            <div>
              <p className="text-gray-500">Toplam gönderi</p>
              <p className="font-bold text-gray-800 text-lg">{posts.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostAnalyticsView;
