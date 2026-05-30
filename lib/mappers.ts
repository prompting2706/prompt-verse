import type { User, Prompt, Project, MarketplaceItem, Order, Campaign, Post, Notification, CustomOrder, ReferralRecord, Conversation } from '../types';
import { MembershipType } from '../types';

type Row = Record<string, any>;

export function mapDbProfile(row: Row, email = ''): User {
  return {
    id: row.id,
    // DB uses `name` column (not full_name)
    name: row.name ?? row.username ?? 'User',
    email: email || row.email || '',
    avatarUrl: row.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`,
    bio: row.bio ?? '',
    membership: row.membership ?? MembershipType.STARTER,
    subscriptionStartDate: row.subscription_start_date ?? undefined,
    subscriptionEndDate: row.subscription_end_date ?? undefined,
    isPrivate: false,
    followers: [],
    following: row.following ?? [],
    favorites: [],
    referralCode: row.referral_code ?? undefined,
    verificationStatus: row.verification_status ?? 'none',
  };
}

export function mapDbPrompt(row: Row): Prompt {
  return {
    id: row.id,
    title: row.title ?? '',
    description: row.description ?? '',
    promptText: row.prompt_text ?? row.content ?? '',
    tags: row.tags ?? [],
    projectId: row.project_id ?? null,
    outputs: row.outputs ?? row.output_files ?? [],
    lastEdited: row.updated_at ?? row.created_at,
    likes: row.likes ?? [],
    comments: row.comments ?? [],
    usageCount: row.use_count ?? 0,
    versions: row.versions ?? [],
    ownerId: row.user_id,
    collaborators: row.collaborators ?? [],
  };
}

export function mapDbProject(row: Row): Project {
  return {
    id: row.id,
    name: row.name ?? '',
    color: row.color ?? `hsl(${Math.abs((row.id?.charCodeAt(0) ?? 0) * 137) % 360}, 70%, 50%)`,
    ownerId: row.user_id ?? row.owner_id,
    collaborators: row.collaborators ?? [],
  };
}

export function mapDbMarketplaceItem(row: Row): MarketplaceItem {
  // When fetched with JOIN: row.seller is { name, avatar_url, verification_status }
  const sellerJoin = row.seller as Row | null;
  return {
    id: row.id,
    type: row.type ?? 'single',
    title: row.title ?? '',
    description: row.description ?? '',
    seller: {
      name: sellerJoin?.name ?? row.seller_name ?? 'Unknown',
      avatarUrl: sellerJoin?.avatar_url ?? row.seller_avatar ?? '',
      verificationStatus: sellerJoin?.verification_status ?? row.seller_verification_status,
    },
    sellerId: row.seller_id,
    price: row.price ?? 0,
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    salesCount: row.sales_count ?? 0,
    views: row.views ?? 0,
    coverImage: row.cover_image ?? '',
    promptCount: row.prompt_count ?? undefined,
    tags: row.tags ?? [],
    promptIds: row.prompt_ids ?? [],
    originalPrice: row.original_price ?? undefined,
    sponsored: row.sponsored ?? undefined,
  };
}

export function mapDbOrder(row: Row): Order {
  // DB stores one row per item; reconstruct a CartItem from the joined marketplace_item
  const itemJoin = row.item as Row | null;
  const cartItems = row.items ?? (row.item_id ? [{
    product: {
      id: row.item_id,
      type: itemJoin?.type ?? 'single',
      title: itemJoin?.title ?? '',
      description: '',
      seller: { name: '', avatarUrl: '', verificationStatus: undefined },
      sellerId: itemJoin?.seller_id ?? '',
      price: Number(itemJoin?.price ?? row.unit_price ?? 0),
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      views: 0,
      coverImage: itemJoin?.cover_image ?? '',
      tags: itemJoin?.tags ?? [],
      promptIds: [],
    },
    quantity: row.quantity ?? 1,
  }] : []);
  const unitPrice = Number(row.unit_price ?? 0);
  const qty = Number(row.quantity ?? 1);
  return {
    id: row.id,
    date: row.created_at,
    items: cartItems,
    subtotal: row.subtotal ?? unitPrice * qty,
    discountAmount: row.discount_amount ?? 0,
    couponCode: row.coupon_code ?? undefined,
    total: row.total ?? Number(row.total_price ?? unitPrice * qty),
    status: row.status === 'completed' ? 'Completed' : (row.status ?? 'Completed'),
  };
}

export function mapDbPost(row: Row): Post {
  // author comes from JOIN: profiles!posts_author_id_fkey
  const author = row.author as Row | null;
  // comments come from JOIN: post_comments(...)
  const rawComments: Row[] = Array.isArray(row.post_comments) ? row.post_comments : [];
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: author?.name ?? row.author_name ?? '',
    authorAvatar: author?.avatar_url ?? row.author_avatar ?? '',
    caption: row.caption ?? '',
    imageUrl: row.image_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    likes: row.likes ?? [],
    comments: rawComments.map(c => ({
      id: c.id,
      authorId: c.author_id,
      authorName: (c.author as Row | null)?.name ?? '',
      authorAvatar: (c.author as Row | null)?.avatar_url ?? '',
      text: c.text ?? '',
      createdAt: c.created_at,
    })),
  };
}

export function mapDbCampaign(row: Row): Campaign {
  return {
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? '',
    promptIds: row.prompt_ids ?? [],
    budget: row.budget ?? 0,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    // DB uses `is_active` boolean, map to status string
    status: row.status ?? (row.is_active === false ? 'paused' : 'active'),
    creativeType: row.creative_type ?? 'image',
    creativeUrl: row.creative_url ?? '',
    // DB uses `impressions` / `clicks`, not total_impressions / total_sales
    totalImpressions: row.total_impressions ?? row.impressions ?? 0,
    totalSales: row.total_sales ?? row.clicks ?? 0,
    promptStats: row.prompt_stats ?? [],
  };
}

export function mapDbNotification(row: Row): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    actorId: row.actor_id,
    actorName: row.actor_name ?? '',
    actorAvatar: row.actor_avatar ?? '',
    type: row.type,
    targetType: row.target_type,
    targetId: row.target_id,
    targetPreview: row.target_preview ?? '',
    createdAt: row.created_at,
    isRead: row.is_read ?? false,
  };
}

export function mapDbCustomOrder(row: Row): CustomOrder {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name ?? row.buyer?.name ?? '',
    buyerAvatar: row.buyer_avatar ?? row.buyer?.avatar_url ?? '',
    sellerId: row.seller_id,
    sellerName: row.seller_name ?? row.seller?.name ?? '',
    sellerAvatar: row.seller_avatar ?? row.seller?.avatar_url ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    budget: row.budget ?? 0,
    agreedPrice: row.agreed_price ?? undefined,
    deadline: row.deadline ?? undefined,
    status: row.status ?? 'pending',
    sellerNote: row.seller_note ?? row.delivery_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDbReferral(row: Row): ReferralRecord {
  return {
    id: row.id,
    referredUserId: row.referred_user_id,
    referredUserName: row.referred_user_name ?? row.referred_user?.name ?? '',
    referredUserAvatar: row.referred_user_avatar ?? row.referred_user?.avatar_url ?? '',
    joinedAt: row.joined_at ?? row.created_at,
    status: row.status ?? 'pending',
    earnedAmount: row.earned_amount ?? 0,
  };
}

export function mapDbConversation(row: Row): Conversation {
  return {
    id: row.id,
    participantIds: row.participant_ids ?? [],
    // DB uses last_message_at; fallback to created_at
    updatedAt: row.last_message_at ?? row.updated_at ?? row.created_at,
  };
}
