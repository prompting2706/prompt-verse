import React, { useState } from 'react';
import { type Order, type CartItem } from '../types';
import { MarketplaceIcon } from './icons/Icons';
import { toast } from '../utils/toast';
import StarRating from './StarRating';

interface OrdersProps {
  orders: Order[];
  onNavigateToMarketplace: () => void;
  onUpdateReview: (orderId: string, productId: string, rating: number, review: string) => void;
}

const OrderItem: React.FC<{ item: CartItem; orderId: string; onUpdateReview: OrdersProps['onUpdateReview'] }> = ({ item, orderId, onUpdateReview }) => {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(item.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [review, setReview] = useState(item.review || '');

    const handleSubmitReview = () => {
        if (rating > 0) {
            onUpdateReview(orderId, item.product.id, rating, review);
            setShowReviewForm(false);
        } else {
            toast.warning('Lütfen bir puan seçin.');
        }
    };
    
    return (
        <li className="py-4">
            <div className="flex items-center gap-4">
                <img src={item.product.coverImage} alt={item.product.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                <div className="flex-grow">
                    <h3 className="font-semibold text-sm">{item.product.title}</h3>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-sm text-gray-700">${(item.product.price * item.quantity).toFixed(2)}</p>
            </div>
            
            {/* Review Section */}
            <div className="mt-4 pl-20">
                {item.rating && !showReviewForm ? (
                    <div>
                        <div className="flex items-center gap-2">
                           <StarRating rating={item.rating} />
                           <span className="font-medium text-sm text-gray-600">{item.rating.toFixed(1)}</span>
                        </div>
                        {item.review && <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded-md italic">"{item.review}"</p>}
                         <button onClick={() => { setShowReviewForm(true); setRating(item.rating || 0); setReview(item.review || ''); }} className="text-xs font-medium text-brand-orange hover:text-orange-500 mt-2">
                                Edit review
                         </button>
                    </div>
                ) : (
                    <div>
                        {!showReviewForm && (
                            <button onClick={() => setShowReviewForm(true)} className="text-sm font-medium text-brand-orange hover:text-orange-500">
                                Leave a review
                            </button>
                        )}
                        {showReviewForm && (
                             <div className="p-4 border rounded-lg bg-gray-50/50">
                                <h4 className="font-semibold text-sm mb-2">Rate this product</h4>
                                <div className="flex items-center gap-2 mb-3">
                                    <StarRating
                                        interactive
                                        rating={rating}
                                        onRatingChange={setRating}
                                        hoverRating={hoverRating}
                                        onHoverChange={setHoverRating}
                                        className="w-6 h-6"
                                    />
                                    <span className="font-semibold text-gray-700 w-12 text-center text-sm bg-white px-2 py-1 rounded-md border">{(hoverRating || rating).toFixed(1)}</span>
                                </div>
                                <textarea 
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    placeholder="Share your thoughts... (optional)"
                                    rows={3}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-brand-orange focus:border-brand-orange"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setShowReviewForm(false)} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                                    <button onClick={handleSubmitReview} className="px-3 py-1 text-sm bg-brand-green text-white rounded-md hover:bg-green-600">Submit</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </li>
    );
};


const Orders: React.FC<OrdersProps> = ({ orders, onNavigateToMarketplace, onUpdateReview }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center bg-white p-12 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">No Order History</h2>
          <p className="text-gray-500 mt-2 mb-6">You haven't placed any orders yet. Explore the marketplace to find amazing prompts!</p>
          <button
            onClick={onNavigateToMarketplace}
            className="flex items-center gap-2 mx-auto bg-brand-green text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
          >
            <MarketplaceIcon />
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-start mb-4 border-b pb-4 flex-wrap gap-4">
                <div>
                  <p className="text-xs text-gray-500">ORDER NUMBER</p>
                  <h2 className="font-semibold text-gray-800">{order.id}</h2>
                </div>
                <div>
                  <p className="text-xs text-gray-500">DATE PLACED</p>
                  <p className="font-medium text-gray-600">{new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">TOTAL AMOUNT</p>
                  <div>
                    {order.discountAmount > 0 && (
                      <p className="text-xs text-gray-400 line-through">${order.subtotal.toFixed(2)}</p>
                    )}
                    <p className="font-semibold text-lg text-brand-green">${order.total.toFixed(2)}</p>
                    {order.couponCode && (
                      <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 text-xs rounded font-medium border border-orange-100">
                        🏷 {order.couponCode}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">STATUS</p>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {order.items.map((item, idx) => (
                  <OrderItem key={`${order.id}-${item.product.id}-${idx}`} item={item} orderId={order.id} onUpdateReview={onUpdateReview} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;