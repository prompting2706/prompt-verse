
import React, { useState } from 'react';
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

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('register.errorPasswordMismatch'));
      return;
    }
    if (!name || !username || !email || !password) {
      toast.error(t('register.errorFillAll'));
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authService.signUp({ email, password, name, username, referralCode: referralCode || undefined });
      // Fire-and-forget — never blocks registration
      void emailService.sendWelcomeEmail(email, name);
      toast.success('Account created! Please check your email to confirm your account.');
      onRegister();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-2 text-brand-dark-gray">{t('register.title')}</h1>
        <p className="text-center text-brand-medium-gray mb-6">{t('register.subtitle')}</p>

        <OAuthButtons label="Sign up" />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">VEYA E-POSTA İLE</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('register.nameLabel')}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              placeholder={t('register.namePlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              placeholder="yourhandle"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('register.emailLabel')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              placeholder={t('register.emailPlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('register.passwordLabel')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              placeholder={t('register.passwordPlaceholder')}
              minLength={6}
              required
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">{t('register.confirmPasswordLabel')}</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              placeholder={t('register.passwordPlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="referral" className="block text-sm font-medium text-gray-700">Referral Code <span className="text-gray-400">(optional)</span></label>
            <input
              type="text"
              id="referral"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-orange focus:border-brand-orange"
              placeholder="XXXXXXXX"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              {loading ? 'Creating account...' : t('register.signUp')}
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-sm text-gray-600">
          {t('register.hasAccount')}{' '}
          <button onClick={() => onNavigate({ type: 'login', payload: null })} className="font-medium text-brand-orange hover:text-orange-500">
            {t('register.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
