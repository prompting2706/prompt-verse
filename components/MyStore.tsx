


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type User, type MarketplaceItem, type View, type Prompt, type Campaign } from '../types';
import { StoreIcon, EyeIcon, DollarSignIcon, ShoppingCartIcon, TrashIcon, PlusIcon, EditIcon, SearchIcon, SortIcon, StarIcon as SolidStarIcon, RocketLaunchIcon, ChartBarIcon, PackageIcon, ArrowUpIcon } from './icons/Icons';
import VerifiedBadge from './VerifiedBadge';
import { PLAN_LIMITS } from '../constants';
import { toast } from '../utils/toast';
import StarRating from './StarRating';
import AddProductModal from './AddProductModal';
import { type MarketplaceItemData } from './AddProductModal';
import CampaignsList from './CampaignsView';
import BoostListingModal from './BoostListingModal';
import CreateBundleModal, { type BundleData } from './CreateBundleModal';

interface MyStoreProps {
    user: User;
    items: MarketplaceItem[];
    prompts: Prompt[];
    campaigns: Campaign[];
    onDeleteItem: (itemId: string) => void;
    onAddItem: (itemData: MarketplaceItemData) => void;
    onUpdateItem: (itemData: MarketplaceItemData) => void;
    onBoostItem: (itemId: string, days: number) => void;
    onAddBundle: (data: BundleData) => void;
    shouldOpenAddModal: boolean;
    onAddModalOpened: () => void;
    onNavigate: (view: View) => void;
    initialTab?: ActiveTab;
}

type ActiveTab = 'products' | 'analytics' | 'campaigns';

