import React from 'react';
import { X, Download, Printer, ExternalLink, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { formatAED } from '../services/storage';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction || !transaction.receiptBase64) return null;

  const isImage = transaction.receiptBase64.startsWith('data:image');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transaction.receiptBase64!;
    link.download = transaction.receiptName || `receipt-${transaction.id}.jpg`;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${transaction.id}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; text-align: center; }
              img { max-width: 100%; height: auto; margin-top: 20px; }
              .meta { margin-bottom: 20px; font-size: 14px; text-align: left; max-width: 600px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="meta">
              <h2>AVA UAE Finance Ledger - Digital Receipt</h2>
              <p><strong>Transaction ID:</strong> ${transaction.id}</p>
              <p><strong>Date:</strong> ${transaction.date}</p>
              <p><strong>Account:</strong> ${transaction.account}</p>
              <p><strong>Amount:</strong> ${formatAED(transaction.amount)}</p>
              <p><strong>Category:</strong> ${transaction.category} ${transaction.subcategory ? `(${transaction.subcategory})` : ''}</p>
              <p><strong>Reference No:</strong> ${transaction.referenceNumber || 'N/A'}</p>
              <p><strong>Description:</strong> ${transaction.description}</p>
            </div>
            ${isImage ? `<img src="${transaction.receiptBase64}" />` : '<p>Attached document (PDF/Other)</p>'}
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

  return (
    <div
      id="receipt-viewer-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Digital Receipt Attachment</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {formatAED(transaction.amount)}
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
              {transaction.description} • Ref: {transaction.referenceNumber || 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              title="Print Receipt"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              id="download-receipt-btn"
              onClick={handleDownload}
              title="Download File"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              id="close-receipt-viewer-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-4 sm:p-6 flex-1 overflow-auto flex items-center justify-center bg-slate-950/70 min-h-[300px]">
          {isImage ? (
            <img
              src={transaction.receiptBase64}
              alt={transaction.receiptName || 'Receipt'}
              referrerPolicy="no-referrer"
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg border border-slate-800 shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-300">
              <FileText className="w-16 h-16 text-emerald-400" />
              <p className="text-sm font-semibold">{transaction.receiptName || 'Document Attachment'}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <div>Date: {transaction.date} • Account: {transaction.account}</div>
          <div className="font-mono text-slate-400 truncate">{transaction.receiptName || 'receipt_file'}</div>
        </div>
      </div>
    </div>
  );
};
