import React, { useState } from 'react';
import {
  RefreshCw,
  Lock,
  CloudCheck,
  CloudAlert,
  Settings,
  Tags,
  FileSpreadsheet,
  Building2,
  LogOut,
  CheckCircle2,
  Wifi,
  WifiOff,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logoutGoogle } from '../services/auth';

interface HeaderProps {
  onLock: () => void;
  onOpenSettings: () => void;
  onOpenCategories: () => void;
  onOpenReport: () => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  hasUnsyncedChanges: boolean;
  lastSyncTime: string | null;
  googleUser: User | null;
  onGoogleAuthChange: (user: User | null) => void;
  isOnline: boolean;
  spreadsheetId?: string;
  unsyncedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onLock,
  onOpenSettings,
  onOpenCategories,
  onOpenReport,
  onSync,
  isSyncing,
  hasUnsyncedChanges,
  lastSyncTime,
  googleUser,
  onGoogleAuthChange,
  isOnline,
  spreadsheetId,
  unsyncedCount = 0,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onGoogleAuthChange(result.user);
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      setAuthError('Sign in cancelled or failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    onGoogleAuthChange(null);
  };

  return (
    <header
      id="app-main-header"
      className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950/50">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  AVA UAE Finance
                </h1>
                <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                  AED
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Bank & Petty Cash Operational Ledger
              </p>
            </div>
          </div>

          {/* Actions & Sync Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline & Sync Badge */}
            <div
              id="sync-status-indicator"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                !isOnline
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : isSyncing
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : hasUnsyncedChanges
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Offline</span>
                  {unsyncedCount > 0 && (
                    <span className="text-[10px] bg-amber-400/20 px-1 rounded font-bold">
                      {unsyncedCount} Queued
                    </span>
                  )}
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : hasUnsyncedChanges ? (
                <>
                  <CloudAlert className="w-3.5 h-3.5 text-orange-400" />
                  <span>{unsyncedCount > 0 ? `${unsyncedCount} Unsynced` : 'Unsynced'}</span>
                </>
              ) : (
                <>
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">
                    Synced {lastSyncTime ? `(${lastSyncTime})` : ''}
                  </span>
                  <span className="sm:hidden">Synced</span>
                </>
              )}
            </div>

            {/* Direct Google Sheet Button (when linked) */}
            {spreadsheetId && (
              <a
                id="header-open-sheet-link"
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Live Google Sheet in Google Drive"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Sheet</span>
                <ExternalLink className="w-3 h-3 text-emerald-400/70" />
              </a>
            )}

            {/* Sync Now Button */}
            <button
              id="sync-now-header-btn"
              onClick={onSync}
              disabled={isSyncing}
              title={isOnline ? "Sync now with Google Sheets & Apps Script" : "You are currently offline. Changes are saved locally and will auto-sync on reconnect."}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Sync Now</span>
            </button>

            {/* Google Sheets / Workspace Auth Button */}
            {googleUser ? (
              <div className="flex items-center gap-2 pl-1">
                <div
                  id="google-user-chip"
                  className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300"
                  title={`Connected as ${googleUser.email}`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate max-w-[140px]">{googleUser.email}</span>
                </div>
                <button
                  id="google-signout-btn"
                  onClick={handleLogout}
                  title="Disconnect Google Account"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="google-signin-header-btn"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                title="Connect Google Drive & Sheets"
                className="gsi-material-button text-xs py-1.5 px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isSigningIn ? 'Connecting...' : 'Google Sheets'}
                </span>
              </button>
            )}

            {/* Quick Action Navigation */}
            <button
              id="header-categories-btn"
              onClick={onOpenCategories}
              title="UAE Categories & Subcategories"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Tags className="w-4 h-4" />
            </button>

            <button
              id="header-accountant-report-btn"
              onClick={onOpenReport}
              title="Accountant Hand-off Report"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              id="header-settings-btn"
              onClick={onOpenSettings}
              title="Cloud Sync & REST API Settings"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lock Button */}
            <button
              id="header-lock-ledger-btn"
              onClick={onLock}
              title="Lock Master Access"
              className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {authError && (
          <div className="pb-2 text-xs text-rose-400 flex items-center justify-between">
            <span>{authError}</span>
            <button
              onClick={() => setAuthError(null)}
              className="underline text-slate-400 hover:text-slate-200 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
