


import { type User, type MarketplaceItem, type Post, type Order, type Campaign } from '../types';

// --- Normalization Helper ---
const normalize = (value: number, max: number) => (max > 0 ? value / max : 0);

// --- Marketplace Recommendation ---

export const getRecommendedMarketplaceItems = (
  allItems: MarketplaceItem[],
  user: User,
  orders: Order[],
  campaigns: Campaign[],
): MarketplaceItem[] => {
  if (allItems.length === 0) return [];

  // 0. Create a map of active campaigns for quick lookup
  const now = new Date();
  const activeCampaigns: Campaign[] = campaigns.filter(campaign => 
    campaign.status === 'active' &&
    new Date(campaign.startDate) <= now &&
    (!campaign.endDate || new Date(campaign.endDate) >= now)
  );


  // 1. Analyze user's purchase history for preferences
  const purchasedItemIds = new Set(orders.flatMap(o => o.items.map(i => i.product.id)));
  const userPurchasedItems = allItems.filter(item => purchasedItemIds.has(item.id));

  const preferredTags = new Map<string, number>();
  const preferredSellers = new Map<string, number>();

  userPurchasedItems.forEach(item => {
    item.tags?.forEach(tag => {
      preferredTags.set(tag, (preferredTags.get(tag) || 0) + 1);
    });
    preferredSellers.set(item.sellerId, (preferredSellers.get(item.sellerId) || 0) + 1);
  });

  // 2. Find max values for normalization
  const maxSales = Math.max(...allItems.map(i => i.salesCount));
  const maxRating = 5; // Assuming 5 is max
  const maxViews = Math.max(...allItems.map(i => i.views));
  const timestamps = allItems.map(i => parseInt(i.id.split('-')[1] || '0')).filter(t => !isNaN(t));
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);

  // 3. Score each item
  const scoredItems = allItems.map(item => {
    let score = 0;

    // Give user's own items a negative score to place them last in recommendations
    if (item.sellerId === user.id) {
        return { item, score: -1 };
    }

    // a. Tag Match Score (Weight: 40)
    let tagScore = 0;
    if (item.tags && item.tags.length > 0) {
        const matchingTagsWeight = item.tags.reduce((acc, tag) => acc + (preferredTags.get(tag) || 0), 0);
        tagScore = (matchingTagsWeight / item.tags.length) * 40;
    }
    score += tagScore;

    // b. Seller Affinity Score (Weight: 20)
    if (preferredSellers.has(item.sellerId)) {
        score += 20;
    }

    // c. General Popularity Score (Weight: 30)
    const popularityScore = (
        normalize(item.salesCount, maxSales) * 0.5 +
        normalize(item.rating, maxRating) * 0.3 +
        normalize(item.views, maxViews) * 0.2
    ) * 30;
    score += popularityScore;
    
    // d. Recency Score (Weight: 10)
    const itemTimestamp = parseInt(item.id.split('-')[1] || '0');
    if (!isNaN(itemTimestamp) && maxTimestamp > minTimestamp) {
        const recencyScore = normalize(itemTimestamp - minTimestamp, maxTimestamp - minTimestamp) * 10;
        score += recencyScore;
    }
    
    // e. Campaign Boost Score (High weight to prioritize)
    let campaignBoost = 0;
    const campaignBoostWeight = 2.5;
    activeCampaigns.forEach(campaign => {
        // Check if any prompt from the campaign is in the current marketplace item
        const isBoosted = campaign.promptIds.some(pId => item.promptIds?.includes(pId));
        if (isBoosted) {
            // If multiple campaigns boost the same item, take the highest budget
            campaignBoost = Math.max(campaignBoost, campaign.budget);
        }
    });
    
    if (campaignBoost > 0) {
        score += campaignBoost * campaignBoostWeight;
    }


    return { item, score };
  });

  // 4. Sort by score
  return scoredItems
    .sort((a, b) => b.score - a.score)
    .map(scored => scored.item);
};


// --- Explore Page Recommendation ---

export const getRecommendedPosts = (
  allPosts: Post[],
  user: User,
): Post[] => {
    if (allPosts.length === 0) return [];
    
    // 1. Analyze user's interaction history
    const likedOrFavoritedPosts = allPosts.filter(
        post => post.likes.includes(user.id) || user.favorites?.includes(post.id)
    );
    
    const preferredTags = new Map<string, number>();
    const interactedAuthors = new Map<string, number>();

    likedOrFavoritedPosts.forEach(post => {
        post.tags.forEach(tag => {
            preferredTags.set(tag, (preferredTags.get(tag) || 0) + 1);
        });
        interactedAuthors.set(post.authorId, (interactedAuthors.get(post.authorId) || 0) + 1);
    });
    
    // 2. Find max values for normalization
    const maxLikes = Math.max(...allPosts.map(p => p.likes.length));
    const maxComments = Math.max(...allPosts.map(p => p.comments.length));
    const timestamps = allPosts.map(p => new Date(p.createdAt).getTime());
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    // 3. Score each post
    const scoredPosts = allPosts.map(post => {
        let score = 0;
        
        // a. Tag Match Score (Weight: 30)
        let tagScore = 0;
        if (post.tags.length > 0) {
            const matchingTagsWeight = post.tags.reduce((acc, tag) => acc + (preferredTags.get(tag) || 0), 0);
            tagScore = (matchingTagsWeight / post.tags.length) * 30;
        }
        score += tagScore;
        
        // b. Author Affinity Score (Weight: 30)
        let authorAffinityScore = 0;
        if (user.following?.includes(post.authorId)) {
            authorAffinityScore += 15;
        }
        if (interactedAuthors.has(post.authorId)) {
            authorAffinityScore += 15;
        }
        score += authorAffinityScore;
        
        // c. General Popularity Score (Weight: 25)
        const popularityScore = (
            normalize(post.likes.length, maxLikes) * 0.7 +
            normalize(post.comments.length, maxComments) * 0.3
        ) * 25;
        score += popularityScore;
        
        // d. Recency Score (Weight: 15)
        if (maxTimestamp > minTimestamp) {
            const recencyScore = normalize(new Date(post.createdAt).getTime() - minTimestamp, maxTimestamp - minTimestamp) * 15;
            score += recencyScore;
        }
        
        // e. Boost posts from followed users
        if (user.following?.includes(post.authorId)) {
            score *= 1.1;
        }
        
        return { post, score };
    });

    // 4. Sort
    return scoredPosts
        .sort((a, b) => b.score - a.score)
        .map(scored => scored.post);
};