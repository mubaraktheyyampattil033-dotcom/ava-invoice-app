import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatAED } from '../services/storage';

interface AnalyticsReportsProps {
  transactions: Transaction[];
  categories: Category[];
  onOpenAccountantReport: () => void;
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  transactions,
  categories,
  onOpenAccountantReport,
}) => {
  // Monthly Breakdown aggregation
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        month: string;
        income: number;
        bankExpense: number;
        pettyCashExpense: number;
        totalExpense: number;
        net: number;
      }
    >();

    for (const tx of transactions) {
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      let current = map.get(monthKey);
      if (!current) {
        current = {
          month: monthKey,
          income: 0,
          bankExpense: 0,
          pettyCashExpense: 0,
          totalExpense: 0,
          net: 0,
        };
        map.set(monthKey, current);
      }

      if (tx.type === 'INCOME') {
        current.income += tx.amount;
        current.net += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        current.totalExpense += tx.amount;
        current.net -= tx.amount;
        if (tx.account === 'BANK') {
          current.bankExpense += tx.amount;
        } else {
          current.pettyCashExpense += tx.amount;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);

  // Category expense breakdown
  const categoryExpenses = useMemo(() => {
    const map = new Map<string, number>();
    let totalExpense = 0;

    for (const tx of transactions) {
      if (tx.type === 'EXPENSE') {
        const current = map.get(tx.category) || 0;
        map.set(tx.category, current + tx.amount);
        totalExpense += tx.amount;
      }
    }

    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // One-click CSV Export
  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = [
      'Transaction ID',
      'Date',
      'Account',
      'Type',
      'Amount (AED)',
      'Category',
      'Subcategory',
      'Description',
      'Reference / Cheque No.',
      'Payment Method',
      'Target Account',
      'Has Digital Receipt',
      'Created At',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.account,
      t.type,
      t.amount.toFixed(2),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.subcategory || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.referenceNumber || '').replace(/"/g, '""')}"`,
      t.paymentMethod || '',
      t.transferTargetAccount || '',
      t.receiptBase64 ? 'YES' : 'NO',
      t.createdAt,
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel compatibility
      headers.join(',') +
      '\n' +
      rows.map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AVA_UAE_Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="analytics-and-reports-section" className="space-y-6 mt-8">
      {/* Top Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>P&L Analytics & Audit Hand-off</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic monthly grouping and category cost distribution for UAE business compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="open-accountant-summary-btn"
            onClick={onOpenAccountantReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Accountant Hand-off Report</span>
          </button>
        </div>
      </div>

      {/* Grid: Monthly Breakdown & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly P&L Table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Monthly P&L Ledger Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Currency: AED
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Total Income</th>
                  <th className="py-2.5 px-3 text-right text-sky-400">Bank Outflow</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Petty Cash</th>
                  <th className="py-2.5 px-3 text-right text-rose-400">Total Expense</th>
                  <th className="py-2.5 px-3 text-right">Net Profit / Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                      No monthly data available yet.
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((m) => (
                    <tr key={m.month} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        {new Date(`${m.month}-01`).toLocaleString('default', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        +{formatAED(m.income)}
                      </td>
                      <td className="py-3 px-3 text-right text-sky-300">
                        -{formatAED(m.bankExpense)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-300">
                        -{formatAED(m.pettyCashExpense)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-400 font-medium">
                        -{formatAED(m.totalExpense)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            m.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {m.net >= 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {formatAED(m.net)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Category Distribution (1 col on lg) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>UAE Operational Spend Breakdown</span>
              </h3>
            </div>

            {categoryExpenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No expense records to analyze.
              </div>
            ) : (
              <div className="space-y-3.5">
                {categoryExpenses.slice(0, 6).map((cat, idx) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {cat.name}
                      </span>
                      <span className="font-mono text-slate-300 font-medium">
                        {formatAED(cat.amount)} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0
                            ? 'bg-rose-500'
                            : idx === 1
                            ? 'bg-amber-500'
                            : idx === 2
                            ? 'bg-sky-500'
                            : idx === 3
                            ? 'bg-indigo-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>UAE Corporate Tax / VAT ready</span>
            <span className="text-emerald-400 font-mono">FTA compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
};
