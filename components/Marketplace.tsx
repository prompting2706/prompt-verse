


import React, { useMemo, useState, useRef, useEffect } from 'react';
import { type MarketplaceItem, type User, type Order, type Campaign, type View } from '../types';
import { CollectionIcon, CartIcon, TrashIcon, SearchIcon, FilterIcon, SortIcon, RocketLaunchIcon, PackageIcon } from './icons/Icons';
import StarRating from './StarRating';
import { getRecommendedMarketplaceItems } from '../services/recommendationService';
import AdBanner from './AdBanner';
import VerifiedBadge from './VerifiedBadge';

const isActivelySponsored = (item: MarketplaceItem): boolean => {
  if (!item.sponsored) return false;
  return new Date(item.sponsored.endDate) > new Date();
};

interface MarketplaceProps {
    user: User;
    orders: Order[];
    items: MarketplaceItem[];
    campaigns: Campaign[];
    onAddToCart: (item: MarketplaceItem) => void;
    onDeleteItem: (itemId: string) => void;
    onViewStore: (seller: { id: string; name: string; avatarUrl: string; }) => void;
    onSellYourPrompts: () => void;
    onCampaignImpression: (campaignId: string, promptId: string) => void;
    onNavigate: (view: View) => void;
}

type SortKey = 'rating' | 'price' | 'reviewCount' | 'salesCount';
type SortDirection = 'asc' | 'desc';
interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}


