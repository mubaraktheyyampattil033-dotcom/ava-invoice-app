import React from 'react';
import {
  Wallet,
  Building,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { AccountBalances } from '../types';
import { formatAED } from '../services/storage';

interface DashboardMetricsProps {
  balances: AccountBalances;
  onNewTransaction: (defaultAccount: 'BANK' | 'PETTY_CASH', defaultType: 'EXPENSE' | 'INCOME' | 'TRANSFER') => void;
  monthlyStats: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyNet: number;
  };
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  balances,
  onNewTransaction,
  monthlyStats,
}) => {
  const isPettyCashLow = balances.pettyCashBalance <= balances.pettyCashReserveAlertLevel;

  return (
    <section id="financial-dashboard-metrics" className="mb-8">
      {/* Reserve Alert Banner if Petty Cash is low */}
      {isPettyCashLow && (
        <div
          id="petty-cash-reserve-warning-banner"
          className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 text-amber-200"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Petty Cash Reserve Alert:</strong> Balance ({formatAED(balances.pettyCashBalance)}) is at or below the threshold ({formatAED(balances.pettyCashReserveAlertLevel)}). Consider an Inter-Account Transfer to replenish.
            </span>
          </div>
          <button
            id="replenish-petty-cash-btn"
            onClick={() => onNewTransaction('BANK', 'TRANSFER')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow transition-colors cursor-pointer"
          >
            Transfer to Cash
          </button>
        </div>
      )}

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Total Balance Card */}
        <div
          id="metric-card-net-balance"
          className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Working Capital
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              {formatAED(balances.totalNetBalance)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Combined Bank & Cash Pool</span>
            </div>
          </div>
        </div>

        {/* Bank Account Balance */}
        <div
          id="metric-card-bank-account"
          className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bank Account (Wire/Deposits)
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-300 font-mono">
              {formatAED(balances.bankBalance)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Main Business Account</span>
              <span className="text-[11px] text-sky-400 font-medium">UAE Central Bank Reg.</span>
            </div>
          </div>
        </div>

        {/* Petty Cash Reserve Card */}
        <div
          id="metric-card-petty-cash"
          className={`border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
            isPettyCashLow
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Petty Cash Reserve
              </span>
              {isPettyCashLow && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Low
                </span>
              )}
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono ${
                isPettyCashLow ? 'text-amber-300' : 'text-amber-400'
              }`}
            >
              {formatAED(balances.pettyCashBalance)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Field & Driver Operational Cash</span>
              <span className="text-[11px] text-slate-400">
                Min: {formatAED(balances.pettyCashReserveAlertLevel)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Month Net Flow Card */}
        <div
          id="metric-card-monthly-flow"
          className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Month P&L Cash Flow
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                monthlyStats.monthlyNet >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
              }`}
            >
              {monthlyStats.monthlyNet >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>
          </div>
          <div>
            <div
              className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono ${
                monthlyStats.monthlyNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {monthlyStats.monthlyNet >= 0 ? '+' : ''}
              {formatAED(monthlyStats.monthlyNet)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span className="text-emerald-400 font-medium">
                +{formatAED(monthlyStats.monthlyIncome)}
              </span>
              <span className="text-rose-400 font-medium">
                -{formatAED(monthlyStats.monthlyExpense)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-800/50 border border-slate-700/60 rounded-xl p-3">
        <div className="text-xs text-slate-400 font-medium px-1">
          Quick Ledger Entries:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="quick-new-bank-expense-btn"
            onClick={() => onNewTransaction('BANK', 'EXPENSE')}
            className="px-3.5 py-2 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-sky-400" />
            <span>Bank Outflow / Wire</span>
          </button>

          <button
            id="quick-new-petty-expense-btn"
            onClick={() => onNewTransaction('PETTY_CASH', 'EXPENSE')}
            className="px-3.5 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Petty Cash Expense</span>
          </button>

          <button
            id="quick-new-income-btn"
            onClick={() => onNewTransaction('BANK', 'INCOME')}
            className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Client Deposit / Income</span>
          </button>

          <button
            id="quick-inter-account-transfer-btn"
            onClick={() => onNewTransaction('BANK', 'TRANSFER')}
            className="px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
            <span>Inter-Account Transfer</span>
          </button>
        </div>
      </div>
    </section>
  );
};
