import React, { useState } from 'react';
import { X, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatFare } from '../fare/fareEngine';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromName: string;
  toName: string;
  distanceKm: number;
  expectedFare: number;
  driverQuote?: number | null;
  rideTime?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  fromName,
  toName,
  distanceKm,
  expectedFare,
  driverQuote,
  rideTime
}) => {
  const { t } = useTranslation();
  const [vehicleNo, setVehicleNo] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const excessAmount = driverQuote && driverQuote > expectedFare ? driverQuote - expectedFare : 0;
  const nowStr = new Date().toLocaleString('en-IN');

  const complaintText = `[FORMAL COMPLAINT: AUTO-RICKSHAW FARE VIOLATION]
To: State Transport Authority / Regional Transport Office (RTO), Tamil Nadu

1. Date & Time of Incident: ${nowStr} (Ride Time: ${rideTime || 'Now'})
2. Auto Registration No: ${vehicleNo.trim() || '[VEHICLE NUMBER PENDING]'}
3. Journey Route: ${fromName || 'Origin'} to ${toName || 'Destination'}
4. Distance: ${distanceKm} km
5. Location Landmark: ${locationDetails.trim() || 'Chennai Metropolitan Area'}
6. Legal Government Fare (Gazette Notification 27-10-2026): ${formatFare(expectedFare)}
7. Fare Demanded by Driver: ${driverQuote ? formatFare(driverQuote) : '[NOT ENTERED]'}
8. Excess Amount Overcharged: ${excessAmount > 0 ? formatFare(excessAmount) : 'Refusal of meter / arbitrary quote'}

Statutory Notice: Motor Vehicles Act, 1988 Section 192A (Permit violation for refusal of meter / overcharging statutory tariff).
Helpline reference: [TODO: Pending confirmation of toll-free complaint helpline 1800-425-5430]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaintText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-rose-200 dark:border-rose-900/40 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {t('report_modal_title')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          If an auto driver refuses the legal meter or demands an illegal flat fare, this pre-formatted grievance report can be submitted to the Regional Transport Office (RTO) or traffic police.
        </p>

        {/* Input fields */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Auto Registration Number (e.g., TN 01 AB 1234)
            </label>
            <input
              type="text"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              placeholder="TN 0X XX XXXX"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase text-sm focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stand / Pickup Landmark Details
            </label>
            <input
              type="text"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="e.g. Near Central Station Auto Stand"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500/50"
            />
          </div>
        </div>

        {/* Complaint Preview Box */}
        <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Prefilled Grievance Record
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto">
            {complaintText}
          </pre>
        </div>

        {/* Official placeholder notification note */}
        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200">
          <strong>Official Note:</strong> {t('complaint_placeholder')}
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t('copied')}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Complaint Record
              </>
            )}
          </button>

          <a
            href="https://transport.tn.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
          >
            TN Transport Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
