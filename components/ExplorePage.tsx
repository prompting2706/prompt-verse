


import React, { useState, useMemo, useEffect } from 'react';
import { type Post, type User, type View, type Campaign, type Prompt } from '../types';
import { PlusIcon, SearchIcon, SparklesIcon } from './icons/Icons';
import PostItem from './PostItem';
import CreatePostModal, { type PostData } from './CreatePostModal';
import { getRecommendedPosts } from '../services/recommendationService';
import AdBanner from './AdBanner';
import PromptCard from './PromptCard'; // To optionally show prompt details

interface ExplorePageProps {
  user: User;
  posts: Post[];
  prompts: Prompt[];
  allSystemPrompts?: Prompt[];
  campaigns: Campaign[];
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onFollowUser: (userId: string) => void;
  onCreatePost: (postData: PostData) => void;
  onFavoritePost: (postId: string) => void;
  onNavigate: (view: View) => void;
  onCampaignImpression: (campaignId: string, promptId: string) => void;
}

const ExplorePage: React.FC<ExplorePageProps> = ({ user, posts, prompts, allSystemPrompts, campaigns, onLikePost, onAddComment, onFollowUser, onCreatePost, onFavoritePost, onNavigate, onCampaignImpression }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adToShow, setAdToShow] = useState<Campaign | null>(null);

  useEffect(() => {
    // Select an ad to show
    const now = new Date();
    const activeCampaigns = campaigns.filter(c => 
        c.status === 'active' && 
        new Date(c.startDate) <= now &&
        (!c.endDate || new Date(c.endDate) > now)
    );
    if (activeCampaigns.length > 0) {
        const randomAd = activeCampaigns[Math.floor(Math.random() * activeCampaigns.length)];
        setAdToShow(randomAd);
    }
  }, [campaigns]);

  // Determine Prompt of the Day based on the current date and system-wide engagement
  const promptOfTheDay = useMemo(() => {
      const systemPromptsToUse = allSystemPrompts && allSystemPrompts.length > 0 ? allSystemPrompts : prompts;
      if (!systemPromptsToUse || systemPromptsToUse.length === 0) return null;
      
      // Get a number based on today's date string e.g. "2026-05-14"
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Calculate daily score for each prompt: base baseEngagement * daily multiplier
      const promptsWithDailyScore = systemPromptsToUse.map(p => {
          const baseEngagement = (p.likes?.length || 0) + (p.comments?.length || 0) + (p.usageCount || 0);
          
          let hash = 0;
          const str = p.id + dateStr;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          const randomFactor = 0.8 + (Math.abs(hash) % 40) / 100; // Multiplier between 0.8 and 1.19
          
          return {
             prompt: p,
             dailyScore: baseEngagement * randomFactor
          };
      });

      promptsWithDailyScore.sort((a, b) => b.dailyScore - a.dailyScore);
      return promptsWithDailyScore[0].prompt;
  }, [prompts, allSystemPrompts]);

  const filteredAndSortedPosts = useMemo(() => {
    // If there's a search term, filter based on it and sort by date.
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = posts.filter(post => {
        const matchesCaption = post.caption.toLowerCase().includes(searchLower);
        const matchesAuthor = post.authorName.toLowerCase().includes(searchLower);
        const matchesTags = post.tags.some(tag => tag.toLowerCase().includes(searchLower));
        return matchesCaption || matchesAuthor || matchesTags;
      });
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Otherwise, return the personally recommended posts.
    return getRecommendedPosts(posts, user);
  }, [posts, user, searchTerm]);

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Explore</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
        >
          <PlusIcon />
          Create Post
        </button>
      </div>

      {/* Sticky Prompt of the Day */}
      {promptOfTheDay && (
          <div className="sticky top-[-32px] z-20 pt-8 pb-4 mb-8 bg-[#fdfdfd]/95 backdrop-blur-md border-b border-gray-200">
             <div className="max-w-2xl mx-auto">
                 <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wide mb-2">
                     <SparklesIcon />
                     <h2>Prompt of the Day</h2>
                 </div>
                 <div 
                    onClick={() => onNavigate({ type: 'promptDetail', payload: promptOfTheDay })}
                    className="bg-white border border-brand-orange/30 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center group"
                 >
                     <div>
                         <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-orange transition-colors">{promptOfTheDay.title}</h3>
                         <p className="text-gray-600 text-sm mt-1 line-clamp-1">{promptOfTheDay.description}</p>
                     </div>
                     <span className="bg-brand-orange text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap ml-4">
                         View Details
                     </span>
                 </div>
             </div>
          </div>
      )}

      {/* Ad Banner */}
      {adToShow && (
        <AdBanner 
            campaign={adToShow} 
            onNavigate={onNavigate} 
            onImpression={onCampaignImpression}
            className="mb-8 max-w-2xl mx-auto"
        />
      )}
      
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
            </span>
            <input
                type="text"
                placeholder="Search posts by caption, tags, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange"
                aria-label="Search explore feed"
            />
        </div>
      </div>


      <div className="max-w-2xl mx-auto space-y-8">
        {filteredAndSortedPosts.length > 0 ? (
          filteredAndSortedPosts.map(post => (
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
           <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-gray-700">No Posts Found</h2>
                <p className="text-gray-500 mt-2">Try adjusting your search term to find what you're looking for.</p>
            </div>
        )}
      </div>
      
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={onCreatePost}
        userId={user.id}
      />
    </div>
  );
};

export default ExplorePage;