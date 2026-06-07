
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type CartItem, type Coupon } from '../types';
import { TrashIcon, PlusIcon, MinusIcon, TagIcon, XIcon, CheckIcon } from './icons/Icons';

interface CartProps {
  cartItems: CartItem[];
  onRemoveFromCart: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onCheckout: () => void;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => Promise<string | null>;
  onRemoveCoupon: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  onRemoveFromCart,
  onUpdateQuantity,
  onCheckout,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const { t } = useTranslation();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? subtotal * appliedCoupon.value / 100
      : Math.min(appliedCoupon.value, subtotal)
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const handleApply = async () => {
    const trimmed = couponInput.trim().toUpperCase();
    if (!trimmed) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const error = await onApplyCoupon(trimmed);
      if (error) {
        setCouponError(error);
      } else {
        setCouponError('');
        setCouponInput('');
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setCouponError('');
    setCouponInput('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('cart.title')}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-grow bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{t('cart.items', { count: totalItems })}</h2>
          {cartItems.length === 0 ? (
            <p className="text-gray-500">{t('cart.empty')}</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cartItems.map(item => (
                <li key={item.product.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-grow">
                    {item.product.coverImage
                      ? <img src={item.product.coverImage} alt={item.product.title} className="w-20 h-16 rounded-md object-cover" />
                      : <div className="w-20 h-16 rounded-md bg-gray-100 flex items-center justify-center text-2xl">📦</div>
                    }
                    <div>
                      <h3 className="font-semibold">{item.product.title}</h3>
                      <p className="text-sm text-gray-500">{t('common.by')} {item.product.seller.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-1 border border-gray-200 rounded-md p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="text-gray-500 hover:text-brand-green disabled:text-gray-300 p-1"
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="font-semibold w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="text-gray-500 hover:text-brand-green p-1"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-md w-20 text-right">${(item.product.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.product.id); }}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Coupon Section */}
          <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-brand-orange" />
              {t('cart.discountCode')}
            </h3>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-green-700 text-sm tracking-widest">{appliedCoupon.code}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-0.5">{appliedCoupon.description}</p>
                </div>
                <button
                  onClick={handleRemove}
                  className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                  aria-label={t('cart.removeCouponAriaLabel')}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && void handleApply()}
                    placeholder={t('cart.couponPlaceholder')}
                    className="flex-1 text-sm font-mono uppercase border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent tracking-widest placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
                  />
                  <button
                    onClick={() => void handleApply()}
                    disabled={!couponInput.trim() || couponLoading}
                    className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed min-w-[80px]"
                  >
                    {couponLoading ? '...' : t('cart.applyCoupon')}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {couponError}
                  </p>
                )}
                <p className="text-xs text-gray-400">{t('cart.tryCodes')}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">{t('cart.orderSummary')}</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>{t('cart.subtotal')}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span className="flex items-center gap-1">
                    <TagIcon className="w-3.5 h-3.5" />
                    {appliedCoupon!.code}
                    {appliedCoupon!.type === 'percent' && ` (${appliedCoupon!.value}%)`}
                  </span>
                  <span>−${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400 text-sm">
                <span>{t('cart.taxes')}</span>
                <span>{t('cart.taxesNote')}</span>
              </div>
            </div>
            <div className="border-t my-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>{t('cart.total')}</span>
              <span className={discountAmount > 0 ? 'text-green-600' : ''}>
                ${total.toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <p className="text-xs text-green-600 text-right mt-1">
                {t('cart.saved', { amount: discountAmount.toFixed(2) })}
              </p>
            )}
            <button
              onClick={onCheckout}
              disabled={cartItems.length === 0}
              className="w-full mt-6 bg-brand-green text-white py-2.5 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('cart.checkout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
