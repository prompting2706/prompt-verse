

import { type User, type Project, type Prompt, MembershipType, OutputType, type Order, type MarketplaceItem, PermissionLevel, type Post, type Campaign, type ReferralRecord, type Coupon, type CustomOrder, type Conversation } from './types';

export const MARKETPLACE_COMMISSION_RATE = 0.15;
export const MIN_MARKETPLACE_PRICE = 3;

export const MOCK_COUPONS: Coupon[] = [
  { code: 'HOSGELDIN', type: 'percent', value: 20, minOrderAmount: 5, description: 'İlk alışverişe %20 indirim' },
  { code: 'PROMPTVERSE10', type: 'fixed', value: 2, minOrderAmount: 10, description: '$2 indirim kuponu' },
  { code: 'CREATOR50', type: 'percent', value: 50, description: 'Creator üyelerine özel %50 indirim' },
  { code: 'BUNDLE5', type: 'fixed', value: 5, minOrderAmount: 20, description: 'Paket alışverişine $5 indirim' },
];

export interface SponsoredListingOption {
  id: string;
  label: string;
  days: number;
  price: number;
  description: string;
  popular?: boolean;
}

export const SPONSORED_LISTING_OPTIONS: SponsoredListingOption[] = [
  { id: '1week',  label: '1 Hafta',  days: 7,  price: 5,  description: 'Temel görünürlük artışı' },
  { id: '2weeks', label: '2 Hafta',  days: 14, price: 9,  description: 'Daha fazla erişim', popular: true },
  { id: '1month', label: '1 Ay',     days: 30, price: 19, description: 'Maksimum görünürlük' },
];

export interface PlanConfig {
  label: string;
  promptLimit: number;
  projectLimit: number;
  canArchive: boolean;
  canSell: boolean;
  canUseAI: boolean;
  maxCollaboratorsPerPrompt: number;
  maxCampaigns: number;
  commissionRate: number;
  price: { monthly: number; yearly: number };
  color: 'gray' | 'blue' | 'orange' | 'purple';
}

export const PLAN_LIMITS: Record<MembershipType, PlanConfig> = {
  [MembershipType.STARTER]: {
    label: 'Starter',
    promptLimit: 15,
    projectLimit: 2,
    canArchive: false,
    canSell: false,
    canUseAI: false,
    maxCollaboratorsPerPrompt: 0,
    maxCampaigns: 0,
    commissionRate: MARKETPLACE_COMMISSION_RATE,
    price: { monthly: 0, yearly: 0 },
    color: 'gray',
  },
  [MembershipType.CREATOR]: {
    label: 'Creator',
    promptLimit: 150,
    projectLimit: Infinity,
    canArchive: true,
    canSell: false,
    canUseAI: true,
    maxCollaboratorsPerPrompt: 2,
    maxCampaigns: 0,
    commissionRate: MARKETPLACE_COMMISSION_RATE,
    price: { monthly: 7, yearly: 5.83 },
    color: 'blue',
  },
  [MembershipType.PRO]: {
    label: 'Pro',
    promptLimit: Infinity,
    projectLimit: Infinity,
    canArchive: true,
    canSell: true,
    canUseAI: true,
    maxCollaboratorsPerPrompt: 10,
    maxCampaigns: 5,
    commissionRate: MARKETPLACE_COMMISSION_RATE,
    price: { monthly: 19, yearly: 15.83 },
    color: 'orange',
  },
  [MembershipType.TEAM]: {
    label: 'Team',
    promptLimit: Infinity,
    projectLimit: Infinity,
    canArchive: true,
    canSell: true,
    canUseAI: true,
    maxCollaboratorsPerPrompt: Infinity,
    maxCampaigns: Infinity,
    commissionRate: 0.12,
    price: { monthly: 49, yearly: 40.83 },
    color: 'purple',
  },
};

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Chroma',
  email: 'alex.chroma@example.com',
  avatarUrl: 'https://picsum.photos/seed/user1/100/100',
  bio: 'AI enthusiast & prompt engineer. Crafting the future, one prompt at a time.',
  membership: MembershipType.PRO,
  isPrivate: false,
  followers: ['user-2', 'user-3'],
  following: ['user-2'],
  favorites: [],
  referralCode: 'ALEX8472',
  verificationStatus: 'verified',
};

