import React, { useState, useRef } from 'react';
import {
  X,
  Cloud,
  Check,
  Copy,
  RefreshCw,
  Key,
  Database,
  HelpCircle,
  ExternalLink,
  Shield,
  Coins,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { SyncSettings, Transaction } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../services/syncService';
import { formatAED } from '../services/storage';
import {
  downloadCsvTemplate,
  parseTransactionsCsv,
  CsvParseResult,
} from '../services/csvImporter';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  onSaveSettings: (settings: SyncSettings) => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  pettyCashAlertLevel: number;
  onSavePettyCashAlertLevel: (val: number) => void;
  googleUserEmail: string | null;
  transactions: Transaction[];
  onImportTransactions: (
    txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>[]
  ) => void;
  onResetToFreshData?: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onManualSync,
  isSyncing,
  pettyCashAlertLevel,
  onSavePettyCashAlertLevel,
  googleUserEmail,
  transactions,
  onImportTransactions,
  onResetToFreshData,
}) => {
  const [gasUrl, setGasUrl] = useState(settings.googleAppsScriptUrl);
  const [apiKey, setApiKey] = useState(settings.apiKey || 'ava-finance-2026');
  const [autoSync, setAutoSync] = useState(settings.autoSync);
  const [alertLevel, setAlertLevel] = useState(pettyCashAlertLevel.toString());
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'CSV_IMPORT' | 'SCRIPT_TEMPLATE'>('SETTINGS');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // CSV Import State
  const [isDragging, setIsDragging] = useState(false);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setCsvFileName(file.name);
    setIsParsing(true);
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      try {
        const result = parseTransactionsCsv(content, transactions);
        setParseResult(result);
      } catch (err: any) {
        setParseResult({
          valid: [],
          duplicates: [],
          errors: [{ row: 0, reason: `Failed to read file: ${err.message || 'Malformed format'}` }],
          totalRows: 0,
        });
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setIsParsing(false);
      setParseResult({
        valid: [],
        duplicates: [],
        errors: [{ row: 0, reason: 'Could not read CSV file from disk' }],
        totalRows: 0,
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!parseResult || parseResult.valid.length === 0) return;

    let recordsToImport = parseResult.valid.map((item) => item.data);
    if (skipDuplicates) {
      recordsToImport = parseResult.valid
        .filter((item) => !item.isDuplicate)
        .map((item) => item.data);
    }

    if (recordsToImport.length === 0) {
      alert('All parsed transactions are flagged duplicates. Uncheck "Skip Flagged Duplicates" if you wish to import them anyway.');
      return;
    }

    onImportTransactions(recordsToImport);
    setImportSuccessCount(recordsToImport.length);
    setParseResult(null);
    setCsvFileName(null);
  };

  const handleResetCsvState = () => {
    setParseResult(null);
    setCsvFileName(null);
    setImportSuccessCount(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      googleAppsScriptUrl: gasUrl.trim(),
      apiKey: apiKey.trim() || 'ava-finance-2026',
      autoSync,
    });

    const parsedAlert = parseFloat(alertLevel);
    if (!isNaN(parsedAlert) && parsedAlert >= 0) {
      onSavePettyCashAlertLevel(parsedAlert);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      id="sync-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Cloud Sync & Backend Configuration
              </h2>
              <p className="text-xs text-slate-400">
                Google Sheets REST API, Apps Script & Local-First Resilience
              </p>
            </div>
          </div>

          <button
            id="close-sync-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SETTINGS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            API & Sync Settings
          </button>
          <button
            type="button"
            id="tab-csv-bulk-import"
            onClick={() => setActiveTab('CSV_IMPORT')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'CSV_IMPORT'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Bulk Import</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-mono">
              Past Data
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SCRIPT_TEMPLATE')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'SCRIPT_TEMPLATE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Google Apps Script Template</span>
            <span className="text-[10px] bg-sky-500/10 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/20">
              Free Backend
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'SETTINGS' ? (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Architecture Info Callout */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Local-First & Dual Cloud Sync Architecture</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All transactions and digital receipts work 100% offline in browser storage so your field operators never lose data. You can sync in real-time either directly via your connected Google Account or through a Google Apps Script REST Endpoint.
                </p>
                {googleUserEmail && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mt-2 pt-2 border-t border-slate-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active Google Workspace Account: {googleUserEmail}</span>
                  </div>
                )}
                {settings.spreadsheetId && (
                  <div className="flex items-center justify-between gap-3 text-xs bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-lg mt-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-mono">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Linked Sheet: {settings.spreadsheetName || 'AVA UAE Finance Ledger (AED)'}</span>
                    </div>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Open in Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Google Apps Script Web App REST Endpoint URL */}
              <div>
                <label
                  htmlFor="gas-endpoint-url-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Google Apps Script Web App REST Endpoint URL
                </label>
                <input
                  id="gas-endpoint-url-input"
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank to use direct Google Sheets API with your authenticated account, or paste your deployed Apps Script URL.
                </p>
              </div>

              {/* API Authentication Key */}
              <div>
                <label
                  htmlFor="api-auth-key-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Single-Key API Authentication
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    id="api-auth-key-input"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <code className="text-emerald-400">ava-finance-2026</code> (Sent in header/body payload to authenticate script calls).
                </p>
              </div>

              {/* Petty Cash Reserve Alert Level */}
              <div>
                <label
                  htmlFor="petty-cash-alert-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Petty Cash Minimum Reserve Alert Level (AED)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <input
                    id="petty-cash-alert-input"
                    type="number"
                    min="0"
                    step="100"
                    value={alertLevel}
                    onChange={(e) => setAlertLevel(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Triggers an in-app replenishment warning when physical cash reserves drop below this threshold.
                </p>
              </div>

              {/* Auto Sync Toggle */}
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">
                    Automated Background Sync on Save / Delete
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Automatically syncs with cloud storage whenever a transaction is recorded, updated, or removed.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Reset to Fresh Demo Data */}
              {onResetToFreshData && (
                <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-300">
                      Reset to Fresh Fleet Ledger Dataset
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Restores all 13 categories, 11 fleet vehicle plates, and clean sample transactions from the spreadsheet image.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset ledger to fresh AVA fleet categories, vehicles, and sample records?')) {
                        onResetToFreshData();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
                  >
                    Reset to Fresh Data
                  </button>
                </div>
              )}

              {/* Sync Now Action */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  id="sync-settings-manual-trigger-btn"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSyncing ? 'Syncing Now...' : 'Trigger Manual Sync'}</span>
                </button>

                <div className="flex items-center gap-3">
                  {savedSuccess && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 cursor-pointer transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </form>
          ) : activeTab === 'CSV_IMPORT' ? (
            /* CSV Bulk Import Tab */
            <div className="space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Bulk Upload Past Business Transactions</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ingest historical records into your UAE business ledger from any spreadsheet software.
                  </p>
                </div>
                <button
                  type="button"
                  id="download-csv-template-btn"
                  onClick={downloadCsvTemplate}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
                  title="Download standard CSV template with sample UAE business expenses"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* Success Notification if just imported */}
              {importSuccessCount !== null && (
                <div
                  id="csv-import-success-banner"
                  className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl flex items-start justify-between gap-3 text-emerald-200"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        Bulk Ingestion Completed!
                      </h4>
                      <p className="text-xs text-emerald-400/90 mt-0.5">
                        {importSuccessCount} past transactions have been recorded into your ledger and will sync automatically.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCsvState}
                    className="text-xs text-emerald-400 hover:text-emerald-200 underline font-semibold cursor-pointer"
                  >
                    Upload Another
                  </button>
                </div>
              )}

              {/* Upload Dropzone */}
              {!parseResult && importSuccessCount === null && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="csv-file-input"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Drag and drop your CSV file here, or browse
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                    Supports standard .csv format with headers: <code className="text-emerald-300 font-mono text-[11px]">date, account, type, amount, category, description</code>
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 pointer-events-none"
                  >
                    Choose CSV File
                  </button>
                </div>
              )}

              {/* Parsing State */}
              {isParsing && (
                <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-semibold">Parsing CSV records & verifying duplicate entries...</p>
                </div>
              )}

              {/* Parsed Results Overview */}
              {parseResult && (
                <div className="space-y-4">
                  {/* File name & quick stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-white">{csvFileName}</span>
                      <span className="text-slate-500">({parseResult.totalRows} lines parsed)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCsvState}
                      className="text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard / Choose Different</span>
                    </button>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <p className="text-[11px] text-slate-400 font-medium">Valid Records</p>
                      <p className="text-lg font-bold text-white mt-0.5">{parseResult.valid.length}</p>
                    </div>

                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <p className="text-[11px] text-slate-400 font-medium">Total Inflow / Outflow</p>
                      <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                        {formatAED(parseResult.valid.reduce((acc, v) => acc + v.data.amount, 0))}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      parseResult.duplicates.length > 0
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400'
                    }`}>
                      <p className="text-[11px] font-medium">Duplicate Entries Flagged</p>
                      <p className={`text-lg font-bold mt-0.5 ${parseResult.duplicates.length > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {parseResult.duplicates.length}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      parseResult.errors.length > 0
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400'
                    }`}>
                      <p className="text-[11px] font-medium">Validation Errors</p>
                      <p className={`text-lg font-bold mt-0.5 ${parseResult.errors.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {parseResult.errors.length}
                      </p>
                    </div>
                  </div>

                  {/* Duplicate Handling Checkbox */}
                  {parseResult.duplicates.length > 0 && (
                    <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-200">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>{parseResult.duplicates.length} potential duplicates detected</strong> (match amount, date, and category already in ledger).
                        </span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold shrink-0">
                        <input
                          type="checkbox"
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Skip Flagged Duplicates</span>
                      </label>
                    </div>
                  )}

                  {/* Errors Callout (if any) */}
                  {parseResult.errors.length > 0 && (
                    <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Issues found in {parseResult.errors.length} row(s) (will be skipped):</span>
                      </div>
                      <ul className="list-disc list-inside text-rose-300/80 space-y-0.5 max-h-24 overflow-y-auto font-mono text-[11px]">
                        {parseResult.errors.map((err, i) => (
                          <li key={i}>
                            Row {err.row}: {err.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Preview Table */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-slate-950 text-xs font-semibold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                      <span>Preview Parsed Records (showing first {Math.min(parseResult.valid.length, 8)})</span>
                      <span>Total Valid: {parseResult.valid.length}</span>
                    </div>
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Account</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-sans">
                          {parseResult.valid.slice(0, 8).map((item, idx) => (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-800/40 ${
                                item.isDuplicate ? 'bg-amber-950/10' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                {item.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">
                                {item.data.date}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  item.data.account === 'BANK'
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {item.data.account === 'BANK' ? 'Bank' : 'Petty Cash'}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  item.data.type === 'INCOME'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : item.data.type === 'TRANSFER'
                                    ? 'bg-indigo-500/10 text-indigo-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {item.data.type}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold whitespace-nowrap">
                                {formatAED(item.data.amount)}
                              </td>
                              <td className="py-2 px-3 truncate max-w-[120px]">
                                {item.data.category}
                              </td>
                              <td className="py-2 px-3 truncate max-w-[150px] text-slate-400">
                                {item.data.description}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {item.isDuplicate ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                                    Flagged Duplicate
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold">
                                    Ready
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Confirmation Buttons */}
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      Ready to insert{' '}
                      <strong className="text-white">
                        {skipDuplicates
                          ? parseResult.valid.filter((v) => !v.isDuplicate).length
                          : parseResult.valid.length}
                      </strong>{' '}
                      records into your ledger
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleResetCsvState}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        id="execute-csv-bulk-import-btn"
                        onClick={handleExecuteImport}
                        disabled={
                          (skipDuplicates
                            ? parseResult.valid.filter((v) => !v.isDuplicate).length
                            : parseResult.valid.length) === 0
                        }
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-40"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>
                          Import{' '}
                          {skipDuplicates
                            ? parseResult.valid.filter((v) => !v.isDuplicate).length
                            : parseResult.valid.length}{' '}
                          Transactions
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Script Template Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Google Apps Script Web App Template (Free Cloud Database)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste this into any Google Sheet (Extensions &gt; Apps Script) to turn it into your REST backend.
                  </p>
                </div>
                <button
                  type="button"
                  id="copy-apps-script-code-btn"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions steps */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1.5 text-slate-300">
                <div className="font-semibold text-emerald-400">3-Step Setup Instructions:</div>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Open Google Drive and create a new Google Sheet named <strong className="text-white">AVA UAE Finance Ledger (AED)</strong>.</li>
                  <li>Click <strong className="text-white">Extensions &gt; Apps Script</strong>, delete default code, and paste the code below.</li>
                  <li>Click <strong className="text-white">Deploy &gt; New deployment &gt; Select type: Web app</strong>. Set Execute as: <em>Me</em>, Who has access: <em>Anyone</em>. Copy the web app URL and paste it in the API settings tab.</li>
                </ol>
              </div>

              {/* Code display */}
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[340px] leading-relaxed">
                {GOOGLE_APPS_SCRIPT_TEMPLATE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
