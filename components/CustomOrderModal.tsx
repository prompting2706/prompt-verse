
import React, { useState } from 'react';
import { type User, type CustomOrder } from '../types';
import { XIcon } from './icons/Icons';

interface CustomOrderModalProps {
  buyer: User;
  seller: { id: string; name: string; avatarUrl: string };
  onSubmit: (order: Omit<CustomOrder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const CustomOrderModal: React.FC<CustomOrderModalProps> = ({ buyer, seller, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  const isValid = title.trim().length >= 5 && description.trim().length >= 20 && parseFloat(budget) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit({
      buyerId: buyer.id,
      buyerName: buyer.name,
      buyerAvatar: buyer.avatarUrl,
      sellerId: seller.id,
      sellerName: seller.name,
      sellerAvatar: seller.avatarUrl,
      title: title.trim(),
      description: description.trim(),
      budget: parseFloat(budget),
      deadline: deadline ? new Date(deadline + 'T23:59:59').toISOString() : undefined,
      status: 'pending',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src={seller.avatarUrl} alt={seller.name} className="w-10 h-10 rounded-full" />
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Özel Sipariş Talebi</h2>
              <p className="text-xs text-gray-400">{seller.name}'e gönderilecek</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Sipariş Başlığı <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Örn: 10 adet ürün fotoğrafı promptu"
              maxLength={80}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Detaylı Açıklama <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ne istediğinizi detaylı açıklayın: stil, format, adet, özel gereksinimler..."
              rows={4}
              maxLength={500}
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/500 karakter</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Bütçe ($) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Son Teslim Tarihi
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <strong>Not:</strong> Satıcı talebinizi inceleyip fiyat teklifini onaylayacak. Ödeme yalnızca her iki taraf anlaştıktan sonra gerçekleşir.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Talebi Gönder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomOrderModal;