const MyStore: React.FC<MyStoreProps> = ({ user, items, prompts, campaigns, onDeleteItem, onAddItem, onUpdateItem, onBoostItem, onAddBundle, shouldOpenAddModal, onAddModalOpened, onNavigate, initialTab }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab || 'products');
    const [modalState, setModalState] = useState<{isOpen: boolean, itemToEdit?: MarketplaceItem}>({ isOpen: false });
    const [boostModalItem, setBoostModalItem] = useState<MarketplaceItem | null>(null);
    const [showBundleModal, setShowBundleModal] = useState(false);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const canSell = PLAN_LIMITS[user.membership].canSell;

    const handleOpenAddModal = () => {
        if (!canSell) {
            toast.warning('Satış yapabilmek için Pro veya Team planına geçmeniz gerekmektedir.');
            return;
        }
        setModalState({ isOpen: true, itemToEdit: undefined });
    };

    const handleOpenEditModal = (item: MarketplaceItem) => {
        setModalState({ isOpen: true, itemToEdit: item });
    };

    useEffect(() => {
        if (shouldOpenAddModal) {
            handleOpenAddModal();
            onAddModalOpened();
        }
    }, [shouldOpenAddModal, onAddModalOpened]);

    const handleSaveItem = (itemData: MarketplaceItemData) => {
        if (itemData.id) {
            onUpdateItem(itemData);
        } else {
            onAddItem(itemData);
        }
        setModalState({ isOpen: false });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">My Store</h1>
                    <VerifiedBadge status={user.verificationStatus} size="lg" />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBundleModal(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <PackageIcon className="w-4 h-4" />
                        Paket Oluştur
                    </button>
                    <div className="relative group">
                        <button
                            onClick={handleOpenAddModal}
                            disabled={!canSell}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm ${
                                canSell
                                    ? 'bg-brand-green text-white hover:bg-green-600'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Product
                            {!canSell && <span className="text-xs bg-orange-100 text-brand-orange font-semibold px-1.5 py-0.5 rounded-full ml-1">Pro</span>}
                        </button>
                        {!canSell && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 hidden group-hover:block z-10 shadow-lg">
                                Pro veya Team planına geçerek ürün satabilirsiniz.{' '}
                                <button
                                    onClick={() => onNavigate({ type: 'upgrade', payload: null })}
                                    className="underline text-orange-300 hover:text-orange-200"
                                >
                                    Planı yükselt
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
             <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <TabButton
                        icon={<StoreIcon />}
                        label="My Products"
                        isActive={activeTab === 'products'}
                        onClick={() => onNavigate({ type: 'myStore', payload: { activeTab: 'products' }})}
                    />
                    <TabButton
                        icon={<RocketLaunchIcon />}
                        label="Campaigns"
                        isActive={activeTab === 'campaigns'}
                        onClick={() => onNavigate({ type: 'myStore', payload: { activeTab: 'campaigns' }})}
                    />
                    <TabButton
                        icon={<ChartBarIcon />}
                        label="Analytics"
                        isActive={activeTab === 'analytics'}
                        onClick={() => onNavigate({ type: 'myStore', payload: { activeTab: 'analytics' }})}
                    />
                </nav>
            </div>

            {items.length === 0 && activeTab === 'products' ? (
                 <div className="text-center bg-white p-12 rounded-xl shadow-md border border-gray-200">
                    <StoreIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">Your Store is Empty</h2>
                    <p className="text-gray-500 mt-2 mb-6">You haven't listed any items for sale yet. Start selling to see your products here!</p>
                    {canSell ? (
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 mx-auto bg-brand-green text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Your First Product
                        </button>
                    ) : (
                        <button
                            onClick={() => onNavigate({ type: 'upgrade', payload: null })}
                            className="flex items-center gap-2 mx-auto bg-brand-orange text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            <ArrowUpIcon className="w-5 h-5" />
                            Pro'ya Geç — Satış Başlat
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    {activeTab === 'products' && <MyProductsView items={items} user={user} onDeleteItem={onDeleteItem} onEditItem={handleOpenEditModal} onBoostItem={setBoostModalItem} />}
                    {activeTab === 'analytics' && <AnalyticsView items={items} campaigns={campaigns} user={user} />}
                    {activeTab === 'campaigns' && <CampaignsList campaigns={campaigns} onNavigate={onNavigate} />}
                </div>
            )}
             <AddProductModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false })}
                onSave={handleSaveItem}
                itemToEdit={modalState.itemToEdit}
                userPrompts={prompts}
                userId={user.id}
            />
            <BoostListingModal
                isOpen={boostModalItem !== null}
                item={boostModalItem}
                onClose={() => setBoostModalItem(null)}
                onBoost={(itemId, days) => { onBoostItem(itemId, days); setBoostModalItem(null); }}
            />
            <CreateBundleModal
                isOpen={showBundleModal}
                onClose={() => setShowBundleModal(false)}
                onSave={(data) => { onAddBundle(data); setShowBundleModal(false); }}
                userPrompts={prompts}
            />
        </div>
    );
};

const TabButton: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({ icon, label, isActive, onClick}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
            isActive
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {icon}
        {label}
    </button>
);


type SortKey = 'sales' | 'views' | 'revenue' | 'rating' | 'price-desc' | 'price-asc';

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'sales', label: 'Highest Sales' },
  { key: 'views', label: 'Most Views' },
  { key: 'revenue', label: 'Highest Revenue' },
  { key: 'rating', label: 'Highest Rating' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'price-asc', label: 'Price: Low to High' },
];

