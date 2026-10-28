import React, { useRef, useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatFare } from '../fare/fareEngine';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromName: string;
  toName: string;
  distanceKm: number;
  expectedFare: number;
  oldFareAmount: number;
  isNightTime: boolean;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  fromName,
  toName,
  distanceKm,
  expectedFare,
  oldFareAmount,
  isNightTime
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const shareText = `🛺 *FairRide - Legal Tamil Nadu Auto Fare*
📍 *Route:* ${fromName || 'Pickup'} ➔ ${toName || 'Destination'}
📏 *Distance:* ${distanceKm} km
💰 *Legal Fare (2026):* ${formatFare(expectedFare)} ${isNightTime ? '(Night rate)' : ''}
📜 *Old Fare (2013):* ${formatFare(oldFareAmount)}
🗓️ *Date:* ${todayStr}
⚖️ *Government Notification:* 27 Oct 2026 Gazette
Check your fare: https://fairride.tn`;

  useEffect(() => {
    if (!isOpen) return;

    // Render Canvas Share Card
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a'); // slate-900
    bgGrad.addColorStop(1, '#1e293b'); // slate-800
    ctx.fillStyle = bgGrad;
    ctx.roundRect(0, 0, width, height, 24);
    ctx.fill();

    // Border highlight
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.roundRect(0, 0, width, height, 24);
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(24, 24, width - 48, 70, 14);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.fillText('FairRide  🛺  Official Tamil Nadu Auto Fare', 44, 68);

    // Route Info Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(24, 110, width - 48, 110, 16);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('ROUTE & TRIP DETAILS', 44, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, system-ui, sans-serif';
    const routeText = `${fromName || 'Chennai'}  ➔  ${toName || 'Destination'}`;
    const truncatedRoute = routeText.length > 46 ? routeText.slice(0, 44) + '...' : routeText;
    ctx.fillText(truncatedRoute, 44, 175);

    ctx.fillStyle = '#fde68a';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText(`Distance: ${distanceKm} km  •  ${isNightTime ? 'Night Rate (10pm - 5am)' : 'Day Rate'}  •  ${todayStr}`, 44, 203);

    // Big Fare Highlight
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.beginPath();
    ctx.roundRect(24, 235, (width - 48) / 2 - 10, 150, 16);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('LEGAL GOVT FARE (2026)', 44, 270);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Inter, system-ui, sans-serif';
    ctx.fillText(formatFare(expectedFare), 44, 335);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px Inter, system-ui, sans-serif';
    ctx.fillText('✓ Notified 27 Oct 2026', 44, 365);

    // Old Fare Comparison Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.roundRect(24 + (width - 48) / 2 + 10, 235, (width - 48) / 2 - 10, 150, 16);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText('OLD FARE (2013 G.O. 611)', 24 + (width - 48) / 2 + 30, 270);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 44px Inter, system-ui, sans-serif';
    ctx.fillText(formatFare(oldFareAmount), 24 + (width - 48) / 2 + 30, 330);

    const diff = Math.round((expectedFare - oldFareAmount) * 100) / 100;
    const pct = oldFareAmount > 0 ? Math.round((diff / oldFareAmount) * 100) : 0;
    ctx.fillStyle = '#f87171';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillText(`+${formatFare(diff)} (+${pct}%) increase`, 24 + (width - 48) / 2 + 30, 365);

    // Footer note
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText('Estimate from road distance. Vehicle meter and official gazette notification decide.', 44, 435);

    setImageUrl(canvas.toDataURL('image/png'));
  }, [isOpen, fromName, toName, distanceKm, expectedFare, oldFareAmount, isNightTime, todayStr]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    const canvas = canvasRef.current;
    if (navigator.share) {
      try {
        if (canvas && navigator.canShare) {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], 'fairride_fare.png', { type: 'image/png' });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: 'FairRide Auto Fare',
                  text: shareText,
                  files: [file]
                });
                return;
              }
            }
            await navigator.share({
              title: 'FairRide Auto Fare',
              text: shareText
            });
          });
        } else {
          await navigator.share({
            title: 'FairRide Auto Fare',
            text: shareText
          });
        }
      } catch (e) {
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛺</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {t('share_whatsapp')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex justify-center">
          <canvas ref={canvasRef} className="w-full h-auto max-w-full rounded-2xl block" />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Share2 className="w-5 h-5" />
            {t('share_whatsapp')}
          </button>

          <button
            onClick={handleCopyText}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-emerald-500" />
                {t('copied')}
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                {t('copy_text')}
              </>
            )}
          </button>
        </div>

        {imageUrl && (
          <div className="mt-3 text-center">
            <a
              href={imageUrl}
              download="fairride_fare.png"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium py-1"
            >
              <Download className="w-3.5 h-3.5" />
              Download card image (.png)
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