export const MOCK_REFERRALS: ReferralRecord[] = [
  {
    id: 'ref-1',
    referredUserId: 'ref-u-1',
    referredUserName: 'Sophia Chen',
    referredUserAvatar: 'https://picsum.photos/seed/sophia/100/100',
    joinedAt: '2024-03-12T10:00:00Z',
    status: 'converted',
    earnedAmount: 8,
  },
  {
    id: 'ref-2',
    referredUserId: 'ref-u-2',
    referredUserName: 'Marcus Webb',
    referredUserAvatar: 'https://picsum.photos/seed/marcus/100/100',
    joinedAt: '2024-04-05T14:30:00Z',
    status: 'converted',
    earnedAmount: 8,
  },
  {
    id: 'ref-3',
    referredUserId: 'ref-u-3',
    referredUserName: 'Lena Morrow',
    referredUserAvatar: 'https://picsum.photos/seed/lena/100/100',
    joinedAt: '2024-04-20T09:15:00Z',
    status: 'converted',
    earnedAmount: 8,
  },
  {
    id: 'ref-4',
    referredUserId: 'ref-u-4',
    referredUserName: 'Kai Nakamura',
    referredUserAvatar: 'https://picsum.photos/seed/kai/100/100',
    joinedAt: '2024-05-01T16:45:00Z',
    status: 'converted',
    earnedAmount: 8,
  },
  {
    id: 'ref-5',
    referredUserId: 'ref-u-5',
    referredUserName: 'Priya Sharma',
    referredUserAvatar: 'https://picsum.photos/seed/priya/100/100',
    joinedAt: '2024-05-14T11:00:00Z',
    status: 'pending',
    earnedAmount: 0,
  },
  {
    id: 'ref-6',
    referredUserId: 'ref-u-6',
    referredUserName: 'Tom Erikson',
    referredUserAvatar: 'https://picsum.photos/seed/tom/100/100',
    joinedAt: '2024-05-22T08:30:00Z',
    status: 'pending',
    earnedAmount: 0,
  },
];

export const MOCK_ALL_USERS: User[] = [
  MOCK_USER,
  {
    id: 'user-2',
    name: 'Ben Vector',
    email: 'ben.vector@example.com',
    avatarUrl: 'https://picsum.photos/seed/user2/100/100',
    bio: 'Visual artist exploring the boundaries of AI.',
    membership: MembershipType.TEAM,
    isPrivate: false,
    followers: ['user-1'],
    following: ['user-1', 'user-3'],
    verificationStatus: 'verified',
  },
  {
    id: 'user-3',
    name: 'Casey Script',
    email: 'casey.script@example.com',
    avatarUrl: 'https://picsum.photos/seed/user3/100/100',
    bio: 'Code whisperer and automation expert.',
    membership: MembershipType.STARTER,
    isPrivate: true,
    followers: [],
    following: ['user-2'],
  },
];


