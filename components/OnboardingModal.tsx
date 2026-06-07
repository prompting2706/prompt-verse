import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, SparklesIcon, RocketLaunchIcon, StoreIcon, ChartBarIcon, PlusIcon, ZapIcon, CrownIcon } from './icons/Icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onNavigate: (target: 'dashboard' | 'marketplace') => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete, onNavigate }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const STEPS = [
    {
      id: 1,
      gradient: 'from-orange-400 via-amber-400 to-yellow-300',
      decorColor: 'bg-white/20',
      emoji: '🚀',
      title: t('onboarding.step1Title'),
      description: t('onboarding.step1Desc'),
      features: [
        { icon: <SparklesIcon className="w-4 h-4 text-amber-600" />, label: t('onboarding.step1Feature1Label'), sub: t('onboarding.step1Feature1Sub') },
        { icon: <ZapIcon className="w-4 h-4 text-amber-600" />, label: t('onboarding.step1Feature2Label'), sub: t('onboarding.step1Feature2Sub') },
        { icon: <ChartBarIcon className="w-4 h-4 text-amber-600" />, label: t('onboarding.step1Feature3Label'), sub: t('onboarding.step1Feature3Sub') },
      ],
    },
    {
      id: 2,
      gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      decorColor: 'bg-white/20',
      emoji: '✍️',
      title: t('onboarding.step2Title'),
      description: t('onboarding.step2Desc'),
      features: [
        { icon: <PlusIcon className="w-4 h-4 text-blue-600" />, label: t('onboarding.step2Feature1Label'), sub: t('onboarding.step2Feature1Sub') },
        { icon: <CheckIcon className="w-4 h-4 text-blue-600" />, label: t('onboarding.step2Feature2Label'), sub: t('onboarding.step2Feature2Sub') },
        { icon: <SparklesIcon className="w-4 h-4 text-blue-600" />, label: t('onboarding.step2Feature3Label'), sub: t('onboarding.step2Feature3Sub') },
      ],
    },
    {
      id: 3,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      decorColor: 'bg-white/20',
      emoji: '🏪',
      title: t('onboarding.step3Title'),
      description: t('onboarding.step3Desc'),
      features: [
        { icon: <StoreIcon className="w-4 h-4 text-emerald-700" />, label: t('onboarding.step3Feature1Label'), sub: t('onboarding.step3Feature1Sub') },
        { icon: <RocketLaunchIcon className="w-4 h-4 text-emerald-700" />, label: t('onboarding.step3Feature2Label'), sub: t('onboarding.step3Feature2Sub') },
        { icon: <ChartBarIcon className="w-4 h-4 text-emerald-700" />, label: t('onboarding.step3Feature3Label'), sub: t('onboarding.step3Feature3Sub') },
      ],
    },
    {
      id: 4,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      decorColor: 'bg-white/20',
      emoji: '🎉',
      title: t('onboarding.step4Title'),
      description: t('onboarding.step4Desc'),
      features: [
        { icon: <CrownIcon className="w-4 h-4 text-purple-600" />, label: t('onboarding.step4Feature1Label'), sub: t('onboarding.step4Feature1Sub') },
        { icon: <SparklesIcon className="w-4 h-4 text-purple-600" />, label: t('onboarding.step4Feature2Label'), sub: t('onboarding.step4Feature2Sub') },
        { icon: <StoreIcon className="w-4 h-4 text-purple-600" />, label: t('onboarding.step4Feature3Label'), sub: t('onboarding.step4Feature3Sub') },
      ],
    },
  ];

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const goTo = useCallback((index: number, dir: 'forward' | 'back') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setAnimating(false);
    }, 220);
  }, [animating]);

  // BUG: memoize with useCallback so keyboard handler always has fresh references
  const handleNext = useCallback(() => {
    if (isLast) return;
    goTo(currentStep + 1, 'forward');
  }, [isLast, currentStep, goTo]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) return;
    goTo(currentStep - 1, 'back');
  }, [currentStep, goTo]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onComplete, handleNext, handleBack]);

  if (!isOpen) return null;

  const slideClass = animating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4 pointer-events-none'
      : 'opacity-0 -translate-x-4 pointer-events-none'
    : 'opacity-100 translate-x-0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Visual Header */}
        <div className={`relative bg-gradient-to-br ${step.gradient} h-48 flex items-center justify-center overflow-hidden`}>
          <div className={`absolute -top-8 -right-8 w-40 h-40 rounded-full ${step.decorColor}`} />
          <div className={`absolute -bottom-12 -left-10 w-52 h-52 rounded-full ${step.decorColor}`} />
          <div className={`absolute top-4 left-12 w-12 h-12 rounded-full ${step.decorColor}`} />

          <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {currentStep + 1} / {STEPS.length}
          </div>

          <span
            className={`relative text-7xl transition-all duration-300 ease-out select-none ${slideClass}`}
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }}
          >
            {step.emoji}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`transition-all duration-200 ease-out ${slideClass}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">{step.description}</p>

            <ul className="space-y-3">
              {step.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{f.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {isLast && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => { onComplete(); onNavigate('dashboard'); }}
                className="py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {t('onboarding.ctaCreatePrompt')}
              </button>
              <button
                onClick={() => { onComplete(); onNavigate('marketplace'); }}
                className="py-2.5 rounded-xl bg-brand-green hover:bg-green-600 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {t('onboarding.ctaMarketplace')}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > currentStep ? 'forward' : 'back')}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-5 h-2 bg-brand-orange'
                    : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                {t('onboarding.back')}
              </button>
            )}
            {currentStep === 0 && (
              <button
                onClick={onComplete}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                {t('onboarding.skip')}
              </button>
            )}
            {!isLast && (
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {t('onboarding.next')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
