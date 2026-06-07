import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type User, type ReferralRecord, MembershipType } from '../types';
import { toast } from '../utils/toast';
import { PLAN_LIMITS } from '../constants';
import { CopyIcon, CheckIcon, GiftIcon, ShareLinkIcon, UsersIcon, DollarSignIcon, ChartBarIcon, CrownIcon } from './icons/Icons';

interface ReferralPageProps {
  user: User;
  referrals: ReferralRecord[];
}

const REWARD_PER_PLAN: Record<MembershipType, number> = {
  [MembershipType.STARTER]: 0,
  [MembershipType.CREATOR]: 5,
  [MembershipType.PRO]: 8,
  [MembershipType.TEAM]: 12,
};

const ReferralPage: React.FC<ReferralPageProps> = ({ user, referrals }) => {
  const { t, i18n } = useTranslation();
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const referralCode = user.referralCode ?? `REF${user.id.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6)}`;
  const referralLink = `https://promptverse.app/join?ref=${referralCode}`;
  const rewardAmount = REWARD_PER_PLAN[user.membership];
  const planLabel = PLAN_LIMITS[user.membership].label;

  const converted = referrals.filter(r => r.status === 'converted');
  const pending = referrals.filter(r => r.status === 'pending');
  const totalEarned = converted.reduce((sum, r) => sum + r.earnedAmount, 0);
  const conversionRate = referrals.length > 0
    ? Math.round((converted.length / referrals.length) * 100)
    : 0;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }).catch(() => toast.error(t('toast.copyFailed')));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => toast.error(t('toast.copyFailed')));
  };

  const locale = i18n.language?.startsWith('tr') ? 'tr-TR' : 'en-US';

  const HOW_IT_WORKS = [
    { step: '1', emoji: '🔗', title: t('referral.step1Title'), desc: t('referral.step1Desc') },
    { step: '2', emoji: '👤', title: t('referral.step2Title'), desc: t('referral.step2Desc') },
    { step: '3', emoji: '💰', title: t('referral.step3Title'), desc: t('referral.step3Desc') },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 p-8 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 -left-6 w-36 h-36 bg-white/10 rounded-full" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <GiftIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{t('referral.pageTitle')}</h1>
          </div>
          <p className="text-orange-100 mb-6 max-w-md">
            Arkadaşlarını PromptVerse'e davet et.{' '}
            Her başarılı davet için <strong className="text-white">${rewardAmount} kredi</strong> kazan.{' '}
            Arkadaşın da ilk alışverişinde <strong className="text-white">%10 indirim</strong> kazanır.
          </p>

          {/* Referral code */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 flex-1">
              <span className="text-xs font-semibold text-orange-100 uppercase tracking-wider flex-shrink-0">{t('referral.codeLabel')}</span>
              <span className="font-mono text-xl font-bold tracking-widest">{referralCode}</span>
              <button
                onClick={copyCode}
                className="ml-auto p-1.5 bg-white/30 hover:bg-white/40 rounded-lg transition-colors flex-shrink-0"
                title={t('referral.copyCode')}
              >
                {codeCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={copyLink}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                linkCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-orange-600 hover:bg-orange-50'
              }`}
            >
              {linkCopied ? (
                <><CheckIcon className="w-4 h-4" /> {t('referral.copied')}</>
              ) : (
                <><ShareLinkIcon className="w-4 h-4" /> {t('referral.copyLink')}</>
              )}
            </button>
          </div>

          {/* Plan reward note */}
          <p className="mt-4 text-xs text-orange-200 flex items-center gap-1.5">
            <CrownIcon className="w-3.5 h-3.5" />
            <span>{planLabel} planınla davet başına <strong>${rewardAmount}</strong> kazanıyorsun.</span>
            {user.membership !== MembershipType.TEAM && (
              <span> {t('referral.planUpgradeHint', { reward: REWARD_PER_PLAN[MembershipType.TEAM] })}</span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<UsersIcon className="text-blue-500" />}
          label={t('referral.statsTotalInvites')}
          value={referrals.length}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<CheckIcon className="text-green-500" />}
          label={t('referral.statsConverted')}
          value={converted.length}
          bg="bg-green-50"
          sub={`${pending.length} ${t('referral.statsPending')}`}
        />
        <StatCard
          icon={<ChartBarIcon className="text-purple-500" />}
          label={t('referral.statsConversionRate')}
          value={locale === 'tr-TR' ? `%${conversionRate}` : `${conversionRate}%`}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<DollarSignIcon className="text-amber-500" />}
          label={t('referral.statsTotalEarned')}
          value={`$${totalEarned}`}
          bg="bg-amber-50"
          highlight
        />
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-5">{t('referral.howItWorksTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">
                  {step.emoji}
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-orange text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {step.step}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-gray-800 mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan rewards comparison */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">{t('referral.rewardsTitle')}</h2>
        <div className="space-y-2">
          {(Object.entries(REWARD_PER_PLAN) as [MembershipType, number][]).map(([plan, reward]) => {
            const config = PLAN_LIMITS[plan];
            const isCurrent = plan === user.membership;
            return (
              <div
                key={plan}
                className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-orange-50 border-2 border-brand-orange'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    plan === MembershipType.TEAM ? 'bg-purple-100 text-purple-700' :
                    plan === MembershipType.PRO ? 'bg-orange-100 text-orange-700' :
                    plan === MembershipType.CREATOR ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {config.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-brand-orange font-semibold">{t('referral.currentPlanLabel')}</span>
                  )}
                </div>
                <span className="font-bold text-gray-800">{t('referral.rewardPerInvite', { amount: reward })}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral history */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">{t('referral.historyTitle')}</h2>
          <span className="text-xs text-gray-400">{t('referral.historyCount', { count: referrals.length })}</span>
        </div>

        {referrals.length === 0 ? (
          <div className="text-center py-10">
            <GiftIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{t('referral.historyEmpty')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('referral.historyEmptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <img
                  src={r.referredUserAvatar}
                  alt={r.referredUserName}
                  className="w-9 h-9 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.referredUserName}</p>
                  <p className="text-xs text-gray-400">
                    {t('referral.historyJoinedAt', {
                      date: new Date(r.joinedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {r.status === 'converted' ? (
                    <>
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        {t('referral.statusConverted')}
                      </span>
                      <span className="text-sm font-bold text-green-600">{t('referral.earnedAmount', { amount: r.earnedAmount })}</span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
                      {t('referral.statusPending')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
  sub?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, bg, sub, highlight }) => (
  <div className={`${bg} rounded-xl p-4 border ${highlight ? 'border-amber-200' : 'border-transparent'}`}>
    <div className="flex items-start justify-between mb-2">
      <div className="p-1.5 bg-white rounded-lg shadow-sm">{icon}</div>
    </div>
    <p className={`text-2xl font-bold ${highlight ? 'text-amber-600' : 'text-gray-800'}`}>{value}</p>
    <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default ReferralPage;