export const MOCK_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'TikTok Intros', color: '#F59E0B', ownerId: 'user-1', collaborators: [] },
  { id: 'proj-2', name: 'Midjourney Concepts', color: '#10B981', ownerId: 'user-1', collaborators: [] },
  { id: 'proj-3', name: 'Code Generation', color: '#3B82F6', ownerId: 'user-1', collaborators: [] },
  { id: 'proj-4', name: 'Blog Post Ideas', color: '#EF4444', ownerId: 'user-1', collaborators: [] },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    authorId: 'user-2',
    authorName: 'Ben Vector',
    authorAvatar: 'https://picsum.photos/seed/user2/100/100',
    imageUrl: 'https://picsum.photos/seed/post1/600/400',
    caption: 'Exploring new styles with generative AI. This piece was inspired by classic sci-fi novel covers. What do you all think?',
    tags: ['ai-art', 'scifi', 'generativeart'],
    createdAt: '2024-07-30T10:00:00Z',
    likes: ['user-1', 'user-3'],
    comments: [
      {
        id: 'comment-1',
        authorId: 'user-1',
        authorName: 'Alex Chroma',
        authorAvatar: 'https://picsum.photos/seed/user1/100/100',
        text: 'This is incredible, Ben! The color palette is stunning.',
        createdAt: '2024-07-30T10:05:00Z',
      },
    ],
  },
  {
    id: 'post-2',
    authorId: 'user-1',
    authorName: 'Alex Chroma',
    authorAvatar: 'https://picsum.photos/seed/user1/100/100',
    caption: 'Just released a new prompt collection on the marketplace for creating hyper-realistic animal portraits. Go check it out! #prompts #marketplace #ai',
    tags: ['prompt-engineering', 'new-release', 'hyperrealism'],
    createdAt: '2024-07-29T18:45:00Z',
    likes: ['user-2'],
    comments: [
      {
        id: 'comment-2',
        authorId: 'user-2',
        authorName: 'Ben Vector',
        authorAvatar: 'https://picsum.photos/seed/user2/100/100',
        text: 'Awesome! I\'ll definitely buy it. Can\'t wait to try it out. @Casey Script you might like this too.',
        createdAt: '2024-07-29T19:00:00Z',
      },
       {
        id: 'comment-3',
        authorId: 'user-3',
        authorName: 'Casey Script',
        authorAvatar: 'https://picsum.photos/seed/user3/100/100',
        text: 'Looks great! Thanks for the tag @Ben Vector',
        createdAt: '2024-07-30T09:15:00Z',
      },
    ],
  },
];

