package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "company_profile")
data class CompanyProfileEntity(
    @PrimaryKey
    val id: Int = 1,
    val companyName: String,
    val address: String,
    val phone: String,
    val email: String,
    val trn: String,
    val defaultCurrency: String = "AED",
    val defaultVatRate: Double = 5.0,
    val defaultPaymentTerms: String = "Payment due within 30 days of invoice date.",
    val bankName: String = "",
    val bankAccountName: String = "",
    val bankIban: String = "",
    val bankSwift: String = "",
    val defaultNotes: String = "Thank you for your business!"
)
