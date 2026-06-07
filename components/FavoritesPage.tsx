
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type Post, type User, type View } from '../types';
import PostItem from './PostItem';
import { BookmarkIcon } from './icons/Icons';

interface FavoritesPageProps {
  user: User;
  posts: Post[];
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onFollowUser: (userId: string) => void;
  onFavoritePost: (postId: string) => void;
  onNavigate: (view: View) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ user, posts, onLikePost, onAddComment, onFollowUser, onFavoritePost, onNavigate }) => {
  const { t } = useTranslation();

  const favoritePosts = useMemo(() => {
    const favoriteIds = new Set(user.favorites || []);
    return posts
      .filter(post => favoriteIds.has(post.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, user.favorites]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('favorites.title', 'My Favorites')}</h1>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-8">
        {favoritePosts.length > 0 ? (
          favoritePosts.map(post => (
            <PostItem 
              key={post.id}
              post={post}
              currentUser={user}
              onLike={onLikePost}
              onComment={onAddComment}
              onFollow={onFollowUser}
              onFavorite={onFavoritePost}
              onNavigate={onNavigate}
            />
          ))
        ) : (
           <div className="text-center py-16 bg-white p-12 rounded-xl shadow-md border border-gray-200">
                <BookmarkIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">{t('favorites.empty', 'No Favorites Yet')}</h2>
                <p className="text-gray-500 mt-2">{t('favorites.emptyHint', 'Click the bookmark icon on any post to save it here for later.')}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
