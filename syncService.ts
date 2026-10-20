import { Transaction, Category, SyncSettings } from '../types';
import { getTransactions, saveTransactions, getCategories, getSyncSettings, saveSyncSettings } from './storage';
import { getAccessToken } from './auth';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  source: 'GOOGLE_APPS_SCRIPT' | 'GOOGLE_SHEETS_API' | 'LOCAL_OFFLINE';
  syncedCount?: number;
}

/**
 * Production-ready Google Apps Script code for the user to paste into their Google Drive script editor.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * AVA UAE Finance Ledger - Google Apps Script Web App Backend
 * Turn your Google Drive Sheet into a secure REST API for your business ledger.
 */
const API_KEY = "ava-finance-2026";
const SPREADSHEET_NAME = "AVA UAE Finance Ledger (AED)";

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    
    // Validate API Key
    if (contents.apiKey !== API_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Unauthorized: Invalid API Key"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = contents.action || "sync";
    const ss = getOrCreateSpreadsheet();
    
    if (action === "sync" || action === "saveTransactions") {
      const txSheet = getOrCreateSheet(ss, "Transactions");
      const transactions = contents.transactions || [];
      
      // Setup headers
      txSheet.clear();
      const headers = [
        "Transaction ID", "Date", "Account", "Type", "Amount (AED)", 
        "Category", "Subcategory", "Vehicle Number", "Description", "Reference No.", 
        "Target Account", "Has Receipt", "Updated At"
      ];
      txSheet.appendRow(headers);
      txSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
      
      if (transactions.length > 0) {
        const rows = transactions.map(t => [
          t.id,
          t.date,
          t.account,
          t.type,
          t.amount,
          t.category,
          t.subcategory || "",
          t.vehicleNumber || "",
          t.description,
          t.referenceNumber || "",
          t.transferTargetAccount || "",
          t.receiptBase64 ? "YES" : "NO",
          t.updatedAt || new Date().toISOString()
        ]);
        txSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Successfully synchronized " + transactions.length + " transactions to Google Sheets",
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "AVA UAE Finance Ledger Google Apps Script REST Endpoint",
    currency: "AED",
    version: "1.0.0"
  })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create(SPREADSHEET_NAME);
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}
`;

/**
 * Sync using Google Apps Script REST Endpoint
 */
export const syncWithGoogleAppsScript = async (
  endpointUrl: string,
  apiKey: string,
  transactions: Transaction[],
  categories: Category[]
): Promise<SyncResult> => {
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script handles text/plain without CORS preflight issues
      },
      body: JSON.stringify({
        apiKey,
        action: 'sync',
        transactions,
        categories,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Error reported by Google Apps Script');
    }

    return {
      success: true,
      message: data.message || `Synced ${transactions.length} records to Google Sheet`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'GOOGLE_APPS_SCRIPT',
      syncedCount: transactions.length,
    };
  } catch (err: unknown) {
    console.error('Apps script sync error:', err);
    throw err;
  }
};

/**
 * Direct Google Sheets API sync using the Workspace OAuth token
 */
export const syncWithGoogleSheetsDirect = async (
  token: string,
  transactions: Transaction[]
): Promise<SyncResult> => {
  try {
    // 1. Check if spreadsheet already exists in Drive, or create one
    let spreadsheetId = getSyncSettings().spreadsheetId;

    if (!spreadsheetId) {
      // Search drive for existing spreadsheet
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='AVA UAE Finance Ledger (AED)' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        spreadsheetId = searchData.files[0].id;
      } else {
        // Create new spreadsheet via Sheets API
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              title: 'AVA UAE Finance Ledger (AED)',
            },
            sheets: [
              {
                properties: {
                  title: 'Transactions',
                  gridProperties: { rowCount: 1000, columnCount: 15 },
                },
              },
            ],
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error?.message || 'Failed to create Google Spreadsheet');
        }

        const createData = await createRes.json();
        spreadsheetId = createData.spreadsheetId;
      }

      // Save spreadsheetId
      const currentSettings = getSyncSettings();
      saveSyncSettings({
        ...currentSettings,
        spreadsheetId,
        spreadsheetName: 'AVA UAE Finance Ledger (AED)',
      });
    }

    // 2. Prepare headers and rows
    const headers = [
      'Transaction ID',
      'Date',
      'Account',
      'Type',
      'Amount (AED)',
      'Category',
      'Subcategory',
      'Vehicle Number',
      'Description',
      'Reference / Cheque No.',
      'Target Account',
      'Has Receipt',
      'Last Updated',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.account,
      t.type,
      t.amount,
      t.category,
      t.subcategory || '',
      t.vehicleNumber || '',
      t.description,
      t.referenceNumber || '',
      t.transferTargetAccount || '',
      t.receiptBase64 ? 'YES' : 'NO',
      t.updatedAt || new Date().toISOString(),
    ]);

    const values = [headers, ...rows];

    // Clear and write values
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A1:M1000:clear`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: 'Transactions!A1',
          majorDimension: 'ROWS',
          values,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.error?.message || 'Failed to update Google Sheet rows');
    }

    return {
      success: true,
      message: `Synchronized ${transactions.length} transactions directly to Google Sheets`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'GOOGLE_SHEETS_API',
      syncedCount: transactions.length,
    };
  } catch (err: unknown) {
    console.error('Direct Google Sheets sync error:', err);
    throw err;
  }
};

export const isBrowserOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Master sync function that handles both Google Apps Script and Direct Google Sheets OAuth
 */
export const performSync = async (): Promise<SyncResult> => {
  const transactions = getTransactions();
  const settings = getSyncSettings();
  const categories = getCategories();

  // If user is currently offline, inform that changes are queued locally
  if (!isBrowserOnline()) {
    return {
      success: true,
      message: 'Working Offline: Transactions are saved safely on your device and will automatically sync to Google Sheets as soon as internet is restored.',
      timestamp: new Date().toLocaleTimeString(),
      source: 'LOCAL_OFFLINE',
      syncedCount: transactions.length,
    };
  }

  const token = await getAccessToken();

  // Try Apps Script if configured
  if (settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim()) {
    const res = await syncWithGoogleAppsScript(
      settings.googleAppsScriptUrl.trim(),
      settings.apiKey || 'ava-finance-2026',
      transactions,
      categories
    );

    // Mark all as synced
    const marked = transactions.map((t) => ({ ...t, synced: true }));
    saveTransactions(marked);
    saveSyncSettings({
      ...settings,
      lastSyncTime: new Date().toISOString(),
    });
    return res;
  }

  // Otherwise try Direct Google Sheets if user has signed in with Google
  if (token) {
    const res = await syncWithGoogleSheetsDirect(token, transactions);
    const marked = transactions.map((t) => ({ ...t, synced: true }));
    saveTransactions(marked);
    saveSyncSettings({
      ...settings,
      lastSyncTime: new Date().toISOString(),
    });
    return res;
  }

  // If neither is configured, notify local storage is active
  return {
    success: true,
    message: 'Data securely saved in browser local storage. Connect Google Sheets or Apps Script for cloud sync.',
    timestamp: new Date().toLocaleTimeString(),
    source: 'LOCAL_OFFLINE',
    syncedCount: transactions.length,
  };
};
