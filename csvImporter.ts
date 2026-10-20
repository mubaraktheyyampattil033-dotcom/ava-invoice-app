import { Transaction, AccountType, TransactionType } from '../types';

export interface ParsedCsvRow {
  rowNumber: number;
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>;
  isValid: boolean;
  errors: string[];
  isPotentialDuplicate?: boolean;
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  validCount: number;
  invalidCount: number;
  totalValidAmount: number;
  potentialDuplicateCount: number;
}

// Sample CSV Template content for download
export const SAMPLE_CSV_TEMPLATE = `Date,Account,Type,Amount,Category,Subcategory,VehicleNumber,Description,ReferenceNumber
2026-09-01,BANK,INCOME,48500,Income,ALICO,27804 (SHARJAH),Staff Transport Monthly Contract,WIRE-DXB-98442
2026-09-02,BANK,EXPENSE,14200,Diesel,ADNOC,U / 77468,Bulk monthly ADNOC fleet diesel balance replenishment,ENOC-EP-8831
2026-09-03,PETTY_CASH,EXPENSE,650,Vehicle exp,Salik,V / 16788,Salik toll recharge for trip,SLK-DXB-4412
2026-09-04,BANK,EXPENSE,3200,Maintenance,Spare parts,EE / 77604,Heavy duty brake pads set,INV-ALQ-7781
2026-09-05,PETTY_CASH,EXPENSE,240,Office,Utilities,,Office emergency cleaning supplies,CASH-RCP-104
2026-09-06,BANK,TRANSFER,5000,Inter-Account Transfer,Bank Cash Withdrawal for Petty Cash,,Petty cash safe replenishment cash withdrawal,CHQ-ADCB-00441`;

export function downloadCsvTemplate(): void {
  const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'AVA_UAE_Ledger_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Simple robust CSV line splitter that handles quotes and commas
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Normalizes various date representations to YYYY-MM-DD
function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const str = raw.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // MM/DD/YYYY
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().substring(0, 10);
  }

  return null;
}

