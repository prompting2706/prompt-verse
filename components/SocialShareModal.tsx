
import React, { useEffect, useRef, useState } from 'react';
import { type Prompt } from '../types';
import { XIcon, CopyIcon, CheckIcon, DownloadIcon, ShareIcon, TwitterXIcon, LinkedInIcon, FacebookIcon, WhatsAppIcon, TelegramIcon } from './icons/Icons';

interface SocialShareModalProps {
  prompt: Prompt;
  onClose: () => void;
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      if (lines.length === maxLines - 1) {
        let last = current;
        while (ctx.measureText(last + '...').width > maxWidth && last.length > 3) {
          last = last.slice(0, -1).trimEnd();
        }
        lines.push(last + '...');
        return lines;
      }
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines;
};

const drawCard = (canvas: HTMLCanvasElement, prompt: Prompt): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1200, H = 630;
  canvas.width = W;
  canvas.height = H;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.55, '#f59e0b');
  grad.addColorStop(1, '#fbbf24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(W + 80, -80, 220, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(-60, H + 40, 200, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  const PAD = 48;
  roundRect(ctx, PAD, PAD, W - PAD * 2, H - PAD * 2, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.fill();

  const IX = PAD + 56;
  const IW = W - PAD * 2 - 112;

  ctx.font = 'bold 26px system-ui, Arial, sans-serif';
  ctx.fillStyle = '#f97316';
  ctx.fillText('✶ PromptVerse', IX, PAD + 62);

  ctx.font = 'bold 52px system-ui, Arial, sans-serif';
  ctx.fillStyle = '#111827';
  const titleLines = wrapText(ctx, prompt.title, IW, 2);
  let y = PAD + 130;
  for (const line of titleLines) {
    ctx.fillText(line, IX, y);
    y += 70;
  }

  const preview = prompt.promptText
    .replace(/\{\{[^}]+\}\}/g, '_____')
    .replace(/\n+/g, ' ')
    .trim();
  ctx.font = '27px system-ui, Arial, sans-serif';
  ctx.fillStyle = '#6b7280';
  const previewLines = wrapText(ctx, preview, IW, 3);
  y += 20;
  for (const line of previewLines) {
    ctx.fillText(line, IX, y);
    y += 42;
  }

  const divY = H - PAD - 100;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(IX, divY);
  ctx.lineTo(W - IX, divY);
  ctx.stroke();

  const tags = prompt.tags.slice(0, 4);
  if (tags.length > 0) {
    ctx.font = 'bold 22px system-ui, Arial, sans-serif';
    ctx.fillStyle = '#f97316';
    ctx.fillText(tags.map(t => `#${t}`).join('  '), IX, H - PAD - 50);
  }

  const urlText = 'promptverse.app';
  ctx.font = '22px system-ui, Arial, sans-serif';
  ctx.fillStyle = '#9ca3af';
  const urlW = ctx.measureText(urlText).width;
  ctx.fillText(urlText, W - IX - urlW, H - PAD - 50);
};

const SOCIALS = [
  {
    name: 'Twitter',
    Icon: TwitterXIcon,
    bg: 'bg-black hover:bg-gray-800',
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: 'LinkedIn',
    Icon: LinkedInIcon,
    bg: 'bg-blue-700 hover:bg-blue-800',
    getUrl: (_: string, url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Facebook',
    Icon: FacebookIcon,
    bg: 'bg-blue-600 hover:bg-blue-700',
    getUrl: (_: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'WhatsApp',
    Icon: WhatsAppIcon,
    bg: 'bg-green-500 hover:bg-green-600',
    getUrl: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    name: 'Telegram',
    Icon: TelegramIcon,
    bg: 'bg-sky-500 hover:bg-sky-600',
    getUrl: (text: string, url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

const SocialShareModal: React.FC<SocialShareModalProps> = ({ prompt, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (canvasRef.current) drawCard(canvasRef.current, prompt);
  }, [prompt]);

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const shareUrl = `https://promptverse.app/#/prompt/${prompt.id}`;
  const shareText = `"${prompt.title}" — PromptVerse'de bu harika prompt'u kesfet!`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${prompt.title.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}-promptverse.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const nativeShare = () => {
    if (!canvasRef.current) return;
    setIsSharing(true);
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) { setIsSharing(false); return; }
      const file = new File([blob], 'prompt-card.png', { type: 'image/png' });
      try {
        const shareData: ShareData = { title: prompt.title, text: shareText, url: shareUrl };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ ...shareData, files: [file] });
        } else {
          await navigator.share(shareData);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          // Share API failed or was cancelled — no action needed
        }
      } finally {
        setIsSharing(false);
      }
    }, 'image/png');
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Prompt Kartını Paylaş</h2>
            <p className="text-xs text-gray-400 mt-0.5">Kartı indir veya sosyal medyada paylaş</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <span className="text-xs text-gray-400 flex-shrink-0 font-semibold uppercase tracking-wide">Link</span>
            <span className="flex-1 text-sm text-gray-600 font-mono truncate">{shareUrl}</span>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                linkCopied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {linkCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
              {linkCopied ? 'Kopyalandı!' : 'Kopyala'}
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sosyal Medyada Paylaş</p>
            <div className="flex gap-2 flex-wrap">
              {SOCIALS.map(({ name, Icon, bg, getUrl }) => (
                <a
                  key={name}
                  href={getUrl(shareText, shareUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${bg}`}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Instagram &amp; TikTok</p>
            {canNativeShare ? (
              <button
                onClick={nativeShare}
                disabled={isSharing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)' }}
              >
                <ShareIcon className="w-4 h-4" />
                {isSharing ? 'Paylaşılıyor...' : 'Telefonda Paylaş'}
                <span className="text-xs font-normal opacity-80 ml-1">(Instagram, TikTok dahil)</span>
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm">
                <ShareIcon className="w-4 h-4" />
                Telefonda Paylaş
                <span className="text-xs ml-1">— Sadece mobil tarayıcılarda çalışır</span>
              </div>
            )}
          </div>

          <button
            onClick={downloadPNG}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange transition-colors font-semibold text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            PNG Olarak İndir
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialShareModal;
