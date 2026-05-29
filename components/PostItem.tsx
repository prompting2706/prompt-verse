
import React, { useState } from 'react';
import { type Post, type User, type View } from '../types';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from './icons/Icons';
import { toast } from '../utils/toast';

interface PostItemProps {
  post: Post;
  currentUser: User;
  onLike: (postId: string) => void;
  onComment: (postId: string, commentText: string) => void;
  onFollow: (userId: string) => void;
  onFavorite: (postId: string) => void;
  onNavigate: (view: View) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUser, onLike, onComment, onFollow, onFavorite, onNavigate }) => {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

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
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname + '#explore').then(() => {
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
            <button onClick={() => onFavorite(post.id)} className="text-gray-600 hover:text-brand-green">
                <BookmarkIcon className={`w-6 h-6 ${isFavorited ? 'text-brand-green fill-current' : ''}`} />
            </button>
        </div>
      </div>
      
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
