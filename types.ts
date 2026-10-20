export type AccountType = 'BANK' | 'PETTY_CASH';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  account: AccountType; // Origin account (or target for transfers)
  type: TransactionType;
  amount: number; // in AED
  category: string;
  subcategory?: string;
  description: string;
  referenceNumber?: string; // Cheque number, wire ref, invoice no, RTA receipt no.
  vehicleNumber?: string; // Fleet vehicle plate e.g. 27804 (SHARJAH), U / 77468
  paymentMethod?: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD';
  receiptBase64?: string; // Base64 encoded image
  receiptName?: string;
  receiptType?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
  // For inter-account transfers:
  transferTargetAccount?: AccountType;
  transferLinkedId?: string; // Linked mirrored transaction id
}

export interface Category {
  id: string;
  name: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  subcategories: string[];
  isCustom?: boolean;
}

export interface SyncSettings {
  googleAppsScriptUrl: string;
  apiKey: string; // Default: 'ava-finance-2026'
  autoSync: boolean;
  lastSyncTime: string | null;
  spreadsheetId?: string;
  spreadsheetName?: string;
  driveFolderId?: string;
}

export interface AccountBalances {
  bankBalance: number;
  pettyCashBalance: number;
  totalNetBalance: number;
  totalIncome: number;
  totalExpenses: number;
  pettyCashReserveAlertLevel: number;
}
