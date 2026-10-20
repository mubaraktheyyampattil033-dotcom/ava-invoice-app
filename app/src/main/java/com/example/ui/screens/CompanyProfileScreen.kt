package com.example.ui.screens

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.CompanyProfileEntity
import com.example.ui.InvoiceViewModel
import com.example.util.SampleData

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompanyProfileScreen(
    viewModel: InvoiceViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val currentProfile by viewModel.companyProfile.collectAsState()
    val initial = currentProfile ?: SampleData.defaultCompanyProfile

    var companyName by remember(initial) { mutableStateOf(initial.companyName) }
    var address by remember(initial) { mutableStateOf(initial.address) }
    var phone by remember(initial) { mutableStateOf(initial.phone) }
    var email by remember(initial) { mutableStateOf(initial.email) }
    var trn by remember(initial) { mutableStateOf(initial.trn) }
    var defaultCurrency by remember(initial) { mutableStateOf(initial.defaultCurrency) }
    var defaultVatRate by remember(initial) { mutableStateOf(initial.defaultVatRate.toString()) }
    var defaultPaymentTerms by remember(initial) { mutableStateOf(initial.defaultPaymentTerms) }
    var bankName by remember(initial) { mutableStateOf(initial.bankName) }
    var bankAccountName by remember(initial) { mutableStateOf(initial.bankAccountName) }
    var bankIban by remember(initial) { mutableStateOf(initial.bankIban) }
    var bankSwift by remember(initial) { mutableStateOf(initial.bankSwift) }
    var defaultNotes by remember(initial) { mutableStateOf(initial.defaultNotes) }

    BackHandler {
        viewModel.navigateBack()
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = { Text("Business & Bank Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { viewModel.navigateBack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            val updated = CompanyProfileEntity(
                                id = 1,
                                companyName = companyName,
                                address = address,
                                phone = phone,
                                email = email,
                                trn = trn,
                                defaultCurrency = defaultCurrency,
                                defaultVatRate = defaultVatRate.toDoubleOrNull() ?: 5.0,
                                defaultPaymentTerms = defaultPaymentTerms,
                                bankName = bankName,
                                bankAccountName = bankAccountName,
                                bankIban = bankIban,
                                bankSwift = bankSwift,
                                defaultNotes = defaultNotes
                            )
                            viewModel.saveCompanyProfile(updated)
                            Toast.makeText(context, "Business profile saved", Toast.LENGTH_SHORT).show()
                            viewModel.navigateBack()
                        },
                        modifier = Modifier.testTag("save_profile_button")
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Save Settings")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "These details will automatically pre-fill when you create new tax invoices.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            item {
                EditorSectionCard(title = "Company Information") {
                    OutlinedTextField(
                        value = companyName,
                        onValueChange = { companyName = it },
                        label = { Text("Company Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = address,
                        onValueChange = { address = it },
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
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Phone") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Email") },
                            modifier = Modifier.weight(1.2f),
                            singleLine = true
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = trn,
                        onValueChange = { trn = it },
                        label = { Text("Company TRN (Tax Registration Number)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            item {
                EditorSectionCard(title = "Invoice Defaults") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = defaultCurrency,
                            onValueChange = { defaultCurrency = it.uppercase() },
                            label = { Text("Currency (e.g. AED)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = defaultVatRate,
                            onValueChange = { defaultVatRate = it },
                            label = { Text("Default VAT %") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = defaultPaymentTerms,
                        onValueChange = { defaultPaymentTerms = it },
                        label = { Text("Default Payment Terms") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = defaultNotes,
                        onValueChange = { defaultNotes = it },
                        label = { Text("Default Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2
                    )
                }
            }

            item {
                EditorSectionCard(title = "Bank Account Information") {
                    OutlinedTextField(
                        value = bankName,
                        onValueChange = { bankName = it },
                        label = { Text("Bank Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = bankAccountName,
                        onValueChange = { bankAccountName = it },
                        label = { Text("Account Holder Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = bankIban,
                        onValueChange = { bankIban = it },
                        label = { Text("IBAN") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = bankSwift,
                        onValueChange = { bankSwift = it },
                        label = { Text("SWIFT / BIC (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            item {
                Button(
                    onClick = {
                        val updated = CompanyProfileEntity(
                            id = 1,
                            companyName = companyName,
                            address = address,
                            phone = phone,
                            email = email,
                            trn = trn,
                            defaultCurrency = defaultCurrency,
                            defaultVatRate = defaultVatRate.toDoubleOrNull() ?: 5.0,
                            defaultPaymentTerms = defaultPaymentTerms,
                            bankName = bankName,
                            bankAccountName = bankAccountName,
                            bankIban = bankIban,
                            bankSwift = bankSwift,
                            defaultNotes = defaultNotes
                        )
                        viewModel.saveCompanyProfile(updated)
                        Toast.makeText(context, "Business profile updated", Toast.LENGTH_SHORT).show()
                        viewModel.navigateBack()
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Save Business Profile")
                }
            }

            item { Spacer(modifier = Modifier.height(40.dp)) }
        }
    }
}
