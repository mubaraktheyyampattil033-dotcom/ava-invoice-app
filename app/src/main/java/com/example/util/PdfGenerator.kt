package com.example.util

import android.content.Context
import android.content.Intent
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.print.PrintAttributes
import android.print.PrintManager
import androidx.core.content.FileProvider
import com.example.data.model.InvoiceWithItems
import java.io.File
import java.io.FileOutputStream
import java.util.Locale

object PdfGenerator {

    private const val PAGE_WIDTH = 595
    private const val PAGE_HEIGHT = 842
    private const val MARGIN = 36f

    fun generatePdf(context: Context, invoiceWithItems: InvoiceWithItems): File {
        val document = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(PAGE_WIDTH, PAGE_HEIGHT, 1).create()
        val page = document.startPage(pageInfo)
        val canvas = page.canvas

        drawInvoice(canvas, invoiceWithItems)

        document.finishPage(page)

        val outputDir = File(context.cacheDir, "invoices").apply { mkdirs() }
        val safeNum = invoiceWithItems.invoice.invoiceNumber.replace("[^a-zA-Z0-9_-]".toRegex(), "_")
        val outputFile = File(outputDir, "Invoice_$safeNum.pdf")

        FileOutputStream(outputFile).use { out ->
            document.writeTo(out)
        }
        document.close()

        return outputFile
    }

