import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Trash2,
  Building,
  Coins,
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Tag,
  Hash,
  Bus,
  Plus,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Transaction, AccountType, TransactionType, Category } from '../types';
import { formatAED, getVehicles, addVehicle } from '../services/storage';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
  existingTransactions?: Transaction[];
  initialAccount?: AccountType;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  categories,
  existingTransactions = [],
  initialAccount = 'BANK',
  initialType = 'EXPENSE',
}) => {
  const [account, setAccount] = useState<AccountType>(initialAccount);
  const [type, setType] = useState<TransactionType>(initialType);
  const [transferTargetAccount, setTransferTargetAccount] = useState<AccountType>('PETTY_CASH');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [vehiclesList, setVehiclesList] = useState<string[]>(() => getVehicles());
  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false);
  const [newVehicleInput, setNewVehicleInput] = useState('');
  const [receiptBase64, setReceiptBase64] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect potential duplicate transactions with identical amount, date, and category
  const potentialDuplicates = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !date || !category.trim()) {
      return [];
    }
    return existingTransactions.filter((tx) => {
      // Exclude the current transaction if editing
      if (editingTransaction && tx.id === editingTransaction.id) {
        return false;
      }
      const sameAmount = Math.abs(Number(tx.amount) - numAmount) < 0.001;
      const sameDate = tx.date === date;
      const sameCategory = tx.category.trim().toLowerCase() === category.trim().toLowerCase();
      return sameAmount && sameDate && sameCategory;
    });
  }, [existingTransactions, editingTransaction, amount, date, category]);

  // Initialize or reset state when modal opens or editingTransaction changes
  useEffect(() => {
    setVehiclesList(getVehicles());
    setIsAddingNewVehicle(false);
    setNewVehicleInput('');

    if (editingTransaction) {
      setAccount(editingTransaction.account);
      setType(editingTransaction.type);
      setTransferTargetAccount(editingTransaction.transferTargetAccount || 'PETTY_CASH');
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setSubcategory(editingTransaction.subcategory || '');
      setDescription(editingTransaction.description);
      setReferenceNumber(editingTransaction.referenceNumber || '');
      setVehicleNumber(editingTransaction.vehicleNumber || '');
      setReceiptBase64(editingTransaction.receiptBase64);
      setReceiptName(editingTransaction.receiptName);
    } else {
      setAccount(initialAccount);
      setType(initialType);
      setTransferTargetAccount(initialAccount === 'BANK' ? 'PETTY_CASH' : 'BANK');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setReferenceNumber('');
      setVehicleNumber('');
      setReceiptBase64(undefined);
      setReceiptName(undefined);

      // Default category
      if (initialType === 'TRANSFER') {
        setCategory('Inter-Account Transfer');
        setSubcategory('Bank Cash Withdrawal for Petty Cash');
      } else if (initialType === 'INCOME') {
        const incCat = categories.find((c) => c.type === 'INCOME' || c.type === 'BOTH');
        if (incCat) {
          setCategory(incCat.name);
          setSubcategory(incCat.subcategories[0] || '');
        }
      } else {
        const expCat = categories.find((c) => c.type === 'EXPENSE' || c.type === 'BOTH');
        if (expCat) {
          setCategory(expCat.name);
          setSubcategory(expCat.subcategories[0] || '');
        }
      }
    }
    setErrorMsg(null);
    setAcknowledgedDuplicate(false);
  }, [editingTransaction, isOpen, initialAccount, initialType, categories]);

  // Adjust categories when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'TRANSFER') {
      setCategory('Inter-Account Transfer');
      setSubcategory(
        account === 'BANK'
          ? 'Bank Cash Withdrawal for Petty Cash'
          : 'Petty Cash Surplus Deposit to Bank'
      );
      setTransferTargetAccount(account === 'BANK' ? 'PETTY_CASH' : 'BANK');
    } else {
      const filtered = categories.filter(
        (c) => c.type === newType || c.type === 'BOTH'
      );
      if (filtered.length > 0) {
        setCategory(filtered[0].name);
        setSubcategory(filtered[0].subcategories[0] || '');
      }
    }
  };

  const handleAccountChange = (newAccount: AccountType) => {
    setAccount(newAccount);
    if (type === 'TRANSFER') {
      setTransferTargetAccount(newAccount === 'BANK' ? 'PETTY_CASH' : 'BANK');
      setSubcategory(
        newAccount === 'BANK'
          ? 'Bank Cash Withdrawal for Petty Cash'
          : 'Petty Cash Surplus Deposit to Bank'
      );
    }
  };

  const currentCategoryObj = categories.find((c) => c.name === category);

  // File upload and Base64 compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processReceiptFile(file);
  };

  const processReceiptFile = (file: File) => {
    setIsCompressingReceipt(true);
    setReceiptName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setIsCompressingReceipt(false);
        return;
      }

      // If image, resize for lightweight storage (< 200KB)
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.75);
            setReceiptBase64(optimizedBase64);
          } else {
            setReceiptBase64(result);
          }
          setIsCompressingReceipt(false);
        };
        img.src = result;
      } else {
        // Non-image (e.g. PDF)
        setReceiptBase64(result);
        setIsCompressingReceipt(false);
      }
    };
    reader.onerror = () => {
      setIsCompressingReceipt(false);
      setErrorMsg('Failed to process receipt file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptBase64(undefined);
    setReceiptName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount in AED.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please enter a transaction description.');
      return;
    }

    if (!category.trim()) {
      setErrorMsg('Please select a category.');
      return;
    }

    if (type === 'TRANSFER' && account === transferTargetAccount) {
      setErrorMsg('Source and target transfer accounts must be different.');
      return;
    }

    if (potentialDuplicates.length > 0 && !acknowledgedDuplicate) {
      setErrorMsg(
        `Duplicate Warning: A record with this Amount (${formatAED(numAmount)}), Date (${date}), and Category ("${category}") already exists. To prevent double-entry errors, please review the matching record and confirm by checking the verification box before saving.`
      );
      return;
    }

    let finalVehicle = vehicleNumber.trim();
    if (isAddingNewVehicle && newVehicleInput.trim()) {
      const addedPlate = newVehicleInput.trim().toUpperCase();
      addVehicle(addedPlate);
      finalVehicle = addedPlate;
    }

    onSave({
      account,
      type,
      amount: numAmount,
      date,
      category,
      subcategory: subcategory || undefined,
      vehicleNumber: finalVehicle || undefined,
      description: description.trim(),
      referenceNumber: referenceNumber.trim() || undefined,
      receiptBase64,
      receiptName,
      transferTargetAccount: type === 'TRANSFER' ? transferTargetAccount : undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="transaction-entry-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              {type === 'TRANSFER' ? (
                <ArrowRightLeft className="w-4 h-4" />
              ) : account === 'BANK' ? (
                <Building className="w-4 h-4" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {editingTransaction
                  ? 'Edit Transaction Record'
                  : type === 'TRANSFER'
                  ? 'Inter-Account Transfer'
                  : `New ${account === 'BANK' ? 'Bank' : 'Petty Cash'} ${
                      type === 'INCOME' ? 'Income / Deposit' : 'Expense'
                    }`}
              </h2>
              <p className="text-xs text-slate-400">
                UAE Dirham (AED) • Automated Ledger Sync
              </p>
            </div>
          </div>
          <button
            id="close-transaction-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Transaction Flow
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              <button
                type="button"
                id="select-type-expense-btn"
                onClick={() => handleTypeChange('EXPENSE')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>Expense (-)</span>
              </button>
              <button
                type="button"
                id="select-type-income-btn"
                onClick={() => handleTypeChange('INCOME')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>Income (+)</span>
              </button>
              <button
                type="button"
                id="select-type-transfer-btn"
                onClick={() => handleTypeChange('TRANSFER')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'TRANSFER'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transfer (⇄)</span>
              </button>
            </div>
          </div>

          {/* Account Selection */}
          {type === 'TRANSFER' ? (
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Source Account (Debit)
                </label>
                <select
                  id="transfer-source-account-select"
                  value={account}
                  onChange={(e) => handleAccountChange(e.target.value as AccountType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="BANK">Bank Account (Main)</option>
                  <option value="PETTY_CASH">Petty Cash (Reserve)</option>
                </select>
              </div>

              <div className="text-slate-400 pt-4 hidden sm:block">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="w-full flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Target Account (Credit)
                </label>
                <select
                  id="transfer-target-account-select"
                  value={transferTargetAccount}
                  onChange={(e) => setTransferTargetAccount(e.target.value as AccountType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="PETTY_CASH">Petty Cash (Reserve)</option>
                  <option value="BANK">Bank Account (Main)</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Account
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="account-bank-select-btn"
                  onClick={() => handleAccountChange('BANK')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    account === 'BANK'
                      ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 ring-1 ring-sky-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Bank Account</div>
                    <div className="text-[11px] text-slate-400">Wires, Invoices, Deposits</div>
                  </div>
                </button>

                <button
                  type="button"
                  id="account-petty-select-btn"
                  onClick={() => handleAccountChange('PETTY_CASH')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    account === 'PETTY_CASH'
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Coins className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Petty Cash</div>
                    <div className="text-[11px] text-slate-400">Daily Field Operations</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="tx-amount-input"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Amount (AED) *
                </label>
                {potentialDuplicates.length > 0 && (
                  <span
                    id="duplicate-amount-indicator"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                    title="Potential duplicate: identical amount matches an existing record"
                  >
                    <AlertTriangle className="w-3 h-3" /> Duplicate Match
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-mono font-bold text-sm">
                  AED
                </div>
                <input
                  id="tx-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAcknowledgedDuplicate(false);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-14 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white font-mono text-lg focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="tx-date-input"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Date *
                </label>
                {potentialDuplicates.length > 0 && (
                  <span
                    id="duplicate-date-indicator"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                    title="Potential duplicate: identical date matches an existing record"
                  >
                    <AlertTriangle className="w-3 h-3" /> Duplicate Match
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  id="tx-date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setAcknowledgedDuplicate(false);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="tx-category-select"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Main Category *
                </label>
                {potentialDuplicates.length > 0 && (
                  <span
                    id="duplicate-category-indicator"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
                    title="Potential duplicate: identical category matches an existing record"
                  >
                    <AlertTriangle className="w-3 h-3" /> Duplicate Match
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  id="tx-category-select"
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    setAcknowledgedDuplicate(false);
                    setErrorMsg(null);
                    const catObj = categories.find((c) => c.name === newCat);
                    if (catObj && catObj.subcategories.length > 0) {
                      setSubcategory(catObj.subcategories[0]);
                    } else {
                      setSubcategory('');
                    }
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {categories
                    .filter((c) => type === 'TRANSFER' ? c.name === 'Inter-Account Transfer' : c.type === type || c.type === 'BOTH')
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="tx-subcategory-select"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Subcategory / Fleet Tag
              </label>
              {currentCategoryObj && currentCategoryObj.subcategories.length > 0 ? (
                <select
                  id="tx-subcategory-select"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">-- None / General --</option>
                  {currentCategoryObj.subcategories.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="tx-subcategory-input"
                  type="text"
                  placeholder="e.g. Bus #104, Salik, Depot"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Vehicle Number Dropdown & Reference / Cheque Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="tx-vehicle-select"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Vehicle Number *
                </label>
                {!isAddingNewVehicle && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewVehicle(true);
                      setNewVehicleInput('');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Plate
                  </button>
                )}
              </div>
              {!isAddingNewVehicle ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Bus className="w-4 h-4 text-emerald-400" />
                  </div>
                  <select
                    id="tx-vehicle-select"
                    value={vehicleNumber}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW__') {
                        setIsAddingNewVehicle(true);
                        setNewVehicleInput('');
                      } else {
                        setVehicleNumber(e.target.value);
                      }
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none font-medium"
                  >
                    <option value="">-- None / Yard / General Fleet --</option>
                    <optgroup label="AVA Bus Fleet Vehicles">
                      {vehiclesList.map((veh) => (
                        <option key={veh} value={veh}>
                          {veh}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__ADD_NEW__">+ Register New Vehicle Plate...</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. 27804 (SHARJAH)"
                    value={newVehicleInput}
                    onChange={(e) => setNewVehicleInput(e.target.value.toUpperCase())}
                    className="flex-1 py-2 px-3 bg-slate-950/90 border border-emerald-500 rounded-xl text-white text-sm font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newVehicleInput.trim()) {
                        const plate = newVehicleInput.trim().toUpperCase();
                        const updated = addVehicle(plate);
                        setVehiclesList(updated);
                        setVehicleNumber(plate);
                      }
                      setIsAddingNewVehicle(false);
                    }}
                    className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewVehicle(false)}
                    className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="tx-ref-input"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Reference / Cheque / Voucher #
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="tx-ref-input"
                  type="text"
                  placeholder="e.g. CHQ-004812, WIRE-9982, SALIK-01"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="tx-description-input"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Description / Notes *
            </label>
            <input
              id="tx-description-input"
              type="text"
              required
              placeholder="e.g. ADNOC fleet diesel refill for buses 12-16 or RTA route permit renewal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full py-2.5 px-3.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Digital Receipt Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Digital Receipt / Invoice Attachment
            </label>

            {receiptBase64 ? (
              <div
                id="receipt-preview-card"
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {receiptBase64.startsWith('data:image') ? (
                    <img
                      src={receiptBase64}
                      alt="Receipt thumbnail"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="truncate">
                    <div className="text-xs font-medium text-slate-200 truncate max-w-[200px] sm:max-w-[320px]">
                      {receiptName || 'Attached Receipt'}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      Base64 Encoded (Ready for local & cloud sync)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="remove-attached-receipt-btn"
                    onClick={handleRemoveReceipt}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Remove receipt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                id="receipt-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/80 rounded-xl p-4 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="receipt-file-input"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      {isCompressingReceipt
                        ? 'Optimizing receipt format...'
                        : 'Upload photo receipt or vendor invoice'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, PDF up to 5MB (Encodes to lightweight Base64 for instant offline & cloud backup)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Potential Duplicate Warning System */}
          {potentialDuplicates.length > 0 && (
            <div
              id="duplicate-warning-banner"
              className="p-4 bg-amber-950/40 border-2 border-amber-500/60 rounded-xl space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5 border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span>Potential Duplicate Transaction Detected</span>
                    </h4>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {potentialDuplicates.length} match{potentialDuplicates.length > 1 ? 'es' : ''} found
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                    A record with the exact same <strong>Amount ({formatAED(parseFloat(amount) || 0)})</strong>, <strong>Date ({date})</strong>, and <strong>Category ("{category}")</strong> is already recorded. Please review to avoid an accidental double-entry.
                  </p>

                  {/* List matching duplicate transactions */}
                  <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {potentialDuplicates.map((dup) => (
                      <div
                        key={dup.id}
                        id={`duplicate-match-item-${dup.id}`}
                        className="p-2.5 bg-slate-900/90 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                dup.account === 'BANK'
                                  ? 'bg-sky-500/20 text-sky-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {dup.account === 'BANK' ? 'Bank' : 'Petty Cash'}
                            </span>
                            <span className="text-[11px] font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                              {dup.description || dup.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {dup.subcategory ? `${dup.subcategory} • ` : ''}Ref: {dup.referenceNumber || 'N/A'} • {dup.paymentMethod || 'Payment'}
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono font-bold text-amber-300 text-xs">
                          {formatAED(dup.amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verification Checkbox */}
                  <label
                    id="confirm-duplicate-label"
                    className="mt-3 flex items-start gap-2.5 cursor-pointer bg-amber-950/70 p-2.5 rounded-lg border border-amber-500/50 hover:bg-amber-950/90 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id="confirm-duplicate-checkbox"
                      checked={acknowledgedDuplicate}
                      onChange={(e) => {
                        setAcknowledgedDuplicate(e.target.checked);
                        if (e.target.checked) {
                          setErrorMsg(null);
                        }
                      }}
                      className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 h-4 w-4 shrink-0 cursor-pointer accent-amber-500"
                    />
                    <span className="text-xs font-semibold text-amber-100 leading-snug">
                      I confirm this is a distinct, legitimate transaction (not an accidental double-entry).
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              id="cancel-tx-modal-btn"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-tx-modal-btn"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                potentialDuplicates.length > 0 && !acknowledgedDuplicate
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {potentialDuplicates.length > 0 && !acknowledgedDuplicate ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-slate-950" />
                  <span>Confirm Duplicate & Save</span>
                </>
              ) : (
                <>
                  {potentialDuplicates.length > 0 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  )}
                  <span>{editingTransaction ? 'Save Changes' : 'Record Transaction'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
