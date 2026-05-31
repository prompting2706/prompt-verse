



import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import PromptDetail from './components/PromptDetail';
import Login from './components/Login';
import Register from './components/Register';
import Settings from './components/Settings';
import Cart from './components/Cart';
import Orders from './components/Orders';
import CreatePromptModal from './components/CreatePromptModal';
import UpgradePage from './components/UpgradePage';
import SharePromptModal from './components/SharePromptModal';
import ShareProjectModal from './components/ShareProjectModal';
import MyStore from './components/MyStore';
import OnboardingModal from './components/OnboardingModal';
import ReferralPage from './components/ReferralPage';
import PublicStore from './components/PublicStore';
import ExplorePage from './components/ExplorePage';
import FavoritesPage from './components/FavoritesPage';
import ProfilePage from './components/ProfilePage';
import MessagesView from './components/MessagesView';
import CancelSubscriptionPage from './components/CancelSubscriptionPage';
import CreateCampaignPage from './components/CreateCampaignPage';
import CampaignDetailPage from './components/CampaignDetailPage';
import NotFoundPage from './components/NotFoundPage';
import ShareViaMessageModal from './components/ShareViaMessageModal';
import CommissionsPage from './components/CommissionsPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import ToastContainer from './components/ToastContainer';

import { MOCK_USER, MOCK_SYSTEM_PROMPTS, PLAN_LIMITS, MOCK_COUPONS, MARKETPLACE_COMMISSION_RATE } from './constants';
import { type Project, type Prompt, type User, type View, type CartItem, MembershipType, type Order, type MarketplaceItem, type Collaborator, type Post, type Campaign, type Notification, type Conversation, type ReferralRecord, type Coupon, type CustomOrder, type CustomOrderStatus } from './types';

import { type MarketplaceItemData } from './components/AddProductModal';
import CreatePostModal, { type PostData } from './components/CreatePostModal';
import { ArchiveIcon, ArrowUpIcon, RocketLaunchIcon } from './components/icons/Icons';
import { toast } from './utils/toast';
import { authService } from './lib/auth';
import { emailService } from './lib/emailService';
import { analytics } from './lib/monitoring';
import { promptService } from './lib/promptService';
import { profileService } from './lib/profileService';
import { projectService } from './lib/projectService';
import { marketplaceService } from './lib/marketplaceService';
import { postService } from './lib/postService';
import { storageService } from './lib/storageService';
import { campaignService } from './lib/campaignService';
import { customOrderService } from './lib/customOrderService';
import { referralService } from './lib/referralService';
import { notificationService } from './lib/notificationService';
import { messageService } from './lib/messageService';
import { mapDbProfile, mapDbPrompt, mapDbProject, mapDbMarketplaceItem, mapDbOrder, mapDbPost, mapDbCampaign, mapDbNotification, mapDbCustomOrder, mapDbReferral, mapDbConversation } from './lib/mappers';