export const MOCK_PROMPTS: Prompt[] = [
  {
    id: 'prompt-1',
    title: 'Futuristic Cityscape Logo',
    description: 'A prompt for generating a sleek, minimalist logo for a tech startup based on a futuristic city.',
    promptText: 'Logo design, vector art, futuristic cityscape silhouette at sunset, neon glow, minimalist, tech company, high resolution, 8k --ar 1:1',
    tags: ['text-to-image', 'logo-design', 'midjourney'],
    projectId: 'proj-2',
    outputs: [
      { type: OutputType.IMAGE, content: 'https://picsum.photos/seed/prompt1/512/512' },
      { type: OutputType.IMAGE, content: 'https://picsum.photos/seed/prompt1-v2/512/512' },
    ],
    lastEdited: '2024-07-28T10:00:00Z',
    likes: [],
    comments: [],
    usageCount: 450,
    versions: [
      { id: 'v1', promptText: 'Logo design, vector art, futuristic cityscape, neon glow, minimalist', createdAt: '2024-07-27T09:00:00Z', updatedBy: 'user-1', updatedByName: 'Alex Prompt' },
    ],
    ownerId: 'user-1',
    collaborators: [],
  },
  {
    id: 'prompt-2',
    title: 'Engaging 5-Second Video Hook',
    description: 'Create a dynamic video intro for TikTok to grab attention immediately.',
    promptText: 'A high-energy, fast-paced video montage of a person successfully completing a difficult task, with upbeat electronic music. The video should end with the text overlay: "I failed 100 times, but this is what I learned." --style dynamic --duration 5s',
    tags: ['text-to-video', 'social-media', 'marketing'],
    projectId: 'proj-1',
    outputs: [
      { type: OutputType.VIDEO, content: 'https://picsum.photos/seed/prompt2/512/512' }, // Placeholder
    ],
    lastEdited: '2024-07-27T14:30:00Z',
    likes: [],
    comments: [],
    usageCount: 1200,
    versions: [],
    ownerId: 'user-1',
    collaborators: [],
  },
  {
    id: 'prompt-3',
    title: 'React Component Generator',
    description: 'A prompt to generate a reusable React button component with TypeScript and Tailwind CSS.',
    promptText: 'Create a React functional component for a button using TypeScript. It should accept props for `children`, `onClick`, `variant` ("primary", "secondary", "danger"), and `disabled`. Style it using Tailwind CSS. The primary variant should have a green background, secondary a gray one, and danger a red one. Add hover and focus states.',
    tags: ['code-generation', 'react', 'frontend'],
    projectId: 'proj-3',
    outputs: [
      { type: OutputType.CODE, content: `
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
    secondary: 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button className={[baseClasses, variantClasses[variant], disabledClasses].join(' ')} {...props}>
      {children}
    </button>
  );
};

export default Button;
`
      },
    ],
    lastEdited: '2024-07-26T18:00:00Z',
    likes: [],
    comments: [],
    usageCount: 310,
    versions: [],
    ownerId: 'user-1',
    collaborators: [],
  },
    {
    id: 'prompt-4',
    title: 'Ambient Lo-fi Study Beat',
    description: 'Generate a relaxing, royalty-free audio track for study or focus sessions.',
    promptText: 'A 5-minute lo-fi hip hop track, chill beat, gentle piano melody, vinyl crackle, no vocals, 80 BPM, perfect for studying or relaxation.',
    tags: ['text-to-audio', 'music', 'lo-fi'],
    projectId: 'proj-4',
    outputs: [
      { type: OutputType.AUDIO, content: '#' }, // Placeholder
    ],
    lastEdited: '2024-07-25T11:00:00Z',
    likes: [],
    comments: [],
    usageCount: 800,
    versions: [],
    ownerId: 'user-1',
    collaborators: [
        { userId: 'user-2', email: 'ben.vector@example.com', avatarUrl: 'https://picsum.photos/seed/user2/100/100', permission: PermissionLevel.EDITOR }
    ],
  },
  {
    id: 'prompt-template-1',
    title: '📧 E-posta Yazım Şablonu',
    description: 'Farklı durumlar için profesyonel e-posta taslakları oluşturan evrensel şablon.',
    promptText: `Sen deneyimli bir iş yazışmaları uzmanısın.\n\nAşağıdaki bilgilere dayanarak profesyonel bir e-posta yaz:\n\n- Gönderici: {{gönderici_adı}}\n- Alıcı/Şirket: {{alıcı_şirket}}\n- E-posta amacı: {{e-posta_amacı}}\n- Ton: {{ton}}\n- Önemli detaylar: {{önemli_detaylar}}\n\nE-posta; net bir konu satırı, profesyonel bir giriş, ana mesaj ve礼 kibar bir kapanış içermelidir. Türkçe yaz.`,
    tags: ['e-posta', 'şablon', 'iş yazışması', 'profesyonel'],
    projectId: 'proj-1',
    outputs: [],
    lastEdited: new Date().toISOString(),
    likes: [],
    comments: [],
    usageCount: 42,
    versions: [],
    ownerId: 'user-1',
    collaborators: [],
  },
  {
    id: 'prompt-template-2',
    title: '📝 Blog Yazısı Üreteci',
    description: 'SEO uyumlu blog yazıları için doldurulabilir şablon.',
    promptText: `Aşağıdaki konuda SEO uyumlu, {{kelime_sayısı}} kelimelik bir blog yazısı yaz.\n\nKonu: {{konu}}\nHedef kitle: {{hedef_kitle}}\nAna anahtar kelime: {{anahtar_kelime}}\nTon: {{ton}}\n\nYazı şu bölümleri içermeli:\n1. Dikkat çekici bir giriş\n2. En az 3 alt başlık (H2)\n3. Pratik örnekler veya listeler\n4. Güçlü bir CTA ile kapanış\n\nTürkçe yaz, anahtar kelimeyi doğal biçimde 3-5 kez kullan.`,
    tags: ['blog', 'seo', 'içerik', 'şablon'],
    projectId: 'proj-1',
    outputs: [],
    lastEdited: new Date().toISOString(),
    likes: [],
    comments: [],
    usageCount: 87,
    versions: [],
    ownerId: 'user-1',
    collaborators: [],
  },
];

