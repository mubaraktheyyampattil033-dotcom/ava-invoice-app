package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class InvoiceStatus(val displayName: String) {
    DRAFT("Draft"),
    SENT("Sent"),
    PAID("Paid"),
    OVERDUE("Overdue")
}

@Entity(tableName = "invoices")
data class InvoiceEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val invoiceNumber: String,
    val invoiceDate: String,
    val dueDate: String,
    // Seller Info
    val sellerName: String,
    val sellerAddress: String,
    val sellerPhone: String,
    val sellerEmail: String,
    val sellerTrn: String,
    // Client (Bill To)
    val clientName: String,
    val clientAddress: String,
    val clientPoBox: String,
    val clientPhone: String,
    val clientTrn: String,
    // Financials
    val currency: String = "AED",
    val vatRate: Double = 5.0,
    // Bank Details
    val bankName: String,
    val bankAccountName: String,
    val bankIban: String,
    val bankSwift: String = "",
    // Terms & Notes
    val paymentTerms: String,
    val notes: String,
    val status: String = InvoiceStatus.DRAFT.name,
    val amountInWordsOverride: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
