
import React, { useState } from 'react';
import { type User, type Post, type View } from '../types';
import PostItem from './PostItem';
import { UsersIcon, PlusIcon } from './icons/Icons';
import CreatePostModal, { type PostData } from './CreatePostModal';
import VerifiedBadge from './VerifiedBadge';

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
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profileUser, currentUser, posts, onFollowUser, onLikePost, onAddComment, onFavoritePost, onNavigate, onCreatePost, onMessageUser, onRequestVerification, onDeletePost }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const userPosts = posts.filter(p => p.authorId === profileUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
    const isFollowing = currentUser.following?.includes(profileUser.id);
    const isOwnProfile = currentUser.id === profileUser.id;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <img src={profileUser.avatarUrl} alt={profileUser.name} className="w-32 h-32 rounded-full border-4 border-white shadow-lg" />
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

            {/* Posts */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Posts</h2>
                    {isOwnProfile && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
                        >
                            <PlusIcon />
                            Create Post
                        </button>
                    )}
                </div>
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
            </div>
            
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={onCreatePost}
                userId={currentUser.id}
            />
        </div>
    );
};

export default ProfilePage;
