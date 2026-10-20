import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Check,
  RotateCcw,
  Bus,
  Search,
  FileSpreadsheet,
  ArrowUpDown,
  Sparkles,
  CheckCircle2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Category } from '../types';
import {
  DEFAULT_UAE_CATEGORIES,
  AVA_FLEET_CATEGORIES,
  AVA_FLEET_VEHICLES,
  getVehicles,
  saveVehicles,
  addVehicle,
  deleteVehicle,
} from '../services/storage';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSaveCategories: (updatedCategories: Category[]) => void;
  onResetToFreshData?: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  onResetToFreshData,
}) => {
  // Tabs: 'CARDS' for visual list, 'BULK_CSV' for multi-line comma-separated editing, 'VEHICLES' for fleet plates
  const [activeTab, setActiveTab] = useState<'CARDS' | 'BULK_CSV' | 'VEHICLES'>('CARDS');

  // Fleet vehicles state
  const [vehicles, setVehicles] = useState<string[]>(() => getVehicles());
  const [newVehiclePlate, setNewVehiclePlate] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Editing single category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubcategoriesStr, setEditSubcategoriesStr] = useState('');
  const [editType, setEditType] = useState<'EXPENSE' | 'INCOME' | 'BOTH'>('EXPENSE');

  // Quick inline add subcategory state (key: catId, value: string)
  const [inlineSubcatInput, setInlineSubcatInput] = useState<{ [catId: string]: string }>({});

  // New category form state
  const [newName, setNewName] = useState('');
  const [newSubcategoriesStr, setNewSubcategoriesStr] = useState('');
  const [newType, setNewType] = useState<'EXPENSE' | 'INCOME' | 'BOTH'>('EXPENSE');
  const [isAdding, setIsAdding] = useState(false);

  // Bulk editor state
  const [bulkText, setBulkText] = useState('');
  const [bulkStatusMsg, setBulkStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Success toast feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Populate bulk text when switching to bulk tab
  const handleOpenBulkTab = () => {
    const text = categories
      .map((c) => `${c.name} [${c.type}]: ${c.subcategories.join(', ')}`)
      .join('\n');
    setBulkText(text);
    setBulkStatusMsg(null);
    setActiveTab('BULK_CSV');
  };

  // Parse and save bulk text
  const handleApplyBulkText = () => {
    try {
      const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) {
        setBulkStatusMsg({ text: 'Please enter at least one category line.', isError: true });
        return;
      }

      const parsedCategories: Category[] = [];

      lines.forEach((line, idx) => {
        // Formats supported:
        // 1. "Category Name [EXPENSE]: sub1, sub2, sub3"
        // 2. "Category Name | EXPENSE | sub1, sub2, sub3"
        // 3. "Category Name: sub1, sub2, sub3" (defaults to EXPENSE, or INCOME if name is Income)
        let name = '';
        let type: 'EXPENSE' | 'INCOME' | 'BOTH' = 'EXPENSE';
        let subStr = '';

        if (line.includes(':')) {
          const colonIdx = line.indexOf(':');
          const header = line.substring(0, colonIdx).trim();
          subStr = line.substring(colonIdx + 1).trim();

          const typeMatch = header.match(/\[(EXPENSE|INCOME|BOTH)\]/i);
          if (typeMatch) {
            type = typeMatch[1].toUpperCase() as any;
            name = header.replace(/\[(EXPENSE|INCOME|BOTH)\]/i, '').trim();
          } else {
            name = header;
            if (name.toLowerCase().includes('income')) {
              type = 'INCOME';
            } else if (name.toLowerCase().includes('transfer')) {
              type = 'BOTH';
            }
          }
        } else if (line.includes('|')) {
          const parts = line.split('|').map((p) => p.trim());
          name = parts[0];
          const rawType = (parts[1] || '').toUpperCase();
          type = (rawType === 'INCOME' || rawType === 'BOTH' || rawType === 'EXPENSE') ? rawType as any : 'EXPENSE';
          subStr = parts.slice(2).join(', ');
        } else {
          name = line;
          subStr = '';
        }

        if (!name) return;

        const subcategories = subStr
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        parsedCategories.push({
          id: `cat-${Date.now()}-${idx}`,
          name,
          type,
          subcategories,
          isCustom: true,
        });
      });

      if (parsedCategories.length === 0) {
        setBulkStatusMsg({ text: 'Could not parse any valid categories.', isError: true });
        return;
      }

      onSaveCategories(parsedCategories);
      showFeedback(`Successfully updated ${parsedCategories.length} categories!`);
      setActiveTab('CARDS');
    } catch (e: any) {
      setBulkStatusMsg({ text: `Failed to parse bulk list: ${e?.message || 'Check formatting'}`, isError: true });
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSubcategoriesStr(cat.subcategories.join(', '));
    setEditType(cat.type);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    const subcats = editSubcategoriesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = categories.map((c) => {
      if (c.id === editingId) {
        return {
          ...c,
          name: editName.trim(),
          type: editType,
          subcategories: subcats,
        };
      }
      return c;
    });

    onSaveCategories(updated);
    setEditingId(null);
    showFeedback(`Saved changes to "${editName.trim()}"`);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const subcats = newSubcategoriesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: newName.trim(),
      type: newType,
      subcategories: subcats,
      isCustom: true,
    };

    onSaveCategories([...categories, newCat]);
    setNewName('');
    setNewSubcategoriesStr('');
    setIsAdding(false);
    showFeedback(`Added category "${newCat.name}" with ${subcats.length} sub-categories`);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`Delete category "${name}"? Existing transactions will retain their category name.`)) {
      const updated = categories.filter((c) => c.id !== id);
      onSaveCategories(updated);
      showFeedback(`Deleted "${name}"`);
    }
  };

  // Quick single subcategory deletion from pill
  const handleRemoveSubcategoryPill = (catId: string, subToRemove: string) => {
    const updated = categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          subcategories: c.subcategories.filter((s) => s !== subToRemove),
        };
      }
      return c;
    });
    onSaveCategories(updated);
  };

  // Quick inline append of comma-separated subcategories
  const handleAppendInlineSubcategory = (catId: string) => {
    const rawInput = inlineSubcatInput[catId]?.trim();
    if (!rawInput) return;

    const newSubs = rawInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (newSubs.length === 0) return;

    const updated = categories.map((c) => {
      if (c.id === catId) {
        const set = new Set(c.subcategories);
        newSubs.forEach((ns) => set.add(ns));
        return {
          ...c,
          subcategories: Array.from(set),
        };
      }
      return c;
    });

    onSaveCategories(updated);
    setInlineSubcatInput({ ...inlineSubcatInput, [catId]: '' });
    showFeedback(`Added ${newSubs.length} sub-categories`);
  };

  // Sort subcategories alphabetically
  const handleSortSubcategories = (catId: string) => {
    const updated = categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          subcategories: [...c.subcategories].sort((a, b) => a.localeCompare(b)),
        };
      }
      return c;
    });
    onSaveCategories(updated);
    showFeedback('Sorted sub-categories alphabetically');
  };

  // Quick append vehicle plates to a category
  const handleAppendVehiclePlates = (catId: string) => {
    const updated = categories.map((c) => {
      if (c.id === catId) {
        const set = new Set(c.subcategories);
        AVA_FLEET_VEHICLES.forEach((v) => set.add(v));
        return {
          ...c,
          subcategories: Array.from(set),
        };
      }
      return c;
    });
    onSaveCategories(updated);
    showFeedback('Added 11 AVA Fleet vehicle plates to sub-categories');
  };

  // Load exact categories from the spreadsheet image
  const handleLoadAvaSpreadsheetCategories = () => {
    if (confirm('Load categories and comma-separated sub-categories from the AVA Fleet spreadsheet?')) {
      if (onResetToFreshData) {
        onResetToFreshData();
      } else {
        onSaveCategories(AVA_FLEET_CATEGORIES);
      }
      setVehicles(getVehicles());
      showFeedback('Loaded all 13 categories and fleet vehicles from AVA Fleet spreadsheet!');
    }
  };

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.subcategories.some((s) => s.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Total subcategory count
  const totalSubcategoriesCount = useMemo(() => {
    return categories.reduce((acc, c) => acc + c.subcategories.length, 0);
  }, [categories]);

  if (!isOpen) return null;

  return (
    <div
      id="category-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>UAE Business Categories & Sub-categories</span>
                <span className="text-[11px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {categories.length} cats • {totalSubcategoriesCount} sub-cats
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customizable categories with comma-separated sub-categories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Load AVA Fleet Spreadsheet Preset */}
            <button
              id="load-ava-fleet-categories-btn"
              onClick={handleLoadAvaSpreadsheetCategories}
              title="Load categories from the AVA Fleet Spreadsheet image"
              className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Load AVA Fleet Preset</span>
            </button>

            <button
              id="close-category-manager-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="bg-emerald-950/80 border-b border-emerald-600/40 px-6 py-2 text-xs text-emerald-200 flex items-center gap-2 transition-all">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Tab Controls & Search */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('CARDS')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'CARDS'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category List</span>
            </button>
            <button
              type="button"
              id="bulk-category-editor-tab"
              onClick={handleOpenBulkTab}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'BULK_CSV'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bulk Comma-Separated Editor</span>
            </button>
            <button
              type="button"
              id="fleet-vehicles-tab"
              onClick={() => setActiveTab('VEHICLES')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'VEHICLES'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bus className="w-3.5 h-3.5 text-sky-400" />
              <span>Fleet Vehicles ({vehicles.length})</span>
            </button>
          </div>

          {activeTab === 'CARDS' && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories or sub-categories..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'VEHICLES' ? (
            /* FLEET VEHICLES MANAGER */
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sky-400 text-sm">
                    <Bus className="w-4 h-4" />
                    <span>Bus Fleet Vehicle Numbers</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset vehicle plates to default AVA fleet plates?')) {
                        saveVehicles(AVA_FLEET_VEHICLES);
                        setVehicles(AVA_FLEET_VEHICLES);
                        showFeedback('Reset fleet vehicles to AVA defaults');
                      }
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </button>
                </div>
                <p className="text-slate-400 text-xs">
                  These vehicle numbers populate the vehicle dropdown in transaction forms and filters. Add or manage your bus license plate numbers below:
                </p>

                {/* Add Vehicle Plate */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newVehiclePlate.trim()) {
                      const updated = addVehicle(newVehiclePlate.trim().toUpperCase());
                      setVehicles(updated);
                      setNewVehiclePlate('');
                      showFeedback(`Added vehicle ${newVehiclePlate.trim().toUpperCase()}`);
                    }
                  }}
                  className="flex gap-2 max-w-md"
                >
                  <input
                    type="text"
                    required
                    placeholder="e.g. 27804 (SHARJAH) or Plate #"
                    value={newVehiclePlate}
                    onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                    className="flex-1 py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Plate</span>
                  </button>
                </form>
              </div>

              {/* Grid of Vehicles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {vehicles.map((v) => (
                  <div
                    key={v}
                    className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-white">{v}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = deleteVehicle(v);
                        setVehicles(updated);
                        showFeedback(`Removed vehicle ${v}`);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      title="Remove vehicle from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'BULK_CSV' ? (
            /* BULK COMMA-SEPARATED EDITOR */
            <div className="space-y-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Bulk Comma-Separated Quick Editor</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Format each line as:{' '}
                  <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
                    Category Name [TYPE]: subcategory1, subcategory2, subcategory3
                  </code>
                  . Supported types: <code className="text-emerald-300 font-mono">[EXPENSE]</code>,{' '}
                  <code className="text-sky-300 font-mono">[INCOME]</code>, or{' '}
                  <code className="text-indigo-300 font-mono">[BOTH]</code>.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const sampleText = AVA_FLEET_CATEGORIES.map(
                        (c) => `${c.name} [${c.type}]: ${c.subcategories.join(', ')}`
                      ).join('\n');
                      setBulkText(sampleText);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    Paste AVA Fleet Spreadsheet Template
                  </button>
                </div>
              </div>

              {bulkStatusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    bulkStatusMsg.isError
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-200'
                      : 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                  }`}
                >
                  {bulkStatusMsg.text}
                </div>
              )}

              <div>
                <textarea
                  id="bulk-category-textarea"
                  rows={14}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full p-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="Maintenance [EXPENSE]: Service, Tyres, Spare parts, Repairs&#10;Vehicle exp [EXPENSE]: Salik, Fines, Insurance, Registration&#10;Salary [EXPENSE]: Driver, Helper, Office staff&#10;Income [INCOME]: ALICO, Data UAQ, Headline"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {bulkText.split('\n').filter((l) => l.trim()).length} category lines detected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('CARDS')}
                    className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="save-bulk-categories-btn"
                    onClick={handleApplyBulkText}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 cursor-pointer"
                  >
                    Apply All Categories
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <>
              {/* Add New Category Form / Trigger */}
              {isAdding ? (
                <form
                  onSubmit={handleAddCategory}
                  className="p-4 bg-slate-950/70 border border-emerald-500/40 rounded-xl space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Category Definition</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vehicle Hire, Diesel, Rent"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 uppercase font-semibold mb-1">
                        Flow Type
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="EXPENSE">Expense Category</option>
                        <option value="INCOME">Income / Revenue Category</option>
                        <option value="BOTH">Both (Expense & Income)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] text-slate-400 uppercase font-semibold">
                        Sub-categories (comma-separated)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Separated by commas
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Service, Tyres, Spare parts, Repairs, Batteries"
                      value={newSubcategoriesStr}
                      onChange={(e) => setNewSubcategoriesStr(e.target.value)}
                      className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />

                    {/* Preview Pills */}
                    {newSubcategoriesStr.trim() && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {newSubcategoriesStr
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0)
                          .map((sub, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-800 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md"
                            >
                              {sub}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
                    >
                      Add Category
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  id="add-category-toggle-btn"
                  onClick={() => setIsAdding(true)}
                  className="w-full py-3 px-4 border border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/80 rounded-xl text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category & Comma-Separated Sub-categories</span>
                </button>
              )}

              {/* Category Cards List */}
              <div className="space-y-3">
                {filteredCategories.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No categories found matching &quot;{searchQuery}&quot;.
                  </div>
                ) : (
                  filteredCategories.map((cat) => {
                    const isEditing = editingId === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-2.5 hover:border-slate-700 transition-colors"
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                                  Category Name
                                </label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                                  Type
                                </label>
                                <select
                                  value={editType}
                                  onChange={(e) => setEditType(e.target.value as any)}
                                  className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="EXPENSE">Expense</option>
                                  <option value="INCOME">Income</option>
                                  <option value="BOTH">Both</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[11px] text-slate-400 font-semibold">
                                  Sub-categories (comma-separated list)
                                </label>
                                <span className="text-[10px] text-slate-500">
                                  {editSubcategoriesStr.split(',').filter((s) => s.trim()).length} subcategories
                                </span>
                              </div>
                              <textarea
                                rows={2}
                                value={editSubcategoriesStr}
                                onChange={(e) => setEditSubcategoriesStr(e.target.value)}
                                placeholder="e.g. Service, Tyres, Spare parts, Repairs"
                                className="w-full py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() => handleAppendVehiclePlates(cat.id)}
                                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                                title="Append AVA Fleet vehicle numbers to subcategories"
                              >
                                <Bus className="w-3 h-3" />
                                <span>+ Add Fleet Vehicle Plates</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save Changes</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-white tracking-wide">
                                  {cat.name}
                                </h4>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    cat.type === 'INCOME'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : cat.type === 'EXPENSE'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}
                                >
                                  {cat.type}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  ({cat.subcategories.length} sub-cats)
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSortSubcategories(cat.id)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                                  title="Sort Sub-categories A-Z"
                                >
                                  <ArrowUpDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => startEdit(cat)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                                  title="Edit Category & Comma-Separated Subcategories"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {cat.id !== 'transfer_internal' && (
                                  <button
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Subcategory Pills with 1-click Delete */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              {cat.subcategories.length === 0 ? (
                                <span className="text-[11px] text-slate-500 italic">
                                  No sub-categories yet. Type below to add.
                                </span>
                              ) : (
                                cat.subcategories.map((sub, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="group inline-flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-medium"
                                  >
                                    <span>{sub}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubcategoryPill(cat.id, sub)}
                                      className="text-slate-500 hover:text-rose-400 transition-colors opacity-70 group-hover:opacity-100"
                                      title={`Remove "${sub}"`}
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>

                            {/* Fast Inline Add Comma-Separated Subcategories */}
                            <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-slate-800/60">
                              <input
                                type="text"
                                placeholder="Add subcategory (or paste comma-separated list)..."
                                value={inlineSubcatInput[cat.id] || ''}
                                onChange={(e) =>
                                  setInlineSubcatInput({
                                    ...inlineSubcatInput,
                                    [cat.id]: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAppendInlineSubcategory(cat.id);
                                  }
                                }}
                                className="flex-1 py-1 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAppendInlineSubcategory(cat.id)}
                                disabled={!inlineSubcatInput[cat.id]?.trim()}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg disabled:opacity-40 cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span>Changes persist locally and sync across transactions and reports.</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                if (confirm('Reset categories back to standard AVA Fleet defaults?')) {
                  onSaveCategories(DEFAULT_UAE_CATEGORIES);
                  showFeedback('Reset categories to default!');
                }
              }}
              title="Reset to AVA Fleet Defaults"
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-md shadow-emerald-950/40"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