const MyProductsView: React.FC<{ items: MarketplaceItem[], user: User, onDeleteItem: (itemId: string) => void, onEditItem: (item: MarketplaceItem) => void, onBoostItem: (item: MarketplaceItem) => void }> = ({ items, user, onDeleteItem, onEditItem, onBoostItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('sales');
    const [showSort, setShowSort] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setShowSort(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const processedItems = useMemo(() => {
        const filtered = items.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return [...filtered].sort((a, b) => {
            switch (sortKey) {
                case 'sales': return b.salesCount - a.salesCount;
                case 'views': return b.views - a.views;
                case 'revenue': return (b.price * b.salesCount) - (a.price * a.salesCount);
                case 'rating': return b.rating - a.rating;
                case 'price-desc': return b.price - a.price;
                case 'price-asc': return a.price - b.price;
                default: return 0;
            }
        });
    }, [items, searchTerm, sortKey]);

    return (
        <div>
            <div className="mb-6 flex gap-4">
                <div className="relative flex-grow">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Search your products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange"
                    />
                </div>
                 <div className="relative" ref={sortRef}>
                    <button
                        onClick={() => setShowSort(!showSort)}
                        className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 h-full"
                    >
                        <SortIcon />
                        Sort
                    </button>
                    {showSort && (
                        <div className="absolute z-10 top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                            {sortOptions.map(option => (
                                <button
                                    key={option.key}
                                    onClick={() => { setSortKey(option.key); setShowSort(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm ${sortKey === option.key ? 'bg-orange-100 text-brand-orange' : 'text-gray-700 hover:bg-gray-100'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {processedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {processedItems.map(item => (
                        <div key={item.id} className={`bg-white rounded-xl shadow-sm flex flex-col overflow-hidden group ${item.sponsored && new Date(item.sponsored.endDate) > new Date() ? 'border-2 border-amber-300' : 'border border-gray-200'}`}>
                            <div className="relative">
                                <img src={item.coverImage} alt={item.title} className="w-full h-40 object-cover" />
                                {item.sponsored && new Date(item.sponsored.endDate) > new Date() && (
                                    <span className="absolute top-2 left-2 flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                                        <RocketLaunchIcon className="w-3 h-3" />
                                        Sponsorlu
                                    </span>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="font-bold text-md mb-1">{item.title}</h3>
                                <p className="font-bold text-lg text-brand-green mb-3">${item.price.toFixed(2)}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2" title="Views"><EyeIcon className="w-4 h-4 text-gray-400" /> {item.views.toLocaleString()}</div>
                                    <div className="flex items-center gap-2" title="Sales"><ShoppingCartIcon className="w-4 h-4 text-gray-400" /> {item.salesCount.toLocaleString()}</div>
                                                    <div className="flex items-center gap-2" title={`Net Kazanç (${PLAN_LIMITS[user.membership].commissionRate * 100}% komisyon sonrası)`}>
                                        <DollarSignIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-brand-green font-semibold">${(item.salesCount * item.price * (1 - PLAN_LIMITS[user.membership].commissionRate)).toFixed(2)}</span>
                                        <span className="text-gray-400 text-xs">net</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Rating"><SolidStarIcon className="w-4 h-4 text-yellow-400" /> {item.rating.toFixed(1)} ({item.reviewCount})</div>
                                </div>
                                <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-gray-100 flex-wrap">
                                    <button onClick={() => onBoostItem(item)} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-amber-100 transition-colors">
                                        <RocketLaunchIcon className="w-3 h-3" />
                                        Öne Çıkar
                                    </button>
                                    <button onClick={() => onEditItem(item)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-gray-200 transition-colors">
                                        <EditIcon className="w-3 h-3" />
                                        Edit
                                    </button>
                                    <button onClick={() => onDeleteItem(item.id)} className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold text-xs hover:bg-red-200 transition-colors">
                                        <TrashIcon className="w-3 h-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700">No Matching Products Found</h2>
                    <p className="text-gray-500 mt-2">Try adjusting your search term to find what you're looking for.</p>
                </div>
            )}
        </div>
    );
};

const AnalyticsView: React.FC<{ items: MarketplaceItem[], campaigns: Campaign[], user: User }> = ({ items, campaigns, user }) => {
    const commissionRate = PLAN_LIMITS[user.membership].commissionRate;
    const grossRevenue = items.reduce((acc, item) => acc + (item.price * item.salesCount), 0);
    const totalCommission = grossRevenue * commissionRate;
    const netEarnings = grossRevenue - totalCommission;
    const totalRevenue = grossRevenue;
    const totalSales = items.reduce((acc, item) => acc + item.salesCount, 0);
    const topSeller = items.length > 0 ? [...items].sort((a,b) => (b.price * b.salesCount) - (a.price * a.salesCount))[0] : null;

    // Mock data for repeat purchase rate
    const repeatPurchaseRate = 34.5;

    // Campaign metrics
    const totalCampaignImpressions = campaigns.reduce((acc, c) => acc + c.totalImpressions, 0);
    const totalCampaignClicks = Math.floor(totalCampaignImpressions * 0.12); // Mock 12% CTR
    const totalCampaignConversions = campaigns.reduce((acc, c) => acc + c.totalSales, 0);
    const avgConversionRate = totalCampaignClicks > 0 ? ((totalCampaignConversions / totalCampaignClicks) * 100).toFixed(1) : '0.0';
    
    // Mock data for cohort analysis
    const cohortData = [
        { month: 'Jan', m1: '100%', m2: '45%', m3: '35%', m4: '20%' },
        { month: 'Feb', m1: '100%', m2: '42%', m3: '30%', m4: '15%' },
        { month: 'Mar', m1: '100%', m2: '48%', m3: '38%', m4: '-' },
        { month: 'Apr', m1: '100%', m2: '52%', m3: '-', m4: '-' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Store Performance</h2>
                <input type="date" className="border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange text-sm"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Gross Revenue" value={`$${grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSignIcon className="text-blue-500"/>} />
                <KpiCard title={`Komisyon (%${commissionRate * 100})`} value={`-$${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSignIcon className="text-red-400"/>} />
                <KpiCard title="Net Earnings" value={`$${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSignIcon className="text-green-500"/>} />
                <KpiCard title="Total Sales" value={totalSales.toLocaleString()} icon={<ShoppingCartIcon className="text-orange-500"/>} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <KpiCard title="Repeat Purchase Rate" value={`${repeatPurchaseRate}%`} icon={<ChartBarIcon className="text-purple-500"/>} />
                <KpiCard title="Avg. Net Per Sale" value={`$${(netEarnings / (totalSales || 1)).toFixed(2)}`} icon={<DollarSignIcon className="text-gray-500"/>} />
            </div>

            <div className="mt-8 mb-4 border-t pt-8">
                <h2 className="text-xl font-bold mb-6">Campaign Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KpiCard title="Total Impressions" value={totalCampaignImpressions.toLocaleString()} icon={<EyeIcon className="text-blue-500"/>} />
                    <KpiCard title="Total Clicks" value={totalCampaignClicks.toLocaleString()} icon={<RocketLaunchIcon className="text-orange-500"/>} />
                    <KpiCard title="Conversion Rate (Sales/Clicks)" value={`${avgConversionRate}%`} icon={<ChartBarIcon className="text-brand-green"/>} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                 <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="font-bold mb-4">Top Performing Items</h3>
                     <ul className="space-y-2">
                        {[...items].sort((a,b) => b.salesCount - a.salesCount).slice(0,5).map(item => (
                             <li key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                <span>{item.title}</span>
                                <span className="font-semibold">{item.salesCount} sales</span>
                            </li>
                        ))}
                    </ul>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="font-bold mb-1">Highest Net Earnings</h3>
                    <p className="text-xs text-gray-400 mb-4">%{commissionRate * 100} komisyon sonrası</p>
                     <ul className="space-y-2">
                        {[...items].sort((a,b) => (b.price * b.salesCount) - (a.price * a.salesCount)).slice(0,5).map(item => {
                            const gross = item.price * item.salesCount;
                            const net = gross * (1 - commissionRate);
                            return (
                                <li key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                    <span>{item.title}</span>
                                    <div className="text-right">
                                        <span className="font-semibold text-brand-green block">${net.toFixed(2)}</span>
                                        <span className="text-xs text-gray-400">${gross.toFixed(2)} gross</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                 </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mt-6 lg:mt-0">
                <h3 className="font-bold mb-4">Cohort Analysis (Retention Rate)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-2 px-4 font-semibold text-gray-600">Cohort</th>
                                <th className="text-left py-2 px-4 font-semibold text-gray-600">Month 1</th>
                                <th className="text-left py-2 px-4 font-semibold text-gray-600">Month 2</th>
                                <th className="text-left py-2 px-4 font-semibold text-gray-600">Month 3</th>
                                <th className="text-left py-2 px-4 font-semibold text-gray-600">Month 4</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cohortData.map((row, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 font-medium">{row.month}</td>
                                    <td className="py-3 px-4 text-blue-600 font-semibold">{row.m1}</td>
                                    <td className="py-3 px-4">{row.m2}</td>
                                    <td className="py-3 px-4">{row.m3}</td>
                                    <td className="py-3 px-4">{row.m4}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const KpiCard: React.FC<{title: string, value: string, icon: React.ReactNode}> = ({title, value, icon}) => (
     <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
                {icon}
            </div>
        </div>
    </div>
);


export default MyStore;