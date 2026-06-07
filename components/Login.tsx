import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type View } from '../types';
import { toast } from '../utils/toast';
import { authService } from '../lib/auth';
import OAuthButtons from './OAuthButtons';

interface LoginProps {
  onLogin: () => void;
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

type AuthView = 'oauth' | 'email' | 'forgot';

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const { t } = useTranslation();
  const [authView, setAuthView] = useState<AuthView>('oauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  // BUG-022: prevent double-submit on rapid clicks
  const submittingRef = useRef(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!email || !password) {
      toast.error(t('login.errorEmpty'));
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await authService.signIn({ email, password });
      onLogin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await authService.resetPassword(email);
      toast.success('Password reset email sent. Check your inbox.');
      setAuthView('oauth');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
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
        {authView === 'oauth' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{t('login.title')}</h1>
              <p className="text-white/50 text-sm">{t('login.subtitle')}</p>
            </div>

            <OAuthButtons label="Sign in" variant="dark" />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30 font-medium tracking-wider">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={() => setAuthView('email')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-sm font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Continue with Email
            </button>

            <p className="mt-6 text-center text-sm text-white/40">
              {t('login.noAccount')}{' '}
              <button
                onClick={() => onNavigate({ type: 'register', payload: null })}
                className="text-brand-green hover:text-green-400 font-medium transition-colors"
              >
                {t('login.signUp')}
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

        {/* Email sign-in view */}
        {authView === 'email' && (
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setAuthView('oauth')}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-white mb-1">Sign in with email</h1>
              <p className="text-white/40 text-sm">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('login.emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green focus:bg-white/8 transition-all text-sm"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-white/60">{t('login.passwordLabel')}</label>
                  <button
                    type="button"
                    onClick={() => setAuthView('forgot')}
                    className="text-xs text-brand-green hover:text-green-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green focus:bg-white/8 transition-all text-sm"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-green hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
              >
                {loading ? 'Signing in...' : t('login.signIn')}
              </button>
            </form>

            <p className="text-center text-sm text-white/40">
              {t('login.noAccount')}{' '}
              <button
                onClick={() => onNavigate({ type: 'register', payload: null })}
                className="text-brand-green hover:text-green-400 font-medium transition-colors"
              >
                {t('login.signUp')}
              </button>
            </p>
          </div>
        )}

        {/* Forgot password view */}
        {authView === 'forgot' && (
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={() => setAuthView('email')}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
              <p className="text-white/40 text-sm">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">{t('login.emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                  placeholder={t('login.emailPlaceholder')}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-green hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
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
            <img
              src={s.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Slide content */}
        <div className="absolute bottom-0 left-0 right-0 px-10 pb-10">
          <span className="inline-block text-xs font-semibold text-white/70 tracking-widest mb-3">
            {slide.tag}
          </span>
          <h2 className="text-4xl font-bold text-white leading-tight mb-2 whitespace-pre-line">
            {slide.title}
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-xs">{slide.desc}</p>

          {/* Tab navigation */}
          <div className="flex gap-6">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className="flex flex-col gap-2 text-left group"
              >
                <span className={`text-xs font-medium transition-colors ${i === activeSlide ? 'text-white' : 'text-white/35 group-hover:text-white/60'}`}>
                  {s.tab}
                </span>
                <div className="h-0.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-none"
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

export default Login;
