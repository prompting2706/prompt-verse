import React from 'react';

const base = 'animate-pulse bg-gray-200 rounded';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${base} h-4 ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
    <div className={`${base} h-32 w-full rounded-lg`} />
    <SkeletonLine className="w-3/4" />
    <SkeletonLine className="w-1/2" />
    <div className="flex gap-2 pt-1">
      <div className={`${base} h-6 w-16 rounded-full`} />
      <div className={`${base} h-6 w-16 rounded-full`} />
    </div>
  </div>
);

export const SkeletonPromptCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-2">
        <SkeletonLine className="w-2/3" />
        <SkeletonLine className="w-full" />
        <SkeletonLine className="w-4/5" />
      </div>
      <div className={`${base} h-8 w-8 rounded-lg ml-3 flex-shrink-0`} />
    </div>
    <div className="flex gap-2">
      <div className={`${base} h-5 w-14 rounded-full`} />
      <div className={`${base} h-5 w-20 rounded-full`} />
    </div>
    <div className="flex items-center justify-between pt-1">
      <div className={`${base} h-4 w-24`} />
      <div className={`${base} h-7 w-16 rounded-lg`} />
    </div>
  </div>
);

export const SkeletonMarketplaceCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className={`${base} h-40 w-full rounded-none`} />
    <div className="p-4 space-y-2">
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-1/2" />
      <div className="flex items-center justify-between pt-2">
        <div className={`${base} h-5 w-12 rounded`} />
        <div className={`${base} h-8 w-20 rounded-lg`} />
      </div>
    </div>
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonLine className="w-48" />
        <SkeletonLine className="w-32" />
      </div>
      <div className={`${base} h-9 w-32 rounded-lg`} />
    </div>
    {/* Cards grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonPromptCard key={i} />
      ))}
    </div>
  </div>
);

export const SkeletonMarketplace: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className={`${base} h-10 flex-1 rounded-xl`} />
      <div className={`${base} h-10 w-24 rounded-xl`} />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonMarketplaceCard key={i} />
      ))}
    </div>
  </div>
);
