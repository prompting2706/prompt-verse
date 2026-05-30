
import React, { useState } from 'react';
import { type User, type Post, type View } from '../types';
import PostItem from './PostItem';
import { UsersIcon, PlusIcon } from './icons/Icons';
import CreatePostModal, { type PostData } from './CreatePostModal';
import VerifiedBadge from './VerifiedBadge';
import AvatarCropModal from './AvatarCropModal';
import PostAnalyticsView from './PostAnalyticsView';

interface ProfilePageProps {
    profileUser: User;
    currentUser: User;
    posts: Post[];
    onFollowUser: (userId: string) => void;
    onLikePost: (postId: string) => void;
    onAddComment: (postId: string, commentText: string) => void;
    onFavoritePost: (postId: string) => void;
    onNavigate: (view: View) => void;
    onCreatePost: (postData: PostData) => void;
    onMessageUser: (userId: string) => void;
    onRequestVerification?: () => void;
    onDeletePost?: (postId: string) => void;
    onEditPost?: (postId: string, newCaption: string, newTags: string[]) => void;
    onUpdateAvatar?: (blob: Blob) => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profileUser, currentUser, posts, onFollowUser, onLikePost, onAddComment, onFavoritePost, onNavigate, onCreatePost, onMessageUser, onRequestVerification, onDeletePost, onEditPost, onUpdateAvatar }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showAvatarCrop, setShowAvatarCrop] = useState(false);
    const [activeTab, setActiveTab] = useState<'posts' | 'analytics'>('posts');
    
    const userPosts = posts.filter(p => p.authorId === profileUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
    const isFollowing = currentUser.following?.includes(profileUser.id);
    const isOwnProfile = currentUser.id === profileUser.id;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative group">
                        <img src={profileUser.avatarUrl} alt={profileUser.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover" />
                        {isOwnProfile && onUpdateAvatar && (
                            <button
                                onClick={() => setShowAvatarCrop(true)}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Fotoğrafı değiştir"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                            <VerifiedBadge status={profileUser.verificationStatus} size="lg" />
                        </div>
                        <p className="text-gray-600 mt-2">{profileUser.bio}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
                            <div className="text-center">
                                <p className="text-xl font-bold">{userPosts.length}</p>
                                <p className="text-sm text-gray-500">Posts</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold">{profileUser.followers?.length || 0}</p>
                                <p className="text-sm text-gray-500">Followers</p>
                            </div>
                            {isOwnProfile && (
                                <div className="text-center">
                                    <p className="text-xl font-bold">{profileUser.following?.length || 0}</p>
                                    <p className="text-sm text-gray-500">Following</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {isOwnProfile && (
                        <div className="self-center sm:self-start flex flex-col items-center sm:items-end gap-1">
                            {profileUser.verificationStatus === 'verified' && (
                                <span className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                                    <VerifiedBadge status="verified" size="sm" />
                                    Verified Creator
                                </span>
                            )}
                            {profileUser.verificationStatus === 'pending' && (
                                <span className="text-xs font-semibold bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-full">
                                    Doğrulama İnceleniyor...
                                </span>
                            )}
                            {(!profileUser.verificationStatus || profileUser.verificationStatus === 'none') && onRequestVerification && (
                                <button
                                    onClick={onRequestVerification}
                                    className="text-xs font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    Doğrulama Talep Et
                                </button>
                            )}
                        </div>
                    )}
                    {!isOwnProfile && (
                        <div className="flex gap-2 self-center sm:self-start">
                            <button
                                onClick={() => onFollowUser(profileUser.id)}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                                    isFollowing
                                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        : 'bg-brand-green text-white hover:bg-green-600'
                                }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button
                                onClick={() => onMessageUser(profileUser.id)}
                                className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm bg-brand-orange text-white hover:bg-orange-600"
                            >
                                Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Posts / Analytics tabs */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'posts' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Gönderiler
                        </button>
                        {isOwnProfile && (
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'analytics' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                📊 Analitik
                            </button>
                        )}
                    </div>
                    {isOwnProfile && activeTab === 'posts' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
                        >
                            <PlusIcon />
                            Create Post
                        </button>
                    )}
                </div>

                {activeTab === 'analytics' && isOwnProfile && (
                    <PostAnalyticsView posts={userPosts} />
                )}

                {activeTab === 'posts' && (
                 <div className="max-w-2xl mx-auto space-y-8">
                    {userPosts.length > 0 ? (
                        userPosts.map(post => (
                            <PostItem
                                key={post.id}
                                post={post}
                                currentUser={currentUser}
                                onLike={onLikePost}
                                onComment={onAddComment}
                                onFollow={onFollowUser}
                                onFavorite={onFavoritePost}
                                onNavigate={onNavigate}
                                onDelete={isOwnProfile ? onDeletePost : undefined}
                                onEdit={isOwnProfile ? onEditPost : undefined}
                            />
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white p-12 rounded-xl shadow-md border border-gray-200">
                            <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <h2 className="text-xl font-semibold text-gray-700">No Posts Yet</h2>
                            <p className="text-gray-500 mt-2">{profileUser.name} hasn't shared any posts.</p>
                        </div>
                    )}
                </div>
                )}
            </div>
            
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={onCreatePost}
                userId={currentUser.id}
            />

            {onUpdateAvatar && (
                <AvatarCropModal
                    isOpen={showAvatarCrop}
                    onClose={() => setShowAvatarCrop(false)}
                    onSave={onUpdateAvatar}
                />
            )}
        </div>
    );
};

export default ProfilePage;
