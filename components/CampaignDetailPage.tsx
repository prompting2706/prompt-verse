


import React from 'react';
import { type Campaign, type Prompt, type View } from '../types';
import { ArrowLeftIcon, CalendarIcon, DollarSignIcon, EditIcon, EyeIcon, ShoppingCartIcon, TrashIcon, VideoIcon } from './icons/Icons';

interface CampaignDetailPageProps {
  campaign: Campaign;
  allPrompts: Prompt[];
  onNavigate: (view: View) => void;
  onDelete: (campaignId: string) => void;
}

const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaign, allPrompts, onNavigate, onDelete }) => {
  const getPromptTitle = (promptId: string) => {
    return allPrompts.find(p => p.id === promptId)?.title || 'Unknown Prompt';
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Ongoing';
    return new Date(isoString).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => onNavigate({ type: 'myStore', payload: { activeTab: 'campaigns' } })} className="flex items-center gap-2 text-gray-600 hover:text-brand-dark-gray">
          <ArrowLeftIcon />
          Back to Campaigns
        </button>
        <div className="flex gap-2">
            <button onClick={() => onNavigate({ type: 'createCampaign', payload: { campaignId: campaign.id }})} className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors border bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                <EditIcon />
                Edit
            </button>
            <button onClick={() => onDelete(campaign.id)} className="flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors border bg-red-50 border-red-200 text-red-600 hover:bg-red-100">
                <TrashIcon />
                Delete
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                 <h2 className="text-xl font-bold mb-1">{campaign.name}</h2>
                 <p className="text-sm text-gray-500 mb-4">Campaign Details</p>
                 <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{formatDateTime(campaign.startDate)} - {formatDateTime(campaign.endDate)}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <DollarSignIcon className="w-5 h-5 text-gray-400" />
                        <span>${campaign.budget.toFixed(2)} Budget</span>
                    </div>
                     <div className={`flex items-center gap-3 font-medium px-2 py-1 rounded-full text-xs inline-flex ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' : campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                     }`}>
                        <div className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-green-500' : campaign.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                        <span className="capitalize">{campaign.status}</span>
                    </div>
                 </div>
                 <p className="text-sm text-gray-600 mt-4 pt-4 border-t italic">"{campaign.description}"</p>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                 <h3 className="font-bold mb-3">Ad Creative</h3>
                 <div className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {campaign.creativeType === 'image' ? 
                        <img src={campaign.creativeUrl} alt="Ad Creative" className="w-full h-full object-cover" /> :
                        <video src={campaign.creativeUrl} controls className="w-full h-full object-cover" />
                    }
                 </div>
             </div>
        </div>

        {/* Right Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Budget" value={`$${campaign.budget.toFixed(2)}`} icon={<DollarSignIcon className="text-orange-500" />} />
                <StatCard title="Total Impressions" value={(campaign.totalImpressions ?? 0).toLocaleString()} icon={<EyeIcon className="text-blue-500" />} />
                <StatCard title="Total Sales" value={(campaign.totalSales ?? 0).toLocaleString()} icon={<ShoppingCartIcon className="text-green-500" />} />
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
                 <h3 className="font-bold p-4 border-b">Per-Prompt Performance</h3>
                 <div className="divide-y divide-gray-200">
                     {(campaign.promptStats ?? []).map(stat => (
                        <div key={stat.promptId} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <p className="font-semibold text-sm">{getPromptTitle(stat.promptId)}</p>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <EyeIcon className="w-4 h-4 text-gray-400" />
                                    <span>{stat.impressions.toLocaleString()}</span>
                                </div>
                                 <div className="flex items-center gap-2 text-gray-600">
                                    <ShoppingCartIcon className="w-4 h-4 text-gray-400" />
                                    <span>{stat.sales.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{title: string, value: string, icon: React.ReactNode}> = ({title, value, icon}) => (
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

export default CampaignDetailPage;