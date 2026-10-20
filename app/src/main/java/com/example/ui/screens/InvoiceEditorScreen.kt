package com.example.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.InvoiceStatus
import com.example.ui.InvoiceViewModel
import com.example.ui.Screen
import com.example.ui.theme.BorderSubtle
import com.example.ui.theme.NavyPrimary
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InvoiceEditorScreen(
    invoiceId: Long?,
    viewModel: InvoiceViewModel,
    modifier: Modifier = Modifier
) {
    val editorState by viewModel.editorState.collectAsState()
    val allClients by viewModel.allClients.collectAsState()
    var clientDropdownExpanded by remember { mutableStateOf(false) }

    BackHandler {
        viewModel.navigateBack()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (editorState.invoiceId == 0L) "New Tax Invoice" else "Edit Invoice",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = { viewModel.navigateBack() },
                        modifier = Modifier.testTag("editor_back_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            viewModel.saveCurrentInvoice { savedId ->
                                viewModel.navigateTo(Screen.Preview(savedId))
                            }
                        },
                        modifier = Modifier.testTag("editor_preview_button")
                    ) {
                        Icon(Icons.Default.Visibility, contentDescription = "Save & Preview")
                    }
                    IconButton(
                        onClick = {
                            viewModel.saveCurrentInvoice {
                                viewModel.navigateBack()
                            }
                        },
                        modifier = Modifier.testTag("editor_save_button")
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Save")
                    }
                }
            )
        },
        bottomBar = {
            // Live Summary & Save Action
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                elevation = CardDefaults.cardElevation(8.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "TOTAL DUE (Inc. VAT)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${editorState.currency} " + String.format(Locale.US, "%,.2f", editorState.totalDue),
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Black,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                viewModel.saveCurrentInvoice { savedId ->
                                    viewModel.navigateTo(Screen.Preview(savedId))
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier.testTag("editor_save_and_preview_cta")
                        ) {
                            Text("Save & Preview")
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item { Spacer(modifier = Modifier.height(4.dp)) }

            // 1. Meta & Status Card
            item {
                EditorSectionCard(title = "Invoice Details") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = editorState.invoiceNumber,
                            onValueChange = { viewModel.updateEditorState { s -> s.copy(invoiceNumber = it) } },
                            label = { Text("Invoice No.") },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_invoice_number"),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = editorState.currency,
                            onValueChange = { viewModel.updateEditorState { s -> s.copy(currency = it.uppercase()) } },
                            label = { Text("Currency") },
                            modifier = Modifier.width(90.dp),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = editorState.invoiceDate,
                            onValueChange = { viewModel.updateEditorState { s -> s.copy(invoiceDate = it) } },
                            label = { Text("Invoice Date") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = editorState.dueDate,
                            onValueChange = { viewModel.updateEditorState { s -> s.copy(dueDate = it) } },
                            label = { Text("Due Date") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Status",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        InvoiceStatus.entries.forEach { status ->
                            FilterChip(
                                selected = editorState.status == status.name,
                                onClick = { viewModel.updateEditorState { s -> s.copy(status = status.name) } },
                                label = { Text(status.displayName) }
                            )
                        }
                    }
                }
            }

            // 2. Client Section (Bill To)
            item {
                EditorSectionCard(title = "Bill To (Client)") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Customer Information",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Box {
                            OutlinedButton(
                                onClick = { clientDropdownExpanded = true },
                                modifier = Modifier.testTag("select_client_button")
                            ) {
                                Icon(Icons.Default.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Autofill Client")
                            }
                            DropdownMenu(
                                expanded = clientDropdownExpanded,
                                onDismissRequest = { clientDropdownExpanded = false }
                            ) {
                                allClients.forEach { client ->
                                    DropdownMenuItem(
                                        text = { Text(client.name) },
                                        onClick = {
                                            viewModel.applyClientToEditor(client)
                                            clientDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editorState.clientName,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(clientName = it) } },
                        label = { Text("Client Company Name") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_client_name"),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editorState.clientAddress,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(clientAddress = it) } },
                        label = { Text("Address / City / Country") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = editorState.clientPoBox,
                            onValueChange = { viewModel.updateEditorState { s -> s.copy(clientPoBox = it) } },
                            label = { Text("P.O. Box") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = editorState.clientPhone,
                            onValueChange = { viewModel.updateEditorState { s -> s.copy(clientPhone = it) } },
                            label = { Text("Phone") },
                            modifier = Modifier.weight(1.2f),
                            singleLine = true
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editorState.clientTrn,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(clientTrn = it) } },
                        label = { Text("Client TRN (Tax Registration Number)") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_client_trn"),
                        singleLine = true
                    )
                }
            }

            // 3. Line Items Section
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Line Items (${editorState.items.size})",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    OutlinedButton(
                        onClick = { viewModel.addLineItem() },
                        modifier = Modifier.testTag("btn_add_item")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Item")
                    }
                }
            }

            itemsIndexed(editorState.items) { index, item ->
                LineItemEditorCard(
                    index = index,
                    item = item,
                    currency = editorState.currency,
                    onUpdate = { desc, qty, price ->
                        viewModel.updateLineItem(index, desc, qty, price)
                    },
                    onDelete = {
                        viewModel.removeLineItem(index)
                    }
                )
            }

            // 4. Financials & VAT Calculation
            item {
                EditorSectionCard(title = "Taxes & Totals") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(text = "Subtotal", fontSize = 14.sp)
                        Text(
                            text = "${editorState.currency} " + String.format(Locale.US, "%,.2f", editorState.subtotal),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = if (editorState.vatRate % 1.0 == 0.0) editorState.vatRate.toInt().toString() else editorState.vatRate.toString(),
                            onValueChange = {
                                val rate = it.toDoubleOrNull() ?: 0.0
                                viewModel.updateEditorState { s -> s.copy(vatRate = rate) }
                            },
                            label = { Text("VAT %") },
                            modifier = Modifier.width(110.dp),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )

                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = "VAT Amount", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                text = "${editorState.currency} " + String.format(Locale.US, "%,.2f", editorState.vatAmount),
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.primaryContainer, RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Column {
                            Text(
                                text = "AMOUNT IN WORDS (AUTO-GENERATED)",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = editorState.calculatedAmountInWords,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            }

            // 5. Payment Terms & Bank Info
            item {
                EditorSectionCard(title = "Payment Terms & Bank Details") {
                    OutlinedTextField(
                        value = editorState.paymentTerms,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(paymentTerms = it) } },
                        label = { Text("Payment Terms") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = editorState.bankName,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(bankName = it) } },
                        label = { Text("Bank Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editorState.bankAccountName,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(bankAccountName = it) } },
                        label = { Text("Account Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editorState.bankIban,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(bankIban = it) } },
                        label = { Text("IBAN") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = editorState.notes,
                        onValueChange = { viewModel.updateEditorState { s -> s.copy(notes = it) } },
                        label = { Text("Invoice Notes / Message") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun EditorSectionCard(
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(1.5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}

@Composable
fun LineItemEditorCard(
    index: Int,
    item: com.example.data.model.InvoiceItemEntity,
    currency: String,
    onUpdate: (description: String, quantity: Double, unitPrice: Double) -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Item #${index + 1}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Remove Item",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = item.description,
                onValueChange = { onUpdate(it, item.quantity, item.unitPrice) },
                label = { Text("Description (e.g. Service, Bus, Route, Dates)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = if (item.quantity % 1.0 == 0.0) item.quantity.toInt().toString() else item.quantity.toString(),
                    onValueChange = {
                        val qty = it.toDoubleOrNull() ?: 1.0
                        onUpdate(item.description, qty, item.unitPrice)
                    },
                    label = { Text("Qty") },
                    modifier = Modifier.weight(1f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )

                OutlinedTextField(
                    value = if (item.unitPrice == 0.0) "" else String.format(Locale.US, "%.2f", item.unitPrice),
                    onValueChange = {
                        val price = it.toDoubleOrNull() ?: 0.0
                        onUpdate(item.description, item.quantity, price)
                    },
                    label = { Text("Unit Price") },
                    modifier = Modifier.weight(1.3f),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true
                )

                Column(
                    modifier = Modifier.weight(1.2f),
                    horizontalAlignment = Alignment.End
                ) {
                    Text(text = "Amount", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(
                        text = "$currency " + String.format(Locale.US, "%,.2f", item.amount),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}
