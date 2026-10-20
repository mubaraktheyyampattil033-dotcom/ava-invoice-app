package com.example.data.model

import androidx.room.Embedded
import androidx.room.Relation
import com.example.util.NumberToWordsConverter

data class InvoiceWithItems(
    @Embedded
    val invoice: InvoiceEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "invoiceId"
    )
    val items: List<InvoiceItemEntity>
) {
    val subtotal: Double
        get() = items.sumOf { it.quantity * it.unitPrice }

    val vatAmount: Double
        get() = subtotal * (invoice.vatRate / 100.0)

    val totalDue: Double
        get() = subtotal + vatAmount

    val calculatedAmountInWords: String
        get() {
            if (!invoice.amountInWordsOverride.isNullOrBlank()) {
                return invoice.amountInWordsOverride
            }
            return NumberToWordsConverter.convert(totalDue, invoice.currency)
        }
}
