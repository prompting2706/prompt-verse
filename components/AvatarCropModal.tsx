import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { XIcon } from './icons/Icons';
import { toast } from '../utils/toast';

interface AvatarCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => Promise<void>;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const size = 400;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    size,
    size,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.92);
  });
}

const AvatarCropModal: React.FC<AvatarCropModalProps> = ({ isOpen, onClose, onSave }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // BUG: file size was not validated despite UI showing "Maks 5 MB"
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu 5 MB\'ı aşamaz.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setImgSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      await onSave(blob);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold">Profil Fotoğrafı Güncelle</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!imgSrc ? (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-orange hover:bg-orange-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Fotoğraf seç</span>
              <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Maks 5 MB</span>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onSelectFile} />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500 text-center">Görünmesini istediğin alanı seç — kare kırpma</p>
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-80 rounded-xl overflow-hidden"
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Kırpılacak fotoğraf"
                  onLoad={onImageLoad}
                  className="max-h-80 max-w-full object-contain"
                />
              </ReactCrop>
              <button
                type="button"
                onClick={() => { setImgSrc(''); setCrop(undefined); setCompletedCrop(undefined); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Farklı fotoğraf seç
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={handleClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            İptal
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!completedCrop || saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-green rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Yükleniyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropModal;