export const MOCK_SYSTEM_PROMPTS: Prompt[] = [
  {
    id: 'sys-prompt-1',
    title: 'Epic Fantasy Landscape',
    description: 'Breathtaking fantasy environment with castles and dragons.',
    promptText: 'Epic high fantasy landscape, glowing castle on a floating island, dragons flying in the background, cinematic lighting, dramatic clouds, highly detailed, 8k --ar 16:9',
    tags: ['text-to-image', 'fantasy', 'concept-art'],
    projectId: 'proj-sys-1',
    outputs: [{ type: OutputType.IMAGE, content: 'https://picsum.photos/seed/sys1/512/512' }],
    lastEdited: '2024-07-20T10:00:00Z',
    likes: Array.from({ length: 450 }, (_, i) => `user-${i}`),
    comments: Array.from({ length: 85 }, (_, i) => ({ id: `c-${i}`, authorId: `user-${i}`, authorName: 'User', authorAvatar: '', text: 'Wow', createdAt: '' })),
    usageCount: 15400,
    versions: [],
    ownerId: 'user-2',
    collaborators: [],
  },
  {
    id: 'sys-prompt-2',
    title: 'Viral Thread Hook Generator',
    description: 'A prompt that always generates a viral Twitter thread starting hook.',
    promptText: 'Act as a world-class copywriter. I will give you a topic, and you will give me 5 viral Twitter thread hooks that use curiosity gaps and strong emotion.',
    tags: ['social-media', 'copywriting', 'viral'],
    projectId: 'proj-sys-2',
    outputs: [{ type: OutputType.TEXT, content: 'Hook 1: 99% of people misunderstand...' }],
    lastEdited: '2024-07-21T10:00:00Z',
    likes: Array.from({ length: 850 }, (_, i) => `user-${i}`),
    comments: Array.from({ length: 120 }, (_, i) => ({ id: `c-${i}`, authorId: `user-${i}`, authorName: 'User', authorAvatar: '', text: 'Wow', createdAt: '' })),
    usageCount: 22000,
    versions: [],
    ownerId: 'user-3',
    collaborators: [],
  },
  {
    id: 'sys-prompt-3',
    title: 'SaaS Landing Page Copy',
    description: 'High-converting landing page structure for B2B SaaS.',
    promptText: 'Create a high-converting landing page copy structure for a B2B SaaS product. Include: Hero section, Social Proof, Pain Points, Solution, Features, and a strong CTA.',
    tags: ['marketing', 'saas', 'copywriting'],
    projectId: 'proj-sys-3',
    outputs: [{ type: OutputType.TEXT, content: 'Hero: Stop wasting time on...' }],
    lastEdited: '2024-07-22T10:00:00Z',
    likes: Array.from({ length: 620 }, (_, i) => `user-${i}`),
    comments: Array.from({ length: 50 }, (_, i) => ({ id: `c-${i}`, authorId: `user-${i}`, authorName: 'User', authorAvatar: '', text: 'Wow', createdAt: '' })),
    usageCount: 18000,
    versions: [],
    ownerId: 'user-2',
    collaborators: [],
  }
];

