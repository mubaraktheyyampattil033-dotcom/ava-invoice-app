import { Transaction, Category, SyncSettings, AccountBalances } from '../types';
import { DEFAULT_API_KEY } from './auth';

const TRANSACTIONS_KEY = 'ava_finance_transactions_v1';
const CATEGORIES_KEY = 'ava_finance_categories_v1';
const SYNC_SETTINGS_KEY = 'ava_finance_sync_settings_v1';
const RESERVE_ALERT_KEY = 'ava_finance_reserve_alert_v1';

export const AVA_FLEET_VEHICLES = [
  '27804 (SHARJAH)',
  'U / 77468',
  'V / 16788',
  'EE / 77604',
  'O / 56229',
  'M / 30419',
  'C / 79067',
  'M / 93137',
  'E / 34993 (DUBAI)',
  'AA / 79364 (DUBAI)',
  'V / 16789',
];

export const AVA_FLEET_CATEGORIES: Category[] = [
  {
    id: 'maintenance',
    name: 'Maintenance',
    type: 'EXPENSE',
    subcategories: [
      'Service',
      'Tyres',
      'Spare parts',
      'Repairs',
      'New Tires',
      'Used Tires',
      'Batteries',
      'Al Nad Maintenance',
    ],
  },
  {
    id: 'vehicle_exp',
    name: 'Vehicle exp',
    type: 'EXPENSE',
    subcategories: [
      'Salik',
      'Fines',
      'Insurance',
      'Registration',
      'Parking',
      'RAK Permit',
      'Sharjah Permit',
      'Dubai Parking',
    ],
  },
  {
    id: 'salary',
    name: 'Salary',
    type: 'EXPENSE',
    subcategories: [
      'Driver',
      'Helper',
      'Office staff',
      'Mubarak',
      'Shah Zeb Rahman',
      'Haseeb Tariq',
      'Usman Khan Gul Zad',
      'Ahsan Nadeem',
      'Nadeem Ishfaq',
      'Fazal Hussain Ali Muhammad',
      'Huzaifa Nisahuddin',
      'Ilyas',
      'Kamarvan Kahan',
      'Mohammed',
      'Salam',
    ],
  },
  {
    id: 'office',
    name: 'Office',
    type: 'EXPENSE',
    subcategories: [
      'Stationery',
      'Utilities',
      'Internet',
      'Phone',
    ],
  },
  {
    id: 'rent',
    name: 'Rent',
    type: 'EXPENSE',
    subcategories: [
      'Bab Al Skoon Hilux',
      'AlNad Cars Services Workshop',
      'Emirates Rent',
      'Fawad Ali Rasool Khan',
      'Jabal Rayan Passengers Transport',
      'Muhammad Noor Akbar Fazal Haq',
      'Nasir Ullah',
      'Waheed Ur Rehman Akram Khan',
      'UAQ Rent / DATS',
      '30-Seater Abu Dhabi - Speed Badshah',
      '14-Seater Sharjah - Sabir Khan',
      '60-Seater Abu Dhabi - Habibullah',
      'Azad Abu dhabi',
    ],
  },
  {
    id: 'owner_drawings',
    name: 'Owner drawings',
    type: 'EXPENSE',
    subcategories: [
      'Owner Drawings',
      'Personal Expense',
      'Partner Withdrawal',
    ],
  },
  {
    id: 'vehicle_hire',
    name: 'Vehicle hire',
    type: 'EXPENSE',
    subcategories: [
      'Bus hire',
      'Pick-up hire',
      'Salik recharge',
    ],
  },
  {
    id: 'diesel',
    name: 'Diesel',
    type: 'EXPENSE',
    subcategories: [
      'ADNOC',
      'UAQ',
      'Sharjah',
      'Ajman',
      'Cash',
    ],
  },
  {
    id: 'income',
    name: 'Income',
    type: 'INCOME',
    subcategories: [
      'ALICO',
      'Data UAQ',
      'Headline',
      'Exalogic',
    ],
  },
  {
    id: 'ava',
    name: 'AVA',
    type: 'EXPENSE',
    subcategories: [
      'AVA Office',
      'AVA Trade License',
      'AVA Visas',
      'AVA Telephone',
      'AVA Bus',
      'AVA Typing',
      'AVA VAT',
      'AVA Fines',
      'AVA Salik',
    ],
  },
  {
    id: 'other',
    name: 'Other',
    type: 'EXPENSE',
    subcategories: [
      'Hammer',
      'General Expense',
    ],
  },
  {
    id: 'ebrahim',
    name: 'Ebrahim',
    type: 'EXPENSE',
    subcategories: [
      'Salary',
      'Advance',
      'deposit',
    ],
  },
  {
    id: 'transfer_internal',
    name: 'Inter-Account Transfer',
    type: 'BOTH',
    subcategories: [
      'Bank Cash Withdrawal for Petty Cash',
      'Petty Cash Surplus Deposit to Bank',
      'Cheque Encashment',
    ],
  },
];

