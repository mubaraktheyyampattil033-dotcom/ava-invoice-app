package com.example.util

import com.example.data.model.ClientEntity
import com.example.data.model.CompanyProfileEntity
import com.example.data.model.InvoiceEntity
import com.example.data.model.InvoiceItemEntity
import com.example.data.model.InvoiceStatus

object SampleData {

    val defaultCompanyProfile = CompanyProfileEntity(
        id = 1,
        companyName = "AVA Passengers Transport by Rental Buses L.L.C",
        address = "P.O. Box 91977, Dubai – United Arab Emirates",
        phone = "00971 4 3439666",
        email = "Contact@avarental.ae",
        trn = "100364388700003",
        defaultCurrency = "AED",
        defaultVatRate = 5.0,
        defaultPaymentTerms = "Payment due within 45 days of invoice date.\nPlease make checks payable to AVA Passengers Transport by Rental Buses L.L.C.",
        bankName = "RAKBANK",
        bankAccountName = "AVA Passengers Transport by Rental Buses L.L.C",
        bankIban = "AE11 0400 0083 7152 7349 901",
        bankSwift = "RAKBAEADXXX",
        defaultNotes = "Thank you for your business! Please contact us at Contact@avarental.ae if you have any questions regarding this invoice."
    )

    val sampleClients = listOf(
        ClientEntity(
            id = 1,
            name = "ALUMINIUM & LIGHT INDUSTRIES CO. (ALICO) LLC",
            address = "Sharjah - United Arab Emirates",
            poBox = "P.O. Box 6011",
            phone = "+971 6 5582244",
            email = "accounts@alico.ae",
            trn = "100016708800003"
        ),
        ClientEntity(
            id = 2,
            name = "EMIRATES LOGISTICS SOLUTIONS LLC",
            address = "Business Bay, Tower 1, Dubai",
            poBox = "P.O. Box 45220",
            phone = "+971 4 2200119",
            email = "procurement@emirateslogistics.ae",
            trn = "100456789100003"
        ),
        ClientEntity(
            id = 3,
            name = "GULF INFRASTRUCTURE CONTRACTING FZE",
            address = "Hamriyah Free Zone, Sharjah",
            poBox = "P.O. Box 8112",
            phone = "+971 6 5261100",
            email = "finance@gulfinfraco.com",
            trn = "100889922300003"
        )
    )

    fun createTemplateInvoice(): Pair<InvoiceEntity, List<InvoiceItemEntity>> {
        val invoice = InvoiceEntity(
            id = 0,
            invoiceNumber = "INV-02849",
            invoiceDate = "31 Aug 2026",
            dueDate = "15 Oct 2026",
            sellerName = "AVA Passengers Transport by Rental Buses L.L.C",
            sellerAddress = "P.O. Box 91977, Dubai – United Arab Emirates",
            sellerPhone = "00971 4 3439666",
            sellerEmail = "Contact@avarental.ae",
            sellerTrn = "100364388700003",
            clientName = "ALUMINIUM & LIGHT INDUSTRIES CO. (ALICO) LLC",
            clientAddress = "Sharjah - United Arab Emirates",
            clientPoBox = "P.O. Box 6011",
            clientPhone = "+971 6 5582244",
            clientTrn = "100016708800003",
            currency = "AED",
            vatRate = 5.0,
            bankName = "RAKBANK",
            bankAccountName = "AVA Passengers Transport by Rental Buses L.L.C",
            bankIban = "AE11 0400 0083 7152 7349 901",
            bankSwift = "RAKBAEADXXX",
            paymentTerms = "Payment due within 45 days of invoice date — by 15 Oct 2026.\nPlease make checks payable to AVA Passengers Transport by Rental Buses L.L.C.",
            notes = "Thank you for your business! Please contact us at Contact@avarental.ae if you have any questions regarding this invoice.",
            status = InvoiceStatus.SENT.name,
            amountInWordsOverride = "UAE Dirham seventeen thousand six hundred and twenty-seven and eighty-eight Fils only"
        )

        val items = listOf(
            InvoiceItemEntity(
                description = "60 Seated AC Bus with driver and fuel from camp to Site Pick and Drop\nBUS: 14377\nGO NO: 219\nFROM 01/09/2026-12/09/2026\nFrom Shj Camp - Rak",
                quantity = 12.0,
                unitPrice = 416.67,
                orderIndex = 0
            ),
            InvoiceItemEntity(
                description = "FROM 13/09/2026-30/09/2026",
                quantity = 18.0,
                unitPrice = 500.00,
                orderIndex = 1
            ),
            InvoiceItemEntity(
                description = "ADDED TRIP\n01,10-Sep 2026 from Uaq camp",
                quantity = 2.0,
                unitPrice = 240.39,
                orderIndex = 2
            ),
            InvoiceItemEntity(
                description = "18 Sep 2026 From Shj Camp - Rak",
                quantity = 1.0,
                unitPrice = 576.92,
                orderIndex = 3
            ),
            InvoiceItemEntity(
                description = "13,20,27-Sep 2026 Sunday",
                quantity = 3.0,
                unitPrice = 576.92,
                orderIndex = 4
            )
        )

        return Pair(invoice, items)
    }
}
