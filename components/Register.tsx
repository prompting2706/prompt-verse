import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type View } from '../types';
import { toast } from '../utils/toast';
import { authService } from '../lib/auth';
import { emailService } from '../lib/emailService';
import OAuthButtons from './OAuthButtons';

interface RegisterProps {
  onRegister: () => void;
  onNavigate: (view: View) => void;
}

const SLIDES = [
  {
    image: 'https://picsum.photos/seed/pv-mkt/900/1200',
    tag: '✦ AI Marketplace',
    title: 'Discover & Sell\nAI Prompts',
    desc: 'The best prompts, curated for every creative workflow.',
    tab: 'Marketplace',
  },
  {
    image: 'https://picsum.photos/seed/pv-studio/900/1200',
    tag: '✦ Prompt Studio',
    title: 'Organize Your\nPrompt Library',
    desc: 'Projects, versions, and collaborators — all in one place.',
    tab: 'Prompt Studio',
  },
  {
    image: 'https://picsum.photos/seed/pv-analytics/900/1200',
    tag: '✦ Analytics',
    title: 'Grow Your\nAudience',
    desc: 'Track performance, run campaigns, and earn more.',
    tab: 'Campaigns',
  },
  {
    image: 'https://picsum.photos/seed/pv-collab/900/1200',
    tag: '✦ Collaboration',
    title: 'Create\nTogether',
    desc: 'Share, co-edit, and commission custom prompts.',
    tab: 'Collaborate',
  },
];

const SLIDE_DURATION = 5000;

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigate }) => {
  const { t } = useTranslation();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  // BUG-022: prevent double-submit on rapid clicks
  const submittingRef = useRef(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (elapsed >= SLIDE_DURATION) {
        setActiveSlide(prev => (prev + 1) % SLIDES.length);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [activeSlide]);

  const goToSlide = (idx: number) => {
    setActiveSlide(idx);
    setProgress(0);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (password !== confirmPassword) {
      toast.error(t('register.errorPasswordMismatch'));
      return;
    }
    if (!name || !username || !email || !password) {
      toast.error(t('register.errorFillAll'));
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await authService.signUp({ email, password, name, username, referralCode: referralCode || undefined });
      void emailService.sendWelcomeEmail(email, name);
      toast.success('Account created! Please check your email to confirm your account.');
      onRegister();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const slide = SLIDES[activeSlide];

  return (
    <div className="min-h-screen flex bg-[#0d0d0d]">
      {/* Left: Auth Panel */}
      <div className="w-full md:w-[420px] lg:w-[480px] shrink-0 flex flex-col justify-center px-10 py-12 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-brand-green rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PromptVerse</span>
        </div>

        {/* OAuth view */}
        {!showEmailForm && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{t('register.title')}</h1>
              <p className="text-white/50 text-sm">{t('register.subtitle')}</p>
            </div>

            <OAuthButtons label="Sign up" variant="dark" />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30 font-medium tracking-wider">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Continue with Email
            </button>

            <p className="text-center text-sm text-white/40">
              {t('register.hasAccount')}{' '}
              <button
                onClick={() => onNavigate({ type: 'login', payload: null })}
                className="text-brand-green hover:text-green-400 font-medium transition-colors"
              >
                {t('register.signIn')}
              </button>
            </p>

            <p className="text-center text-xs text-white/20 leading-relaxed">
              By continuing, you agree to our{' '}
              <button onClick={() => onNavigate({ type: 'privacy', payload: null })} className="underline hover:text-white/40 transition-colors">Privacy Policy</button>
              {' '}and{' '}
              <button onClick={() => onNavigate({ type: 'terms', payload: null })} className="underline hover:text-white/40 transition-colors">Terms of Use</button>
            </p>
          </div>
        )}

        {/* Email registration form */}
        {showEmailForm && (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
              <p className="text-white/40 text-sm">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('register.nameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder={t('register.namePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder="yourhandle"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('register.emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder={t('register.emailPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('register.passwordLabel')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder={t('register.passwordPlaceholder')}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('register.confirmPasswordLabel')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder={t('register.passwordPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">
                  Referral Code <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder="XXXXXXXX"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-green hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm mt-1"
              >
                {loading ? 'Creating account...' : t('register.signUp')}
              </button>
            </form>

            <p className="text-center text-sm text-white/40">
              {t('register.hasAccount')}{' '}
              <button
                onClick={() => onNavigate({ type: 'login', payload: null })}
                className="text-brand-green hover:text-green-400 font-medium transition-colors"
              >
                {t('register.signIn')}
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Right: Showcase Panel */}
      <div className="hidden md:block flex-1 relative overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === activeSlide ? 1 : 0 }}
          >
            <img src={s.image} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 px-10 pb-10">
          <span className="inline-block text-xs font-semibold text-white/70 tracking-widest mb-3">
            {slide.tag}
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight mb-2 whitespace-pre-line">
            {slide.title}
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-xs">{slide.desc}</p>

          <div className="flex gap-6">
            {SLIDES.map((s, i) => (
              <button key={i} onClick={() => goToSlide(i)} className="flex flex-col gap-2 text-left group">
                <span className={`text-xs font-medium transition-colors ${i === activeSlide ? 'text-white' : 'text-white/35 group-hover:text-white/60'}`}>
                  {s.tab}
                </span>
                <div className="h-0.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: i === activeSlide ? `${progress}%` : i < activeSlide ? '100%' : '0%' }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
