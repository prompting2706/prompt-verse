
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type View } from '../types';
import { toast } from '../utils/toast';
import { authService } from '../lib/auth';
import OAuthButtons from './OAuthButtons';

interface LoginProps {
  onLogin: () => void;
  onNavigate: (view: View) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.errorEmpty'));
      return;
    }
    setLoading(true);
    try {
      await authService.signIn({ email, password });
      onLogin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email);
      toast.success('Password reset email sent. Check your inbox.');
      setForgotMode(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-2 text-brand-dark-gray">
          {forgotMode ? 'Reset Password' : t('login.title')}
        </h1>
        <p className="text-center text-brand-medium-gray mb-6">
          {forgotMode ? 'Enter your email to receive a reset link' : t('login.subtitle')}
        </p>

        {!forgotMode && (
          <>
            <OAuthButtons label="Sign in" />
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">VEYA</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          </>
        )}

        {forgotMode ? (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('login.emailLabel')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setForgotMode(false)} className="w-full text-center text-sm text-brand-orange hover:text-orange-500">
              Back to Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('login.emailLabel')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('login.passwordLabel')}</label>
                <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-brand-orange hover:text-orange-500">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                {loading ? 'Signing in...' : t('login.signIn')}
              </button>
            </div>
          </form>
        )}

        {!forgotMode && (
          <p className="mt-8 text-center text-sm text-gray-600">
            {t('login.noAccount')}{' '}
            <button onClick={() => onNavigate({ type: 'register', payload: null })} className="font-medium text-brand-orange hover:text-orange-500">
              {t('login.signUp')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
