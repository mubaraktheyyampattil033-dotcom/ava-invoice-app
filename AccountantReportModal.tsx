import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Building2,
  FileSpreadsheet,
  Download,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, Category, AccountBalances } from '../types';
import { formatAED } from '../services/storage';
import { generateAccountantReportPdf } from '../services/pdfReportGenerator';

interface AccountantReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  balances: AccountBalances;
}

export const AccountantReportModal: React.FC<AccountantReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  balances,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Filter transactions for report
  const reportTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Months available
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      months.add(t.date.substring(0, 7));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Computations
  const stats = useMemo(() => {
    let bankIncome = 0;
    let bankExpense = 0;
    let pettyIncome = 0;
    let pettyExpense = 0;
    let transferToPetty = 0;
    let transferToBank = 0;
    const catMap = new Map<string, number>();

    for (const tx of reportTransactions) {
      if (tx.type === 'INCOME') {
        if (tx.account === 'BANK') bankIncome += tx.amount;
        else pettyIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        if (tx.account === 'BANK') bankExpense += tx.amount;
        else pettyExpense += tx.amount;

        const current = catMap.get(tx.category) || 0;
        catMap.set(tx.category, current + tx.amount);
      } else if (tx.type === 'TRANSFER') {
        if (tx.account === 'BANK' && tx.transferTargetAccount === 'PETTY_CASH') {
          transferToPetty += tx.amount;
        } else if (tx.account === 'PETTY_CASH' && tx.transferTargetAccount === 'BANK') {
          transferToBank += tx.amount;
        }
      }
    }

    return {
      bankIncome,
      bankExpense,
      pettyIncome,
      pettyExpense,
      transferToPetty,
      transferToBank,
      totalIncome: bankIncome + pettyIncome,
      totalExpense: bankExpense + pettyExpense,
      netMargin: bankIncome + pettyIncome - (bankExpense + pettyExpense),
      categorySpends: Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [reportTransactions]);

  const handlePrint = () => {
    const printArea = document.getElementById('accountant-report-print-container');
    if (!printArea) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>UAE Business Accountant Hand-off Report</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
              h1, h2, h3 { margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 13px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
              th { background-color: #f1f5f9; font-weight: 600; }
              .text-right { text-align: right; }
              .font-mono { font-family: monospace; }
              .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
              .summary-grid { display: flex; gap: 16px; margin-bottom: 24px; }
              .summary-card { flex: 1; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; }
              .highlight { font-weight: bold; font-size: 16px; }
            </style>
          </head>
          <body>
            ${printArea.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleCopyText = () => {
    const summaryText = `
AVA UAE BUSINESS FINANCE LEDGER - ACCOUNTANT REPORT
Period: ${selectedMonth === 'ALL' ? 'All Records to Date' : selectedMonth}
Currency: AED (United Arab Emirates Dirham)
Generated: ${new Date().toLocaleString()}

1. EXECUTIVE CASH POSITION:
- Current Bank Balance: ${formatAED(balances.bankBalance)}
- Current Petty Cash Reserve: ${formatAED(balances.pettyCashBalance)}
- Total Net Working Capital: ${formatAED(balances.totalNetBalance)}

2. REPORTING PERIOD TOTALS:
- Total Gross Inflow: ${formatAED(stats.totalIncome)}
  * Bank Wire & Contract Deposits: ${formatAED(stats.bankIncome)}
  * Cash Deposits: ${formatAED(stats.pettyIncome)}
- Total Outflow / Expenses: ${formatAED(stats.totalExpense)}
  * Bank Operating Expenses: ${formatAED(stats.bankExpense)}
  * Petty Cash Field Expenses: ${formatAED(stats.pettyExpense)}
- Net Profit / Operating Cash Flow: ${formatAED(stats.netMargin)}

3. INTER-ACCOUNT TRANSFERS:
- Bank to Petty Cash Replenishments: ${formatAED(stats.transferToPetty)}
- Petty Cash Surplus Deposited to Bank: ${formatAED(stats.transferToBank)}

4. TOP OPERATIONAL EXPENSES BY CATEGORY:
${stats.categorySpends.map(([name, amt]) => `* ${name}: ${formatAED(amt)}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateAccountantReportPdf({
        period: selectedMonth,
        transactions: reportTransactions,
        balances,
        stats,
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF document:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="accountant-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Accountant Hand-off & Audit Summary
              </h2>
              <p className="text-xs text-slate-400">
                Structured ledger statements for UAE Corporate Tax, VAT & Bookkeeping
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Recorded Dates</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {new Date(`${m}-01`).toLocaleString('default', { month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>

            <button
              id="download-accountant-report-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              title="Download Formatted PDF Document"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfDownloaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isGeneratingPdf ? 'Generating PDF...' : pdfDownloaded ? 'Downloaded!' : 'Download PDF'}
              </span>
            </button>

            <button
              id="copy-report-summary-btn"
              onClick={handleCopyText}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy Summary Text"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              id="print-accountant-report-btn"
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Print / Save PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              id="close-accountant-report-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          <div id="accountant-report-print-container" className="space-y-6">
            {/* Report Header */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-white">AVA UAE Business Finance Statement</h1>
                <p className="text-xs text-slate-400">
                  Reporting Period: {selectedMonth === 'ALL' ? 'Cumulative to Date' : selectedMonth} • Currency: United Arab Emirates Dirham (AED)
                </p>
              </div>
              <div className="text-left sm:text-right text-xs text-slate-400 font-mono">
                Generated: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>

            {/* Balances Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">
                  Current Bank Account
                </div>
                <div className="text-lg font-bold text-sky-300 font-mono mt-1">
                  {formatAED(balances.bankBalance)}
                </div>
              </div>
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">
                  Current Petty Cash Reserve
                </div>
                <div className="text-lg font-bold text-amber-300 font-mono mt-1">
                  {formatAED(balances.pettyCashBalance)}
                </div>
              </div>
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">
                  Net Working Capital
                </div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  {formatAED(balances.totalNetBalance)}
                </div>
              </div>
            </div>

            {/* Period P&L Performance */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Period P&L Performance Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Total Revenue / Inflow:</span>
                  <strong className="text-emerald-400 text-sm font-mono block mt-0.5">
                    +{formatAED(stats.totalIncome)}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Bank: {formatAED(stats.bankIncome)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Operating Outflow:</span>
                  <strong className="text-rose-400 text-sm font-mono block mt-0.5">
                    -{formatAED(stats.totalExpense)}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Bank: {formatAED(stats.bankExpense)} | Cash: {formatAED(stats.pettyExpense)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Net Operating Flow:</span>
                  <strong
                    className={`text-sm font-mono block mt-0.5 ${
                      stats.netMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {stats.netMargin >= 0 ? '+' : ''}
                    {formatAED(stats.netMargin)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Inter-Account Transfers:</span>
                  <strong className="text-indigo-300 text-sm font-mono block mt-0.5">
                    {formatAED(stats.transferToPetty)}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    Withdrawn for Petty Cash
                  </span>
                </div>
              </div>
            </div>

            {/* Category Cost Breakdown Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Operational Expenditure by Category
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">UAE Operational Category</th>
                      <th className="py-2.5 px-3 text-right">Expenditure (AED)</th>
                      <th className="py-2.5 px-3 text-right">Share (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {stats.categorySpends.map(([name, amt]) => {
                      const pct = stats.totalExpense > 0 ? (amt / stats.totalExpense) * 100 : 0;
                      return (
                        <tr key={name}>
                          <td className="py-2.5 px-3 font-sans text-slate-200">{name}</td>
                          <td className="py-2.5 px-3 text-right text-rose-300">{formatAED(amt)}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400">{pct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sign-off Box */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-400">
              <div>
                <p>Prepared By: ___________________________</p>
                <p className="mt-1">Finance Officer / Manager</p>
              </div>
              <div className="text-right">
                <p>Verified By: ___________________________</p>
                <p className="mt-1">Certified Accountant / Auditor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {reportTransactions.length} transactions included in this reporting period ({formatAED(stats.totalExpense)} total outflow)
          </div>
          <div className="flex items-center gap-2">
            <button
              id="footer-download-accountant-report-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : pdfDownloaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Generating...' : pdfDownloaded ? 'Downloaded!' : 'Download PDF Document'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
