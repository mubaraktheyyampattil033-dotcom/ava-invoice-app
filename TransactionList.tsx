import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Building,
  Coins,
  ArrowRightLeft,
  Paperclip,
  Trash2,
  Edit2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Calendar,
  RotateCcw,
  X,
  Download,
  Loader2,
  CheckCircle2,
  FileText,
  Bus,
} from 'lucide-react';
import { Transaction, AccountType, TransactionType, Category } from '../types';
import { formatAED, getVehicles } from '../services/storage';
import { generateLedgerPdf } from '../services/pdfReportGenerator';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (tx: Transaction) => void;
  onNewTransaction: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  onEdit,
  onDelete,
  onViewReceipt,
  onNewTransaction,
}) => {
  const [accountFilter, setAccountFilter] = useState<'ALL' | 'BANK' | 'PETTY_CASH' | 'TRANSFER'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'THIS_YEAR' | 'CUSTOM'>('ALL');
  const [deleteCandidate, setDeleteCandidate] = useState<Transaction | null>(null);
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [csvDownloaded, setCsvDownloaded] = useState(false);

  const handleExportLedgerCsv = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Transaction ID',
      'Date',
      'Account',
      'Type',
      'Category',
      'Subcategory',
      'Vehicle Number',
      'Description',
      'Reference / Cheque No',
      'Amount (AED)',
      'Sync Status',
    ];

    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = filteredTransactions.map((tx) => [
      escapeCsvField(tx.id),
      escapeCsvField(tx.date),
      escapeCsvField(tx.account === 'BANK' ? 'Bank Account' : 'Petty Cash'),
      escapeCsvField(tx.type),
      escapeCsvField(tx.category),
      escapeCsvField(tx.subcategory || ''),
      escapeCsvField(tx.vehicleNumber || ''),
      escapeCsvField(tx.description),
      escapeCsvField(tx.referenceNumber || ''),
      escapeCsvField(tx.amount.toFixed(2)),
      escapeCsvField(tx.synced ? 'Synced' : 'Local / Pending'),
    ]);

    const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().substring(0, 10);
    link.setAttribute('download', `AVA_Ledger_Export_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 3000);
  };

  const handleDownloadLedgerPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const dateRangeStr =
        startDate && endDate
          ? `${startDate} to ${endDate}`
          : startDate
          ? `From ${startDate}`
          : endDate
          ? `Up to ${endDate}`
          : datePreset !== 'ALL'
          ? datePreset.replace(/_/g, ' ')
          : undefined;

      generateLedgerPdf({
        transactions: filteredTransactions,
        filtersSummary: {
          account: accountFilter,
          flowType: typeFilter,
          category: categoryFilter,
          dateRange: dateRangeStr,
          searchQuery: searchQuery.trim() || undefined,
        },
        periodTotal: filteredTotal,
      });

      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate ledger PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Quick Date Range Preset Handler
  const handleApplyDatePreset = (preset: 'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'THIS_YEAR') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      setEndDate(todayStr);
    } else if (preset === 'LAST_30_DAYS') {
      const prior = new Date();
      prior.setDate(prior.getDate() - 30);
      setStartDate(prior.toISOString().substring(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'THIS_YEAR') {
      const y = now.getFullYear();
      setStartDate(`${y}-01-01`);
      setEndDate(todayStr);
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setVehicleFilter('ALL');
    setTypeFilter('ALL');
    setAccountFilter('ALL');
    setShowDuplicatesOnly(false);
    setStartDate('');
    setEndDate('');
    setDatePreset('ALL');
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    categoryFilter !== 'ALL' ||
    vehicleFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    accountFilter !== 'ALL' ||
    showDuplicatesOnly ||
    startDate ||
    endDate
  );

  // Computed list of unique vehicle numbers from storage fleet + transactions
  const availableVehicles = useMemo(() => {
    const set = new Set<string>(getVehicles());
    transactions.forEach((t) => {
      if (t.vehicleNumber && t.vehicleNumber.trim()) {
        set.add(t.vehicleNumber.trim());
      }
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Identify transactions that share exact amount, date, and category with another record
  const duplicateTxIds = useMemo(() => {
    const keyMap = new Map<string, string[]>();
    for (const tx of transactions) {
      const key = `${tx.date}_${Number(tx.amount).toFixed(2)}_${tx.category.trim().toLowerCase()}`;
      const group = keyMap.get(key) || [];
      group.push(tx.id);
      keyMap.set(key, group);
    }
    const duplicateIds = new Set<string>();
    for (const [, ids] of keyMap.entries()) {
      if (ids.length > 1) {
        ids.forEach((id) => duplicateIds.add(id));
      }
    }
    return duplicateIds;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Flagged duplicates only filter
      if (showDuplicatesOnly && !duplicateTxIds.has(tx.id)) return false;

      // Account filter
      if (accountFilter === 'BANK' && tx.account !== 'BANK') return false;
      if (accountFilter === 'PETTY_CASH' && tx.account !== 'PETTY_CASH') return false;
      if (accountFilter === 'TRANSFER' && tx.type !== 'TRANSFER') return false;

      // Type filter
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) return false;

      // Vehicle filter
      if (vehicleFilter === 'UNASSIGNED') {
        if (tx.vehicleNumber && tx.vehicleNumber.trim()) return false;
      } else if (vehicleFilter !== 'ALL') {
        if (tx.vehicleNumber !== vehicleFilter) return false;
      }

      // Date Range filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Search query (keyword match on description, ref, category, subcategory, vehicle, amount)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchRef = (tx.referenceNumber || '').toLowerCase().includes(q);
        const matchCat = tx.category.toLowerCase().includes(q);
        const matchSub = (tx.subcategory || '').toLowerCase().includes(q);
        const matchVeh = (tx.vehicleNumber || '').toLowerCase().includes(q);
        const matchAmt = tx.amount.toString().includes(q);
        if (!matchDesc && !matchRef && !matchCat && !matchSub && !matchVeh && !matchAmt) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    accountFilter,
    typeFilter,
    categoryFilter,
    vehicleFilter,
    startDate,
    endDate,
    searchQuery,
    showDuplicatesOnly,
    duplicateTxIds,
  ]);

  // Account total for filtered results
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      if (tx.type === 'INCOME') return acc + tx.amount;
      if (tx.type === 'EXPENSE') return acc - tx.amount;
      return acc;
    }, 0);
  }, [filteredTransactions]);

  const confirmDelete = () => {
    if (deleteCandidate) {
      onDelete(deleteCandidate.id);
      setDeleteCandidate(null);
    }
  };

  return (
    <div id="transactions-ledger-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
      {/* Section Header & Tab Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 w-full md:w-auto">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Operational Ledger</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {filteredTransactions.length} records
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time multi-account UAE business transactions
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              id="header-export-ledger-csv-btn"
              type="button"
              onClick={handleExportLedgerCsv}
              disabled={filteredTransactions.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Export current filtered ledger as CSV spreadsheet"
            >
              {csvDownloaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{csvDownloaded ? 'CSV Exported!' : 'Export to CSV'}</span>
            </button>

            <button
              id="header-download-ledger-pdf-btn"
              type="button"
              onClick={handleDownloadLedgerPdf}
              disabled={isGeneratingPdf || filteredTransactions.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Download current filtered ledger as PDF document"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Download Ledger</span>
            </button>
          </div>
        </div>

        {/* Account Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            id="tab-filter-all-accounts"
            onClick={() => setAccountFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              accountFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Accounts
          </button>
          <button
            id="tab-filter-bank"
            onClick={() => setAccountFilter('BANK')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              accountFilter === 'BANK'
                ? 'bg-sky-600/30 text-sky-200 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-sky-400" />
            <span>Bank Account</span>
          </button>
          <button
            id="tab-filter-petty-cash"
            onClick={() => setAccountFilter('PETTY_CASH')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              accountFilter === 'PETTY_CASH'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Petty Cash</span>
          </button>
          <button
            id="tab-filter-transfers"
            onClick={() => {
              setAccountFilter('TRANSFER');
              setShowDuplicatesOnly(false);
            }}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              accountFilter === 'TRANSFER' && !showDuplicatesOnly
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Transfers</span>
          </button>

          {duplicateTxIds.size > 0 && (
            <button
              id="tab-filter-duplicates"
              onClick={() => setShowDuplicatesOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                showDuplicatesOnly
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/60 shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Flagged Duplicates ({duplicateTxIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div id="transaction-search-filter-bar" className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 sm:p-4 mb-5 space-y-3">
        {/* Main Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* 1. Keyword Search */}
          <div className="lg:col-span-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="transaction-search-input"
              type="text"
              placeholder="Search keyword, ref, bus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              id="transaction-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Vehicle Dropdown Filter */}
          <div className="lg:col-span-2">
            <select
              id="transaction-vehicle-filter"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full py-2 px-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="ALL">All Vehicles</option>
              <option value="UNASSIGNED">-- General / Yard --</option>
              <optgroup label="Bus Fleet Plates">
                {availableVehicles.map((veh) => (
                  <option key={veh} value={veh}>
                    {veh}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 4. Date Range (From - To) */}
          <div className="lg:col-span-2 flex items-center gap-1">
            <div className="relative flex-1">
              <input
                id="transaction-filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="w-full py-2 px-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                title="Filter From Date"
              />
            </div>
            <span className="text-slate-500 text-[10px] font-semibold">-</span>
            <div className="relative flex-1">
              <input
                id="transaction-filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="w-full py-2 px-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                title="Filter To Date"
              />
            </div>
          </div>

          {/* 5. Flow Type & Add Button */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <select
              id="transaction-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Flows</option>
              <option value="EXPENSE">Expenses (-)</option>
              <option value="INCOME">Income (+)</option>
              <option value="TRANSFER">Transfers (⇄)</option>
            </select>

            <button
              id="list-add-transaction-btn"
              onClick={onNewTransaction}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-md shadow-emerald-950/40 whitespace-nowrap"
              title="Record New Transaction"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Quick Date Presets & Filter Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date:</span>
            </span>
            <button
              id="date-preset-all"
              type="button"
              onClick={() => handleApplyDatePreset('ALL')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                datePreset === 'ALL' && !startDate && !endDate
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              id="date-preset-this-month"
              type="button"
              onClick={() => handleApplyDatePreset('THIS_MONTH')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                datePreset === 'THIS_MONTH'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              id="date-preset-last-30-days"
              type="button"
              onClick={() => handleApplyDatePreset('LAST_30_DAYS')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                datePreset === 'LAST_30_DAYS'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              id="date-preset-this-year"
              type="button"
              onClick={() => handleApplyDatePreset('THIS_YEAR')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                datePreset === 'THIS_YEAR'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Year to Date
            </button>

            {hasActiveFilters && (
              <button
                id="reset-all-ledger-filters-btn"
                type="button"
                onClick={handleResetAllFilters}
                className="ml-2 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset all active search and filter constraints"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Result Count and Sum & Download Ledger Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="text-slate-400 text-[11px] flex items-center gap-2 flex-wrap">
              <span>
                Showing <strong className="text-white">{filteredTransactions.length}</strong> of{' '}
                {transactions.length} records
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Period Total:{' '}
                <strong className={`font-mono ${filteredTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {filteredTotal >= 0 ? '+' : ''}
                  {formatAED(filteredTotal)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="export-ledger-csv-btn"
                type="button"
                onClick={handleExportLedgerCsv}
                disabled={filteredTransactions.length === 0}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                title="Export current filtered transaction list as CSV spreadsheet"
              >
                {csvDownloaded ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{csvDownloaded ? 'CSV Exported!' : 'Export to CSV'}</span>
              </button>

              <button
                id="download-ledger-pdf-btn"
                type="button"
                onClick={handleDownloadLedgerPdf}
                disabled={isGeneratingPdf || filteredTransactions.length === 0}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                title="Download current filtered transaction list as PDF document"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : pdfDownloaded ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>
                  {isGeneratingPdf
                    ? 'Generating PDF...'
                    : pdfDownloaded
                    ? 'PDF Downloaded!'
                    : 'Download Ledger'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div
          id="empty-transactions-state"
          className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30"
        >
          <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No transactions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'ALL' || accountFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try changing or clearing your search filters.'
              : 'Start by recording your first UAE business expense, client deposit, or inter-account transfer.'}
          </p>
          <button
            onClick={onNewTransaction}
            className="mt-4 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record First Entry</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account / Flow</th>
                <th className="py-3 px-4">Category & Fleet Tag</th>
                <th className="py-3 px-4">Description & Ref #</th>
                <th className="py-3 px-3 text-center">Receipt</th>
                <th className="py-3 px-4 text-right">Amount (AED)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.map((tx) => {
                const isDuplicate = duplicateTxIds.has(tx.id);
                return (
                <tr
                  key={tx.id}
                  id={`tx-row-${tx.id}`}
                  className={`transition-colors group ${
                    isDuplicate ? 'bg-amber-950/15 hover:bg-amber-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Date */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span>{tx.date}</span>
                    </div>
                  </td>

                  {/* Account & Type Badges */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          tx.account === 'BANK'
                            ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {tx.account === 'BANK' ? (
                          <Building className="w-3 h-3 text-sky-400" />
                        ) : (
                          <Coins className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{tx.account === 'BANK' ? 'Bank' : 'Petty Cash'}</span>
                      </span>

                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          tx.type === 'INCOME'
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : tx.type === 'EXPENSE'
                            ? 'text-rose-400 bg-rose-950/60'
                            : 'text-indigo-400 bg-indigo-950/60'
                        }`}
                      >
                        {tx.type === 'TRANSFER'
                          ? `⇄ Transfer to ${tx.transferTargetAccount === 'PETTY_CASH' ? 'Cash' : 'Bank'}`
                          : tx.type}
                      </span>
                    </div>
                  </td>

                  {/* Category, Subcategory & Vehicle Fleet Plate */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                        {tx.category}
                      </span>
                      {tx.vehicleNumber && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                          title={`Assigned Fleet Vehicle: ${tx.vehicleNumber}`}
                        >
                          <Bus className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{tx.vehicleNumber}</span>
                        </span>
                      )}
                      {isDuplicate && (
                        <span
                          id={`tx-duplicate-flag-${tx.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded"
                          title="Shares the same date, amount, and category with another transaction"
                        >
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          <span>Possible Duplicate</span>
                        </span>
                      )}
                    </div>
                    {tx.subcategory && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {tx.subcategory}
                      </div>
                    )}
                  </td>

                  {/* Description & Reference # */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300 truncate max-w-[240px] sm:max-w-[320px]">
                      {tx.description}
                    </div>
                    {tx.referenceNumber && (
                      <div className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                        Ref: {tx.referenceNumber}
                      </div>
                    )}
                  </td>

                  {/* Receipt Attachment */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {tx.receiptBase64 ? (
                      <button
                        type="button"
                        id={`view-receipt-btn-${tx.id}`}
                        onClick={() => onViewReceipt(tx)}
                        title="View digital photo receipt"
                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-semibold">View</span>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-sm font-bold">
                    <span
                      className={
                        tx.type === 'INCOME'
                          ? 'text-emerald-400'
                          : tx.type === 'EXPENSE'
                          ? 'text-rose-400'
                          : 'text-indigo-400'
                      }
                    >
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                      {formatAED(tx.amount)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        id={`edit-tx-btn-${tx.id}`}
                        onClick={() => onEdit(tx)}
                        title="Edit transaction"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        id={`delete-tx-btn-${tx.id}`}
                        onClick={() => setDeleteCandidate(tx)}
                        title="Delete transaction"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog for Destructive Delete (MANDATORY REQUIREMENT) */}
      {deleteCandidate && (
        <div
          id="confirm-delete-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">
                Delete Transaction Record?
              </h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to delete this {deleteCandidate.account} entry:
              <br />
              <strong className="text-white font-mono">
                {deleteCandidate.description} ({formatAED(deleteCandidate.amount)})
              </strong>
              {deleteCandidate.receiptBase64 && (
                <span className="block text-rose-300 mt-1">
                  Attached digital receipt will also be permanently deleted.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                id="cancel-delete-tx-btn"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-tx-btn"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-rose-950/40"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