export const DEFAULT_UAE_CATEGORIES: Category[] = AVA_FLEET_CATEGORIES;

// Fresh sample UAE fleet transactions matching categories from spreadsheet
export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-seed-1',
    date: '2026-09-01',
    account: 'BANK',
    type: 'INCOME',
    amount: 48500,
    category: 'Income',
    subcategory: 'ALICO',
    vehicleNumber: '27804 (SHARJAH)',
    description: 'ALICO corporate staff passenger transport contract wire payment',
    referenceNumber: 'WIRE-DXB-98442',
    synced: true,
    createdAt: '2026-09-01T08:30:00.000Z',
    updatedAt: '2026-09-01T08:30:00.000Z',
  },
  {
    id: 'tx-seed-2',
    date: '2026-09-02',
    account: 'BANK',
    type: 'EXPENSE',
    amount: 14200,
    category: 'Diesel',
    subcategory: 'ADNOC',
    vehicleNumber: 'U / 77468',
    description: 'Bulk monthly ADNOC fleet diesel balance replenishment',
    referenceNumber: 'ADNOC-INV-7731',
    synced: true,
    createdAt: '2026-09-02T10:15:00.000Z',
    updatedAt: '2026-09-02T10:15:00.000Z',
  },
  {
    id: 'tx-seed-3',
    date: '2026-09-03',
    account: 'BANK',
    type: 'TRANSFER',
    amount: 5000,
    category: 'Inter-Account Transfer',
    subcategory: 'Bank Cash Withdrawal for Petty Cash',
    description: 'Cheque cash withdrawal from Mashreq Bank to replenish operational Petty Cash',
    referenceNumber: 'CHQ-004521',
    transferTargetAccount: 'PETTY_CASH',
    synced: true,
    createdAt: '2026-09-03T11:00:00.000Z',
    updatedAt: '2026-09-03T11:00:00.000Z',
  },
  {
    id: 'tx-seed-4',
    date: '2026-09-04',
    account: 'PETTY_CASH',
    type: 'EXPENSE',
    amount: 420,
    category: 'Vehicle exp',
    subcategory: 'Salik',
    vehicleNumber: 'EE / 77604',
    description: 'Salik toll tag recharge voucher for fleet bus',
    referenceNumber: 'SALIK-9920',
    synced: true,
    createdAt: '2026-09-04T14:20:00.000Z',
    updatedAt: '2026-09-04T14:20:00.000Z',
  },
  {
    id: 'tx-seed-5',
    date: '2026-09-05',
    account: 'PETTY_CASH',
    type: 'EXPENSE',
    amount: 680,
    category: 'Maintenance',
    subcategory: 'Service',
    vehicleNumber: 'V / 16788',
    description: 'Scheduled lube, oil filter and brake maintenance inspection at Al Nad Workshop',
    referenceNumber: 'ALNAD-REC-102',
    synced: true,
    createdAt: '2026-09-05T16:45:00.000Z',
    updatedAt: '2026-09-05T16:45:00.000Z',
  },
  {
    id: 'tx-seed-6',
    date: '2026-09-06',
    account: 'BANK',
    type: 'EXPENSE',
    amount: 4350,
    category: 'Maintenance',
    subcategory: 'Repairs',
    vehicleNumber: 'M / 30419',
    description: 'Bus AC compressor replacement & Denso refrigerant refill',
    referenceNumber: 'INV-5519',
    synced: true,
    createdAt: '2026-09-06T09:10:00.000Z',
    updatedAt: '2026-09-06T09:10:00.000Z',
  },
  {
    id: 'tx-seed-7',
    date: '2026-09-07',
    account: 'BANK',
    type: 'INCOME',
    amount: 22000,
    category: 'Income',
    subcategory: 'Data UAQ',
    vehicleNumber: 'O / 56229',
    description: 'Data UAQ staff passenger charter agreement contract booking',
    referenceNumber: 'DEP-INV-4412',
    synced: true,
    createdAt: '2026-09-07T11:40:00.000Z',
    updatedAt: '2026-09-07T11:40:00.000Z',
  },
  {
    id: 'tx-seed-8',
    date: '2026-09-08',
    account: 'BANK',
    type: 'EXPENSE',
    amount: 3500,
    category: 'Salary',
    subcategory: 'Mubarak',
    vehicleNumber: '27804 (SHARJAH)',
    description: 'Monthly driver salary disbursement for Mubarak',
    referenceNumber: 'SAL-MUBARAK-09',
    synced: true,
    createdAt: '2026-09-08T10:00:00.000Z',
    updatedAt: '2026-09-08T10:00:00.000Z',
  },
  {
    id: 'tx-seed-9',
    date: '2026-09-09',
    account: 'BANK',
    type: 'EXPENSE',
    amount: 4500,
    category: 'Rent',
    subcategory: 'Bab Al Skoon Hilux',
    vehicleNumber: 'C / 79067',
    description: 'Monthly commercial vehicle lease payment - Bab Al Skoon Hilux',
    referenceNumber: 'RENT-BSH-09',
    synced: true,
    createdAt: '2026-09-09T14:30:00.000Z',
    updatedAt: '2026-09-09T14:30:00.000Z',
  },
  {
    id: 'tx-seed-10',
    date: '2026-09-10',
    account: 'PETTY_CASH',
    type: 'EXPENSE',
    amount: 850,
    category: 'AVA',
    subcategory: 'AVA Salik',
    vehicleNumber: 'AA / 79364 (DUBAI)',
    description: 'AVA company fleet Salik recharge portal top-up',
    referenceNumber: 'AVA-SLK-44',
    synced: true,
    createdAt: '2026-09-10T16:00:00.000Z',
    updatedAt: '2026-09-10T16:00:00.000Z',
  },
  {
    id: 'tx-seed-11',
    date: '2026-09-11',
    account: 'PETTY_CASH',
    type: 'EXPENSE',
    amount: 1200,
    category: 'Ebrahim',
    subcategory: 'Advance',
    vehicleNumber: 'M / 93137',
    description: 'Driver cash advance disbursement for Ebrahim',
    referenceNumber: 'EBR-ADV-01',
    synced: true,
    createdAt: '2026-09-11T12:00:00.000Z',
    updatedAt: '2026-09-11T12:00:00.000Z',
  },
];

