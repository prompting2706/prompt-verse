


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type Campaign, type Prompt } from '../types';
import { RocketLaunchIcon, XIcon, ArrowLeftIcon, SearchIcon, ImageIcon, VideoIcon, EyeIcon } from './icons/Icons';
import { storageService } from '../lib/storageService';

interface CreateCampaignPageProps {
  onSave: (campaignData: Omit<Campaign, 'id' | 'totalImpressions' | 'totalSales' | 'promptStats'> & { id?: string }) => void;
  onCancel: () => void;
  userPrompts: Prompt[];
  campaignToEdit?: Campaign;
  userId: string;
}

const CreateCampaignPage: React.FC<CreateCampaignPageProps> = ({ onSave, onCancel, userPrompts, campaignToEdit, userId }) => {
    const [purpose, setPurpose] = useState<'marketplace' | 'social'>('marketplace');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState(50);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [noEndDate, setNoEndDate] = useState(false);
    const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');
    const [creativeUrl, setCreativeUrl] = useState('');
    const [creativeType, setCreativeType] = useState<'image' | 'video'>('image');
    const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
    const [promptSearch, setPromptSearch] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const selectedFileRef = useRef<File | null>(null);
    const previewUrlRef = useRef<string | null>(null);

    const isEditMode = !!campaignToEdit;

    const formatDateTimeForInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    };

    useEffect(() => {
        if (isEditMode && campaignToEdit) {
            setName(campaignToEdit.name);
            setDescription(campaignToEdit.description);
            setBudget(campaignToEdit.budget);
            setStartDate(formatDateTimeForInput(campaignToEdit.startDate));
            if (campaignToEdit.endDate) {
                setEndDate(formatDateTimeForInput(campaignToEdit.endDate));
                setNoEndDate(false);
            } else {
                setEndDate('');
                setNoEndDate(true);
            }
            setStatus(campaignToEdit.status);
            setCreativeUrl(campaignToEdit.creativeUrl);
            setCreativeType(campaignToEdit.creativeType);
            setSelectedPromptIds(campaignToEdit.promptIds);
            if (campaignToEdit.purpose) setPurpose(campaignToEdit.purpose);
        } else {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            setStartDate(formatDateTimeForInput(today.toISOString()));
            setEndDate(formatDateTimeForInput(nextWeek.toISOString()));
            setNoEndDate(false);
            setStatus('active');
        }
    }, [campaignToEdit, isEditMode]);

    const estimatedImpressions = useMemo(() => {
        if (budget < 10) return { lower: 0, upper: 0 };
        const cpmLower = 12; // Higher CPM means fewer impressions
        const cpmUpper = 8;  // Lower CPM means more impressions

        const lowerBound = Math.round(((budget / cpmLower) * 1000) / 100) * 100;
        const upperBound = Math.round(((budget / cpmUpper) * 1000) / 100) * 100;

        return { lower: lowerBound, upper: upperBound };
    }, [budget]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            const preview = URL.createObjectURL(file);
            previewUrlRef.current = preview;
            selectedFileRef.current = file;
            setCreativeUrl(preview);
            setCreativeType(file.type.startsWith('video/') ? 'video' : 'image');
        }
    };

    const handlePromptToggle = (promptId: string) => {
        setSelectedPromptIds(prev =>
            prev.includes(promptId) ? prev.filter(id => id !== promptId) : [...prev, promptId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !description || !creativeUrl || selectedPromptIds.length === 0) {
            setError('Please fill all fields, upload a creative, and select at least one prompt.');
            return;
        }
        if (!noEndDate && !endDate) {
            setError('End date is required unless "No end date" is checked.');
            return;
        }
        if (!noEndDate && endDate && new Date(endDate) < new Date(startDate)) {
            setError('End date cannot be before the start date.');
            return;
        }

        let finalCreativeUrl = creativeUrl;
        if (selectedFileRef.current) {
            setUploading(true);
            try {
                finalCreativeUrl = await storageService.uploadCampaignCreative(userId, selectedFileRef.current);
                selectedFileRef.current = null;
            } catch {
                setError('Failed to upload creative. Please try again.');
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        onSave({
            id: campaignToEdit?.id,
            name,
            description,
            budget,
            startDate: new Date(startDate).toISOString(),
            endDate: noEndDate || !endDate ? undefined : new Date(endDate).toISOString(),
            creativeUrl: finalCreativeUrl,
            creativeType,
            promptIds: selectedPromptIds,
            status,
            purpose,
        });
    };
    
    const filteredPrompts = userPrompts.filter(p => p.title.toLowerCase().includes(promptSearch.toLowerCase()));

    return (
        <div className="max-w-4xl mx-auto">
             <button onClick={onCancel} className="flex items-center gap-2 text-gray-600 hover:text-brand-dark-gray mb-6">
                <ArrowLeftIcon />
                Back to My Store
            </button>
            <form onSubmit={handleSubmit}>
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Campaign' : 'Create New Campaign'}</h1>
                        <p className="text-gray-500 text-sm">Promptlarını daha fazla kişiye ulaştırmak için kampanya oluştur.</p>
                    </div>

                    {/* Campaign purpose */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Kampanya Türü</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPurpose('marketplace')}
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${purpose === 'marketplace' ? 'border-brand-orange bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="text-2xl mt-0.5">🏪</span>
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">Marketplace Öne Çıkarma</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Ürünlerin marketplace'de daha üst sıralarda görünsün. Pro+ planı gerektirir.</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPurpose('social')}
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${purpose === 'social' ? 'border-brand-orange bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="text-2xl mt-0.5">📣</span>
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">Sosyal Medya Tanıtımı</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Promptların keşfet akışında daha fazla kişiye gösterilsin. Tüm planlar.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Campaign Name</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                        </div>
                        {isEditMode && (
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Campaign Status</label>
                                <select 
                                    id="status" 
                                    value={status} 
                                    onChange={e => setStatus(e.target.value as 'active' | 'paused')} 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm disabled:bg-gray-100"
                                    disabled={status === 'completed'}
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused (Not Active)</option>
                                </select>
                                {status === 'completed' && <p className="text-xs text-gray-500 mt-1">This campaign has completed and cannot be reactivated.</p>}
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Campaign Notes</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                            <input type="datetime-local" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date & Time</label>
                            <input type="datetime-local" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={noEndDate} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm disabled:bg-gray-100" required={!noEndDate} />
                            <div className="mt-2">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={noEndDate} onChange={e => { setNoEndDate(e.target.checked); if(e.target.checked) setEndDate(''); }} className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                                    <span className="ml-2 text-sm text-gray-600">No end date (runs indefinitely)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget ($)</label>
                        <input type="number" id="budget" value={budget} onChange={e => setBudget(Number(e.target.value))} min="10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm" required />
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <EyeIcon className="w-4 h-4" />
                            <span>
                                Est. {estimatedImpressions.lower.toLocaleString()} - {estimatedImpressions.upper.toLocaleString()} impressions
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ad Creative</label>
                        <div className="mt-1 flex items-center gap-4">
                            <div className="w-48 h-28 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                {creativeUrl ? (
                                    creativeType === 'image' ? 
                                    <img src={creativeUrl} alt="Creative preview" className="w-full h-full object-cover" /> :
                                    <video src={creativeUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <label htmlFor="creative-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                                <span>Upload Image/Video</span>
                                <input id="creative-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/*" />
                            </label>
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700">Select Prompts to Promote ({selectedPromptIds.length})</label>
                        <div className="mt-1 relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon /></span>
                            <input type="text" placeholder="Search your prompts..." value={promptSearch} onChange={e => setPromptSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-orange focus:border-brand-orange sm:text-sm" />
                        </div>
                        <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                            {filteredPrompts.map(prompt => (
                                <div key={prompt.id} onClick={() => handlePromptToggle(prompt.id)} className={`flex items-center gap-3 p-2 border-b last:border-b-0 cursor-pointer ${selectedPromptIds.includes(prompt.id) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                                    <input type="checkbox" checked={selectedPromptIds.includes(prompt.id)} readOnly className="h-4 w-4 text-brand-orange focus:ring-brand-orange border-gray-300 rounded pointer-events-none" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{prompt.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onCancel} disabled={uploading} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={uploading} className="px-6 py-2 bg-brand-green border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        {uploading ? 'Uploading...' : (isEditMode ? 'Save Changes' : 'Launch Campaign')}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 text-right">{error}</p>}
            </form>
        </div>
    );
};

export default CreateCampaignPage;