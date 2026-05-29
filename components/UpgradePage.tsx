import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, CrownIcon } from './icons/Icons';
import { type User, MembershipType, type View } from '../types';
import { PLAN_LIMITS } from '../constants';

interface UpgradePageProps {
  user: User;
  onUpgrade: (plan: MembershipType) => void;
  onNavigate: (view: View) => void;
  onCancelSubscription: () => void;
}

const PLAN_ORDER = [MembershipType.STARTER, MembershipType.CREATOR, MembershipType.PRO, MembershipType.TEAM];

const PLAN_COLORS: Record<MembershipType, { badge: string; border: string; button: string; ring: string }> = {
  [MembershipType.STARTER]: {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-gray-200',
    button: 'bg-gray-200 text-gray-600',
    ring: '',
  },
  [MembershipType.CREATOR]: {
    badge: 'bg-blue-100 text-blue-600',
    border: 'border-blue-300',
    button: 'bg-blue-500 hover:bg-blue-600 text-white',
    ring: 'ring-4 ring-blue-100',
  },
  [MembershipType.PRO]: {
    badge: 'bg-orange-100 text-brand-orange',
    border: 'border-brand-orange',
    button: 'bg-brand-orange hover:bg-orange-600 text-white',
    ring: 'ring-4 ring-orange-100',
  },
  [MembershipType.TEAM]: {
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700 text-white',
    ring: 'ring-4 ring-purple-100',
  },
};

const PLAN_FEATURE_KEYS: Record<MembershipType, string> = {
  [MembershipType.STARTER]: 'starter',
  [MembershipType.CREATOR]: 'creator',
  [MembershipType.PRO]: 'pro',
  [MembershipType.TEAM]: 'team',
};

const UpgradePage: React.FC<UpgradePageProps> = ({ user, onUpgrade, onNavigate, onCancelSubscription }) => {
  const { t, i18n } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showManageView, setShowManageView] = useState(false);

  const isOnPaidPlan = user.membership !== MembershipType.STARTER;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(i18n.language?.startsWith('tr') ? 'tr-TR' : 'en-US');
  };

  if (isOnPaidPlan && showManageView) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold">{t('upgrade.subscriptionManagement')}</h1>
            <button onClick={() => setShowManageView(false)} className="text-sm font-medium text-gray-600 hover:text-brand-dark-gray">
              {t('upgrade.backButton')}
            </button>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">{t('upgrade.currentPlanLabel')}</span>
              <span className={`font-semibold px-3 py-1 rounded-full text-xs ${PLAN_COLORS[user.membership].badge}`}>
                {PLAN_LIMITS[user.membership].label} Plan
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-gray-500">{t('upgrade.startDate')}</span>
              <span className="font-semibold">{formatDate(user.subscriptionStartDate)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-gray-500">{t('upgrade.renewalDate')}</span>
              <span className="font-semibold">{formatDate(user.subscriptionEndDate)}</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-red-200">
            <h3 className="font-semibold text-md text-red-600">{t('upgrade.cancelSubscription')}</h3>
            <p className="text-sm text-gray-500 mt-2 mb-4">{t('upgrade.cancelWarning')}</p>
            <button onClick={onCancelSubscription} className="w-full py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors shadow-sm">
              {t('upgrade.cancelSubscription')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">{t('upgrade.pageTitle')}</h1>
        <p className="text-lg text-gray-500">{t('upgrade.pageSubtitle')}</p>

        <div className="inline-flex bg-gray-200 rounded-lg p-1 mt-6">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${billingCycle === 'monthly' ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            {t('upgrade.monthly')}
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors relative ${billingCycle === 'yearly' ? 'bg-white shadow' : 'text-gray-600'}`}
          >
            {t('upgrade.yearly')}
            <span className="absolute -top-2 -right-2 bg-brand-green text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{t('upgrade.yearlyDiscount')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLAN_ORDER.map((planType) => {
          const config = PLAN_LIMITS[planType];
          const colors = PLAN_COLORS[planType];
          const featureKey = PLAN_FEATURE_KEYS[planType];
          const features: string[] = t(`upgrade.features.${featureKey}`, { returnObjects: true }) as string[];
          const isCurrent = user.membership === planType;
          const price = billingCycle === 'monthly' ? config.price.monthly : config.price.yearly;
          const currentIdx = PLAN_ORDER.indexOf(user.membership);
          const thisIdx = PLAN_ORDER.indexOf(planType);
          const isUpgrade = thisIdx > currentIdx;
          const isDowngrade = thisIdx < currentIdx;

          return (
            <div
              key={planType}
              className={`bg-white rounded-xl shadow-sm border-2 flex flex-col p-6 transition-all ${colors.border} ${isCurrent ? colors.ring : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold">{config.label}</h2>
                {isCurrent && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${colors.badge}`}>
                    {t('upgrade.currentPlan')}
                  </span>
                )}
                {planType === MembershipType.PRO && !isCurrent && (
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-brand-orange">
                    {t('common.popular')}
                  </span>
                )}
              </div>

              <div className="mt-4 mb-5">
                {price === 0 ? (
                  <p className="text-3xl font-bold">{t('common.free')}</p>
                ) : (
                  <p className="text-3xl font-bold">
                    ${price.toFixed(2)}
                    <span className="text-base font-normal text-gray-400"> {t('upgrade.perMonth')}</span>
                  </p>
                )}
                {billingCycle === 'yearly' && price > 0 && (
                  <p className="text-xs text-brand-green mt-1">{t('upgrade.billedYearly')}</p>
                )}
              </div>

              <ul className="space-y-2.5 mb-6 flex-grow">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="space-y-2">
                  <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg font-semibold text-sm cursor-default">
                    {t('upgrade.currentPlan')}
                  </button>
                  {isOnPaidPlan && (
                    <button onClick={() => setShowManageView(true)} className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50">
                      {t('upgrade.managePlan')}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onUpgrade(planType)}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm ${colors.button}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isUpgrade && <CrownIcon />}
                    {isUpgrade
                      ? t('upgrade.upgradeToLabel', { plan: config.label })
                      : isDowngrade
                        ? t('upgrade.downgradeToLabel', { plan: config.label })
                        : t('upgrade.selectLabel', { plan: config.label })}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-gray-400 mt-8">
        {t('upgrade.footerNote')}
      </p>
    </div>
  );
};

export default UpgradePage;