export const getTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    }
    const parsed: Transaction[] = JSON.parse(raw);
    // Seamlessly upgrade if transactions contain legacy categories that don't match the new fleet sheet
    const hasLegacyCats = parsed.some(
      (t) =>
        t.category === 'Client Deposits & Contracts' ||
        t.category === 'ADNOC / ENOC Fuel' ||
        t.category === 'RTA Permits & Licensing' ||
        t.category === 'Petty Cash Operational Costs' ||
        t.category === 'Vehicle Maintenance & Spares'
    );
    if (hasLegacyCats) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading transactions from storage:', e);
    return SEED_TRANSACTIONS;
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions to storage:', e);
  }
};

export const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Transaction => {
  const transactions = getTransactions();
  const now = new Date().toISOString();
  const newTx: Transaction = {
    ...tx,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    synced: false,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newTx, ...transactions];
  saveTransactions(updated);
  return newTx;
};

export const addBulkTransactions = (
  txList: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>[]
): Transaction[] => {
  const transactions = getTransactions();
  const now = new Date().toISOString();
  const newTransactions: Transaction[] = txList.map((tx, idx) => ({
    ...tx,
    id: 'tx-bulk-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 7),
    synced: false,
    createdAt: now,
    updatedAt: now,
  }));

  const updated = [...newTransactions, ...transactions];
  saveTransactions(updated);
  return newTransactions;
};

export const updateTransaction = (id: string, updates: Partial<Transaction>): Transaction | null => {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updatedTx: Transaction = {
    ...transactions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    synced: false,
  };

  transactions[index] = updatedTx;
  saveTransactions(transactions);
  return updatedTx;
};

export const deleteTransaction = (id: string): boolean => {
  const transactions = getTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  if (filtered.length === transactions.length) return false;
  saveTransactions(filtered);
  return true;
};

