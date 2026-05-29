
import React, { useState } from 'react';
import { type CustomOrder, type CustomOrderStatus, type User } from '../types';
import { CheckIcon, XIcon, ClipboardListIcon } from './icons/Icons';

interface CommissionsPageProps {
  customOrders: CustomOrder[];
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: CustomOrderStatus, extra?: { agreedPrice?: number; sellerNote?: string }) => void;
}

const STATUS_CONFIG: Record<CustomOrderStatus, { label: string; color: string }> = {
  pending:     { label: 'Beklemede',      color: 'bg-yellow-100 text-yellow-700' },
  accepted:    { label: 'Kabul Edildi',   color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Yapılıyor',      color: 'bg-purple-100 text-purple-700' },
  delivered:   { label: 'Teslim Edildi',  color: 'bg-orange-100 text-orange-700' },
  completed:   { label: 'Tamamlandı',     color: 'bg-green-100 text-green-700' },
  declined:    { label: 'Reddedildi',     color: 'bg-red-100 text-red-700' },
  cancelled:   { label: 'İptal Edildi',   color: 'bg-gray-100 text-gray-500' },
};

const StatusBadge: React.FC<{ status: CustomOrderStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

const CommissionsPage: React.FC<CommissionsPageProps> = ({ customOrders, currentUser, onUpdateStatus }) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptPrice, setAcceptPrice] = useState('');
  const [acceptNote, setAcceptNote] = useState('');
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');

  const receivedOrders = customOrders.filter(o => o.sellerId === currentUser.id);
  const sentOrders = customOrders.filter(o => o.buyerId === currentUser.id);

  const pendingCount = receivedOrders.filter(o => o.status === 'pending').length;
  const activeSentCount = sentOrders.filter(o => ['accepted', 'in_progress', 'delivered'].includes(o.status)).length;
  const completedCount = customOrders.filter(o => o.status === 'completed' && (o.sellerId === currentUser.id || o.buyerId === currentUser.id)).length;

  const handleAcceptConfirm = (orderId: string, budget: number) => {
    const price = parseFloat(acceptPrice) || budget;
    onUpdateStatus(orderId, 'accepted', { agreedPrice: price, sellerNote: acceptNote.trim() || undefined });
    setAcceptingId(null);
    setAcceptPrice('');
    setAcceptNote('');
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

  const OrderCard = ({ order }: { order: CustomOrder }) => {
    const isSeller = order.sellerId === currentUser.id;
    const isAcceptingThis = acceptingId === order.id;

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={isSeller ? order.buyerAvatar : order.sellerAvatar}
                alt=""
                className="w-9 h-9 rounded-full flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">
                  {isSeller ? 'Alıcı' : 'Satıcı'}
                </p>
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {isSeller ? order.buyerName : order.sellerName}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <StatusBadge status={order.status} />
              <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <h3 className="font-bold text-gray-900 mb-1">{order.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{order.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-400 text-xs">Bütçe</span>
              <p className="font-semibold text-gray-700">${order.budget.toFixed(2)}</p>
            </div>
            {order.agreedPrice && (
              <div>
                <span className="text-gray-400 text-xs">Anlaşılan</span>
                <p className="font-semibold text-green-600">${order.agreedPrice.toFixed(2)}</p>
              </div>
            )}
            {order.deadline && (
              <div>
                <span className="text-gray-400 text-xs">Son Tarih</span>
                <p className="font-semibold text-gray-700">{formatDate(order.deadline)}</p>
              </div>
            )}
          </div>

          {order.sellerNote && (
            <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 italic">
              "{order.sellerNote}"
            </div>
          )}
        </div>

        {/* Inline accept form */}
        {isAcceptingThis && (
          <div className="border-t border-gray-100 bg-blue-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-800">Teklif Fiyatını Gir</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={acceptPrice}
                  onChange={e => setAcceptPrice(e.target.value)}
                  placeholder={order.budget.toFixed(2)}
                  min="0.01"
                  step="0.01"
                  className="w-full pl-6 pr-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <textarea
              value={acceptNote}
              onChange={e => setAcceptNote(e.target.value)}
              placeholder="Alıcıya mesaj (isteğe bağlı)"
              rows={2}
              className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAcceptConfirm(order.id, order.budget)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <CheckIcon className="w-4 h-4" />
                Onayla
              </button>
              <button
                onClick={() => setAcceptingId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Inline revision form */}
        {revisionId === order.id && (
          <div className="border-t border-gray-100 bg-amber-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-800">Revizyon Notunu Gir</p>
            <textarea
              value={revisionNote}
              onChange={e => setRevisionNote(e.target.value)}
              placeholder="Nelerin değiştirilmesini istediğinizi açıklayın..."
              rows={3}
              className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onUpdateStatus(order.id, 'in_progress', { sellerNote: revisionNote.trim() || undefined });
                  setRevisionId(null);
                  setRevisionNote('');
                }}
                className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Revizyon İste
              </button>
              <button
                onClick={() => { setRevisionId(null); setRevisionNote(''); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

        {/* Action bar */}
        {!isAcceptingThis && revisionId !== order.id && (
          <div className="border-t border-gray-100 px-5 py-3 flex gap-2 flex-wrap">
            {/* Seller actions */}
            {isSeller && order.status === 'pending' && (
              <>
                <button
                  onClick={() => { setAcceptingId(order.id); setAcceptPrice(order.budget.toFixed(2)); setAcceptNote(''); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  Kabul Et
                </button>
                <button
                  onClick={() => onUpdateStatus(order.id, 'declined')}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  Reddet
                </button>
              </>
            )}
            {isSeller && order.status === 'accepted' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'in_progress')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                Çalışmaya Başla
              </button>
            )}
            {isSeller && order.status === 'in_progress' && (
              <button
                onClick={() => onUpdateStatus(order.id, 'delivered')}
                className="px-4 py-2 bg-brand-orange text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
              >
                Teslim Et
              </button>
            )}

            {/* Buyer actions */}
            {!isSeller && order.status === 'delivered' && (
              <>
                <button
                  onClick={() => onUpdateStatus(order.id, 'completed')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                  Teslim Aldım
                </button>
                <button
                  onClick={() => { setRevisionId(order.id); setRevisionNote(''); }}
                  className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-50 transition-colors"
                >
                  Revizyon İste
                </button>
              </>
            )}
            {!isSeller && ['pending', 'accepted'].includes(order.status) && (
              <button
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
                İptal Et
              </button>
            )}

            {/* Terminal states — no actions */}
            {['completed', 'declined', 'cancelled'].includes(order.status) && (
              <span className="text-xs text-gray-400 py-2">Tamamlandı veya kapatıldı</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const emptyState = (tab: 'received' | 'sent') => (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
      <ClipboardListIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">
        {tab === 'received' ? 'Henüz gelen özel sipariş talebi yok.' : 'Henüz gönderilen sipariş talebi yok.'}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {tab === 'received' ? 'Alıcılar mağaza sayfanızdan talep gönderebilir.' : 'Satıcı mağazalarından özel sipariş talep edebilirsiniz.'}
      </p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Komisyonlar</h1>
      <p className="text-gray-500 mb-6">Özel sipariş taleplerini yönet ve takip et.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Bekleyen Talepler', value: pendingCount, color: 'text-yellow-600' },
          { label: 'Aktif Siparişler',  value: activeSentCount, color: 'text-purple-600' },
          { label: 'Tamamlanan',        value: completedCount, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {(['received', 'sent'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'received'
              ? `Gelen Talepler${receivedOrders.length > 0 ? ` (${receivedOrders.length})` : ''}`
              : `Gönderdiklerim${sentOrders.length > 0 ? ` (${sentOrders.length})` : ''}`
            }
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-4">
        {activeTab === 'received'
          ? receivedOrders.length === 0
            ? emptyState('received')
            : receivedOrders.map(o => <OrderCard key={o.id} order={o} />)
          : sentOrders.length === 0
            ? emptyState('sent')
            : sentOrders.map(o => <OrderCard key={o.id} order={o} />)
        }
      </div>
    </div>
  );
};

export default CommissionsPage;