    private fun drawInvoice(canvas: Canvas, inv: InvoiceWithItems) {
        val invoice = inv.invoice
        val items = inv.items

        val paintText = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 41, 59)
            textSize = 9f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }

        val paintBold = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(15, 23, 42)
            textSize = 9.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }

        val paintHeaderTitle = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 58, 138) // Deep Blue
            textSize = 17f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.RIGHT
        }

        val paintArabic = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(100, 116, 139)
            textSize = 13f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.RIGHT
        }

        val paintBorder = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(203, 213, 225)
            style = Paint.Style.STROKE
            strokeWidth = 0.8f
        }

        val paintFillHeader = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(241, 245, 249)
            style = Paint.Style.FILL
        }

        val paintFillSubtle = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(248, 250, 252)
            style = Paint.Style.FILL
        }

        val paintTotalBar = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(224, 231, 255)
            style = Paint.Style.FILL
        }

        val rightMargin = PAGE_WIDTH - MARGIN
        var y = MARGIN + 12f

        // 1. Top Section: Seller info on Left, Title on Right
        canvas.drawText("TAX INVOICE", rightMargin, y, paintHeaderTitle)
        y += 15f
        canvas.drawText("فاتورة ضريبية", rightMargin, y, paintArabic)

        var sellerY = MARGIN + 10f
        paintBold.textSize = 11f
        canvas.drawText(invoice.sellerName, MARGIN, sellerY, paintBold)
        sellerY += 13f
        paintText.textSize = 8.5f
        canvas.drawText(invoice.sellerAddress, MARGIN, sellerY, paintText)
        sellerY += 12f
        canvas.drawText("Phone: ${invoice.sellerPhone}   |   Email: ${invoice.sellerEmail}", MARGIN, sellerY, paintText)
        sellerY += 12f
        canvas.drawText("TRN: ${invoice.sellerTrn}", MARGIN, sellerY, paintBold)

        y = maxOf(sellerY + 16f, y + 16f)

        // 2. Invoice Meta Table Box (INVOICE NO, DATE, TRN, DUE DATE)
        val metaBoxTop = y
        val metaBoxHeight = 34f
        val metaBoxWidth = rightMargin - MARGIN
        val colW = metaBoxWidth / 4f

        canvas.drawRect(MARGIN, metaBoxTop, rightMargin, metaBoxTop + metaBoxHeight, paintFillHeader)
        canvas.drawRect(MARGIN, metaBoxTop, rightMargin, metaBoxTop + metaBoxHeight, paintBorder)

        // Vertical lines
        for (i in 1..3) {
            val lineX = MARGIN + colW * i
            canvas.drawLine(lineX, metaBoxTop, lineX, metaBoxTop + metaBoxHeight, paintBorder)
        }

        val metaHeaders = listOf("INVOICE NO.:", "INVOICE DATE:", "TRN:", "DUE DATE:")
        val metaValues = listOf(
            invoice.invoiceNumber,
            invoice.invoiceDate,
            invoice.sellerTrn,
            invoice.dueDate
        )

        val headerPaintSmall = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(100, 116, 139)
            textSize = 7.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val valuePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(15, 23, 42)
            textSize = 8.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }

        for (i in 0..3) {
            val cellX = MARGIN + colW * i + 6f
            canvas.drawText(metaHeaders[i], cellX, metaBoxTop + 13f, headerPaintSmall)
            canvas.drawText(metaValues[i], cellX, metaBoxTop + 27f, valuePaint)
        }

        y += metaBoxHeight + 14f

        // 3. Bill To Section
        val billToSectionTop = y
        val sectionTitlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 58, 138)
            textSize = 9.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText("■  BILL TO", MARGIN, y, sectionTitlePaint)
        y += 13f

        paintBold.textSize = 10f
        canvas.drawText(invoice.clientName, MARGIN, y, paintBold)
        y += 12f
        paintText.textSize = 8.5f
        if (invoice.clientAddress.isNotBlank()) {
            canvas.drawText(invoice.clientAddress, MARGIN, y, paintText)
            y += 11f
        }
        if (invoice.clientPoBox.isNotBlank()) {
            canvas.drawText(invoice.clientPoBox, MARGIN, y, paintText)
            y += 11f
        }
        if (invoice.clientPhone.isNotBlank()) {
            canvas.drawText("Phone: ${invoice.clientPhone}", MARGIN, y, paintText)
            y += 11f
        }
        if (invoice.clientTrn.isNotBlank()) {
            paintBold.textSize = 8.5f
            canvas.drawText("TRN: ${invoice.clientTrn}", MARGIN, y, paintBold)
            y += 12f
        }

        y += 6f

        // 4. Line Items Table
        // Table Columns: DESCRIPTION (flexible), QTY (45pt), UNIT PRICE (70pt), AMOUNT (80pt)
        val colAmountW = 85f
        val colPriceW = 75f
        val colQtyW = 45f
        val colDescW = metaBoxWidth - (colAmountW + colPriceW + colQtyW)

        val tableLeft = MARGIN
        val tableTop = y
        val tableHeaderH = 18f

        // Header Background
        canvas.drawRect(tableLeft, tableTop, rightMargin, tableTop + tableHeaderH, paintFillHeader)
        canvas.drawRect(tableLeft, tableTop, rightMargin, tableTop + tableHeaderH, paintBorder)

        val tableHeaderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(71, 85, 105)
            textSize = 8f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }

        canvas.drawText("DESCRIPTION", tableLeft + 8f, tableTop + 12f, tableHeaderPaint)
        tableHeaderPaint.textAlign = Paint.Align.RIGHT
        canvas.drawText("QTY", tableLeft + colDescW + colQtyW - 6f, tableTop + 12f, tableHeaderPaint)
        canvas.drawText("UNIT PRICE", tableLeft + colDescW + colQtyW + colPriceW - 6f, tableTop + 12f, tableHeaderPaint)
        canvas.drawText("AMOUNT (${invoice.currency})", rightMargin - 6f, tableTop + 12f, tableHeaderPaint)

        y = tableTop + tableHeaderH

        // Draw items
        val itemTextPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 41, 59)
            textSize = 8f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        }
        val numRightPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 41, 59)
            textSize = 8.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textAlign = Paint.Align.RIGHT
        }

        for (item in items) {
            val lines = item.description.split("\n")
            val rowHeight = maxOf(20f, lines.size * 11f + 8f)

            canvas.drawRect(tableLeft, y, rightMargin, y + rowHeight, paintBorder)

            // Description lines
            var lineY = y + 11f
            for (line in lines) {
                canvas.drawText(line.trimEnd(), tableLeft + 8f, lineY, itemTextPaint)
                lineY += 10.5f
            }

            // Qty, Price, Amount
            val qtyStr = if (item.quantity % 1.0 == 0.0) item.quantity.toInt().toString() else String.format(Locale.US, "%.2f", item.quantity)
            val priceStr = String.format(Locale.US, "%,.2f", item.unitPrice)
            val amountStr = String.format(Locale.US, "%,.2f", item.amount)

            canvas.drawText(qtyStr, tableLeft + colDescW + colQtyW - 6f, y + 13f, numRightPaint)
            canvas.drawText(priceStr, tableLeft + colDescW + colQtyW + colPriceW - 6f, y + 13f, numRightPaint)
            canvas.drawText(amountStr, rightMargin - 6f, y + 13f, numRightPaint)

            // Column separators
            canvas.drawLine(tableLeft + colDescW, y, tableLeft + colDescW, y + rowHeight, paintBorder)
            canvas.drawLine(tableLeft + colDescW + colQtyW, y, tableLeft + colDescW + colQtyW, y + rowHeight, paintBorder)
            canvas.drawLine(tableLeft + colDescW + colQtyW + colPriceW, y, tableLeft + colDescW + colQtyW + colPriceW, y + rowHeight, paintBorder)

            y += rowHeight
        }

        y += 8f

        // 5. Totals Box (Subtotal, VAT, Total Due) on Right, Amount in Words on Left
        val totalsBoxW = 200f
        val totalsBoxLeft = rightMargin - totalsBoxW
        val totalsTop = y

        val subtotalStr = "${invoice.currency} " + String.format(Locale.US, "%,.2f", inv.subtotal)
        val vatStr = "${invoice.currency} " + String.format(Locale.US, "%,.2f", inv.vatAmount)
        val totalDueStr = "${invoice.currency} " + String.format(Locale.US, "%,.2f", inv.totalDue)

        // Subtotal row
        canvas.drawRect(totalsBoxLeft, y, rightMargin, y + 17f, paintBorder)
        tableHeaderPaint.textAlign = Paint.Align.LEFT
        canvas.drawText("Subtotal", totalsBoxLeft + 8f, y + 12f, tableHeaderPaint)
        numRightPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText(subtotalStr, rightMargin - 6f, y + 12f, numRightPaint)
        y += 17f

        // VAT row
        canvas.drawRect(totalsBoxLeft, y, rightMargin, y + 17f, paintBorder)
        val vatRateStr = if (invoice.vatRate % 1.0 == 0.0) "${invoice.vatRate.toInt()}%" else "${invoice.vatRate}%"
        canvas.drawText("VAT ($vatRateStr)", totalsBoxLeft + 8f, y + 12f, tableHeaderPaint)
        canvas.drawText(vatStr, rightMargin - 6f, y + 12f, numRightPaint)
        y += 17f

        // Total Due row (highlighted)
        canvas.drawRect(totalsBoxLeft, y, rightMargin, y + 20f, paintTotalBar)
        canvas.drawRect(totalsBoxLeft, y, rightMargin, y + 20f, paintBorder)
        val grandTotalHeader = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 58, 138)
            textSize = 9.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        val grandTotalValue = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(30, 58, 138)
            textSize = 10f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.RIGHT
        }
        canvas.drawText("TOTAL DUE", totalsBoxLeft + 8f, y + 14f, grandTotalHeader)
        canvas.drawText(totalDueStr, rightMargin - 6f, y + 14f, grandTotalValue)

        // 6. Amount in Words Box (Left side)
        val wordsBoxW = totalsBoxLeft - MARGIN - 12f
        val wordsBoxH = (y + 20f) - totalsTop
        canvas.drawRect(MARGIN, totalsTop, MARGIN + wordsBoxW, totalsTop + wordsBoxH, paintFillSubtle)
        canvas.drawRect(MARGIN, totalsTop, MARGIN + wordsBoxW, totalsTop + wordsBoxH, paintBorder)

        val wordsLabelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(100, 116, 139)
            textSize = 7.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText("AMOUNT IN WORDS", MARGIN + 8f, totalsTop + 12f, wordsLabelPaint)

        val wordsContentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(15, 23, 42)
            textSize = 8.2f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC)
        }

        // Wrap words text if long
        val wordsText = inv.calculatedAmountInWords
        val wordsLines = wrapText(wordsText, wordsContentPaint, wordsBoxW - 16f)
        var wordLineY = totalsTop + 24f
        for (wLine in wordsLines.take(3)) {
            canvas.drawText(wLine, MARGIN + 8f, wordLineY, wordsContentPaint)
            wordLineY += 10.5f
        }

        y += 20f + 14f

        // 7. Payment Terms & Bank Details Side-by-Side Boxes
        val halfW = (metaBoxWidth - 10f) / 2f
        val boxH = 68f

        // Payment Terms Box
        canvas.drawRect(MARGIN, y, MARGIN + halfW, y + boxH, paintFillSubtle)
        canvas.drawRect(MARGIN, y, MARGIN + halfW, y + boxH, paintBorder)
        canvas.drawText("■  PAYMENT TERMS", MARGIN + 8f, y + 13f, sectionTitlePaint)

        val termsLines = wrapText(invoice.paymentTerms, paintText, halfW - 16f)
        var termsY = y + 25f
        for (tLine in termsLines.take(4)) {
            canvas.drawText(tLine, MARGIN + 8f, termsY, paintText)
            termsY += 10.5f
        }

        // Bank Details Box
        val bankLeft = MARGIN + halfW + 10f
        canvas.drawRect(bankLeft, y, rightMargin, y + boxH, paintFillSubtle)
        canvas.drawRect(bankLeft, y, rightMargin, y + boxH, paintBorder)
        canvas.drawText("■  BANK DETAILS", bankLeft + 8f, y + 13f, sectionTitlePaint)

        var bankY = y + 25f
        if (invoice.bankName.isNotBlank()) {
            canvas.drawText("Bank: ", bankLeft + 8f, bankY, headerPaintSmall)
            canvas.drawText(invoice.bankName, bankLeft + 55f, bankY, valuePaint)
            bankY += 11f
        }
        if (invoice.bankAccountName.isNotBlank()) {
            canvas.drawText("Account: ", bankLeft + 8f, bankY, headerPaintSmall)
            canvas.drawText(invoice.bankAccountName, bankLeft + 55f, bankY, valuePaint)
            bankY += 11f
        }
        if (invoice.bankIban.isNotBlank()) {
            canvas.drawText("IBAN: ", bankLeft + 8f, bankY, headerPaintSmall)
            canvas.drawText(invoice.bankIban, bankLeft + 55f, bankY, valuePaint)
            bankY += 11f
        }
        if (invoice.bankSwift.isNotBlank()) {
            canvas.drawText("SWIFT: ", bankLeft + 8f, bankY, headerPaintSmall)
            canvas.drawText(invoice.bankSwift, bankLeft + 55f, bankY, valuePaint)
        }

        y += boxH + 12f

        // 8. Notes Section
        if (invoice.notes.isNotBlank()) {
            canvas.drawText("■  NOTES", MARGIN, y, sectionTitlePaint)
            y += 11f
            val noteLines = wrapText(invoice.notes, paintText, metaBoxWidth)
            for (nLine in noteLines.take(2)) {
                canvas.drawText(nLine, MARGIN, y, paintText)
                y += 10.5f
            }
        }

        // 9. Footer: Legal notice centered
        val footerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.rgb(148, 163, 184)
            textSize = 7.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText(
            "This is a computer-generated e-invoice and does not require a signature.",
            PAGE_WIDTH / 2f,
            PAGE_HEIGHT - MARGIN + 4f,
            footerPaint
        )
    }

    private fun wrapText(text: String, paint: Paint, maxWidth: Float): List<String> {
        val result = mutableListOf<String>()
        val paragraphs = text.split("\n")
        for (paragraph in paragraphs) {
            val words = paragraph.split(" ")
            var currentLine = StringBuilder()
            for (word in words) {
                val candidate = if (currentLine.isEmpty()) word else "$currentLine $word"
                if (paint.measureText(candidate) <= maxWidth) {
                    currentLine = StringBuilder(candidate)
                } else {
                    if (currentLine.isNotEmpty()) {
                        result.add(currentLine.toString())
                    }
                    currentLine = StringBuilder(word)
                }
            }
            if (currentLine.isNotEmpty()) {
                result.add(currentLine.toString())
            }
        }
        return result
    }

    fun sharePdf(context: Context, pdfFile: File, invoiceNumber: String) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            pdfFile
        )
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, "Tax Invoice $invoiceNumber")
            putExtra(Intent.EXTRA_TEXT, "Please find attached Tax Invoice $invoiceNumber.")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        val chooser = Intent.createChooser(shareIntent, "Share Invoice PDF via")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }

    fun openPdf(context: Context, pdfFile: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            pdfFile
        )
        val viewIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            context.startActivity(viewIntent)
        } catch (e: Exception) {
            // Fallback to share
            sharePdf(context, pdfFile, pdfFile.name)
        }
    }

    fun printPdf(context: Context, pdfFile: File, invoiceNumber: String) {
        val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager ?: return
        val printAdapter = PdfPrintDocumentAdapter(pdfFile)
        printManager.print("Tax_Invoice_$invoiceNumber", printAdapter, PrintAttributes.Builder().build())
    }
}
