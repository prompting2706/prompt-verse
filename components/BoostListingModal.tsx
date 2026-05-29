import React, { useState } from 'react';
import { type MarketplaceItem } from '../types';
import { SPONSORED_LISTING_OPTIONS, type SponsoredListingOption } from '../constants';
import { RocketLaunchIcon, CheckIcon } from './icons/Icons';

interface BoostListingModalProps {
  isOpen: boolean;
  item: MarketplaceItem | null;
  onClose: () => void;
  onBoost: (itemId: string, days: number) => void;
}

const BoostListingModal: React.FC<BoostListingModalProps> = ({ isOpen, item, onClose, onBoost }) => {
  const [selectedOption, setSelectedOption] = useState<SponsoredListingOption>(SPONSORED_LISTING_OPTIONS[1]);

  if (!isOpen || !item) return null;

  const isAlreadySponsored = item.sponsored && new Date(item.sponsored.endDate) > new Date();
  const remainingDays = isAlreadySponsored
    ? Math.ceil((new Date(item.sponsored!.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleBoost = () => {
    onBoost(item.id, selectedOption.days);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RocketLaunchIcon className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Listelemeyi Öne Çıkar</h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{item.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light leading-none">✕</button>
          </div>
        </div>

        {/* Active sponsorship warning */}
        {isAlreadySponsored && (
          <div className="mx-6 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            Bu ürün zaten öne çıkarılmış. <strong>{remainingDays} gün</strong> kaldı. Yeni süre seçersen mevcut süreye eklenir.
          </div>
        )}

        {/* What you get */}
        <div className="px-6 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Öne çıkarma kapsamı</p>
          <ul className="space-y-2 mb-5">
            {[
              'Marketplace\'in en üstünde "Sponsorlu" bölümünde gösterim',
              'Altın rozet ile dikkat çekici kart tasarımı',
              'Arama sonuçlarında önce gösterim',
              'Seçilen süre boyunca aktif',
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckIcon className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Duration options */}
        <div className="px-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Süre seç</p>
          <div className="space-y-2">
            {SPONSORED_LISTING_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                  selectedOption.id === option.id
                    ? 'border-brand-orange bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedOption.id === option.id ? 'border-brand-orange' : 'border-gray-300'
                  }`}>
                    {selectedOption.id === option.id && (
                      <div className="w-2 h-2 rounded-full bg-brand-orange" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{option.label}</span>
                      {option.popular && (
                        <span className="text-xs bg-green-100 text-brand-green px-2 py-0.5 rounded-full font-semibold">
                          Popüler
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{option.description}</p>
                  </div>
                </div>
                <span className="font-bold text-brand-green text-sm">${option.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 mt-4">
          <button
            onClick={handleBoost}
            className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <RocketLaunchIcon className="w-4 h-4" />
            {selectedOption.label} için ${selectedOption.price} öde ve öne çıkar
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Bu bir demo — gerçek ödeme alınmaz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoostListingModal;
