
import React, { useEffect, useRef } from 'react';
import { type Campaign, type View } from '../types';
import { RocketLaunchIcon } from './icons/Icons';

interface AdBannerProps {
  campaign: Campaign;
  onNavigate: (view: View) => void;
  onImpression: (campaignId: string, promptId: string) => void;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ campaign, onNavigate, onImpression, className = '' }) => {
  const impressionFired = useRef(false);

  useEffect(() => {
    if (!impressionFired.current && campaign.promptIds.length > 0) {
      impressionFired.current = true;
      onImpression(campaign.id, campaign.promptIds[0]);
    }
  }, []);

  const handleCtaClick = () => {
    if (campaign.promptIds.length > 0) {
      window.location.hash = `#prompt/${campaign.promptIds[0]}`;
    }
  };

  return (
    <div className={`relative w-full h-48 bg-gray-800 rounded-xl overflow-hidden shadow-lg group ${className}`}>
      {campaign.creativeType === 'image' ? (
        <img src={campaign.creativeUrl} alt={campaign.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity" />
      ) : (
        <video src={campaign.creativeUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-opacity" autoPlay loop muted playsInline />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent p-8 flex flex-col justify-center">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <RocketLaunchIcon className="w-5 h-5 text-brand-orange" />
                <span className="text-sm font-bold text-brand-orange uppercase tracking-wider">Featured Campaign</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 max-w-md">{campaign.name}</h3>
            <button
                onClick={handleCtaClick}
                className="bg-white text-brand-dark-gray px-5 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors shadow-md text-sm"
            >
                Check it out
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
