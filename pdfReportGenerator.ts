import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, AccountBalances } from '../types';

interface PdfReportOptions {
  period: string; // e.g. 'ALL' or '2026-09'
  transactions: Transaction[];
  balances: AccountBalances;
  stats: {
    bankIncome: number;
    bankExpense: number;
    pettyIncome: number;
    pettyExpense: number;
    transferToPetty: number;
    transferToBank: number;
    totalIncome: number;
    totalExpense: number;
    netMargin: number;
    categorySpends: [string, number][];
  };
}

export function generateAccountantReportPdf(options: PdfReportOptions): void {
  const { period, transactions, balances, stats } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formattedPeriod =
    period === 'ALL'
      ? 'Cumulative All-Time to Date'
      : new Date(`${period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Top Branding Header Band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 24, 210, 2, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AVA UAE BUSES & PASSENGER TRANSPORT LLC', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Commercial Ledger • UAE Corporate Tax & VAT Audit-Ready Statement', 14, 18);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${generatedDate}`, 196, 18, { align: 'right' });

  // Metadata Panel
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 31, 182, 20, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FINANCIAL AUDIT & ACCOUNTANT HAND-OFF REPORT', 18, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Reporting Period: ${formattedPeriod}`, 18, 45);
  doc.text('Currency: AED (United Arab Emirates Dirham)', 105, 45);
  doc.text(`Total Records: ${transactions.length}`, 165, 45);

  let currentY = 56;

  // SECTION 1: EXECUTIVE CASH BALANCE POSITION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. EXECUTIVE CASH BALANCE POSITION', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Account Description', 'Classification', 'Reconciliation Status', 'Current Balance (AED)']],
    body: [
      ['Primary Corporate Bank Account', 'Bank Wire / Cheques / Direct Debit', 'Active & Reconciled', formatAEDPdf(balances.bankBalance)],
      ['Petty Cash Physical Vault / Float', 'Cash In Hand & Field Driver Expense', 'Controlled Vault Float', formatAEDPdf(balances.pettyCashBalance)],
      ['Total Net Working Capital Reserve', 'Combined Liquid Reserves', 'Balanced', formatAEDPdf(balances.totalNetBalance)],
    ],
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { cellWidth: 55 },
      2: { cellWidth: 32 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 30 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECTION 2: PERIOD PROFIT & LOSS PERFORMANCE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PERIOD PROFIT & LOSS PERFORMANCE SUMMARY', 14, currentY);
  currentY += 3;

  const netPrefix = stats.netMargin >= 0 ? '+' : '';

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Financial Flow Category', 'Channel Breakdown', 'Period Total (AED)']],
    body: [
      [
        'Total Gross Revenue / Inflow (+)',
        `Bank Contracts: ${formatAEDPdf(stats.bankIncome)} | Cash Inflows: ${formatAEDPdf(stats.pettyIncome)}`,
        `+${formatAEDPdf(stats.totalIncome)}`,
      ],
      [
        'Total Operational Expenditure (-)',
        `Bank Operating: ${formatAEDPdf(stats.bankExpense)} | Petty Cash: ${formatAEDPdf(stats.pettyExpense)}`,
        `-${formatAEDPdf(stats.totalExpense)}`,
      ],
      [
        'Net Operating Cash Flow / Margin',
        stats.netMargin >= 0 ? 'Surplus Operating Margin' : 'Operating Deficit for Period',
        `${netPrefix}${formatAEDPdf(stats.netMargin)}`,
      ],
      [
        'Internal Transfers (Vault Replenishment)',
        'Bank to Petty Cash Float Withdrawals',
        formatAEDPdf(stats.transferToPetty),
      ],
    ],
    headStyles: {
      fillColor: [5, 150, 105], // emerald-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { cellWidth: 85 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECTION 3: OPERATIONAL EXPENDITURE BY CATEGORY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. OPERATIONAL EXPENDITURE BY UAE BUSINESS CATEGORY', 14, currentY);
  currentY += 3;

  const categoryRows = stats.categorySpends.map(([catName, amt]) => {
    const pct = stats.totalExpense > 0 ? ((amt / stats.totalExpense) * 100).toFixed(1) : '0.0';
    return [catName, formatAEDPdf(amt), `${pct}%`];
  });

  if (categoryRows.length === 0) {
    categoryRows.push(['No expenses recorded for this period', 'AED 0.00', '0.0%']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['UAE Business Category', 'Total Amount (AED)', 'Expenditure Share (%)']],
    body: categoryRows,
    foot: [['Total Operational Expenses', formatAEDPdf(stats.totalExpense), '100.0%']],
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 105 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 42 },
      2: { halign: 'right', cellWidth: 35 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page for Sign-off block
  if (currentY > 245) {
    doc.addPage();
    currentY = 20;
  }

  // SECTION 4: SIGN-OFF & ATTESTATION BLOCK
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('AUDIT & COMPLIANCE SIGN-OFF', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Prepared By: ____________________________________', 18, currentY + 16);
  doc.text('Finance Officer / Operations Manager', 18, currentY + 22);
  doc.text(`Date: ${generatedDate}`, 18, currentY + 27);

  doc.text('Verified By: ____________________________________', 110, currentY + 16);
  doc.text('Certified Chartered Accountant / Registered Tax Agent', 110, currentY + 22);
  doc.text('Official Stamp & Signature', 110, currentY + 27);

  // Bottom Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL • AVA UAE Buses & Passenger Transport LLC • UAE Corporate Tax & VAT Record',
      14,
      290
    );
    doc.text(`Page ${i} of ${totalPages}`, 196, 290, { align: 'right' });
  }

  const filenameSlug = period === 'ALL' ? 'Cumulative' : period;
  doc.save(`AVA_Accountant_Report_${filenameSlug}.pdf`);
}

function formatAEDPdf(amount: number): string {
  return (
    'AED ' +
    Number(amount).toLocaleString('en-AE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export interface LedgerPdfOptions {
  transactions: Transaction[];
  filtersSummary?: {
    account?: string;
    flowType?: string;
    category?: string;
    dateRange?: string;
    searchQuery?: string;
  };
  periodTotal?: number;
}

export function generateLedgerPdf(options: LedgerPdfOptions): void {
  const { transactions, filtersSummary, periodTotal } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const generatedTime = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate totals
  let totalInflow = 0;
  let totalOutflow = 0;
  let totalTransfers = 0;

  for (const tx of transactions) {
    if (tx.type === 'INCOME') totalInflow += Number(tx.amount);
    else if (tx.type === 'EXPENSE') totalOutflow += Number(tx.amount);
    else if (tx.type === 'TRANSFER') totalTransfers += Number(tx.amount);
  }

  const netBalance = periodTotal !== undefined ? periodTotal : totalInflow - totalOutflow;

  // Top Branding Header Band (Landscape: 297mm width)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 22, 'F');

  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 22, 297, 2, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AVA UAE BUSES & PASSENGER TRANSPORT LLC', 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Operational Transaction Ledger • Filtered Commercial Audit Statement', 14, 17);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${generatedDate} at ${generatedTime}`, 283, 17, { align: 'right' });

  // Metadata Panel
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 28, 269, 18, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`FILTERED LEDGER STATEMENT (${transactions.length} RECORDS)`, 18, 34);

  // Active filters label
  const filterParts: string[] = [];
  if (filtersSummary?.account && filtersSummary.account !== 'ALL') {
    filterParts.push(`Account: ${filtersSummary.account === 'PETTY_CASH' ? 'Petty Cash' : filtersSummary.account}`);
  }
  if (filtersSummary?.flowType && filtersSummary.flowType !== 'ALL') {
    filterParts.push(`Flow: ${filtersSummary.flowType}`);
  }
  if (filtersSummary?.category && filtersSummary.category !== 'ALL') {
    filterParts.push(`Category: ${filtersSummary.category}`);
  }
  if (filtersSummary?.dateRange) {
    filterParts.push(`Dates: ${filtersSummary.dateRange}`);
  }
  if (filtersSummary?.searchQuery) {
    filterParts.push(`Search: "${filtersSummary.searchQuery}"`);
  }

  const filtersString = filterParts.length > 0 ? filterParts.join('  |  ') : 'All Accounts & Categories (Unfiltered)';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Applied Filters: ${filtersString}`, 18, 41);

  // Summary figures on right side of metadata panel
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const summaryMetricsText = `Total Inflow: +${formatAEDPdf(totalInflow)}   |   Total Outflow: -${formatAEDPdf(totalOutflow)}   |   Net Period: ${netBalance >= 0 ? '+' : ''}${formatAEDPdf(netBalance)}`;
  doc.text(summaryMetricsText, 280, 36, { align: 'right' });

  // Transaction Ledger Table
  const tableData = transactions.map((tx, index) => {
    const accountLabel = tx.account === 'BANK' ? 'Bank Account' : 'Petty Cash';
    const vehicleLabel = tx.vehicleNumber || '—';
    const formattedAmount = `${tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}${formatAEDPdf(tx.amount)}`;
    const categoryDetail = tx.subcategory ? `${tx.category} / ${tx.subcategory}` : tx.category;
    const descDetail = tx.referenceNumber ? `${tx.description} (Ref: ${tx.referenceNumber})` : tx.description;

    return [
      (index + 1).toString(),
      tx.date,
      accountLabel,
      tx.type,
      categoryDetail,
      descDetail,
      vehicleLabel,
      formattedAmount,
    ];
  });

  autoTable(doc, {
    startY: 49,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [
      [
        '#',
        'Date',
        'Account',
        'Flow Type',
        'Category / Subcategory',
        'Description & Reference',
        'Vehicle / Fleet No.',
        'Amount (AED)',
      ],
    ],
    body: tableData.length > 0 ? tableData : [['-', '-', '-', '-', 'No records matching filter criteria', '-', '-', '-']],
    foot: [
      [
        '',
        '',
        '',
        '',
        `Total Records: ${transactions.length}`,
        `Transfers: ${formatAEDPdf(totalTransfers)}`,
        'Net Filtered Outflow / Inflow:',
        `${netBalance >= 0 ? '+' : ''}${formatAEDPdf(netBalance)}`,
      ],
    ],
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 24 },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 50 },
      5: { cellWidth: 80 },
      6: { cellWidth: 28 },
      7: { cellWidth: 33, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Color-code flow type and amount column
      if (data.section === 'body') {
        const rowData = tableData[data.row.index];
        if (rowData) {
          const type = rowData[3];
          if (data.column.index === 3 || data.column.index === 7) {
            if (type === 'INCOME') {
              data.cell.styles.textColor = [5, 150, 105]; // emerald-600
            } else if (type === 'EXPENSE') {
              data.cell.styles.textColor = [225, 29, 72]; // rose-600
            } else if (type === 'TRANSFER') {
              data.cell.styles.textColor = [79, 70, 229]; // indigo-600
            }
          }
        }
      }
    },
  });

  // Bottom Footer on all pages (Landscape: 210mm height)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'CONFIDENTIAL • AVA UAE Buses & Passenger Transport LLC • Commercial Operational Ledger',
      14,
      202
    );
    doc.text(`Page ${i} of ${totalPages}`, 283, 202, { align: 'right' });
  }

  const dateSlug = new Date().toISOString().substring(0, 10);
  doc.save(`AVA_Operational_Ledger_${dateSlug}.pdf`);
}

