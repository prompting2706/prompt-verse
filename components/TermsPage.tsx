import React from 'react';
import { useTranslation } from 'react-i18next';

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last updated: {lastUpdated}</p>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            By accessing or using PromptVerse, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">2. Description of Service</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            PromptVerse is a platform for creating, managing, and selling AI prompts.
            We provide tools for prompt organization, a marketplace for buying and selling prompts,
            and community features for sharing and collaboration.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">3. User Accounts</h2>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside">
            <li>You must be at least 18 years old to use this service</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must provide accurate and complete information when creating an account</li>
            <li>One person may not maintain more than one free account</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">4. Content and Intellectual Property</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            You retain ownership of the prompts and content you create on PromptVerse.
            By posting content, you grant PromptVerse a non-exclusive license to display
            and distribute your content within the platform. You are responsible for ensuring
            your content does not infringe on third-party intellectual property rights.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">5. Marketplace Rules</h2>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside">
            <li>Minimum product price is $3.00</li>
            <li>PromptVerse charges a {15}% commission on all marketplace sales</li>
            <li>Team plan members receive a reduced {12}% commission rate</li>
            <li>Sellers must deliver products as described</li>
            <li>Fraudulent listings will result in immediate account termination</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">6. Prohibited Content</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            You may not post, upload, or sell content that:
          </p>
          <ul className="text-sm text-gray-600 leading-relaxed space-y-1 list-disc list-inside">
            <li>Is illegal or promotes illegal activity</li>
            <li>Harasses, abuses, or harms other users</li>
            <li>Contains malware or malicious code</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains explicit adult content without proper age verification</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">7. Subscriptions and Refunds</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Subscription fees are billed in advance on a monthly or yearly basis.
            Subscriptions automatically renew unless cancelled before the renewal date.
            Refunds are available within 7 days of purchase for annual subscriptions.
            Monthly subscriptions are non-refundable once the billing period begins.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">8. Termination</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We reserve the right to suspend or terminate your account for violations of these terms.
            You may cancel your account at any time from Settings. Upon termination,
            your right to use the service ceases immediately.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">9. Limitation of Liability</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            PromptVerse is provided "as is" without warranties of any kind.
            We are not liable for any indirect, incidental, or consequential damages
            arising from your use of the service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">10. Contact</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:legal@promptverse.app" className="text-brand-orange hover:underline">
              legal@promptverse.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
