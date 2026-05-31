import React, { useState, useMemo, useRef } from 'react';
import { type Prompt } from '../types';
import { XIcon, SearchIcon, CheckIcon, PackageIcon, ImageIcon } from './icons/Icons';
import { MIN_MARKETPLACE_PRICE } from '../constants';
import { storageService } from '../lib/storageService';

export interface BundleData {
  title: string;
  description: string;
  coverImage: string;
  promptIds: string[];
  price: number;
  originalPrice?: number;
}

interface CreateBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BundleData) => void;
  userPrompts: Prompt[];
  userId?: string;
}

const CreateBundleModal: React.FC<CreateBundleModalProps> = ({ isOpen, onClose, onSave, userPrompts, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const previewUrlRef = useRef<string | null>(null);

  const filteredPrompts = useMemo(() =>
    userPrompts.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
  [userPrompts, searchTerm]);

  const togglePrompt = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const priceNum = parseFloat(price) || 0;
  const origNum = parseFloat(originalPrice) || 0;
  const savings = origNum > priceNum && priceNum > 0 ? origNum - priceNum : 0;
  const savingsPct = origNum > 0 && priceNum > 0 ? Math.round((1 - priceNum / origNum) * 100) : 0;

  const isValid = selectedIds.length >= 2 && title.trim() !== '' && priceNum >= MIN_MARKETPLACE_PRICE;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;
      setSelectedFile(file);
      setCoverPreview(preview);
    }
  };

  const removeCover = () => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setSelectedFile(null);
    setCoverPreview(null);
    setCoverImageUrl('');
  };

  const handleSave = async () => {
    if (!isValid) return;
    let finalCover = coverImageUrl.trim();
    if (selectedFile && userId) {
      setUploading(true);
      try {
        finalCover = await storageService.uploadProductImage(userId, selectedFile);
      } catch {
        finalCover = coverPreview ?? '';
      }
      setUploading(false);
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      coverImage: finalCover || '',
      // Empty string means no cover — marketplace renders a default gradient placeholder
      promptIds: selectedIds,
      price: priceNum,
      originalPrice: origNum > priceNum ? origNum : undefined,
    });
    setTitle(''); setDescription(''); setCoverImageUrl(''); setCoverPreview(null); setSelectedFile(null);
    setSelectedIds([]); setPrice(''); setOriginalPrice(''); setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-xl">
              <PackageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Paket Oluştur</h2>
              <p className="text-xs text-gray-400">Promptlarını indirimli bir pakette sat</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Prompt Seçimi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Prompt Seç</label>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${selectedIds.length >= 2 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {selectedIds.length} seçildi {selectedIds.length < 2 && '(min. 2)'}
              </span>
            </div>
            <div className="relative mb-2">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Prompt ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {filteredPrompts.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">Prompt bulunamadı.</p>
              ) : (
                filteredPrompts.map(prompt => {
                  const isSelected = selectedIds.includes(prompt.id);
                  return (
                    <button
                      key={prompt.id}
                      onClick={() => togglePrompt(prompt.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-b-0 ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{prompt.title}</p>
                        <p className="text-xs text-gray-400 truncate">{prompt.tags.slice(0, 3).join(' · ')}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Paket Bilgileri */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 block">Paket Bilgileri</label>
            <input
              type="text"
              placeholder="Paket adı *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-orange focus:border-brand-orange"
            />
            <textarea
              placeholder="Kısa açıklama (opsiyonel)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-orange focus:border-brand-orange resize-none"
            />
            {/* Cover image: file upload OR URL */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Kapak Görseli (opsiyonel)</label>
              {coverPreview ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100">
                  <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                  <button type="button" onClick={removeCover} className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80 transition-colors">
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-orange hover:bg-orange-50 transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Fotoğraf yükle</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </label>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                <span>veya URL girin</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <input
                type="url"
                placeholder="https://..."
                value={coverImageUrl}
                onChange={e => { setCoverImageUrl(e.target.value); if (e.target.value) setCoverPreview(e.target.value); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>
          </div>

          {/* Fiyatlandırma */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 block">Fiyatlandırma</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Normal fiyat (isteğe bağlı)</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-gray-300 focus:border-gray-300"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Paket fiyatı *</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-orange text-sm font-bold">$</span>
                  <input
                    type="number"
                    min={MIN_MARKETPLACE_PRICE}
                    step="0.01"
                    placeholder={`${MIN_MARKETPLACE_PRICE}.00`}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-orange-200 rounded-xl text-sm focus:ring-brand-orange focus:border-brand-orange"
                  />
                </div>
              </div>
            </div>

            {/* Savings Preview */}
            {savings > 0 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckIcon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Alıcılar <span className="text-green-800">${savings.toFixed(2)}</span> tasarruf eder
                  </p>
                  <p className="text-xs text-green-600">{savingsPct}% indirim — güçlü bir satış motivasyonu!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            İptal
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!isValid || uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PackageIcon className="w-4 h-4" />
            {uploading ? 'Yükleniyor...' : 'Paketi Mağazaya Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBundleModal;
