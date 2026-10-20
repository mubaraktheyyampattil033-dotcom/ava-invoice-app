import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { unlockWithPasscode, MASTER_PASSCODE } from '../services/auth';

interface PasscodeLockProps {
  onUnlock: () => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({ onUnlock }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockWithPasscode(passcode)) {
      setError(false);
      onUnlock();
    } else {
      setError(true);
    }
  };

  const handleQuickFill = () => {
    setPasscode(MASTER_PASSCODE);
    setError(false);
  };

  return (
    <div
      id="passcode-lock-screen"
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6"
    >
      <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Header Icon & Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AVA UAE Finance Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Bank & Petty Cash Management • United Arab Emirates (AED)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="passcode-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Master Access Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="passcode-input"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter access code..."
                autoFocus
                className={`w-full pl-11 pr-11 py-3.5 bg-slate-950/70 border rounded-xl text-slate-100 placeholder-slate-500 font-mono text-lg focus:outline-none transition-all ${
                  error
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                id="toggle-passcode-visibility-btn"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1.5 animate-pulse">
                Incorrect passcode. Default master passcode is <code className="font-bold bg-rose-950/60 px-1 py-0.5 rounded">ava2026</code>.
              </p>
            )}
          </div>

          <button
            type="submit"
            id="unlock-submit-btn"
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <span>Unlock Secure Ledger</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Info & Quick Hint */}
        <div className="mt-6 pt-6 border-t border-slate-700/60 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Master Key: <span className="font-mono text-emerald-400 font-semibold">{MASTER_PASSCODE}</span></span>
          </div>
          <button
            type="button"
            id="quick-fill-passcode-btn"
            onClick={handleQuickFill}
            className="text-xs text-emerald-400/90 hover:text-emerald-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            Auto-fill Master Passcode
          </button>
        </div>
      </div>
    </div>
  );
};