export function parseTransactionsCsv(
  csvText: string,
  existingTransactions: Transaction[] = []
): CsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) {
    return {
      rows: [],
      validCount: 0,
      invalidCount: 0,
      totalValidAmount: 0,
      potentialDuplicateCount: 0,
    };
  }

  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Header index resolution
  const colIndex = {
    date: rawHeaders.findIndex((h) => h.includes('date') || h === 'txdate'),
    account: rawHeaders.findIndex((h) => h.includes('account') || h === 'acc' || h === 'origin'),
    type: rawHeaders.findIndex((h) => h.includes('type') || h === 'flow' || h === 'txtype'),
    amount: rawHeaders.findIndex((h) => h.includes('amount') || h === 'aed' || h === 'total' || h === 'cost' || h === 'price'),
    category: rawHeaders.findIndex((h) => h.includes('cat') || h === 'category'),
    subcategory: rawHeaders.findIndex((h) => h.includes('subcat') || h.includes('sub')),
    description: rawHeaders.findIndex((h) => h.includes('desc') || h.includes('detail') || h.includes('memo') || h.includes('narration')),
    ref: rawHeaders.findIndex((h) => h.includes('ref') || h.includes('cheque') || h.includes('invoice')),
    vehicleNumber: rawHeaders.findIndex((h) => h.includes('veh') || h.includes('bus') || h.includes('plate') || h.includes('fleet')),
    paymentMethod: rawHeaders.findIndex((h) => h.includes('pay') || h.includes('method')),
  };

  const parsedRows: ParsedCsvRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let totalValidAmount = 0;
  let potentialDuplicateCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCsvLine(lines[i]);
    const rowNum = i + 1;
    const errors: string[] = [];

    // Date
    const rawDate = colIndex.date !== -1 ? rawCols[colIndex.date] : rawCols[0];
    const normalizedDate = normalizeDate(rawDate);
    if (!normalizedDate) {
      errors.push(`Invalid date format ("${rawDate || 'empty'}"). Expected YYYY-MM-DD or DD/MM/YYYY.`);
    }

    // Account
    const rawAcc = (colIndex.account !== -1 ? rawCols[colIndex.account] : '').toLowerCase();
    let account: AccountType = 'BANK';
    if (rawAcc.includes('petty') || rawAcc.includes('cash') || rawAcc === 'pc') {
      account = 'PETTY_CASH';
    } else if (rawAcc.includes('bank') || rawAcc === 'adcb' || rawAcc === 'enbd' || rawAcc === 'fab') {
      account = 'BANK';
    }

    // Type
    const rawType = (colIndex.type !== -1 ? rawCols[colIndex.type] : '').toLowerCase();
    let type: TransactionType = 'EXPENSE';
    if (rawType.includes('in') || rawType.includes('dep') || rawType.includes('rev')) {
      type = 'INCOME';
    } else if (rawType.includes('trans') || rawType.includes('xfer')) {
      type = 'TRANSFER';
    } else if (rawType.includes('exp') || rawType.includes('out') || rawType.includes('pay')) {
      type = 'EXPENSE';
    }

    // Amount
    const rawAmt = colIndex.amount !== -1 ? rawCols[colIndex.amount] : '';
    const cleanAmt = (rawAmt || '').replace(/[^0-9.-]/g, '');
    const amountNum = Math.abs(parseFloat(cleanAmt));
    if (isNaN(amountNum) || amountNum <= 0) {
      errors.push(`Invalid amount value ("${rawAmt || 'empty'}"). Must be a positive number in AED.`);
    }

    // Category
    const rawCat = colIndex.category !== -1 ? rawCols[colIndex.category] : '';
    const category = rawCat ? rawCat.trim() : (type === 'TRANSFER' ? 'Inter-Account Transfer' : 'General Operational Expense');

    // Subcategory
    const subcategory = colIndex.subcategory !== -1 && rawCols[colIndex.subcategory] ? rawCols[colIndex.subcategory].trim() : undefined;

    // Description
    const rawDesc = colIndex.description !== -1 ? rawCols[colIndex.description] : '';
    const description = rawDesc ? rawDesc.trim() : `${category} ${subcategory ? `(${subcategory})` : ''}`.trim();

    // Reference
    const referenceNumber = colIndex.ref !== -1 && rawCols[colIndex.ref] ? rawCols[colIndex.ref].trim() : undefined;

    // Payment Method
    const rawMethod = (colIndex.paymentMethod !== -1 ? rawCols[colIndex.paymentMethod] : '').toUpperCase().replace(/[\s-]/g, '_');
    let paymentMethod: any = undefined;
    if (rawMethod.includes('TRANSFER') || rawMethod.includes('WIRE')) paymentMethod = 'BANK_TRANSFER';
    else if (rawMethod.includes('CHEQUE') || rawMethod.includes('CHECK')) paymentMethod = 'CHEQUE';
    else if (rawMethod.includes('CASH')) paymentMethod = 'CASH';
    else if (rawMethod.includes('DEBIT')) paymentMethod = 'DEBIT_CARD';
    else if (rawMethod.includes('CREDIT')) paymentMethod = 'CREDIT_CARD';
    else {
      paymentMethod = account === 'BANK' ? 'BANK_TRANSFER' : 'CASH';
    }

    const isValid = errors.length === 0;

    // Duplicate check
    let isPotentialDuplicate = false;
    if (isValid) {
      const match = existingTransactions.some((tx) => {
        return (
          tx.date === normalizedDate &&
          Math.abs(tx.amount - amountNum) < 0.001 &&
          tx.category.trim().toLowerCase() === category.toLowerCase()
        );
      });
      if (match) {
        isPotentialDuplicate = true;
        potentialDuplicateCount++;
      }
      validCount++;
      totalValidAmount += amountNum;
    } else {
      invalidCount++;
    }

    parsedRows.push({
      rowNumber: rowNum,
      isValid,
      errors,
      isPotentialDuplicate,
      data: {
        date: normalizedDate || '2026-09-01',
        account,
        type,
        amount: amountNum || 0,
        category,
        subcategory,
        vehicleNumber: colIndex.vehicleNumber !== -1 ? rawCols[colIndex.vehicleNumber] : undefined,
        description,
        referenceNumber,
        paymentMethod,
        transferTargetAccount: type === 'TRANSFER' ? (account === 'BANK' ? 'PETTY_CASH' : 'BANK') : undefined,
      },
    });
  }

  return {
    rows: parsedRows,
    validCount,
    invalidCount,
    totalValidAmount,
    potentialDuplicateCount,
  };
}
