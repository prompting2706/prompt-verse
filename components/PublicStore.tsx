
import React, { useState } from 'react';
import { type User, type MarketplaceItem, type View, type CustomOrder, type VerificationStatus } from '../types';
import { CollectionIcon, CartIcon, TrashIcon, ArrowLeftIcon, ClipboardListIcon } from './icons/Icons';
import StarRating from './StarRating';
import CustomOrderModal from './CustomOrderModal';
import VerifiedBadge from './VerifiedBadge';

interface PublicStoreProps {
    user: User;
    sellerInfo: {
        sellerId: string;
        sellerName: string;
        avatarUrl: string;
        verificationStatus?: VerificationStatus;
    };
    items: MarketplaceItem[];
    onAddToCart: (item: MarketplaceItem) => void;
    onViewStore: (seller: { id: string; name: string; avatarUrl: string; }) => void;
    onNavigateToMarketplace: () => void;
    onNavigate: (view: View) => void;
    onCreateCustomOrder: (order: Omit<CustomOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const PublicStore: React.FC<PublicStoreProps> = ({ user, sellerInfo, items, onAddToCart, onViewStore, onNavigateToMarketplace, onNavigate, onCreateCustomOrder }) => {
    const sellerItems = items.filter(item => item.sellerId === sellerInfo.sellerId);
    const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
    const isOwnStore = sellerInfo.sellerId === user.id;

    return (
        <div>
            {/* Store Header */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate({ type: 'profile', payload: { userId: sellerInfo.sellerId }})} className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange">
                        <img src={sellerInfo.avatarUrl} alt={sellerInfo.sellerName} className="w-20 h-20 rounded-full border-4 border-white shadow-md" />
                    </button>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Welcome to the store of</p>
                        <button onClick={() => onNavigate({ type: 'profile', payload: { userId: sellerInfo.sellerId }})} className="focus:outline-none flex items-center gap-2">
                            <h1 className="text-4xl font-bold hover:text-brand-orange transition-colors">{sellerInfo.sellerName}</h1>
                            <VerifiedBadge status={sellerInfo.verificationStatus} size="lg" />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    {!isOwnStore && (
                        <button
                            onClick={() => setShowCustomOrderModal(true)}
                            className="flex items-center gap-2 text-white px-4 py-2 bg-brand-orange hover:bg-orange-600 rounded-lg transition-colors shadow-sm font-semibold text-sm"
                        >
                            <ClipboardListIcon className="w-4 h-4" />
                            Özel Sipariş Talebi
                        </button>
                    )}
                    <button
                        onClick={onNavigateToMarketplace}
                        className="flex items-center gap-2 text-gray-600 hover:text-brand-dark-gray px-4 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeftIcon />
                        Back to Marketplace
                    </button>
                </div>
            </div>

            {/* Items Grid */}
            {sellerItems.length === 0 ? (
                <div className="text-center bg-white p-12 rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700">No Items Found</h2>
                    <p className="text-gray-500 mt-2">This seller doesn't have any items for sale at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sellerItems.map(item => (
                        <MarketplaceCard
                            key={item.id}
                            item={item}
                            user={user}
                            onAddToCart={onAddToCart}
                            onDeleteItem={() => {}}
                            onViewStore={onViewStore}
                        />
                    ))}
                </div>
            )}

            {showCustomOrderModal && (
                <CustomOrderModal
                    buyer={user}
                    seller={{ id: sellerInfo.sellerId, name: sellerInfo.sellerName, avatarUrl: sellerInfo.avatarUrl }}
                    onSubmit={(data) => { onCreateCustomOrder(data); }}
                    onClose={() => setShowCustomOrderModal(false)}
                />
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
}

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ item, user, onAddToCart, onDeleteItem, onViewStore }) => {
    const isOwner = item.sellerId === user.id;

    const SellerInfo = () => (
        <div className="flex items-center gap-2">
            <img src={item.seller.avatarUrl} alt={item.seller.name} className="w-5 h-5 rounded-full" />
            <span className="text-gray-600">{item.seller.name}</span>
            <VerifiedBadge status={item.seller.verificationStatus} size="sm" />
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-200 flex flex-col overflow-hidden group">
            <div className="relative">
                <img src={item.coverImage} alt={item.title} className="w-full h-40 object-cover" />
                {item.type === 'collection' && (
                    <div className="absolute top-2 right-2 bg-brand-orange text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <CollectionIcon />
                        {item.promptCount} Prompts
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
                    <span className="text-lg font-bold text-brand-green">${item.price.toFixed(2)}</span>
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

export default PublicStore;