export const getCategories = (): Category[] => {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_UAE_CATEGORIES));
      return DEFAULT_UAE_CATEGORIES;
    }
    const parsed: Category[] = JSON.parse(raw);
    // If user's storage only has legacy initial defaults, seamlessly upgrade to AVA Fleet Categories
    const hasLegacyDefaultsOnly = parsed.some(
      (c) =>
        c.id === 'rta_permits' ||
        c.id === 'fuel_adnoc_enoc' ||
        c.name === 'Client Deposits & Contracts' ||
        c.name === 'ADNOC / ENOC Fuel'
    );
    if (hasLegacyDefaultsOnly || !parsed.some((c) => c.name === 'Maintenance' || c.id === 'maintenance')) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_UAE_CATEGORIES));
      return DEFAULT_UAE_CATEGORIES;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading categories:', e);
    return DEFAULT_UAE_CATEGORIES;
  }
};

export const resetToFreshFleetData = (): {
  transactions: Transaction[];
  categories: Category[];
  vehicles: string[];
} => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(AVA_FLEET_CATEGORIES));
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(AVA_FLEET_VEHICLES));
  return {
    transactions: SEED_TRANSACTIONS,
    categories: AVA_FLEET_CATEGORIES,
    vehicles: AVA_FLEET_VEHICLES,
  };
};

export const saveCategories = (cats: Category[]): void => {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
};

const VEHICLES_KEY = 'ava_finance_vehicles_v1';

export const getVehicles = (): string[] => {
  try {
    const raw = localStorage.getItem(VEHICLES_KEY);
    if (!raw) {
      localStorage.setItem(VEHICLES_KEY, JSON.stringify(AVA_FLEET_VEHICLES));
      return AVA_FLEET_VEHICLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : AVA_FLEET_VEHICLES;
  } catch (e) {
    return AVA_FLEET_VEHICLES;
  }
};

export const saveVehicles = (vehicles: string[]): void => {
  try {
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.error('Error saving vehicles:', e);
  }
};

export const addVehicle = (newVehicle: string): string[] => {
  const current = getVehicles();
  const trimmed = newVehicle.trim().toUpperCase();
  if (trimmed && !current.includes(trimmed)) {
    const updated = [trimmed, ...current];
    saveVehicles(updated);
    return updated;
  }
  return current;
};

export const deleteVehicle = (vehicleToDelete: string): string[] => {
  const current = getVehicles();
  const updated = current.filter((v) => v !== vehicleToDelete);
  saveVehicles(updated);
  return updated;
};

export const getSyncSettings = (): SyncSettings => {
  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (!raw) {
      const initial: SyncSettings = {
        googleAppsScriptUrl: '',
        apiKey: DEFAULT_API_KEY,
        autoSync: true,
        lastSyncTime: null,
      };
      localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      googleAppsScriptUrl: '',
      apiKey: DEFAULT_API_KEY,
      autoSync: true,
      lastSyncTime: null,
    };
  }
};

export const saveSyncSettings = (settings: SyncSettings): void => {
  try {
    localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving sync settings:', e);
  }
};

export const getPettyCashReserveAlert = (): number => {
  const val = localStorage.getItem(RESERVE_ALERT_KEY);
  return val ? parseFloat(val) : 1000; // Default AED 1,000 threshold
};

export const savePettyCashReserveAlert = (amount: number): void => {
  localStorage.setItem(RESERVE_ALERT_KEY, amount.toString());
};

export const calculateBalances = (transactions: Transaction[]): AccountBalances => {
  let bankBalance = 0;
  let pettyCashBalance = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;

    if (tx.type === 'INCOME') {
      totalIncome += amt;
      if (tx.account === 'BANK') {
        bankBalance += amt;
      } else if (tx.account === 'PETTY_CASH') {
        pettyCashBalance += amt;
      }
    } else if (tx.type === 'EXPENSE') {
      totalExpenses += amt;
      if (tx.account === 'BANK') {
        bankBalance -= amt;
      } else if (tx.account === 'PETTY_CASH') {
        pettyCashBalance -= amt;
      }
    } else if (tx.type === 'TRANSFER') {
      // Inter-account transfer:
      // If origin is BANK and target is PETTY_CASH:
      // Bank decreases by amt, Petty Cash increases by amt
      if (tx.account === 'BANK' && tx.transferTargetAccount === 'PETTY_CASH') {
        bankBalance -= amt;
        pettyCashBalance += amt;
      } else if (tx.account === 'PETTY_CASH' && tx.transferTargetAccount === 'BANK') {
        pettyCashBalance -= amt;
        bankBalance += amt;
      }
    }
  }

  return {
    bankBalance,
    pettyCashBalance,
    totalNetBalance: bankBalance + pettyCashBalance,
    totalIncome,
    totalExpenses,
    pettyCashReserveAlertLevel: getPettyCashReserveAlert(),
  };
};

export const formatAED = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
