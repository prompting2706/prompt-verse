

import React from 'react';
import { type Campaign, type View } from '../types';
import { RocketLaunchIcon, PlusIcon, EyeIcon, ShoppingCartIcon, DollarSignIcon } from './icons/Icons';

interface CampaignsListProps {
  campaigns: Campaign[];
  onNavigate: (view: View) => void;
}

const CampaignsList: React.FC<CampaignsListProps> = ({ campaigns, onNavigate }) => {

  const handleCreateNew = () => {
    onNavigate({ type: 'createCampaign', payload: null });
  };

  const handleViewDetails = (campaignId: string) => {
    onNavigate({ type: 'campaignDetail', payload: { campaignId } });
  };

  return (
    <div>
        <div className="flex justify-end mb-6">
            <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
                <PlusIcon />
                Create New Campaign
            </button>
        </div>
    
      {campaigns.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-xl shadow-md border border-gray-200">
          <RocketLaunchIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">No Campaigns Yet</h2>
          <p className="text-gray-500 mt-2 mb-6">Create your first campaign to promote your prompts and boost your sales!</p>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 mx-auto bg-brand-orange text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <PlusIcon className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Details</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {campaigns.map(campaign => {
                        const campaignStatus = campaign.status;
                        let statusColor = 'bg-gray-100 text-gray-600';
                        if (campaignStatus === 'active') statusColor = 'bg-green-100 text-green-700';
                        if (campaignStatus === 'completed') statusColor = 'bg-blue-100 text-blue-700';
                        if (campaignStatus === 'paused') statusColor = 'bg-yellow-100 text-yellow-700';

                        return (
                            <tr key={campaign.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-gray-900">{campaign.name}</div>
                                    <div className="text-xs text-gray-500">{campaign.promptIds.length} prompt(s)</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusColor}`}>
                                        {campaign.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">${campaign.budget.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{campaign.totalImpressions.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{campaign.totalSales.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleViewDetails(campaign.id)} className="text-brand-orange hover:text-orange-500">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default CampaignsList;
