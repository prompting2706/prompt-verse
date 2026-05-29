
import React from 'react';
import { type VerificationStatus } from '../types';
import { VerifiedIcon } from './icons/Icons';

interface VerifiedBadgeProps {
  status?: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ status, size = 'md' }) => {
  if (status !== 'verified') return null;
  return (
    <span title="Verified Creator" className="inline-flex text-blue-500 flex-shrink-0">
      <VerifiedIcon className={SIZE_MAP[size]} />
    </span>
  );
};

export default VerifiedBadge;
