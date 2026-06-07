import React, { useState, useRef } from 'react';
import { toast } from '../utils/toast';
import { authService } from '../lib/auth';

interface ResetPasswordPageProps {
  onDone: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (password.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor.');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      await authService.updatePassword(password);
      toast.success('Şifreniz başarıyla güncellendi!');
      onDone();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Şifre güncellenemedi.';
      toast.error(message);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 bg-brand-green rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PromptVerse</span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Yeni Şifre Belirle</h1>
          <p className="text-white/40 text-sm mb-6">Hesabınız için güçlü bir şifre seçin.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Yeni Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                placeholder="En az 8 karakter"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Şifreyi Onayla</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-brand-green transition-all text-sm"
                placeholder="Şifreyi tekrar girin"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-green hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
            >
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
