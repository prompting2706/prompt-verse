

export enum MembershipType {
  STARTER = 'starter',
  CREATOR = 'creator',
  PRO = 'pro',
  TEAM = 'team',
}

export enum OutputType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code',
  TEXT = 'text',
  FILE = 'file',
}

export enum PermissionLevel {
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  imageUrl?: string;
  videoUrl?: string;
  caption: string;
  tags: string[];
  createdAt: string;
  likes: string[];
  comments: Comment[];
  viewsCount?: number;
  sharesCount?: number;
  savesCount?: number;
}

export type VerificationStatus = 'none' | 'pending' | 'verified';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  membership: MembershipType;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isPrivate?: boolean;
  followers?: string[];
  following?: string[];
  favorites?: string[];
  referralCode?: string;
  verificationStatus?: VerificationStatus;
}

export interface ReferralRecord {
  id: string;
  referredUserId: string;
  referredUserName: string;
  referredUserAvatar: string;
  joinedAt: string;
  status: 'pending' | 'converted';
  earnedAmount: number;
}

export interface Coupon {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount?: number;
  description: string;
}

export interface Project {
  id:string;
  name: string;
  color: string;
  ownerId: string;
  collaborators: Collaborator[];
}

export interface PromptOutput {
  type: OutputType;
  content: string; // URL for image/video/audio, or code string
  fileName?: string;
}

export interface PromptVersion {
  id:string;
  promptText: string;
  createdAt: string;
  updatedBy: string;
  updatedByName: string;
}

export interface Collaborator {
  userId: string;
  email: string; 
  avatarUrl: string; 
  permission: PermissionLevel;
}

export interface Prompt {
  id:string;
  title: string;
  description: string;
  promptText: string;
  tags: string[];
  projectId: string | null;
  outputs: PromptOutput[];
  lastEdited: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
  usageCount: number;
  versions: PromptVersion[];
  ownerId: string;
  collaborators: Collaborator[];
}

export interface SponsoredListing {
  startDate: string;
  endDate: string;
}

export interface MarketplaceItem {
  id: string;
  type: 'single' | 'collection';
  title: string;
  description: string;
  seller: Pick<User, 'name' | 'avatarUrl' | 'verificationStatus'>;
  sellerId: string;
  price: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  views: number;
  coverImage: string;
  promptCount?: number; // for collections
  tags?: string[];
  promptIds?: string[];
  originalPrice?: number;
  sponsored?: SponsoredListing;
}

export interface CartItem {
  product: MarketplaceItem;
  quantity: number;
  rating?: number; // From 1 to 5
  review?: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  status: 'Completed' | 'Processing';
}

export interface PromptCampaignStat {
  promptId: string;
  impressions: number;
  sales: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  promptIds: string[];
  budget: number;
  startDate: string; // ISO String
  endDate?: string; // ISO String
  status: 'active' | 'paused' | 'completed';
  creativeType: 'image' | 'video';
  creativeUrl: string;
  purpose?: 'marketplace' | 'social';
  // Aggregated data
  totalImpressions: number;
  totalSales: number; // Number of sales generated
  // Per-prompt data
  promptStats: PromptCampaignStat[];
}


export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  actorId: string; // The user who performed the action
  actorName: string;
  actorAvatar: string;
  type: 'like' | 'comment' | 'sale' | 'invite_collaborator' | 'commission_request' | 'commission_accepted' | 'commission_delivered' | 'commission_declined';
  targetType: 'prompt' | 'post' | 'marketplace_item' | 'project';
  targetId: string;
  targetPreview: string; // A short preview of the prompt/post or comment
  createdAt: string;
  isRead: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  sharedPromptId?: string;
  sharedPostId?: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export type CustomOrderStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'declined' | 'cancelled';

export interface CustomOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  title: string;
  description: string;
  budget: number;
  agreedPrice?: number;
  deadline?: string;
  status: CustomOrderStatus;
  sellerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type View =
  | { type: 'dashboard', payload: null }
  | { type: 'marketplace', payload: null }
  | { type: 'myStore', payload: { activeTab?: 'products' | 'analytics' | 'campaigns' } | null }
  | { type: 'publicStore', payload: { sellerId: string; sellerName: string; avatarUrl: string; verificationStatus?: VerificationStatus } }
  | { type: 'promptDetail', payload: Prompt | null }
  | { type: 'login', payload: null }
  | { type: 'register', payload: null }
  | { type: 'settings', payload: null }
  | { type: 'cart', payload: null }
  | { type: 'archived', payload: null }
  | { type: 'orders', payload: null }
  | { type: 'upgrade', payload: null }
  | { type: 'cancelSubscription', payload: null }
  | { type: 'referral', payload: null }
  | { type: 'explore', payload: null }
  | { type: 'favorites', payload: null }
  | { type: 'profile', payload: { userId: string } }
  | { type: 'createCampaign', payload: { campaignId?: string } | null }
  | { type: 'campaignDetail', payload: { campaignId: string } }
  | { type: 'messages', payload: { conversationId?: string } | null }
  | { type: 'commissions', payload: null }
  | { type: 'privacy', payload: null }
  | { type: 'terms', payload: null }
  | { type: 'notFound', payload: null };