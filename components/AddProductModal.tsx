
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
  const [tags, setTags] = useState('');
  const [type, setType] = useState<'single' | 'collection'>('single');
  const [promptCount, setPromptCount] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [promptSearchTerm, setPromptSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
  
  const resetForm = () => {
      setTitle('');
      setDescription('');
      setPrice('');
      setTags('');
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

    const itemData: MarketplaceItemData = {
      id: itemToEdit?.id,
      title,
      description,
      price: Number(price),
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
                    <label className="block text-sm font-medium text-gray-700">Cover Photo</label>
                    <div className="mt-1 flex items-center gap-4">
                        <div className="w-40 h-24 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            {coverImage ? (
                                <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                        <label htmlFor="cover-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                            <span>Upload Image</span>
                            <input id="cover-upload" name="cover-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                        </label>
                    </div>
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
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min={MIN_MARKETPLACE_PRICE} step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                        <p className="mt-1 text-xs text-gray-400">Minimum: ${MIN_MARKETPLACE_PRICE}.00</p>
                        {suggestedPrice !== null && (
                            <p className="mt-1 text-xs text-brand-orange flex items-center gap-1 font-medium">
                                <SparklesIcon className="w-3 h-3" />
                                Analitik Önerisi: Benzer promptlar genelde ${suggestedPrice.toFixed(2)}'a satılıyor.
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
