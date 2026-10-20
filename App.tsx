import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Plus } from 'lucide-react';
import {
  Transaction,
  Category,
  SyncSettings,
  AccountBalances,
  AccountType,
  TransactionType,
} from './types';
import {
  getTransactions,
  saveTransactions,
  addTransaction,
  addBulkTransactions,
  updateTransaction,
  deleteTransaction,
  getCategories,
  saveCategories,
  getSyncSettings,
  saveSyncSettings,
  calculateBalances,
  getPettyCashReserveAlert,
  savePettyCashReserveAlert,
  resetToFreshFleetData,
} from './services/storage';
import {
  isAppUnlocked,
  lockApp,
  initAuth,
} from './services/auth';
import { performSync } from './services/syncService';
import { PasscodeLock } from './components/PasscodeLock';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { AnalyticsReports } from './components/AnalyticsReports';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';
import { AccountantReportModal } from './components/AccountantReportModal';

export default function App() {
  // Authentication & Lock Screen State
  const [unlocked, setUnlocked] = useState<boolean>(() => isAppUnlocked());
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // Core Business Data State
  const [transactions, setTransactions] = useState<Transaction[]>(() => getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getCategories());
  const [syncSettings, setSyncSettingsState] = useState<SyncSettings>(() => getSyncSettings());
  const [pettyCashAlertLevel, setPettyCashAlertLevel] = useState<number>(() => getPettyCashReserveAlert());

  // Sync & Network state
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialAccount, setModalInitialAccount] = useState<AccountType>('BANK');
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('EXPENSE');

  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
      },
      () => {
        // Not signed in or no token cached
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Compute Balances
  const balances: AccountBalances = useMemo(() => {
    return calculateBalances(transactions);
  }, [transactions]);

  // Unsynced count
  const unsyncedCount = useMemo(() => {
    return transactions.filter((t) => !t.synced).length;
  }, [transactions]);

  const hasUnsyncedChanges = unsyncedCount > 0;

  // Current Month Stats
  const monthlyStats = useMemo(() => {
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    for (const tx of transactions) {
      if (tx.date.startsWith(currentMonthKey)) {
        if (tx.type === 'INCOME') monthlyIncome += tx.amount;
        else if (tx.type === 'EXPENSE') monthlyExpense += tx.amount;
      }
    }

    return {
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
    };
  }, [transactions]);

  // Handle Sync operation
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await performSync();
      // Reload updated transactions with synced flag
      setTransactions(getTransactions());
      const updatedSettings = getSyncSettings();
      setSyncSettingsState(updatedSettings);

      setSyncToast({
        message: result.message,
        type: 'success',
      });
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncToast({
        message: `Sync failed: ${err.message || 'Unknown network error'}`,
        type: 'error',
      });
      setTimeout(() => setSyncToast(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Listen for online/offline events for perfect background syncing
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncToast({
        message: 'Connected back online! Syncing queued records with Google Sheets...',
        type: 'info',
      });
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncToast({
        message: 'Offline mode: You can continue recording transactions. All changes are saved locally and will auto-sync once online.',
        type: 'info',
      });
      setTimeout(() => setSyncToast(null), 6000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Lock Application
  const handleLock = () => {
    lockApp();
    setUnlocked(false);
  };

  // Transaction CRUD Handlers
  const handleOpenNewTransaction = (
    defaultAccount: AccountType = 'BANK',
    defaultType: TransactionType = 'EXPENSE'
  ) => {
    setEditingTransaction(null);
    setModalInitialAccount(defaultAccount);
    setModalInitialType(defaultType);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalInitialAccount(tx.account);
    setModalInitialType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>
  ) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, txData);
    } else {
      addTransaction(txData);
    }

    // Refresh state
    const updated = getTransactions();
    setTransactions(updated);

    // Auto-sync in background if enabled
    if (syncSettings.autoSync) {
      triggerSync();
    }
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
    setTransactions(getTransactions());
    if (syncSettings.autoSync) {
      triggerSync();
    }
  };

  const handleImportTransactions = (
    txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>[]
  ) => {
    addBulkTransactions(txList);
    setTransactions(getTransactions());
    if (syncSettings.autoSync) {
      triggerSync();
    }
  };

  // Categories Save Handler
  const handleSaveCategories = (updatedCats: Category[]) => {
    saveCategories(updatedCats);
    setCategories(updatedCats);
  };

  // Settings Save Handler
  const handleSaveSettings = (newSettings: SyncSettings) => {
    saveSyncSettings(newSettings);
    setSyncSettingsState(newSettings);
  };

  const handleSavePettyCashAlertLevel = (val: number) => {
    savePettyCashReserveAlert(val);
    setPettyCashAlertLevel(val);
  };

  const handleResetToFreshData = () => {
    const fresh = resetToFreshFleetData();
    setTransactions(fresh.transactions);
    setCategories(fresh.categories);
    setSyncToast({
      message: 'Ledger and categories refreshed to fresh AVA fleet dataset!',
      type: 'success',
    });
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Lock Screen Check
  if (!unlocked) {
    return <PasscodeLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header with Navigation, Sync, and Google Workspace Auth */}
      <Header
        onLock={handleLock}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCategories={() => setIsCategoriesOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onSync={triggerSync}
        isSyncing={isSyncing}
        hasUnsyncedChanges={hasUnsyncedChanges}
        lastSyncTime={syncSettings.lastSyncTime ? new Date(syncSettings.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null}
        googleUser={googleUser}
        onGoogleAuthChange={(user) => setGoogleUser(user)}
        isOnline={isOnline}
        spreadsheetId={syncSettings.spreadsheetId}
        unsyncedCount={unsyncedCount}
      />

      {/* Sync Notification Toast Banner */}
      {syncToast && (
        <div
          id="sync-notification-toast"
          className={`sticky top-18 z-20 py-2.5 px-4 text-center text-xs font-semibold shadow-md transition-all ${
            syncToast.type === 'success'
              ? 'bg-emerald-900/90 border-b border-emerald-700 text-emerald-100'
              : syncToast.type === 'error'
              ? 'bg-rose-900/90 border-b border-rose-700 text-rose-100'
              : 'bg-sky-900/90 border-b border-sky-700 text-sky-100'
          }`}
        >
          {syncToast.message}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Financial Metrics Dashboard */}
        <DashboardMetrics
          balances={balances}
          onNewTransaction={handleOpenNewTransaction}
          monthlyStats={monthlyStats}
        />

        {/* Operational Transactions Ledger Table */}
        <TransactionList
          transactions={transactions}
          categories={categories}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          onViewReceipt={(tx) => setViewingReceiptTx(tx)}
          onNewTransaction={() => handleOpenNewTransaction('BANK', 'EXPENSE')}
        />

        {/* Real-time Analytics & Reporting */}
        <AnalyticsReports
          transactions={transactions}
          categories={categories}
          onOpenAccountantReport={() => setIsReportOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AVA UAE Business Finance Ledger • Currency: United Arab Emirates Dirham (AED)
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Offline-First Architecture</span>
            <span>•</span>
            <span>Single-Key REST Auth (ava-finance-2026)</span>
          </div>
        </div>
      </footer>

      {/* Floating Quick Add Button (Direct Expense Entry) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          id="floating-quick-add-btn"
          onClick={() => handleOpenNewTransaction('BANK', 'EXPENSE')}
          className="group flex items-center gap-2.5 px-4.5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-full shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 hover:border-emerald-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          title="Quick Add Expense Entry"
        >
          <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-200">
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
          </span>
          <span className="tracking-wide">Quick Add</span>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Expense
          </span>
        </button>
      </div>

      {/* Transaction Entry & Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categories={categories}
        existingTransactions={transactions}
        initialAccount={modalInitialAccount}
        initialType={modalInitialType}
      />

      {/* Digital Receipt High-Res Viewer Modal */}
      <ReceiptViewerModal
        transaction={viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
      />

      {/* Category & Subcategory Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        categories={categories}
        onSaveCategories={handleSaveCategories}
        onResetToFreshData={handleResetToFreshData}
      />

      {/* Cloud Sync & REST API Settings Modal */}
      <SyncSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={syncSettings}
        onSaveSettings={handleSaveSettings}
        onManualSync={triggerSync}
        isSyncing={isSyncing}
        pettyCashAlertLevel={pettyCashAlertLevel}
        onSavePettyCashAlertLevel={handleSavePettyCashAlertLevel}
        googleUserEmail={googleUser ? googleUser.email : null}
        transactions={transactions}
        onImportTransactions={handleImportTransactions}
        onResetToFreshData={handleResetToFreshData}
      />

      {/* Structured Accountant Hand-off Report Modal */}
      <AccountantReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        transactions={transactions}
        categories={categories}
        balances={balances}
      />
    </div>
  );
}
