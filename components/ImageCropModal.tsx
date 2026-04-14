
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from 'lucide-react';

interface ImageCropModalProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
  aspect?: number;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ image, onCropComplete, onClose, aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center lg:pl-64 p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-[#FCFDFE]">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Sesuaikan Foto</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-0.5">Geser dan zoom foto Anda</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[280px] bg-slate-50 border-b border-slate-50">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            showGrid={false}
            cropShape={aspect === 1 ? 'round' : 'rect'}
            classes={{
                containerClassName: 'bg-slate-50',
                cropAreaClassName: 'shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] !border-2 !border-white !rounded-[24px]',
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-5 space-y-5 bg-white">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex-1 relative flex items-center h-4">
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => onZoomChange(Number(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
                />
            </div>
            <ZoomIn className="w-3.5 h-3.5 text-slate-300" />
          </div>

          <div className="flex items-center gap-2.5">
             <button 
                onClick={() => setZoom(1)}
                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95 border border-slate-100"
                title="Reset Zoom"
             >
                <RotateCcw className="w-3.5 h-3.5" />
             </button>
             <button
                onClick={handleDone}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
             >
                <Check className="w-3.5 h-3.5" />
                Simpan & Unggah
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
