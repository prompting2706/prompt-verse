import React from 'react';
import { useTranslation } from 'react-i18next';

interface PrivacyPageProps {
  onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const lastUpdated = 'May 26, 2026';

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
      >
        ← {t('common.back', 'Back')}
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {lastUpdated}</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We collect information you provide directly to us, such as when you create an account,
            make a purchase, or contact us for support. This includes your name, email address,
            payment information (processed securely by Stripe), and any content you upload or create.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside">
            <li>To provide, maintain, and improve our services</li>
            <li>To process transactions and send related information</li>
            <li>To send promotional communications (with your consent)</li>
            <li>To respond to your comments and questions</li>
            <li>To monitor and analyze usage patterns</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">3. Information Sharing</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We do not sell, trade, or rent your personal information to third parties.
            We may share your information with trusted service providers who assist us in operating our platform,
            including Supabase (database), Stripe (payments), and Resend (email).
            These parties are contractually obligated to keep your information confidential.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Data Retention</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We retain your personal data for as long as your account is active or as needed to provide services.
            You may request deletion of your account and associated data at any time by contacting us.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Cookies</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use cookies and similar technologies to enhance your experience, remember your preferences
            (such as language selection), and analyze how our service is used.
            You can control cookies through your browser settings.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Security</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We implement industry-standard security measures to protect your personal information.
            However, no method of transmission over the Internet is 100% secure.
            We encourage you to use a strong, unique password for your account.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Your Rights</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Depending on your location, you may have rights including access to your data,
            correction of inaccurate data, deletion of your data, and data portability.
            You can export your data at any time from Settings → Export Data.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">8. Contact Us</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@promptverse.app" className="text-brand-orange hover:underline">
              privacy@promptverse.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
