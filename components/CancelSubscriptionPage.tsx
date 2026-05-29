
import React from 'react';
import { useTranslation } from 'react-i18next';

interface CancelSubscriptionPageProps {
  onConfirm: () => void;
  onKeepPlan: () => void;
}

const CancelSubscriptionPage: React.FC<CancelSubscriptionPageProps> = ({ onConfirm, onKeepPlan }) => {
  const { t } = useTranslation();
  const features: string[] = t('cancelSubscription.features', { returnObjects: true }) as string[];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">{t('cancelSubscription.title')}</h1>
        <p className="text-gray-600 mb-6">{t('cancelSubscription.description')}</p>

        <ul className="space-y-3 text-left inline-block mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
                    <span className="text-red-500 font-bold text-sm">×</span>
                </div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
        </ul>

        <p className="text-gray-600 mb-8">{t('cancelSubscription.dataNote')}</p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
                onClick={onKeepPlan}
                className="order-2 sm:order-1 px-6 py-3 bg-brand-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
            >
                {t('cancelSubscription.keepPlan')}
            </button>
            <button
                onClick={onConfirm}
                className="order-1 sm:order-2 px-6 py-3 bg-white border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-sm"
            >
                {t('cancelSubscription.confirm')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscriptionPage;
