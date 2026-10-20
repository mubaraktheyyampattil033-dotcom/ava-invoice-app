package com.example.ui.screens

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.InvoiceWithItems
import com.example.ui.InvoiceViewModel
import com.example.ui.components.StatusBadge
import com.example.ui.theme.BorderSubtle
import com.example.ui.theme.HighlightTotalBg
import com.example.ui.theme.NavyDark
import com.example.ui.theme.NavyPrimary
import com.example.ui.theme.TableHeaderBg
import com.example.ui.theme.TableRowStripe
import com.example.ui.theme.TextMuted
import com.example.util.PdfGenerator
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoicePreviewScreen(
    invoiceId: Long,
    viewModel: InvoiceViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val allInvoices by viewModel.allInvoices.collectAsState()
    val invoiceWithItems = remember(allInvoices, invoiceId) {
        allInvoices.find { it.invoice.id == invoiceId }
    }

    BackHandler {
        viewModel.navigateBack()
    }

    if (invoiceWithItems == null) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
        return
    }

    val inv = invoiceWithItems.invoice
    val items = invoiceWithItems.items

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Invoice ${inv.invoiceNumber}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Template Live Preview",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(
                        onClick = { viewModel.navigateBack() },
                        modifier = Modifier.testTag("preview_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = { viewModel.openEditInvoice(invoiceId) },
                        modifier = Modifier.testTag("preview_edit_button")
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit")
                    }
                    IconButton(
                        onClick = {
                            val pdfFile = PdfGenerator.generatePdf(context, invoiceWithItems)
                            PdfGenerator.printPdf(context, pdfFile, inv.invoiceNumber)
                        },
                        modifier = Modifier.testTag("preview_print_button")
                    ) {
                        Icon(Icons.Default.Print, contentDescription = "Print")
                    }
                    IconButton(
                        onClick = {
                            val pdfFile = PdfGenerator.generatePdf(context, invoiceWithItems)
                            PdfGenerator.sharePdf(context, pdfFile, inv.invoiceNumber)
                        },
                        modifier = Modifier.testTag("preview_share_button")
                    ) {
                        Icon(Icons.Default.Share, contentDescription = "Share PDF")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            SurfaceActionsBottomBar(
                onShare = {
                    val pdfFile = PdfGenerator.generatePdf(context, invoiceWithItems)
                    PdfGenerator.sharePdf(context, pdfFile, inv.invoiceNumber)
                },
                onPrint = {
                    val pdfFile = PdfGenerator.generatePdf(context, invoiceWithItems)
                    PdfGenerator.printPdf(context, pdfFile, inv.invoiceNumber)
                },
                onEdit = {
                    viewModel.openEditInvoice(invoiceId)
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFE2E8F0)) // Desk gray background for realism
                .verticalScroll(rememberScrollState())
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Paper Document Canvas (Replicating the Sheet Template)
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(elevation = 6.dp, shape = RoundedCornerShape(2.dp)),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp)
                ) {
                    // 1. Header: Seller Info & Document Title
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = inv.sellerName,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyDark
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = inv.sellerAddress,
                                fontSize = 11.5.sp,
                                color = Color(0xFF334155)
                            )
                            Text(
                                text = "Phone: ${inv.sellerPhone}",
                                fontSize = 11.sp,
                                color = Color(0xFF334155)
                            )
                            Text(
                                text = "Email: ${inv.sellerEmail}",
                                fontSize = 11.sp,
                                color = Color(0xFF334155)
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "TAX INVOICE",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black,
                                color = NavyPrimary,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = "فاتورة ضريبية",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF64748B)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            StatusBadge(status = inv.status)
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // 2. Invoice Meta Table Box (INVOICE NO., DATE, TRN, DUE DATE)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderSubtle)
                            .background(TableHeaderBg)
                    ) {
                        MetaCell(title = "INVOICE NO.:", value = inv.invoiceNumber, modifier = Modifier.weight(1f))
                        Box(modifier = Modifier.width(1.dp).height(46.dp).background(BorderSubtle))
                        MetaCell(title = "INVOICE DATE:", value = inv.invoiceDate, modifier = Modifier.weight(1f))
                        Box(modifier = Modifier.width(1.dp).height(46.dp).background(BorderSubtle))
                        MetaCell(title = "TRN:", value = inv.sellerTrn, modifier = Modifier.weight(1.2f))
                        Box(modifier = Modifier.width(1.dp).height(46.dp).background(BorderSubtle))
                        MetaCell(title = "DUE DATE:", value = inv.dueDate, modifier = Modifier.weight(1f))
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // 3. Bill To Section
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(4.dp))
                            .background(Color(0xFFF8FAFC))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "■ BILL TO",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = NavyPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = inv.clientName,
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = NavyDark
                        )
                        if (inv.clientAddress.isNotBlank()) {
                            Text(text = inv.clientAddress, fontSize = 11.5.sp, color = Color(0xFF334155))
                        }
                        if (inv.clientPoBox.isNotBlank()) {
                            Text(text = inv.clientPoBox, fontSize = 11.5.sp, color = Color(0xFF334155))
                        }
                        if (inv.clientPhone.isNotBlank()) {
                            Text(text = "Phone: ${inv.clientPhone}", fontSize = 11.sp, color = Color(0xFF334155))
                        }
                        if (inv.clientTrn.isNotBlank()) {
                            Text(
                                text = "TRN: ${inv.clientTrn}",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = NavyPrimary
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // 4. Line Items Table (Matches template layout)
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderSubtle)
                    ) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TableHeaderBg)
                                .padding(horizontal = 8.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "DESCRIPTION",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF475569),
                                modifier = Modifier.weight(2.4f)
                            )
                            Text(
                                text = "QTY",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF475569),
                                textAlign = TextAlign.End,
                                modifier = Modifier.weight(0.7f)
                            )
                            Text(
                                text = "UNIT PRICE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF475569),
                                textAlign = TextAlign.End,
                                modifier = Modifier.weight(1.1f)
                            )
                            Text(
                                text = "AMOUNT (${inv.currency})",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF475569),
                                textAlign = TextAlign.End,
                                modifier = Modifier.weight(1.3f)
                            )
                        }

                        // Table Rows
                        items.forEachIndexed { index, item ->
                            val rowBg = if (index % 2 == 0) Color.White else TableRowStripe
                            Divider(color = BorderSubtle, thickness = 0.8.dp)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(rowBg)
                                    .padding(horizontal = 8.dp, vertical = 7.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(2.4f)) {
                                    item.description.split("\n").forEach { line ->
                                        Text(
                                            text = line,
                                            fontSize = 11.sp,
                                            color = Color(0xFF1E293B)
                                        )
                                    }
                                }
                                val qtyStr = if (item.quantity % 1.0 == 0.0) item.quantity.toInt().toString() else String.format(Locale.US, "%.2f", item.quantity)
                                Text(
                                    text = qtyStr,
                                    fontSize = 11.5.sp,
                                    color = Color(0xFF1E293B),
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.weight(0.7f)
                                )
                                Text(
                                    text = String.format(Locale.US, "%,.2f", item.unitPrice),
                                    fontSize = 11.5.sp,
                                    color = Color(0xFF1E293B),
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.weight(1.1f)
                                )
                                Text(
                                    text = String.format(Locale.US, "%,.2f", item.amount),
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF0F172A),
                                    textAlign = TextAlign.End,
                                    modifier = Modifier.weight(1.3f)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 5. Totals & Amount in words
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        // Amount in words box
                        Column(
                            modifier = Modifier
                                .weight(1.1f)
                                .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                                .background(Color(0xFFF8FAFC))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "AMOUNT IN WORDS",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF64748B)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = invoiceWithItems.calculatedAmountInWords,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontStyle = FontStyle.Italic,
                                color = NavyDark
                            )
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        // Subtotal, VAT, Total Due Table
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, BorderSubtle)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = "Subtotal", fontSize = 11.sp, color = Color(0xFF475569))
                                Text(
                                    text = "${inv.currency} " + String.format(Locale.US, "%,.2f", invoiceWithItems.subtotal),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF0F172A)
                                )
                            }
                            Divider(color = BorderSubtle, thickness = 0.8.dp)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                val vatRateStr = if (inv.vatRate % 1.0 == 0.0) "${inv.vatRate.toInt()}%" else "${inv.vatRate}%"
                                Text(text = "VAT ($vatRateStr)", fontSize = 11.sp, color = Color(0xFF475569))
                                Text(
                                    text = "${inv.currency} " + String.format(Locale.US, "%,.2f", invoiceWithItems.vatAmount),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF0F172A)
                                )
                            }
                            Divider(color = BorderSubtle, thickness = 0.8.dp)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(HighlightTotalBg)
                                    .padding(horizontal = 8.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "TOTAL DUE",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NavyPrimary
                                )
                                Text(
                                    text = "${inv.currency} " + String.format(Locale.US, "%,.2f", invoiceWithItems.totalDue),
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Black,
                                    color = NavyPrimary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // 6. Payment Terms & Bank Details (Side by Side or Stacked)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Payment terms
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                                .background(Color(0xFFF8FAFC))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "■ PAYMENT TERMS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = inv.paymentTerms,
                                fontSize = 10.5.sp,
                                color = Color(0xFF334155),
                                lineHeight = 15.sp
                            )
                        }

                        // Bank details
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                                .background(Color(0xFFF8FAFC))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "■ BANK DETAILS",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            if (inv.bankName.isNotBlank()) {
                                BankRow(label = "Bank", value = inv.bankName)
                            }
                            if (inv.bankAccountName.isNotBlank()) {
                                BankRow(label = "Account", value = inv.bankAccountName)
                            }
                            if (inv.bankIban.isNotBlank()) {
                                BankRow(label = "IBAN", value = inv.bankIban)
                            }
                            if (inv.bankSwift.isNotBlank()) {
                                BankRow(label = "SWIFT", value = inv.bankSwift)
                            }
                        }
                    }

                    // 7. Notes
                    if (inv.notes.isNotBlank()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, BorderSubtle, RoundedCornerShape(4.dp))
                                .padding(10.dp)
                        ) {
                            Text(
                                text = "■ NOTES",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = NavyPrimary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = inv.notes,
                                fontSize = 10.5.sp,
                                color = Color(0xFF334155)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // 8. Legal Disclaimer
                    Text(
                        text = "This is a computer-generated e-invoice and does not require a signature.",
                        fontSize = 10.sp,
                        fontStyle = FontStyle.Italic,
                        color = Color(0xFF94A3B8),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun MetaCell(title: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.padding(vertical = 6.dp, horizontal = 6.dp),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = title,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF64748B)
        )
        Text(
            text = value,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF0F172A)
        )
    }
}

@Composable
fun BankRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 1.dp)
    ) {
        Text(
            text = "$label: ",
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF64748B),
            modifier = Modifier.width(52.dp)
        )
        Text(
            text = value,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF0F172A)
        )
    }
}

@Composable
fun SurfaceActionsBottomBar(
    onShare: () -> Unit,
    onPrint: () -> Unit,
    onEdit: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(
                onClick = onPrint,
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Print")
            }

            Button(
                onClick = onShare,
                modifier = Modifier.weight(1.3f),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Export PDF")
            }
        }
    }
}
