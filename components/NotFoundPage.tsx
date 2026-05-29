import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from './icons/Icons';

interface NotFoundPageProps {
  onBack: () => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <h1 className="text-6xl font-bold text-gray-200 mb-6">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('notFound.title')}</h2>
        <p className="text-gray-500 mb-8">{t('notFound.description')}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange text-white font-medium rounded-xl hover:bg-orange-600 transition-colors w-full"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          {t('notFound.backButton')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
