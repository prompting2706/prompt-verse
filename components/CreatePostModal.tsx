
import React, { useState, useRef } from 'react';
import { XIcon, ImageIcon } from './icons/Icons';
import { storageService } from '../lib/storageService';

export interface PostData {
    caption: string;
    tags: string[];
    imageUrl?: string;
    videoUrl?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PostData) => void;
  userId: string;
  initialCaption?: string;
}

const MAX_VIDEO_SIZE_MB = 50;

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSave, userId, initialCaption }) => {
    const [caption, setCaption] = useState(initialCaption ?? '');
    const [tags, setTags] = useState('');
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewUrlRef = useRef<string | null>(null);

    React.useEffect(() => {
        if (isOpen) setCaption(initialCaption ?? '');
    }, [isOpen, initialCaption]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const isVideo = file.type.startsWith('video/');

        if (isVideo && file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setError(`Video size must be under ${MAX_VIDEO_SIZE_MB}MB.`);
            e.target.value = '';
            return;
        }

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const preview = URL.createObjectURL(file);
        previewUrlRef.current = preview;
        setSelectedFile(file);
        setMediaPreview(preview);
        setMediaType(isVideo ? 'video' : 'image');
    };

    const handleRemoveMedia = () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
        setMediaPreview(null);
        setMediaType(null);
        setSelectedFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!caption) {
            setError('Caption is required.');
            return;
        }
        setError('');

        let imageUrl: string | undefined;
        let videoUrl: string | undefined;

        if (selectedFile && mediaType) {
            setUploading(true);
            try {
                const publicUrl = await storageService.uploadPostMedia(userId, selectedFile);
                if (mediaType === 'image') imageUrl = publicUrl;
                else videoUrl = publicUrl;
            } catch {
                setError('Failed to upload media. Please try again.');
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        onSave({ caption, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean), imageUrl, videoUrl });
        setCaption('');
        setTags('');
        handleRemoveMedia();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Create a New Post</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Media <span className="text-gray-400 font-normal">(Optional — image or video)</span>
                            </label>
                            <div className="mt-2">
                                {mediaPreview ? (
                                    <div className="relative w-full rounded-lg overflow-hidden bg-black">
                                        {mediaType === 'video' ? (
                                            <video
                                                ref={videoRef}
                                                src={mediaPreview}
                                                controls
                                                className="w-full max-h-56 object-contain"
                                            />
                                        ) : (
                                            <img src={mediaPreview} alt="Post preview" className="w-full max-h-56 object-contain" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleRemoveMedia}
                                            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                                            title="Remove media"
                                        >
                                            <XIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                            {mediaType === 'video' ? '🎬 Video' : '🖼️ Image'}
                                        </span>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="media-upload"
                                        className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-orange hover:bg-orange-50 transition-colors"
                                    >
                                        <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Click to upload image or video</span>
                                        <span className="text-xs text-gray-400 mt-0.5">Max {MAX_VIDEO_SIZE_MB}MB for video</span>
                                        <input
                                            id="media-upload"
                                            type="file"
                                            className="sr-only"
                                            onChange={handleFileChange}
                                            accept="image/*,video/*"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="caption" className="block text-sm font-medium text-gray-700">Caption</label>
                                <span className="text-xs text-gray-400">Birini etiketlemek için @kullanıcıadı yazın</span>
                            </div>
                            <textarea
                                id="caption"
                                value={caption}
                                onChange={e => setCaption(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                                placeholder="Gönderinizi açıklayın... @birini etiketleyin"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                            <input
                                type="text"
                                id="tags"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                placeholder="e.g. ai-art, inspiration"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-brand-orange focus:border-brand-orange sm:text-sm"
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>

                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={uploading} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={uploading} className="px-4 py-2 bg-brand-green border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed">
                            {uploading ? 'Uploading...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