const App: React.FC = () => {
  const [view, setView] = useState<View>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'explore') return { type: 'explore', payload: null };
    if (hash === 'marketplace') return { type: 'marketplace', payload: null };
    // Just avoid locking in 'dashboard' blindly for prompt routes, so previousView can stay null initially.
    if (hash.startsWith('prompt/')) return { type: 'promptDetail', payload: null as any };
    return { type: 'dashboard', payload: null };
  });
  const [previousView, setPreviousView] = useState<View | null>(null);

  useEffect(() => {
    setPreviousView(prev => {
      if (view.type === 'promptDetail') return prev;
      return view;
    });
  }, [view]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [archivedPrompts, setArchivedPrompts] = useState<Prompt[]>([]);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const loadedForUserRef = useRef<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<Prompt | undefined>(undefined);
  const [promptToDeleteId, setPromptToDeleteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [promptToShare, setPromptToShare] = useState<Prompt | null>(null);
  const [promptToShareViaMessage, setPromptToShareViaMessage] = useState<Prompt | null>(null);
  const [promptToShareAsPost, setPromptToShareAsPost] = useState<Prompt | null>(null);
  const [projectToShare, setProjectToShare] = useState<Project | null>(null);
  const [shouldOpenAddProductModal, setShouldOpenAddProductModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(
    () => !localStorage.getItem('promptverse_onboarding_completed')
  );


  useEffect(() => {
    const allPrompts = [...prompts, ...archivedPrompts, ...MOCK_SYSTEM_PROMPTS];

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('prompt/')) {
        const promptId = decodeURIComponent(hash.split('/')[1]);
        const prompt = allPrompts.find(p => p.id === promptId) || MOCK_SYSTEM_PROMPTS.find(p => p.id === promptId);
        if (prompt) {
          setView({ type: 'promptDetail', payload: prompt });
        } else {
          setView({ type: 'notFound', payload: null });
        }
      } else if (hash.startsWith('campaign/detail/')) {
        const campaignId = hash.split('/')[2];
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaignId && campaign) {
          setView({ type: 'campaignDetail', payload: { campaignId } });
        } else {
          setView({ type: 'notFound', payload: null });
        }
      } else if (hash === 'campaign/create') {
        setView({ type: 'createCampaign', payload: null });
      } else if (hash.startsWith('campaign/edit/')) {
          const campaignId = hash.split('/')[2];
          const campaign = campaigns.find(c => c.id === campaignId);
          if (campaignId && campaign) {
            setView({ type: 'createCampaign', payload: { campaignId } });
          } else {
            setView({ type: 'notFound', payload: null });
          }
      } else if (hash === 'marketplace') {
        setView({ type: 'marketplace', payload: null });
      } else if (hash === 'settings') {
        setView({ type: 'settings', payload: null });
      } else if (hash === 'cart') {
        setView({ type: 'cart', payload: null });
      } else if (hash === 'orders') {
        setView({ type: 'orders', payload: null });
      } else if (hash === 'upgrade') {
        setView({ type: 'upgrade', payload: null });
      } else if (hash === 'cancel-subscription') {
        setView({ type: 'cancelSubscription', payload: null });
      } else if (hash === 'archived') {
        setView({ type: 'archived', payload: null });
      } else if (hash === 'register') {
        setView({ type: 'register', payload: null });
      } else if (hash === 'login') {
        setView({ type: 'login', payload: null });
      } else if (hash === '') {
        setView({ type: 'dashboard', payload: null });
      } else if (hash === 'dashboard') {
        setView({ type: 'dashboard', payload: null });
      } else if (hash.startsWith('messages')) {
        const parts = hash.split('/');
        setView({ type: 'messages', payload: { conversationId: parts[1] } });
      } else if (hash.startsWith('my-store')) {
        const parts = hash.split('/');
        const tab = parts[1] as 'products' | 'analytics' | 'campaigns';
        setView({ type: 'myStore', payload: { activeTab: ['products', 'analytics', 'campaigns'].includes(tab) ? tab : 'products' } });
      } else if (hash === 'explore') {
        setView({ type: 'explore', payload: null });
      } else if (hash === 'commissions') {
        setView({ type: 'commissions', payload: null });
      } else if (hash === 'privacy') {
        setView({ type: 'privacy', payload: null });
      } else if (hash === 'terms') {
        setView({ type: 'terms', payload: null });
      } else if (hash === 'referral') {
        setView({ type: 'referral', payload: null });
      } else if (hash === 'favorites') {
        setView({ type: 'favorites', payload: null });
      } else if (hash.startsWith('store/')) {
        const sellerId = hash.split('/')[1];
        if (sellerId) {
          const itemFromSeller = marketplaceItems.find(i => i.sellerId === sellerId);
          setView({
            type: 'publicStore',
            payload: {
              sellerId,
              sellerName: itemFromSeller?.seller.name ?? '',
              avatarUrl: itemFromSeller?.seller.avatarUrl ?? '',
              verificationStatus: itemFromSeller?.seller.verificationStatus,
            },
          });
        } else {
          setView({ type: 'notFound', payload: null });
        }
      } else if (hash.startsWith('profile/')) {
        const userId = hash.split('/')[1];
        if (userId) {
          setView({ type: 'profile', payload: { userId } });
        } else {
          setView({ type: 'notFound', payload: null });
        }
      } else if (hash === 'prompts') {
        setView({ type: 'dashboard', payload: null });
      } else if (hash === 'projects') {
        setView({ type: 'dashboard', payload: null });
      } else {
        // Unknown hash route => show 404
        setView({ type: 'notFound', payload: null });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial load

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [prompts, archivedPrompts, marketplaceItems, campaigns]);

  const navigate = (newView: View) => {
    if (newView.type === 'dashboard') {
      setSelectedProjectId(null);
    }
    
    switch (newView.type) {
      case 'dashboard': window.location.hash = '#dashboard'; break;
      case 'marketplace': window.location.hash = '#marketplace'; break;
      case 'settings': window.location.hash = '#settings'; break;
      case 'cart': window.location.hash = '#cart'; break;
      case 'orders': window.location.hash = '#orders'; break;
      case 'upgrade': window.location.hash = '#upgrade'; break;
      case 'cancelSubscription': window.location.hash = '#cancel-subscription'; break;
      case 'referral': window.location.hash = '#referral'; break;
      case 'commissions': window.location.hash = '#commissions'; break;
      case 'privacy': window.location.hash = '#privacy'; break;
      case 'terms': window.location.hash = '#terms'; break;
      case 'archived': window.location.hash = '#archived'; break;
      case 'register': window.location.hash = '#register'; break;
      case 'login': window.location.hash = '#login'; break;
      case 'messages': 
        if (newView.payload?.conversationId) {
            window.location.hash = `#messages/${newView.payload.conversationId}`;
        } else {
            window.location.hash = '#messages';
        }
        break;
      case 'myStore':
        if (newView.payload?.activeTab) {
          window.location.hash = `#my-store/${newView.payload.activeTab}`;
        } else {
          window.location.hash = '#my-store';
        }
        break;
      case 'explore': window.location.hash = '#explore'; break;
      case 'favorites': window.location.hash = '#favorites'; break;
      case 'createCampaign':
        if(newView.payload?.campaignId) {
          window.location.hash = `#campaign/edit/${newView.payload.campaignId}`;
        } else {
          window.location.hash = '#campaign/create';
        }
        break;
      case 'campaignDetail':
        if(newView.payload?.campaignId) {
          window.location.hash = `#campaign/detail/${newView.payload.campaignId}`;
        }
        break;
      case 'profile':
        if (newView.payload) {
          window.location.hash = `#profile/${newView.payload.userId}`;
        }
        break;
      case 'publicStore':
        if (newView.payload) {
          window.location.hash = `#store/${newView.payload.sellerId}`;
        }
        break;
      case 'promptDetail':
        if (newView.payload) {
          window.location.hash = `#prompt/${newView.payload.id}`;
        }
        break;
      case 'notFound':
        break;
    }
     // The useEffect will handle the state change
  };

  const loadUserData = async (userId: string, email: string) => {
    // Prevent double-loading for the same user (onAuthStateChange + getSession both fire)
    if (loadedForUserRef.current === userId) return;
    loadedForUserRef.current = userId;
    setDataLoading(true);
    try {
      const results = await Promise.allSettled([
        profileService.getById(userId),
        promptService.getByUser(userId),
        promptService.getArchived(userId),
        projectService.getByUser(userId),
        marketplaceService.getItems(),
        marketplaceService.getOrdersByBuyer(userId),
        postService.getAll(),
        campaignService.getBySeller(userId),
        customOrderService.getByUser(userId),
        referralService.getByReferrer(userId),
        notificationService.getByUser(userId),
        messageService.getConversations(userId),
      ]);
      const [profile, rawPrompts, archivedRaw, rawProjects, rawItems, rawOrders, rawPosts, rawCampaigns, rawCustomOrders, rawReferrals, rawNotifications, rawConversations] = results;

      if (profile.status === 'fulfilled' && profile.value) {
        setUser(mapDbProfile(profile.value as Record<string, any>, email));
      }
      if (rawPrompts.status === 'fulfilled') {
        setPrompts((rawPrompts.value as Record<string, any>[]).map(mapDbPrompt));
      }
      if (archivedRaw.status === 'fulfilled') {
        setArchivedPrompts((archivedRaw.value as Record<string, any>[]).map(mapDbPrompt));
      }
      if (rawProjects.status === 'fulfilled') {
        setProjects((rawProjects.value as Record<string, any>[]).map(mapDbProject));
      }
      if (rawItems.status === 'fulfilled') {
        setMarketplaceItems((rawItems.value as Record<string, any>[]).map(mapDbMarketplaceItem));
      }
      if (rawOrders.status === 'fulfilled') {
        setOrders((rawOrders.value as Record<string, any>[]).map(mapDbOrder));
      }
      if (rawPosts.status === 'fulfilled') {
        setPosts((rawPosts.value as Record<string, any>[]).map(mapDbPost));
      }
      if (rawCampaigns.status === 'fulfilled') {
        setCampaigns((rawCampaigns.value as Record<string, any>[]).map(mapDbCampaign));
      }
      if (rawCustomOrders.status === 'fulfilled') {
        setCustomOrders((rawCustomOrders.value as Record<string, any>[]).map(mapDbCustomOrder));
      }
      if (rawReferrals.status === 'fulfilled') {
        setReferrals((rawReferrals.value as Record<string, any>[]).map(mapDbReferral));
      }
      if (rawNotifications.status === 'fulfilled') {
        setNotifications((rawNotifications.value as Record<string, any>[]).map(mapDbNotification));
      }
      if (rawConversations.status === 'fulfilled') {
        setConversations((rawConversations.value as Record<string, any>[]).map(mapDbConversation));
      }
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
      if (session) {
        analytics.identify(session.user.id, { email: session.user.email });
        void loadUserData(session.user.id, session.user.email ?? '');
        if (view.type === 'login' || view.type === 'register') {
          navigate({ type: 'dashboard', payload: null });
        }
      } else if (event === 'SIGNED_OUT') {
        analytics.reset();
        loadedForUserRef.current = null;
        setUser(MOCK_USER);
        setPrompts([]);
        setArchivedPrompts([]);
        setProjects([]);
        setOrders([]);
        setMarketplaceItems([]);
        setPosts([]);
        setCampaigns([]);
        setCustomOrders([]);
        setReferrals([]);
        setNotifications([]);
        setConversations([]);
        setViewedProfile(null);
      }
    });
    authService.getSession().then(session => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
      if (session) {
        analytics.identify(session.user.id, { email: session.user.email });
        void loadUserData(session.user.id, session.user.email ?? '');
      }
    }).catch(() => setAuthLoading(false));
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated && (view.type === 'login' || view.type === 'register')) {
      navigate({ type: 'dashboard', payload: null });
    }
  }, [isAuthenticated, view.type]);

  useEffect(() => {
    analytics.page(view.type);
  }, [view.type]);

  // Load the viewed profile from DB whenever we navigate to a profile page
  useEffect(() => {
    if (view.type === 'profile' && view.payload?.userId && view.payload.userId !== user.id) {
      setViewedProfile(null);
      profileService.getById(view.payload.userId)
        .then(data => { if (data) setViewedProfile(mapDbProfile(data as Record<string, any>)); })
        .catch(() => setViewedProfile(null));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.type, (view as any).payload?.userId]);
  
  const handleImportPrompts = (importedPrompts: Prompt[]) => {
      setPrompts(prev => [...importedPrompts, ...prev]);
  };

  const handleLogin = () => {
    navigate({ type: 'dashboard', payload: null });
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch {
      // ignore sign-out errors
    }
    loadedForUserRef.current = null;
    setIsAuthenticated(false);
    setUser(MOCK_USER);
    setPrompts([]);
    setArchivedPrompts([]);
    setProjects([]);
    setOrders([]);
    setMarketplaceItems([]);
    setPosts([]);
    setCampaigns([]);
    setCustomOrders([]);
    setReferrals([]);
    setNotifications([]);
    setConversations([]);
    setViewedProfile(null);
    window.location.hash = '#login';
  };

  const handleRegister = () => {
    navigate({ type: 'login', payload: null });
  };

  const handleAddToCart = (productToAdd: MarketplaceItem) => {
    if (productToAdd.sellerId === user.id) {
      toast.warning('Kendi ürününüzü satın alamazsınız.');
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === productToAdd.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === productToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product: productToAdd, quantity: 1 }];
      }
    });
  };
  
  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };
  
  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
          handleRemoveFromCart(productId);
      } else {
          setCart(prevCart => prevCart.map(item =>
              item.product.id === productId ? { ...item, quantity: newQuantity } : item
          ));
      }
  };

  const handleCreateCustomOrder = async (data: Omit<CustomOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await customOrderService.create({
        buyer_id: data.buyerId,
        seller_id: data.sellerId,
        title: data.title,
        description: data.description,
        budget: data.budget,
        status: 'pending',
      });
      const newOrder = mapDbCustomOrder(created as Record<string, any>);
      setCustomOrders(prev => [newOrder, ...prev]);
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: data.sellerId,
        actorId: data.buyerId,
        actorName: data.buyerName,
        actorAvatar: data.buyerAvatar,
        type: 'commission_request',
        targetType: 'marketplace_item',
        targetId: newOrder.id,
        targetPreview: `Özel sipariş talebi: "${data.title}" — Bütçe: $${data.budget.toFixed(2)}`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setNotifications(prev => [notif, ...prev]);
      navigate({ type: 'commissions', payload: null });
    } catch {
      toast.error('Sipariş oluşturulurken hata oluştu.');
    }
  };

  const handleUpdateCustomOrderStatus = async (
    orderId: string,
    newStatus: CustomOrderStatus,
    extra?: { agreedPrice?: number; sellerNote?: string }
  ) => {
    const order = customOrders.find(o => o.id === orderId);
    try {
      await customOrderService.updateStatus(orderId, newStatus);
    } catch {
      toast.error('Sipariş durumu güncellenirken hata oluştu.');
      return;
    }
    setCustomOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString(), ...(extra || {}) } : o
    ));
    if (!order) return;
    const now = new Date().toISOString();
    const notifMap: Partial<Record<CustomOrderStatus, { userId: string; type: Notification['type']; preview: string }>> = {
      accepted:  { userId: order.buyerId, type: 'commission_accepted',  preview: `"${order.title}" talebiniz kabul edildi! Anlaşılan fiyat: $${(extra?.agreedPrice ?? order.budget).toFixed(2)}` },
      delivered: { userId: order.buyerId, type: 'commission_delivered', preview: `"${order.title}" siparişiniz teslim edildi. Onaylamak için Komisyonlar sayfasına gidin.` },
      declined:  { userId: order.buyerId, type: 'commission_declined',  preview: `"${order.title}" sipariş talebiniz reddedildi.` },
    };
    const n = notifMap[newStatus];
    if (n) {
      setNotifications(prev => [{
        id: `notif-${Date.now()}`,
        userId: n.userId,
        actorId: newStatus === 'declined' || newStatus === 'accepted' || newStatus === 'delivered' ? order.sellerId : order.buyerId,
        actorName: newStatus === 'declined' || newStatus === 'accepted' || newStatus === 'delivered' ? order.sellerName : order.buyerName,
        actorAvatar: newStatus === 'declined' || newStatus === 'accepted' || newStatus === 'delivered' ? order.sellerAvatar : order.buyerAvatar,
        type: n.type,
        targetType: 'marketplace_item',
        targetId: orderId,
        targetPreview: n.preview,
        createdAt: now,
        isRead: false,
      }, ...prev]);
    }
  };

  const handleApplyCoupon = (code: string): string | null => {
    const coupon = MOCK_COUPONS.find(c => c.code === code);
    if (!coupon) return 'Geçersiz kupon kodu.';
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return `Bu kupon en az $${coupon.minOrderAmount.toFixed(2)} tutarındaki siparişlerde geçerlidir.`;
    }
    setAppliedCoupon(coupon);
    return null;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = appliedCoupon
      ? appliedCoupon.type === 'percent'
        ? subtotal * appliedCoupon.value / 100
        : Math.min(appliedCoupon.value, subtotal)
      : 0;
    const total = Math.max(0, subtotal - discountAmount);

    // Commission rate is seller-plan-dependent; use the base rate for client-side records.
    // Actual payout is computed server-side where the seller's plan is authoritative.
    const orderRows = cart.map(item => ({
      buyer_id: user.id,
      seller_id: item.product.sellerId,
      item_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity,
      commission_rate: MARKETPLACE_COMMISSION_RATE,
      net_amount: item.product.price * item.quantity * (1 - MARKETPLACE_COMMISSION_RATE),
      status: 'completed',
    }));

    void marketplaceService.createOrderBatch(orderRows).catch(() => {});

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart.map(item => ({ product: item.product, quantity: item.quantity })),
      subtotal,
      discountAmount,
      couponCode: appliedCoupon?.code,
      total,
      status: 'Completed',
    };

    setOrders(prev => [newOrder, ...prev]);

    const newNotifications: Notification[] = [];
    cart.forEach(item => {
      if (item.product.sellerId !== user.id) {
        const grossAmount = item.product.price * item.quantity;
        newNotifications.push({
          id: `notif-${Date.now()}-${Math.random()}`,
          userId: item.product.sellerId,
          actorId: user.id,
          actorName: user.name,
          actorAvatar: user.avatarUrl,
          type: 'sale',
          targetType: 'marketplace_item',
          targetId: item.product.id,
          targetPreview: `Sold ${item.quantity}x ${item.product.title} — Gross $${grossAmount.toFixed(2)}`,
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    });
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }

    setAppliedCoupon(null);
    setCart([]);
    toast.success('Satın alma tamamlandı! Teşekkürler.');
    window.location.hash = '#orders';

    analytics.track('purchase_completed', {
      order_id: newOrder.id,
      total: newOrder.total,
      item_count: cart.length,
    });

    void emailService.sendOrderConfirmation({
      buyerEmail: user.email,
      buyerName: user.name,
      orderId: newOrder.id,
      items: newOrder.items.map(i => ({ title: i.product.title, price: i.product.price * i.quantity })),
      total: newOrder.total,
    });
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await profileService.update(updatedUser.id, {
        name: updatedUser.name,
        avatar_url: updatedUser.avatarUrl,
        bio: updatedUser.bio ?? null,
      });
      setUser(updatedUser);
      toast.success('Ayarlar başarıyla kaydedildi.');
      navigate({ type: 'dashboard', payload: null });
    } catch {
      toast.error('Ayarlar kaydedilirken hata oluştu.');
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView({ type: 'dashboard', payload: null });
    window.location.hash = '#dashboard';
  };

  const handleSavePrompt = async (promptToSave: Prompt) => {
    const existingIndex = prompts.findIndex(p => p.id === promptToSave.id);
    if (existingIndex !== -1) {
      try {
        await promptService.update(promptToSave.id, {
          title: promptToSave.title,
          description: promptToSave.description,
          content: promptToSave.promptText,
          tags: promptToSave.tags,
          project_id: promptToSave.projectId || null,
          output_files: promptToSave.outputs ?? [],
          collaborators: promptToSave.collaborators ?? [],
        });
        const updatedPrompts = [...prompts];
        updatedPrompts[existingIndex] = promptToSave;
        setPrompts(updatedPrompts);
      } catch {
        toast.error('Prompt güncellenirken hata oluştu.');
        return;
      }
    } else {
      const limit = PLAN_LIMITS[user.membership].promptLimit;
      const ownedCount = [...prompts, ...archivedPrompts].filter(p => p.ownerId === user.id).length;
      if (isFinite(limit) && ownedCount >= limit) {
        toast.warning(`${limit} prompt limitine ulaştınız. Daha fazla prompt eklemek için planınızı yükseltin.`);
        navigate({ type: 'upgrade', payload: null });
        return;
      }
      try {
        const created = await promptService.create({
          user_id: user.id,
          title: promptToSave.title,
          description: promptToSave.description,
          content: promptToSave.promptText,
          tags: promptToSave.tags,
          project_id: promptToSave.projectId || null,
          output_files: promptToSave.outputs ?? [],
          collaborators: [],
        });
        const newPrompt = mapDbPrompt(created as Record<string, any>);
        setPrompts(prev => [newPrompt, ...prev]);
        setIsModalOpen(false);
        setPromptToEdit(undefined);
        navigate({ type: 'promptDetail', payload: newPrompt });
        return;
      } catch {
        toast.error('Prompt kaydedilirken hata oluştu.');
        return;
      }
    }
    setIsModalOpen(false);
    setPromptToEdit(undefined);
  };

  const handleOpenCreateModal = () => {
    setPromptToEdit(undefined);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (prompt: Prompt) => {
    setPromptToEdit(prompt);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPromptToEdit(undefined);
  };

  const handleDeletePrompt = (promptId: string) => {
    setPromptToDeleteId(promptId);
  };

  const handleConfirmDeletePrompt = async () => {
    if (!promptToDeleteId) return;
    const promptId = promptToDeleteId;
    setPromptToDeleteId(null);
    const wasArchived = archivedPrompts.some(p => p.id === promptId);
    try {
      await promptService.delete(promptId);
    } catch {
      toast.error('Prompt silinirken hata oluştu.');
      return;
    }
    setPrompts(currentPrompts => currentPrompts.filter(p => p.id !== promptId));
    setArchivedPrompts(currentArchived => currentArchived.filter(p => p.id !== promptId));
    toast.success('Prompt silindi.');
    if (view.type === 'promptDetail' && view.payload?.id === promptId) {
      navigate({ type: wasArchived ? 'archived' : 'dashboard', payload: null });
    }
  };

  const handleDuplicatePrompt = async (prompt: Prompt) => {
    const limit = PLAN_LIMITS[user.membership].promptLimit;
    const ownedCount = [...prompts, ...archivedPrompts].filter(p => p.ownerId === user.id).length;
    if (isFinite(limit) && ownedCount >= limit) {
      toast.warning(`${limit} prompt limitine ulaştınız. Kopyalama yapabilmek için planınızı yükseltin.`);
      navigate({ type: 'upgrade', payload: null });
      return;
    }
    try {
      const created = await promptService.create({
        user_id: user.id,
        title: `${prompt.title} (Copy)`,
        description: prompt.description,
        content: prompt.promptText,
        tags: prompt.tags,
        project_id: prompt.projectId || null,
        output_files: prompt.outputs ?? [],
        collaborators: [],
      });
      const newPrompt = mapDbPrompt(created as Record<string, any>);
      setPrompts(prev => [newPrompt, ...prev]);
      navigate({ type: 'promptDetail', payload: newPrompt });
    } catch {
      toast.error('Prompt kopyalanırken hata oluştu.');
    }
  };
    
  const handleArchivePrompt = async (promptId: string) => {
    if (!PLAN_LIMITS[user.membership].canArchive) {
      toast.warning('Arşivleme özelliği Creator planı ve üzeri için mevcuttur. Lütfen planınızı yükseltin.');
      navigate({ type: 'upgrade', payload: null });
      return;
    }
    const archiveLimit = PLAN_LIMITS[user.membership].archiveLimit;
    const currentArchivedCount = archivedPrompts.filter(p => p.ownerId === user.id).length;
    if (isFinite(archiveLimit) && currentArchivedCount >= archiveLimit) {
      toast.warning(`Arşivleme limitine (${archiveLimit}) ulaştınız. Daha fazla prompt arşivlemek için planınızı yükseltin.`);
      navigate({ type: 'upgrade', payload: null });
      return;
    }
    const promptToArchive = prompts.find(p => p.id === promptId);
    if (!promptToArchive) return;
    try {
      await promptService.archive(promptId, true);
    } catch {
      toast.error('Prompt arşivlenirken hata oluştu.');
      return;
    }
    setPrompts(currentPrompts => currentPrompts.filter(p => p.id !== promptId));
    setArchivedPrompts(currentArchived => [promptToArchive, ...currentArchived]);
    toast.success('Prompt arşivlendi.');
    if (view.type === 'promptDetail' && view.payload?.id === promptId) {
      navigate({ type: 'archived', payload: null });
    }
  };

  const handleUnarchivePrompt = async (promptId: string) => {
    const promptToUnarchive = archivedPrompts.find(p => p.id === promptId);
    if (!promptToUnarchive) return;
    try {
      await promptService.archive(promptId, false);
    } catch {
      toast.error('Prompt arşivden çıkarılırken hata oluştu.');
      return;
    }
    setArchivedPrompts(prev => prev.filter(p => p.id !== promptId));
    setPrompts(prev => [promptToUnarchive, ...prev]);
    toast.success('Prompt arşivden çıkarıldı.');
    navigate({ type: 'promptDetail', payload: promptToUnarchive });
  };
  
  const handleCreateProject = async (projectName: string) => {
    const projectLimit = PLAN_LIMITS[user.membership].projectLimit;
    const ownedProjectCount = projects.filter(p => p.ownerId === user.id).length;
    if (isFinite(projectLimit) && ownedProjectCount >= projectLimit) {
      toast.warning(`${projectLimit} proje limitine ulaştınız. Daha fazla proje oluşturmak için planınızı yükseltin.`);
      navigate({ type: 'upgrade', payload: null });
      return;
    }
    try {
      const created = await projectService.create({
        user_id: user.id,
        name: projectName,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      });
      const newProject = mapDbProject(created as Record<string, any>);
      setProjects(prev => [...prev, newProject]);
    } catch {
      toast.error('Proje oluşturulurken hata oluştu.');
    }
  };

  const handleUpdateProject = async (projectId: string, newName: string) => {
    try {
      await projectService.update(projectId, { name: newName });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
    } catch {
      toast.error('Proje güncellenirken hata oluştu.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) return;
    try {
      await projectService.delete(projectId);
    } catch {
      toast.error('Proje silinirken hata oluştu.');
      return;
    }
    setPrompts(currentPrompts => currentPrompts.filter(p => p.projectId !== projectId));
    setArchivedPrompts(currentArchived => currentArchived.filter(p => p.projectId !== projectId));
    setProjects(currentProjects => currentProjects.filter(p => p.id !== projectId));
    toast.success(`"${projectToDelete.name}" projesi ve tüm prompt'ları silindi.`);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      navigate({ type: 'dashboard', payload: null });
    }
  };

  const handleDeleteMarketplaceItem = async (itemId: string) => {
    const itemToDelete = marketplaceItems.find(item => item.id === itemId);
    try {
      await marketplaceService.delete(itemId);
      setMarketplaceItems(prevItems => prevItems.filter(item => item.id !== itemId));
      toast.success(`"${itemToDelete?.title}" mağazadan kaldırıldı.`);
    } catch {
      toast.error('Ürün silinirken hata oluştu.');
    }
  };

  const handleAddItemToMarketplace = async (itemData: MarketplaceItemData) => {
    try {
      const created = await marketplaceService.create({
        seller_id: user.id,
        type: itemData.type,
        title: itemData.title,
        description: itemData.description,
        price: itemData.price,
        cover_image: itemData.coverImage,
        prompt_count: itemData.promptCount,
        tags: itemData.tags,
        prompt_ids: itemData.promptIds,
        rating: 0,
        review_count: 0,
        sales_count: 0,
        views: 0,
      });
      const newItem = mapDbMarketplaceItem(created as Record<string, any>);
      setMarketplaceItems(prevItems => [newItem, ...prevItems]);
      toast.success('Ürün mağazanıza başarıyla eklendi!');
    } catch {
      toast.error('Ürün eklenirken hata oluştu.');
    }
  };

  const handleUpdateMarketplaceItem = async (itemData: MarketplaceItemData) => {
    if (!itemData.id) return;
    try {
      await marketplaceService.update(itemData.id, {
        title: itemData.title,
        description: itemData.description,
        price: itemData.price,
        cover_image: itemData.coverImage,
        tags: itemData.tags,
        type: itemData.type,
        prompt_count: itemData.promptCount,
        prompt_ids: itemData.promptIds,
      });
      setMarketplaceItems(prevItems =>
        prevItems.map(item => {
          if (item.id === itemData.id) {
            return {
              ...item,
              title: itemData.title,
              description: itemData.description,
              price: itemData.price,
              coverImage: itemData.coverImage,
              tags: itemData.tags,
              type: itemData.type,
              promptCount: itemData.promptCount,
              promptIds: itemData.promptIds,
            };
          }
          return item;
        })
      );
      toast.success('Ürün başarıyla güncellendi!');
    } catch {
      toast.error('Ürün güncellenirken hata oluştu.');
    }
  };

  const handleAddBundle = async (bundleData: import('./components/CreateBundleModal').BundleData) => {
    try {
      const created = await marketplaceService.create({
        seller_id: user.id,
        type: 'collection',
        title: bundleData.title,
        description: bundleData.description,
        price: bundleData.price,
        original_price: bundleData.originalPrice,
        cover_image: bundleData.coverImage,
        prompt_count: bundleData.promptIds.length,
        tags: ['bundle'],
        prompt_ids: bundleData.promptIds,
        rating: 0,
        review_count: 0,
        sales_count: 0,
        views: 0,
      });
      const newBundle = mapDbMarketplaceItem(created as Record<string, any>);
      setMarketplaceItems(prev => [newBundle, ...prev]);
      toast.success('Paket başarıyla mağazanıza eklendi!');
    } catch {
      toast.error('Paket eklenirken hata oluştu.');
    }
  };

  const handleBoostListing = (itemId: string, days: number) => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setMarketplaceItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, sponsored: { startDate: startDate.toISOString(), endDate: endDate.toISOString() } }
        : item
    ));
  };


  const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'totalImpressions' | 'totalSales' | 'promptStats'> & { id?: string }) => {
    // Marketplace campaigns require canSell (Pro+)
    if (campaignData.purpose === 'marketplace' && !PLAN_LIMITS[user.membership].canSell) {
      toast.warning('Marketplace kampanyaları için Pro veya Team planı gereklidir.');
      navigate({ type: 'upgrade', payload: null });
      return;
    }
    const existingIndex = campaigns.findIndex(c => c.id === campaignData.id);
    if (existingIndex === -1) {
      const maxCampaigns = PLAN_LIMITS[user.membership].maxCampaigns;
      if (isFinite(maxCampaigns) && campaigns.filter(c => c.purpose !== 'social').length >= maxCampaigns) {
        toast.warning(`Plan limitine ulaştınız (${maxCampaigns} kampanya). Daha fazla kampanya oluşturmak için planınızı yükseltin.`);
        navigate({ type: 'upgrade', payload: null });
        return;
      }
    }

    if (existingIndex > -1) {
      const id = campaigns[existingIndex].id;
      try {
        await campaignService.update(id, {
          name: campaignData.name,
          description: campaignData.description,
          prompt_ids: campaignData.promptIds,
          budget: campaignData.budget,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate ?? null,
          is_active: campaignData.status !== 'paused',
          creative_type: campaignData.creativeType,
          creative_url: campaignData.creativeUrl,
          purpose: campaignData.purpose ?? 'social',
        });
        setCampaigns(prev => {
          const newCampaigns = [...prev];
          const existing = newCampaigns[existingIndex];
          newCampaigns[existingIndex] = { ...existing, ...campaignData, id: existing.id };
          return newCampaigns;
        });
        toast.success('Kampanya güncellendi!');
      } catch {
        toast.error('Kampanya güncellenirken hata oluştu.');
        return;
      }
    } else {
      try {
        const created = await campaignService.create({
          seller_id: user.id,
          name: campaignData.name,
          description: campaignData.description,
          prompt_ids: campaignData.promptIds,
          budget: campaignData.budget,
          start_date: campaignData.startDate,
          end_date: campaignData.endDate ?? null,
          is_active: campaignData.status !== 'paused',
          creative_type: campaignData.creativeType,
          creative_url: campaignData.creativeUrl,
          purpose: campaignData.purpose ?? 'social',
        });
        const newCampaign = mapDbCampaign(created as Record<string, any>);
        setCampaigns(prev => [newCampaign, ...prev]);
        toast.success('Kampanya oluşturuldu!');
      } catch {
        toast.error('Kampanya oluşturulurken hata oluştu.');
        return;
      }
    }
    navigate({ type: 'myStore', payload: { activeTab: 'campaigns' } });
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await campaignService.delete(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      toast.success('Kampanya silindi.');
      navigate({ type: 'myStore', payload: { activeTab: 'campaigns' } });
    } catch {
      toast.error('Kampanya silinirken hata oluştu.');
    }
  };
  
  const handleCampaignImpression = (campaignId: string, promptId: string) => {
      setCampaigns(prev => prev.map(c => {
          if (c.id === campaignId) {
              const newStats = c.promptStats.map(stat => 
                  stat.promptId === promptId ? { ...stat, impressions: stat.impressions + 1 } : stat
              );
              const newTotalImpressions = c.totalImpressions + 1;
              return { ...c, promptStats: newStats, totalImpressions: newTotalImpressions };
          }
          return c;
      }));
  };

  const handleUpdateOrderReview = (orderId: string, productId: string, rating: number, review: string) => {
    setOrders(prevOrders => 
        prevOrders.map(order => {
            if (order.id === orderId) {
                return {
                    ...order,
                    items: order.items.map(item => {
                        if (item.product.id === productId) {
                            return { ...item, rating, review };
                        }
                        return item;
                    })
                };
            }
            return order;
        })
    );
    toast.success('Yorumunuz için teşekkürler!');
  };

  const handleSendMessage = (conversationId: string, content: string, _receiverId: string) => {
    const now = new Date().toISOString();
    // Snapshot previous state for rollback
    let prevConversations: typeof conversations;
    setConversations(prev => {
      prevConversations = prev;
      return prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              updatedAt: now,
              lastMessage: {
                id: Date.now().toString(),
                senderId: user.id,
                receiverId: _receiverId,
                content,
                timestamp: now,
                isRead: true,
              },
            }
          : c
      );
    });
    messageService.sendMessage({ conversationId, senderId: user.id, text: content }).catch(() => {
      setConversations(prevConversations);
      toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    });
  };

  const handleCreateConversation = async (participantIds: string[]): Promise<string> => {
    const [userId1, userId2] = participantIds;
    try {
      const id = await messageService.getOrCreateConversation(userId1, userId2);
      setConversations(prev => {
        if (prev.some(c => c.id === id)) return prev;
        return [{ id, participantIds, updatedAt: new Date().toISOString() }, ...prev];
      });
      return id;
    } catch {
      // Fallback to local-only conversation
      const tempId = `conv-${Date.now()}`;
      setConversations(prev => [{ id: tempId, participantIds, updatedAt: new Date().toISOString() }, ...prev]);
      return tempId;
    }
  };

  const handleMessageUser = async (userId: string) => {
    const existing = conversations.find(c => c.participantIds.includes(userId) && c.participantIds.includes(user.id));
    if (existing) {
      navigate({ type: 'messages', payload: { conversationId: existing.id } });
    } else {
      const newId = await handleCreateConversation([user.id, userId]);
      navigate({ type: 'messages', payload: { conversationId: newId } });
    }
  };

  const handleSharePromptViaMessage = async (userId: string, promptId: string) => {
      let conversationId = '';
      const existing = conversations.find(c => c.participantIds.includes(userId) && c.participantIds.includes(user.id));
      if (existing) {
          conversationId = existing.id;
      } else {
          conversationId = await handleCreateConversation([user.id, userId]);
      }
      
      // Add the message with the shared prompt
      setConversations(prev => prev.map(c => {
          if (c.id === conversationId) {
              return {
                  ...c,
                  updatedAt: new Date().toISOString(),
                  lastMessage: {
                      id: Date.now().toString(),
                      senderId: user.id,
                      receiverId: userId,
                      content: 'Check out this prompt I found!',
                      timestamp: new Date().toISOString(),
                      isRead: true,
                      sharedPromptId: promptId,
                  }
              };
          }
          return c;
      }));

      // Optionally navigate
      navigate({ type: 'messages', payload: { conversationId } });
  };

  const handleUpgradeMembership = (plan: MembershipType) => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    setUser(prevUser => ({
        ...prevUser,
        membership: plan,
        subscriptionStartDate: plan === MembershipType.STARTER ? undefined : startDate.toISOString(),
        subscriptionEndDate: plan === MembershipType.STARTER ? undefined : endDate.toISOString(),
    }));
    const planLabel = PLAN_LIMITS[plan].label;
    if (plan === MembershipType.STARTER) {
      toast.info('Planınız Starter\'a düşürüldü.');
    } else {
      toast.success(`Tebrikler! Artık ${planLabel} planındasınız.`);
    }
    navigate({ type: 'upgrade', payload: null });
  };
  
  const handleNavigateToCancelSubscription = () => {
    navigate({ type: 'cancelSubscription', payload: null });
  };

  const handleConfirmCancellation = () => {
      setUser(prevUser => ({
          ...prevUser,
          membership: MembershipType.STARTER,
          subscriptionStartDate: undefined,
          subscriptionEndDate: undefined,
      }));
      toast.info('Aboneliğiniz iptal edildi.');
      navigate({ type: 'upgrade', payload: null });
  };
  
  const handleOpenShareModal = (prompt: Prompt) => {
    setPromptToShare(prompt);
  };

  const handleCloseShareModal = () => {
    setPromptToShare(null);
  };

  const handleUpdateCollaborators = (promptId: string, newCollaborators: Collaborator[]) => {
    const maxCollaborators = PLAN_LIMITS[user.membership].maxCollaboratorsPerPrompt;
    if (newCollaborators.length > maxCollaborators) {
      toast.warning(`Planınız prompt başına en fazla ${maxCollaborators} iş birliği üyesine izin veriyor. Daha fazlası için planınızı yükseltin.`);
      navigate({ type: 'upgrade', payload: null });
      return;
    }
    const p = prompts.find(pr => pr.id === promptId) || archivedPrompts.find(pr => pr.id === promptId);
    if (p) {
      const oldIds = new Set((p.collaborators || []).map(c => c.userId));
      const newlyAdded = newCollaborators.filter(c => !oldIds.has(c.userId));

      if (newlyAdded.length > 0) {
        const newNotifs: Notification[] = newlyAdded.map(c => ({
           id: `notif-${Date.now()}-${Math.random()}`,
           userId: c.userId,
           actorId: user.id,
           actorName: user.name,
           actorAvatar: user.avatarUrl,
           type: 'invite_collaborator',
           targetType: 'prompt',
           targetId: promptId,
           targetPreview: `Invited to prompt: ${p.title}`,
           createdAt: new Date().toISOString(),
           isRead: false
        }));
        setNotifications(prev => [...newNotifs, ...prev]);
      }
    }

    const updatePrompt = (p: Prompt) => p.id === promptId ? { ...p, collaborators: newCollaborators } : p;
    setPrompts(prev => prev.map(updatePrompt));
    setArchivedPrompts(prev => prev.map(updatePrompt));
    setPromptToShare(prev => prev ? { ...prev, collaborators: newCollaborators } : null);
  };

  const handleOpenShareProjectModal = (project: Project) => {
    setProjectToShare(project);
  };

  const handleCloseShareProjectModal = () => {
    setProjectToShare(null);
  };

  const handleUpdateProjectCollaborators = (projectId: string, newCollaborators: Collaborator[]) => {
    const p = projects.find(p => p.id === projectId);
    if (p) {
      const oldIds = new Set((p.collaborators || []).map(c => c.userId));
      const newlyAdded = newCollaborators.filter(c => !oldIds.has(c.userId));

      if (newlyAdded.length > 0) {
        const newNotifs: Notification[] = newlyAdded.map(c => ({
           id: `notif-${Date.now()}-${Math.random()}`,
           userId: c.userId,
           actorId: user.id,
           actorName: user.name,
           actorAvatar: user.avatarUrl,
           type: 'invite_collaborator',
           targetType: 'project',
           targetId: projectId,
           targetPreview: `Invited to project: ${p.name}`,
           createdAt: new Date().toISOString(),
           isRead: false
        }));
        setNotifications(prev => [...newNotifs, ...prev]);
      }
    }

    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, collaborators: newCollaborators } : p
      )
    );
    setProjectToShare(prev => prev ? { ...prev, collaborators: newCollaborators } : null);
  };

  const handleViewStore = (seller: { id: string; name: string; avatarUrl: string; verificationStatus?: string }) => {
      navigate({ type: 'publicStore', payload: { sellerId: seller.id, sellerName: seller.name, avatarUrl: seller.avatarUrl, verificationStatus: seller.verificationStatus as any } });
  };

  const handleUpdateAvatar = async (blob: Blob) => {
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const url = await storageService.uploadAvatar(user.id, file);
      await profileService.update(user.id, { avatar_url: url });
      setUser(prev => ({ ...prev, avatarUrl: url }));
      toast.success('Profil fotoğrafı güncellendi.');
    } catch {
      toast.error('Fotoğraf yüklenirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleRequestVerification = async () => {
    try {
      await profileService.update(user.id, { verification_status: 'pending' });
      setUser(prev => ({ ...prev, verificationStatus: 'pending' }));
      toast.success('Doğrulama talebiniz alındı. En kısa sürede incelenecek.');
    } catch {
      toast.error('Doğrulama talebi gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleSellYourPrompts = () => {
      if (!PLAN_LIMITS[user.membership].canSell) {
          toast.warning('Satış yapabilmek için Pro veya Team planına geçmeniz gerekmektedir.');
          navigate({ type: 'upgrade', payload: null });
          return;
      }
      
      navigate({ type: 'myStore', payload: null });
      setShouldOpenAddProductModal(true);
  };

  const handleFollowUser = async (userIdToFollow: string) => {
    const isCurrentlyFollowing = user.following?.includes(userIdToFollow) ?? false;
    setUser(prevUser => {
      const following = isCurrentlyFollowing
        ? prevUser.following?.filter(id => id !== userIdToFollow)
        : [...(prevUser.following || []), userIdToFollow];
      return { ...prevUser, following };
    });
    toast.success(isCurrentlyFollowing ? 'Takipten çıkıldı.' : 'Takip edildi!');
    try {
      await profileService.follow(user.id, userIdToFollow);
    } catch {
      setUser(prevUser => {
        const following = isCurrentlyFollowing
          ? [...(prevUser.following || []), userIdToFollow]
          : prevUser.following?.filter(id => id !== userIdToFollow);
        return { ...prevUser, following };
      });
      toast.error('Takip işlemi başarısız oldu.');
    }
  };

  const handleLikePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.likes.includes(user.id);
    const newLikes = isLiked ? post.likes.filter(id => id !== user.id) : [...post.likes, user.id];
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    if (!isLiked && post.authorId !== user.id) {
      setNotifications(prev => [{
        id: `notif-${Date.now()}`,
        userId: post.authorId,
        actorId: user.id,
        actorName: user.name,
        actorAvatar: user.avatarUrl,
        type: 'like',
        targetType: 'post',
        targetId: post.id,
        targetPreview: post.caption.substring(0, 50),
        createdAt: new Date().toISOString(),
        isRead: false,
      }, ...prev]);
    }
    try {
      await postService.toggleLike(postId, user.id, post.likes);
    } catch {
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likes: post.likes } : p));
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newComment = {
      id: `comment-${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatarUrl,
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    setPosts(prevPosts => prevPosts.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
    if (post.authorId !== user.id) {
      setNotifications(prev => [{
        id: `notif-${Date.now()}`,
        userId: post.authorId,
        actorId: user.id,
        actorName: user.name,
        actorAvatar: user.avatarUrl,
        type: 'comment',
        targetType: 'post',
        targetId: post.id,
        targetPreview: commentText.substring(0, 50),
        createdAt: new Date().toISOString(),
        isRead: false,
      }, ...prev]);
    }
    try {
      await postService.addComment(postId, { authorId: newComment.authorId, text: newComment.text });
    } catch {
      setPosts(prevPosts => prevPosts.map(p =>
        p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== newComment.id) } : p
      ));
    }
  };

  const handleLikePrompt = (promptId: string) => {
     setPrompts(prev => prev.map(p => {
         if (p.id === promptId) {
             const isLiked = p.likes?.includes(user.id);
             const likes = isLiked
                      ? (p.likes || []).filter(id => id !== user.id)
                      : [...(p.likes || []), user.id];
             
             if (!isLiked && p.ownerId !== user.id) {
                 setNotifications(prevNotifs => [{
                     id: `notif-${Date.now()}`,
                     userId: p.ownerId,
                     actorId: user.id,
                     actorName: user.name,
                     actorAvatar: user.avatarUrl,
                     type: 'like',
                     targetType: 'prompt',
                     targetId: p.id,
                     targetPreview: p.title,
                     createdAt: new Date().toISOString(),
                     isRead: false
                 }, ...prevNotifs]);
             }
             return { ...p, likes };
         }
         return p;
     }));
  };

  const handleAddPromptComment = (promptId: string, text: string) => {
      setPrompts(prev => prev.map(p => {
          if (p.id === promptId) {
              const newComment = {
                      id: `comment-${Date.now()}`,
                      authorId: user.id,
                      authorName: user.name,
                      authorAvatar: user.avatarUrl,
                      text: text,
                      createdAt: new Date().toISOString(),
              };
              if (p.ownerId !== user.id) {
                 setNotifications(prevNotifs => [{
                     id: `notif-${Date.now()}`,
                     userId: p.ownerId,
                     actorId: user.id,
                     actorName: user.name,
                     actorAvatar: user.avatarUrl,
                     type: 'comment',
                     targetType: 'prompt',
                     targetId: p.id,
                     targetPreview: text.substring(0, 50),
                     createdAt: new Date().toISOString(),
                     isRead: false
                 }, ...prevNotifs]);
              }
              return { ...p, comments: [...(p.comments || []), newComment] };
          }
          return p;
      }));
  };

  const handleCreatePost = async (postData: PostData) => {
    try {
      const created = await postService.create({
        author_id: user.id,
        caption: postData.caption,
        image_url: postData.imageUrl ?? null,
        video_url: postData.videoUrl ?? null,
        tags: postData.tags,
        likes: [],
      });
      const newPost = mapDbPost(created as Record<string, any>);
      setPosts(prevPosts => [newPost, ...prevPosts]);

      // Parse @mentions and send notifications
      const mentionMatches = [...postData.caption.matchAll(/@(\w+)/g)].map(m => m[1]);
      if (mentionMatches.length > 0) {
        const mentionedUsers = await Promise.all(
          mentionMatches.map(name => profileService.search(name).then(rows => rows.find(r => (r.name ?? '').toLowerCase().includes(name.toLowerCase()))))
        );
        for (const mentionedUser of mentionedUsers.filter(Boolean)) {
          if (mentionedUser && mentionedUser.id !== user.id) {
            void notificationService.create({
              user_id: mentionedUser.id,
              actor_id: user.id,
              actor_name: user.name,
              actor_avatar: user.avatarUrl,
              type: 'comment',
              target_type: 'post',
              target_id: newPost.id,
              target_preview: postData.caption.slice(0, 80),
            }).catch(() => {});
          }
        }
      }
    } catch {
      toast.error('Post oluşturulurken hata oluştu.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postService.delete(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Gönderi silindi.');
    } catch {
      toast.error('Gönderi silinirken hata oluştu.');
    }
  };

  const handleEditPost = async (postId: string, newCaption: string, newTags: string[]) => {
    try {
      await postService.update(postId, { caption: newCaption, tags: newTags });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: newCaption, tags: newTags } : p));
      toast.success('Gönderi güncellendi.');
    } catch {
      toast.error('Gönderi güncellenirken hata oluştu.');
    }
  };

    const handleFavoritePost = (postId: string) => {
        setUser(prevUser => {
            const isFavorited = prevUser.favorites?.includes(postId);
            const favorites = isFavorited
                ? prevUser.favorites?.filter(id => id !== postId)
                : [...(prevUser.favorites || []), postId];
            return { ...prevUser, favorites };
        });
    };

  const visiblePrompts = useMemo(() => {
    return prompts.filter(p => 
        p.ownerId === user.id || 
        p.collaborators.some(c => c.userId === user.id)
    );
  }, [prompts, user.id]);

  const dashboardPrompts = selectedProjectId
    ? visiblePrompts.filter(p => p.projectId === selectedProjectId)
    : visiblePrompts;


  const renderView = () => {
    switch (view.type) {
      case 'dashboard':
        return <Dashboard
                  user={user}
                  title="My Prompts"
                  prompts={dashboardPrompts}
                  projects={projects}
                  onSelectPrompt={(prompt) => navigate({ type: 'promptDetail', payload: prompt })}
                  onNewPrompt={handleOpenCreateModal}
                  onDeletePrompt={handleDeletePrompt}
                  onArchivePrompt={handleArchivePrompt}
                  onOpenShareModal={handleOpenShareModal}
                  onNavigate={navigate}
                />;
      case 'archived':
        if (!PLAN_LIMITS[user.membership].canArchive) {
            return (
                <div className="text-center max-w-2xl mx-auto bg-white p-12 rounded-xl shadow-md border border-gray-200">
                    <ArchiveIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Arşiv Özelliğinin Kilidini Açın</h2>
                    <p className="text-gray-600 mb-6">
                        Arşiv, aktif olarak kullanmadığınız prompt'ları saklayarak panonuzu düzenli tutmanıza yardımcı olan bir Premium özelliktir. Arşivinize erişmek için planınızı yükseltin.
                    </p>
                    <button
                        onClick={() => navigate({ type: 'upgrade', payload: null })}
                        className="flex items-center gap-2 mx-auto bg-brand-orange text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <ArrowUpIcon />
                        Premium'a Yükselt
                    </button>
                </div>
            );
        }
        return <Dashboard
                  user={user}
                  title="Archived Prompts"
                  prompts={archivedPrompts}
                  projects={projects}
                  onSelectPrompt={(prompt) => navigate({ type: 'promptDetail', payload: prompt })}
                  onUnarchivePrompt={handleUnarchivePrompt}
                  onDeletePrompt={handleDeletePrompt}
                  isArchivedView={true}
                  onOpenShareModal={handleOpenShareModal}
                  onNavigate={navigate}
                />;
      case 'marketplace':
        return <Marketplace 
                  user={user}
                  orders={orders}
                  items={marketplaceItems}
                  campaigns={campaigns}
                  onAddToCart={handleAddToCart} 
                  onDeleteItem={handleDeleteMarketplaceItem}
                  onViewStore={handleViewStore}
                  onSellYourPrompts={handleSellYourPrompts}
                  onCampaignImpression={handleCampaignImpression}
                  onNavigate={navigate}
               />;
      case 'myStore':
          return <MyStore 
                      user={user} 
                      items={marketplaceItems.filter(item => item.sellerId === user.id)} 
                      prompts={visiblePrompts}
                      campaigns={campaigns}
                      onDeleteItem={handleDeleteMarketplaceItem}
                      onAddItem={handleAddItemToMarketplace}
                      onUpdateItem={handleUpdateMarketplaceItem}
                      onBoostItem={handleBoostListing}
                      onAddBundle={handleAddBundle}
                      shouldOpenAddModal={shouldOpenAddProductModal}
                      onAddModalOpened={() => setShouldOpenAddProductModal(false)}
                      onNavigate={navigate}
                      initialTab={view.payload?.activeTab}
                  />;
      case 'publicStore':
          if (!view.payload) return <h2>Seller not found</h2>;
          return <PublicStore
                      user={user}
                      sellerInfo={view.payload}
                      items={marketplaceItems}
                      onAddToCart={handleAddToCart}
                      onViewStore={handleViewStore}
                      onNavigateToMarketplace={() => navigate({ type: 'marketplace', payload: null })}
                      onNavigate={navigate}
                      onCreateCustomOrder={handleCreateCustomOrder}
                  />;
      case 'settings':
        return <Settings user={user} onUpdateUser={handleUpdateUser} prompts={prompts} projects={projects} onImportPrompts={handleImportPrompts} />;
      case 'cart':
        return <Cart cartItems={cart} onRemoveFromCart={handleRemoveFromCart} onUpdateQuantity={handleUpdateCartQuantity} onCheckout={handleCheckout} appliedCoupon={appliedCoupon} onApplyCoupon={handleApplyCoupon} onRemoveCoupon={handleRemoveCoupon} />;
      case 'orders':
        return <Orders orders={orders} onNavigateToMarketplace={() => navigate({ type: 'marketplace', payload: null })} onUpdateReview={handleUpdateOrderReview} />;
      case 'commissions':
        return <CommissionsPage customOrders={customOrders} currentUser={user} onUpdateStatus={handleUpdateCustomOrderStatus} />;
      case 'privacy':
        return <PrivacyPage onBack={() => navigate({ type: 'dashboard', payload: null })} />;
      case 'terms':
        return <TermsPage onBack={() => navigate({ type: 'dashboard', payload: null })} />;
      case 'upgrade':
        return <UpgradePage user={user} onUpgrade={handleUpgradeMembership} onNavigate={navigate} onCancelSubscription={handleNavigateToCancelSubscription} />;
      case 'cancelSubscription':
        return <CancelSubscriptionPage onConfirm={handleConfirmCancellation} onKeepPlan={() => navigate({ type: 'upgrade', payload: null })} />;
      case 'referral':
        return <ReferralPage user={user} referrals={referrals} />;
      case 'explore':
        return <ExplorePage
                    user={user}
                    posts={posts}
                    prompts={prompts}
                    allSystemPrompts={MOCK_SYSTEM_PROMPTS}
                    campaigns={campaigns}
                    onLikePost={handleLikePost}
                    onAddComment={handleAddComment}
                    onFollowUser={handleFollowUser}
                    onCreatePost={handleCreatePost}
                    onFavoritePost={handleFavoritePost}
                    onNavigate={navigate}
                    onCampaignImpression={handleCampaignImpression}
                />;
      case 'favorites':
        return <FavoritesPage
                    user={user}
                    posts={posts}
                    onLikePost={handleLikePost}
                    onAddComment={handleAddComment}
                    onFollowUser={handleFollowUser}
                    onFavoritePost={handleFavoritePost}
                    onNavigate={navigate}
                />;
      case 'profile': {
          if (!view.payload) return <h2>User not found</h2>;
          // Use current user's data when viewing own profile
          const profileUser = view.payload.userId === user.id ? user : viewedProfile;
          if (!profileUser) {
            return (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
              </div>
            );
          }
          return <ProfilePage
              profileUser={profileUser}
              currentUser={user}
              posts={posts}
              onFollowUser={handleFollowUser}
              onLikePost={handleLikePost}
              onAddComment={handleAddComment}
              onFavoritePost={handleFavoritePost}
              onNavigate={navigate}
              onCreatePost={handleCreatePost}
              onMessageUser={handleMessageUser}
              onRequestVerification={profileUser.id === user.id ? handleRequestVerification : undefined}
              onDeletePost={handleDeletePost}
              onEditPost={handleEditPost}
              onUpdateAvatar={profileUser.id === user.id ? handleUpdateAvatar : undefined}
          />;
      }
      case 'createCampaign': {
          // Starter can create social campaigns only — marketplace campaigns require canSell
          // (maxCampaigns check removed: Starter can do social, Pro+ can do marketplace too)
          const campaignToEdit = view.payload?.campaignId ? campaigns.find(c => c.id === view.payload.campaignId) : undefined;
          return <CreateCampaignPage
              onSave={handleSaveCampaign}
              onCancel={() => navigate({ type: 'myStore', payload: { activeTab: 'campaigns' } })}
              userPrompts={visiblePrompts}
              campaignToEdit={campaignToEdit}
              userId={user.id}
          />;
      }
      case 'campaignDetail':
          const campaign = campaigns.find(c => c.id === view.payload?.campaignId);
          if (!campaign) return <h2>Campaign not found</h2>;
          return <CampaignDetailPage 
              campaign={campaign}
              allPrompts={prompts}
              onNavigate={navigate}
              onDelete={handleDeleteCampaign}
          />;
      case 'messages':
          return <MessagesView
              currentUser={user}
              conversations={conversations}
              onSearchUsers={(q) => profileService.search(q).then(rows => rows.map(r => ({ id: r.id, name: r.name ?? '', avatarUrl: r.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}` })))}
              onSendMessage={handleSendMessage}
              onCreateConversation={handleCreateConversation}
              initialConversationId={view.payload?.conversationId}
              onNavigate={navigate}
          />;
      case 'promptDetail':
        if (!view.payload) return <h2>Prompt not found</h2>;
        const isArchived = archivedPrompts.some(p => p.id === view.payload?.id);
        
        let backText = isArchived ? "Back to Archived" : "Back to My Prompts";
        if (previousView?.type === 'explore') backText = 'Back to Explore';
        else if (previousView?.type === 'marketplace') backText = 'Back to Marketplace';

        return <PromptDetail
                user={user}
                prompt={view.payload} 
                projects={projects} 
                isArchived={isArchived}
                backButtonText={backText}
                onBack={() => {
                  if (previousView && previousView.type !== 'dashboard' && previousView.type !== 'promptDetail') {
                    navigate(previousView);
                  } else {
                    navigate({ type: isArchived ? 'archived' : 'dashboard', payload: null });
                  }
                }}
                onEdit={handleOpenEditModal}
                onDelete={handleDeletePrompt}
                onDuplicate={handleDuplicatePrompt}
                onArchive={handleArchivePrompt}
                onUnarchive={handleUnarchivePrompt}
                onShareViaMessage={(prompt) => setPromptToShareViaMessage(prompt)}
                onShareAsPost={(prompt) => setPromptToShareAsPost(prompt)}
              />;
      case 'notFound':
        return <NotFoundPage onBack={() => navigate({ type: 'dashboard', payload: null })} />;
      default:
        return <Dashboard
                  user={user}
                  title="My Prompts"
                  prompts={dashboardPrompts}
                  projects={projects}
                  onSelectPrompt={(prompt) => navigate({ type: 'promptDetail', payload: prompt })}
                  onNewPrompt={handleOpenCreateModal}
                  onDeletePrompt={handleDeletePrompt}
                  onArchivePrompt={handleArchivePrompt}
                  onOpenShareModal={handleOpenShareModal}
                  onNavigate={navigate}
                />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-medium-gray">Loading...</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-medium-gray">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (view.type === 'register') {
      return <><Register onRegister={handleRegister} onNavigate={navigate} /><ToastContainer /></>;
    }
    if (view.type === 'privacy') {
      return <><PrivacyPage onBack={() => navigate({ type: 'login', payload: null })} /><ToastContainer /></>;
    }
    if (view.type === 'terms') {
      return <><TermsPage onBack={() => navigate({ type: 'login', payload: null })} /><ToastContainer /></>;
    }
    return <><Login onLogin={handleLogin} onNavigate={navigate} /><ToastContainer /></>;
  }

  // If authenticated, but on login/register page, redirect is happening via useEffect.
  // Show a loading indicator while redirecting.
  if (view.type === 'login' || view.type === 'register') {
    return <div className="min-h-screen bg-brand-light-gray flex justify-center items-center">Loading...</div>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-brand-light-gray min-h-screen flex text-brand-dark-gray">
      <Sidebar
        user={user}
        projects={projects}
        activeView={view.type}
        onNavigate={navigate}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onSelectProject={handleSelectProject}
        selectedProjectId={selectedProjectId}
        cartItemCount={cart.reduce((total, item) => total + item.quantity, 0)}
        pendingCommissionsCount={customOrders.filter(o => o.sellerId === user.id && o.status === 'pending').length || undefined}
        onShareProject={handleOpenShareProjectModal}
        onLogout={handleLogout}
        activeProfileUserId={view.type === 'profile' ? view.payload?.userId : undefined}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar: hamburger (mobile) + notification */}
        <div className="shrink-0 flex items-center justify-between px-4 md:px-8 pt-4 md:pt-5 pb-2 bg-brand-light-gray">
          <button
            className="md:hidden p-2 bg-white rounded-lg shadow-md"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-auto relative z-50">
           <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-white rounded-full shadow-md hover:bg-gray-50 focus:outline-none"
           >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-orange rounded-full">
                      {unreadCount}
                  </span>
              )}
           </button>
           
           {showNotifications && (
               <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transform origin-top-right">
                   <div className="flex justify-between items-center p-4 border-b border-gray-100">
                       <h3 className="font-semibold">Notifications</h3>
                       {unreadCount > 0 && (
                           <button
                               onClick={() => {
                                 setNotifications(prev => prev.map(n => ({...n, isRead: true})));
                                 void notificationService.markAllRead(user.id).catch(() => {});
                               }}
                               className="text-xs text-brand-orange hover:text-orange-600 font-medium"
                           >
                               Mark all as read
                           </button>
                       )}
                   </div>
                   <div className="max-h-96 overflow-y-auto">
                       {notifications.length === 0 ? (
                           <div className="p-4 text-center text-gray-500 text-sm">No new notifications</div>
                       ) : (
                           notifications.map(notification => (
                               <div 
                                  key={notification.id} 
                                  className={`p-4 border-b border-gray-50 flex gap-3 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-orange-50/50' : ''}`}
                                  onClick={() => {
                                      setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, isRead: true} : n));
                                      if (notification.targetType === 'prompt') {
                                          const prompt = prompts.find(p => p.id === notification.targetId);
                                          if (prompt) navigate({ type: 'promptDetail', payload: prompt });
                                      } else if (notification.targetType === 'post') {
                                          navigate({ type: 'explore', payload: null });
                                      } else if (notification.targetType === 'marketplace_item') {
                                          navigate({ type: 'myStore', payload: { activeTab: 'products' } });
                                      } else if (notification.targetType === 'project') {
                                          navigate({ type: 'dashboard', payload: null });
                                      }
                                      setShowNotifications(false);
                                  }}
                               >
                                   <img src={notification.actorAvatar} alt={notification.actorName} className="w-10 h-10 rounded-full flex-shrink-0" />
                                   <div>
                                       <p className="text-sm">
                                           <span className="font-semibold">{notification.actorName}</span>{' '}
                                           {notification.type === 'like' && 'liked your '}
                                           {notification.type === 'comment' && 'commented on your '}
                                           {notification.type === 'sale' && 'purchased your '}
                                           {notification.type === 'invite_collaborator' && 'invited you to collaborate on a '}
                                           <span className="font-medium">
                                              {notification.targetType === 'marketplace_item' ? 'product' : notification.targetType}
                                           </span>
                                       </p>
                                       <p className="text-xs text-gray-500 mt-1 italic truncate">"{notification.targetPreview}"</p>
                                       <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
               </div>
           )}
          </div>
        </div>
        {/* Scrollable page content */}
        <div className="flex-1 px-4 md:px-8 pb-8 pt-2 overflow-y-auto">
          {renderView()}
        </div>
      </main>
      <CreatePromptModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePrompt}
        projects={projects}
        promptToEdit={promptToEdit}
        currentUser={user}
        allPrompts={[...prompts, ...archivedPrompts, ...MOCK_SYSTEM_PROMPTS]}
      />
      {promptToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Prompt'u Sil</h3>
            <p className="text-gray-600 text-sm mb-6">Bu prompt kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPromptToDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => void handleConfirmDeletePrompt()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
      {promptToShare && (
        <SharePromptModal
          isOpen={!!promptToShare}
          onClose={handleCloseShareModal}
          prompt={promptToShare}
          currentUser={user}
          onFindUserByEmail={async (email) => {
            const row = await profileService.getByEmail(email);
            if (!row) return null;
            return { id: row.id, email: row.email ?? email, avatarUrl: row.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}` };
          }}
          onUpdateCollaborators={handleUpdateCollaborators}
        />
      )}
      
      {promptToShareAsPost && (
        <CreatePostModal
          isOpen={!!promptToShareAsPost}
          onClose={() => setPromptToShareAsPost(null)}
          userId={user.id}
          initialCaption={`${promptToShareAsPost.title}\n\n${promptToShareAsPost.description}\n\n#promptverse #ai #prompt`}
          onSave={async (postData) => {
            await handleCreatePost(postData);
            setPromptToShareAsPost(null);
            navigate({ type: 'profile', payload: { userId: user.id } });
          }}
        />
      )}

      <ShareViaMessageModal
          isOpen={!!promptToShareViaMessage}
          onClose={() => setPromptToShareViaMessage(null)}
          prompt={promptToShareViaMessage}
          currentUser={user}
          onSearchUsers={(q) => profileService.search(q).then(rows => rows.map(r => ({ id: r.id, name: r.name ?? '', avatarUrl: r.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.id}` })))}
          onShare={handleSharePromptViaMessage}
      />

       {projectToShare && (
        <ShareProjectModal
          isOpen={!!projectToShare}
          onClose={handleCloseShareProjectModal}
          project={projectToShare}
          currentUser={user}
          onFindUserByEmail={async (email) => {
            const row = await profileService.getByEmail(email);
            if (!row) return null;
            return { id: row.id, email: row.email ?? email, avatarUrl: row.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}` };
          }}
          onUpdateCollaborators={handleUpdateProjectCollaborators}
        />
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => {
          localStorage.setItem('promptverse_onboarding_completed', 'true');
          setShowOnboarding(false);
        }}
        onNavigate={(target) => {
          if (target === 'marketplace') navigate({ type: 'marketplace', payload: null });
          else navigate({ type: 'dashboard', payload: null });
          setIsModalOpen(true);
        }}
      />
      <ToastContainer />
    </div>
  );
};

export default App;