export const MOCK_CUSTOM_ORDERS: CustomOrder[] = [
  {
    id: 'co-1',
    buyerId: 'user-2',
    buyerName: 'Ben Vector',
    buyerAvatar: 'https://picsum.photos/seed/user2/100/100',
    sellerId: 'user-1',
    sellerName: 'Alex Prompt',
    sellerAvatar: 'https://picsum.photos/seed/user1/100/100',
    title: 'Minimalist Logo Tasarım Prompt Paketi',
    description: 'Teknoloji startup\'ları için 5 farklı minimalist logo tasarım promptu istiyorum. Her biri farklı renk paleti ve stil kullansın.',
    budget: 25,
    deadline: '2025-06-20T00:00:00Z',
    status: 'pending',
    createdAt: '2025-05-22T10:00:00Z',
    updatedAt: '2025-05-22T10:00:00Z',
  },
  {
    id: 'co-2',
    buyerId: 'user-1',
    buyerName: 'Alex Prompt',
    buyerAvatar: 'https://picsum.photos/seed/user1/100/100',
    sellerId: 'user-2',
    sellerName: 'Ben Vector',
    sellerAvatar: 'https://picsum.photos/seed/user2/100/100',
    title: 'Yemek Blogu TikTok İçerik Serisi',
    description: 'Türk mutfağı odaklı yemek blogu için 10 adet viral TikTok video senaryosu ve prompt serisi. Hook + içerik + CTA formatında.',
    budget: 40,
    agreedPrice: 35,
    status: 'in_progress',
    sellerNote: 'Harika bir proje! $35\'e anlaştık, 3 gün içinde teslim edeceğim.',
    createdAt: '2025-05-15T08:00:00Z',
    updatedAt: '2025-05-18T14:00:00Z',
  },
  {
    id: 'co-3',
    buyerId: 'user-2',
    buyerName: 'Ben Vector',
    buyerAvatar: 'https://picsum.photos/seed/user2/100/100',
    sellerId: 'user-1',
    sellerName: 'Alex Prompt',
    sellerAvatar: 'https://picsum.photos/seed/user1/100/100',
    title: 'E-ticaret Ürün Fotoğrafı Promptları',
    description: 'Giyim markası için stüdyo kalitesinde ürün fotoğrafı promptları.',
    budget: 15,
    agreedPrice: 15,
    status: 'completed',
    sellerNote: 'Tamamlandı, umarım beğenirsiniz!',
    createdAt: '2025-05-01T09:00:00Z',
    updatedAt: '2025-05-05T16:00:00Z',
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-20240729-001',
    date: '2024-07-29T10:00:00Z',
    items: [
      {
        product: {
          id: 'market-1',
          type: 'collection',
          title: '40 TikTok Intro Prompts',
          description: 'A collection of viral-worthy video prompts to boost your engagement.',
          seller: { name: 'Social Savvy', avatarUrl: 'https://picsum.photos/seed/seller1/40/40' },
          sellerId: 'seller-social-savvy',
          price: 19.99,
          rating: 4.7,
          reviewCount: 102,
          salesCount: 512,
          views: 2500,
          coverImage: 'https://picsum.photos/seed/market1/400/250',
          promptCount: 40,
        },
        quantity: 1
      },
      {
        product: {
          id: 'market-4',
          type: 'single',
          title: '8-bit Pixel Art Scene',
          description: 'Create nostalgic, detailed pixel art scenes for games or art.',
          seller: { name: 'Retro Vibes', avatarUrl: 'https://picsum.photos/seed/seller3/40/40' },
          sellerId: 'seller-retro-vibes',
          price: 2.99,
          rating: 4.8,
          reviewCount: 88,
          salesCount: 345,
          views: 1800,
          coverImage: 'https://picsum.photos/seed/market4/400/250',
        },
        quantity: 2,
        rating: 4.5,
        review: "Absolutely amazing prompt! Generated some fantastic pixel art for my game. Highly recommended!",
      },
    ],
    subtotal: 19.99 + (2.99 * 2),
    discountAmount: 0,
    total: 19.99 + (2.99 * 2),
    status: 'Completed'
  }
];