const Marketplace: React.FC<MarketplaceProps> = ({ user, orders, items, campaigns, onAddToCart, onDeleteItem, onViewStore, onSellYourPrompts, onCampaignImpression, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSort, setShowSort] = useState(false);
  const [adToShow, setAdToShow] = useState<Campaign | null>(null);
  
  const [priceFilter, setPriceFilter] = useState('any'); // any, under10, 10to25, over25
  const [ratingFilter, setRatingFilter] = useState(0); // 0, 4, 3
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'rating', direction: 'desc' });
  
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adToShow) return;
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


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortRef]);

  const sponsoredItems = useMemo(() => {
    return items.filter(isActivelySponsored);
  }, [items]);

  const featuredItems = useMemo(() => {
    return getRecommendedMarketplaceItems(items, user, orders, campaigns).slice(0, 4);
  }, [items, user, orders, campaigns]);

  const clearFilters = () => {
    setPriceFilter('any');
    setRatingFilter(0);
  };
  
  const handleSortChange = (key: SortKey, direction: SortDirection) => {
    setSortConfig({ key, direction });
    setShowSort(false);
  };

  const activeFilterCount = (priceFilter !== 'any' ? 1 : 0) + (ratingFilter !== 0 ? 1 : 0);

  const processedItems = useMemo(() => {
    const sponsoredIds = new Set(sponsoredItems.map(i => i.id));
    const baseItems = searchTerm || priceFilter !== 'any' || ratingFilter !== 0
      ? items
      : items.filter(item => !sponsoredIds.has(item.id));

    // If sorting by "Recommended" and no filters are active, use the recommendation service
    if (sortConfig.key === 'rating' && sortConfig.direction === 'desc' && !searchTerm && priceFilter === 'any' && ratingFilter === 0) {
        return getRecommendedMarketplaceItems(baseItems, user, orders, campaigns);
    }

    const filtered = baseItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' ||
        item.title.toLowerCase().includes(searchLower) ||
        item.seller.name.toLowerCase().includes(searchLower);

      const matchesPrice = priceFilter === 'any' ||
        (priceFilter === 'under10' && item.price < 10) ||
        (priceFilter === '10to25' && item.price >= 10 && item.price <= 25) ||
        (priceFilter === 'over25' && item.price > 25);

      const matchesRating = ratingFilter === 0 || item.rating >= ratingFilter;

      return matchesSearch && matchesPrice && matchesRating;
    });

    return [...filtered].sort((a, b) => {
        const { key, direction } = sortConfig;
        const isAsc = direction === 'asc';

        switch (key) {
            case 'price':
                return isAsc ? a.price - b.price : b.price - a.price;
            case 'rating':
                return isAsc ? a.rating - b.rating : b.rating - a.rating;
            case 'reviewCount':
                return isAsc ? a.reviewCount - b.reviewCount : b.reviewCount - a.reviewCount;
            case 'salesCount':
                return isAsc ? a.salesCount - b.salesCount : b.salesCount - a.salesCount;
            default:
                return 0;
        }
    });
  }, [items, user, orders, campaigns, searchTerm, priceFilter, ratingFilter, sortConfig]);

  const sortOptions: {label: string, key: SortKey, direction: SortDirection}[] = [
      { label: 'Recommended', key: 'rating', direction: 'desc' },
      { label: 'Best Sellers', key: 'salesCount', direction: 'desc' },
      { label: 'Most Reviewed', key: 'reviewCount', direction: 'desc' },
      { label: 'Price (Low to High)', key: 'price', direction: 'asc' },
      { label: 'Price (High to Low)', key: 'price', direction: 'desc' },
  ];

  const priceOptions = [
      { id: 'any', label: 'Any Price' },
      { id: 'under10', label: 'Under $10' },
      { id: '10to25', label: '$10 - $25' },
      { id: 'over25', label: 'Over $25' },
  ];

  const ratingOptions = [
      { id: 0, label: 'Any Rating' },
      { id: 4, label: '4 stars & up' },
      { id: 3, label: '3 stars & up' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <button
          onClick={onSellYourPrompts}
          className="bg-brand-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
        >
          Sell Your Prompts
        </button>
      </div>

       {/* Ad Banner */}
      {adToShow && (
        <AdBanner 
            campaign={adToShow} 
            onNavigate={onNavigate} 
            onImpression={onCampaignImpression}
            className="mb-8"
        />
      )}

      {/* Sponsored Section */}
      {sponsoredItems.length > 0 && (
        <div className="mb-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <RocketLaunchIcon className="w-4 h-4 text-yellow-600" />
            <h2 className="text-sm font-bold text-yellow-700 uppercase tracking-wider">Sponsorlu</h2>
          </div>
          <p className="text-xs text-yellow-600 mb-4">Bu ürünler öne çıkarılmış listelemelere dahildir.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sponsoredItems.map(item => (
              <MarketplaceCard
                key={`sponsored-${item.id}`}
                item={item}
                user={user}
                onAddToCart={onAddToCart}
                onDeleteItem={onDeleteItem}
                onViewStore={onViewStore}
                isSponsored
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by name or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange focus-within:border-brand-orange">
             <div className="pl-3 pr-2 py-2 text-gray-500 bg-gray-50 border-r border-gray-300 flex items-center">
               <FilterIcon />
             </div>
             <select
               value={priceFilter}
               onChange={(e) => setPriceFilter(e.target.value)}
               className="bg-transparent text-gray-700 py-2 pl-3 pr-8 text-sm font-medium focus:outline-none cursor-pointer"
             >
               {priceOptions.map(option => (
                 <option key={option.id} value={option.id}>{option.label}</option>
               ))}
             </select>
          </div>
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-orange focus-within:border-brand-orange">
             <select
               value={ratingFilter}
               onChange={(e) => setRatingFilter(Number(e.target.value))}
               className="bg-transparent text-gray-700 py-2 pl-3 pr-8 text-sm font-medium focus:outline-none cursor-pointer"
             >
               {ratingOptions.map(option => (
                 <option key={option.id} value={option.id}>{option.label}</option>
               ))}
             </select>
          </div>
          {activeFilterCount > 0 && (
            <button
               onClick={clearFilters}
               className="text-sm font-semibold text-brand-orange hover:text-orange-600 px-2 transition-colors flex items-center"
            >
               Clear Filters
            </button>
          )}
        </div>
        <div className="relative" ref={sortRef}>
          <button 
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50"
          >
            <SortIcon />
            Sort
          </button>
          {showSort && (
            <div className="absolute z-10 top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
              {sortOptions.map(option => {
                const isActive = sortConfig.key === option.key && sortConfig.direction === option.direction;
                return (
                  <button
                    key={option.label}
                    onClick={() => handleSortChange(option.key, option.direction)}
                    className={`w-full text-left px-4 py-2 text-sm ${isActive ? 'bg-orange-100 text-brand-orange' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>


      {/* Featured Section */}
      {featuredItems.length > 0 && !searchTerm && activeFilterCount === 0 && (
        <div className="mb-12 p-6 bg-orange-50 rounded-xl">
            <h2 className="text-2xl font-bold mb-2 text-brand-dark-gray">Featured For You</h2>
            <p className="text-brand-medium-gray mb-6">Based on top ratings, community trends, and active campaigns.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredItems.map(item => (
                    <MarketplaceCard 
                        key={`featured-${item.id}`} 
                        item={item} 
                        user={user} 
                        onAddToCart={onAddToCart}
                        onDeleteItem={onDeleteItem}
                        onViewStore={onViewStore}
                    />
                ))}
            </div>
        </div>
      )}
      
       <h2 className="text-2xl font-bold mb-4">Explore All</h2>
        {processedItems.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-700">No Matching Items</h2>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedItems.map(item => (
              <MarketplaceCard 
                key={item.id} 
                item={item} 
                user={user} 
                onAddToCart={onAddToCart}
                onDeleteItem={onDeleteItem}
                onViewStore={onViewStore}
              />
            ))}
          </div>
        )}
    </div>
  );
};

interface MarketplaceCardProps {
    item: MarketplaceItem;
    user: User;
    onAddToCart: (item: MarketplaceItem) => void;
    onDeleteItem: (itemId: string) => void;
    onViewStore?: (seller: { id: string; name: string; avatarUrl: string; }) => void;
    isSponsored?: boolean;
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, user, onAddToCart, onDeleteItem, onViewStore, isSponsored }) => {
    const isOwner = item.sellerId === user.id;

    const SellerInfo = () => (
        <div className="flex items-center gap-2">
            <img src={item.seller.avatarUrl} alt={item.seller.name} className="w-5 h-5 rounded-full" />
            <span className="text-gray-600">{item.seller.name}</span>
            <VerifiedBadge status={item.seller.verificationStatus} size="sm" />
        </div>
    );

    return (
        <div className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow flex flex-col overflow-hidden group border-2 ${isSponsored ? 'border-yellow-300' : 'border-gray-200'}`}>
            <div className="relative">
                {item.coverImage ? (
                    <img src={item.coverImage} alt={item.title} className="w-full h-40 object-cover" />
                ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                    </div>
                )}
                {isSponsored && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <RocketLaunchIcon className="w-3 h-3" />
                        Sponsorlu
                    </div>
                )}
                {item.type === 'collection' && (
                    item.originalPrice ? (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <PackageIcon className="w-3 h-3" />
                            {item.promptCount} Paket
                        </div>
                    ) : (
                        <div className="absolute top-2 right-2 bg-brand-orange text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <CollectionIcon />
                            {item.promptCount} Prompts
                        </div>
                    )
                )}
                {item.originalPrice && (
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        %{Math.round((1 - item.price / item.originalPrice) * 100)} İNDİRİM
                    </div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-md mb-1 group-hover:text-brand-green transition-colors">{item.title}</h3>
                <div className="text-sm mb-3">
                    {onViewStore ? (
                         <button onClick={(e) => { e.stopPropagation(); onViewStore({ id: item.sellerId, name: item.seller.name, avatarUrl: item.seller.avatarUrl }); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                           <SellerInfo />
                        </button>
                    ) : (
                        <SellerInfo />
                    )}
                </div>
                 <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={item.rating} />
                    <span className="font-bold text-sm text-gray-700">{item.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({item.reviewCount} reviews)</span>
                </div>
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                    <div className="flex flex-col">
                        {item.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">${item.originalPrice.toFixed(2)}</span>
                        )}
                        <span className="text-lg font-bold text-brand-green">${item.price.toFixed(2)}</span>
                    </div>
                    {isOwner ? (
                         <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-red-200 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                            Delete
                        </button>
                    ) : (
                        <button onClick={() => onAddToCart(item)} className="flex items-center gap-2 bg-green-100 text-brand-green px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-green-200 transition-colors">
                            <CartIcon className="w-4 h-4" />
                            Add
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Marketplace;