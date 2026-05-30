
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, ImageIcon, SearchIcon, SparklesIcon } from './icons/Icons';
import { type MarketplaceItem, type Prompt } from '../types';
import { MIN_MARKETPLACE_PRICE } from '../constants';
import { marketplaceService } from '../lib/marketplaceService';

export interface MarketplaceItemData {
    id?: string;
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    coverImage: string;
    tags: string[];
    type: 'single' | 'collection';
    promptCount?: number;
    promptIds?: string[];
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MarketplaceItemData) => void;
  userPrompts: Prompt[];
  itemToEdit?: MarketplaceItem;
  userId: string;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSave, userPrompts, itemToEdit, userId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<'single' | 'collection'>('single');
  const [promptCount, setPromptCount] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [promptSearchTerm, setPromptSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  const isEditMode = !!itemToEdit;

  useEffect(() => {
      let basePrice = type === 'single' ? 4.99 : 14.99;
      
      if (type === 'collection' && promptCount) {
          basePrice = Math.max(9.99, parseInt(promptCount) * 2.99);
      }
      
      const lowerTags = tags.toLowerCase();
      if (lowerTags.includes('video') || lowerTags.includes('midjourney') || lowerTags.includes('image')) {
          basePrice += 2.0;
      }
      if (lowerTags.includes('code') || lowerTags.includes('dev')) {
          basePrice += 1.0;
      }
      
      setSuggestedPrice(basePrice);
  }, [type, tags, promptCount]);
  
  const handleExtraFileChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setExtraFiles(prev => { const next = [...prev]; next[idx] = file; return next; });
      setExtraImages(prev => { const next = [...prev]; next[idx] = preview; return next; });
    }
  };

  const resetForm = () => {
      setTitle('');
      setDescription('');
      setPrice('');
      setOriginalPrice('');
      setTags('');
      setExtraImages([]);
      setExtraFiles([]);
      setType('single');
      setPromptCount('');
      setCoverImage(null);
      setError('');
      setSelectedPromptIds([]);
      setPromptSearchTerm('');
      setSelectedFile(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
  };

  useEffect(() => {
    if (isOpen) {
        if (itemToEdit) {
            setTitle(itemToEdit.title);
            setDescription(itemToEdit.description);
            setPrice(itemToEdit.price.toString());
            setOriginalPrice(itemToEdit.originalPrice ? itemToEdit.originalPrice.toString() : '');
            setTags(itemToEdit.tags?.join(', ') || '');
            setType(itemToEdit.type);
            setPromptCount(itemToEdit.promptCount ? itemToEdit.promptCount.toString() : '');
            setCoverImage(itemToEdit.coverImage);
            setSelectedPromptIds(itemToEdit.promptIds || []);
            setError('');
        } else {
            resetForm();
        }
    }
  }, [isOpen, itemToEdit]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const preview = URL.createObjectURL(file);
        previewUrlRef.current = preview;
        setSelectedFile(file);
        setCoverImage(preview);
    }
  };
  
    const handlePromptSelect = (promptId: string) => {
        if (type === 'single') {
            setSelectedPromptIds(prev => prev.includes(promptId) ? [] : [promptId]);
        } else {
            setSelectedPromptIds(prev => 
                prev.includes(promptId) 
                    ? prev.filter(id => id !== promptId)
                    : [...prev, promptId]
            );
        }
    };
    
    const filteredPrompts = userPrompts.filter(p => 
        p.title.toLowerCase().includes(promptSearchTerm.toLowerCase())
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || price === '') {
        setError('Please fill out all required fields.');
        return;
    }

    if (!coverImage && !selectedFile) {
        setError('Please upload a cover image.');
        return;
    }

    if (Number(price) < MIN_MARKETPLACE_PRICE) {
        setError(`Minimum price is $${MIN_MARKETPLACE_PRICE}.00`);
        return;
    }

    const numericPromptCount = promptCount ? Number(promptCount) : 0;

    if (type === 'single') {
        if (selectedPromptIds.length !== 1) {
            setError('Please select exactly one prompt for a single product.');
            return;
        }
    } else if (type === 'collection') {
        if (!promptCount || numericPromptCount <= 1) {
            setError('Collection must have at least 2 prompts.');
            return;
        }
        if (selectedPromptIds.length !== numericPromptCount) {
            setError(`You must select exactly ${promptCount} prompts for this collection. You have selected ${selectedPromptIds.length}.`);
            return;
        }
    }

    let finalCoverImage = coverImage!;
    if (selectedFile) {
        setUploading(true);
        try {
            finalCoverImage = await marketplaceService.uploadCover(userId, selectedFile);
        } catch {
            setError('Failed to upload cover image. Please try again.');
            setUploading(false);
            return;
        }
        setUploading(false);
    }

    const origPriceNum = originalPrice ? Number(originalPrice) : undefined;
    const itemData: MarketplaceItemData = {
      id: itemToEdit?.id,
      title,
      description,
      price: Number(price),
      originalPrice: origPriceNum && origPriceNum > Number(price) ? origPriceNum : undefined,
      coverImage: finalCoverImage,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      type,
      promptCount: type === 'collection' ? numericPromptCount : 1,
      promptIds: selectedPromptIds,
    };
    onSave(itemData);
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">{isEditMode ? 'Edit Product' : 'Add New Product to Store'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photos (up to 3)</label>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Slot 1 — main cover */}
                        <label htmlFor="cover-upload" className="cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300 hover:border-brand-orange">
                            {coverImage ? (
                                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2"><ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" /><span className="text-xs text-gray-400">Cover</span></div>
                            )}
                            <input id="cover-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                        </label>
                        {/* Slot 2 */}
                        <label htmlFor="extra-upload-0" className="cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-200 hover:border-brand-orange">
                            {extraImages[0] ? (
                                <img src={extraImages[0]} alt="Extra 1" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2"><ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" /><span className="text-xs text-gray-400">Photo 2</span></div>
                            )}
                            <input id="extra-upload-0" type="file" className="sr-only" onChange={e => handleExtraFileChange(e, 0)} accept="image/*" />
                        </label>
                        {/* Slot 3 */}
                        <label htmlFor="extra-upload-1" className="cursor-pointer relative aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-200 hover:border-brand-orange">
                            {extraImages[1] ? (
                                <img src={extraImages[1]} alt="Extra 2" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-2"><ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" /><span className="text-xs text-gray-400">Photo 3</span></div>
                            )}
                            <input id="extra-upload-1" type="file" className="sr-only" onChange={e => handleExtraFileChange(e, 1)} accept="image/*" />
                        </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">İlk fotoğraf kapak görseli olarak kullanılır.</p>
                </div>

                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                </div>
                
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Product Type</label>
                        <select id="type" value={type} onChange={e => setType(e.target.value as 'single' | 'collection')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm">
                            <option value="single">Single Prompt</option>
                            <option value="collection">Collection</option>
                        </select>
                    </div>
                     {type === 'collection' && (
                        <div>
                           <label htmlFor="promptCount" className="block text-sm font-medium text-gray-700">Number of Prompts</label>
                           <input type="number" id="promptCount" value={promptCount} onChange={e => setPromptCount(e.target.value)} min="2" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {type === 'single' ? 'Select Prompt' : 'Select Prompts'}
                        {type === 'collection' && ` (${selectedPromptIds.length} / ${promptCount || 0})`}
                    </label>
                    <div className="mt-1 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search your prompts..."
                            value={promptSearchTerm}
                            onChange={e => setPromptSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                        />
                    </div>
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                        {filteredPrompts.length > 0 ? (
                            filteredPrompts.map(prompt => (
                                <div 
                                    key={prompt.id}
                                    onClick={() => handlePromptSelect(prompt.id)}
                                    className={`flex items-center gap-3 p-2 border-b last:border-b-0 cursor-pointer ${selectedPromptIds.includes(prompt.id) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                                >
                                    <input 
                                        type={type === 'single' ? 'radio' : 'checkbox'}
                                        checked={selectedPromptIds.includes(prompt.id)}
                                        readOnly
                                        className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-gray-300 rounded pointer-events-none"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{prompt.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{prompt.description.substring(0, 80)}...</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-sm text-gray-500 text-center">No prompts found.</p>
                        )}
                    </div>
                </div>


                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">Original Price ($)</label>
                            <div className="relative group">
                                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center cursor-help font-bold">?</span>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-52 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 hidden group-hover:block z-10 shadow-lg">
                                    Ürünün normal/karşılaştırma fiyatı. Alıcı üstü çizili olarak görür ve tasarruf miktarını hesaplar. Paket fiyatından yüksek olmalı.
                                </div>
                            </div>
                        </div>
                        <input type="number" id="originalPrice" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} min="0" step="0.01" placeholder="0.00 (opsiyonel)" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Sale Price ($)</label>
                            <div className="relative group">
                                <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center cursor-help font-bold">?</span>
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-52 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 hidden group-hover:block z-10 shadow-lg">
                                    Alıcının ödeyeceği gerçek fiyat. Minimum ${MIN_MARKETPLACE_PRICE}.00 olmalıdır.
                                </div>
                            </div>
                        </div>
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min={MIN_MARKETPLACE_PRICE} step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                        <p className="mt-1 text-xs text-gray-400">Minimum: ${MIN_MARKETPLACE_PRICE}.00</p>
                        {suggestedPrice !== null && (
                            <p className="mt-1 text-xs text-brand-orange flex items-center gap-1 font-medium">
                                <SparklesIcon className="w-3 h-3" />
                                Similar prompts sell for ~${suggestedPrice.toFixed(2)}.
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                        <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. text-to-video, social-media" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" />
                    </div>
                </div>
                {error && <p className="text-sm text-red-500 pt-2">{error}</p>}
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                <button type="button" onClick={onClose} disabled={uploading} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-brand-green border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? 'Uploading...' : (isEditMode ? 'Save Changes' : 'Add Product')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