export const MOCK_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'market-1',
    type: 'collection',
    title: '40 TikTok Intro Prompts',
    description: 'A collection of viral-worthy video prompts to boost your engagement.',
    seller: { name: 'Social Savvy', avatarUrl: 'https://picsum.photos/seed/seller1/40/40' },
    sellerId: 'seller-social-savvy',
    price: 19.99,
    rating: 4.7,
    reviewCount: 102,
    salesCount: 512,
    views: 2500,
    coverImage: 'https://picsum.photos/seed/market1/400/250',
    promptCount: 40,
    tags: ['social-media', 'video-hook', 'tiktok'],
    promptIds: ['prompt-2'],
    sponsored: {
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: 'market-2',
    type: 'single',
    title: 'Hyper-realistic Animal Portraits',
    description: 'A single, powerful prompt to generate stunningly realistic animal photos.',
    seller: { name: MOCK_USER.name, avatarUrl: MOCK_USER.avatarUrl, verificationStatus: MOCK_USER.verificationStatus },
    sellerId: MOCK_USER.id,
    price: 4.99,
    rating: 4.9,
    reviewCount: 34,
    salesCount: 120,
    views: 850,
    coverImage: 'https://picsum.photos/seed/market2/400/250',
    tags: ['text-to-image', 'realism', 'animals'],
    promptIds: ['prompt-1'],
  },
   {
    id: 'market-3',
    type: 'collection',
    title: 'Professional Headshot Prompts',
    description: 'Generate professional, corporate-style headshots for any purpose.',
    seller: { name: 'AI Photo Pro', avatarUrl: 'https://picsum.photos/seed/seller2/40/40' },
    sellerId: 'seller-ai-photo-pro',
    price: 24.99,
    rating: 5.0,
    reviewCount: 230,
    salesCount: 850,
    views: 4100,
    coverImage: 'https://picsum.photos/seed/market3/400/250',
    promptCount: 15,
    tags: ['photography', 'corporate', 'headshots'],
    promptIds: [],
    sponsored: {
      startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
   {
    id: 'market-4',
    type: 'single',
    title: '8-bit Pixel Art Scene',
    description: 'Create nostalgic, detailed pixel art scenes for games or art.',
    seller: { name: 'Retro Vibes', avatarUrl: 'https://picsum.photos/seed/seller3/40/40' },
    sellerId: 'seller-retro-vibes',
    price: 2.99,
    rating: 4.8,
    reviewCount: 88,
    salesCount: 345,
    views: 1800,
    coverImage: 'https://picsum.photos/seed/market4/400/250',
    tags: ['pixel-art', 'gaming', 'retro'],
    promptIds: [],
  },
  {
    id: 'market-bundle-1',
    type: 'collection',
    title: 'Yaratıcı AI Starter Paketi',
    description: '3 güçlü prompt bir arada: Futuristik logo tasarımı, viral video intro ve ambient lo-fi müzik.',
    seller: { name: MOCK_USER.name, avatarUrl: MOCK_USER.avatarUrl, verificationStatus: MOCK_USER.verificationStatus },
    sellerId: MOCK_USER.id,
    price: 8.99,
    originalPrice: 14.97,
    rating: 4.8,
    reviewCount: 28,
    salesCount: 67,
    views: 420,
    coverImage: 'https://picsum.photos/seed/bundle1/400/250',
    promptCount: 3,
    tags: ['bundle', 'starter', 'ai-art'],
    promptIds: ['prompt-1', 'prompt-2', 'prompt-4'],
  },
];

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: "Summer Art Prompts Boost",
    description: "Promoting my best text-to-image prompts for the summer season. Targeting artists and designers.",
    promptIds: ['prompt-1', 'prompt-4'],
    budget: 150, // $150
    startDate: '2024-08-01T00:00:00Z',
    endDate: '2024-08-31T23:59:59Z',
    status: 'active',
    creativeType: 'image',
    creativeUrl: 'https://picsum.photos/seed/camp1/800/200',
    totalImpressions: 12500,
    totalSales: 18,
    promptStats: [
        { promptId: 'prompt-1', impressions: 7800, sales: 12 },
        { promptId: 'prompt-4', impressions: 4700, sales: 6 },
    ]
  }
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participantIds: ['user-1', 'user-2'],
    updatedAt: new Date().toISOString(),
    lastMessage: {
      id: 'msg-1',
      senderId: 'user-2',
      receiverId: 'user-1',
      content: 'Hey! I saw your new prompt collection. Looks amazing!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
    }
  }
];