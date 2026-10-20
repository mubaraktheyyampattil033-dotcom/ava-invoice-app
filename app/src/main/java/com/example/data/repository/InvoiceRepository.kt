package com.example.data.repository

import com.example.data.dao.ClientDao
import com.example.data.dao.CompanyProfileDao
import com.example.data.dao.InvoiceDao
import com.example.data.model.ClientEntity
import com.example.data.model.CompanyProfileEntity
import com.example.data.model.InvoiceEntity
import com.example.data.model.InvoiceItemEntity
import com.example.data.model.InvoiceWithItems
import com.example.util.SampleData
import kotlinx.coroutines.flow.Flow
import java.util.Locale

class InvoiceRepository(
    private val invoiceDao: InvoiceDao,
    private val clientDao: ClientDao,
    private val companyProfileDao: CompanyProfileDao
) {
    val allInvoices: Flow<List<InvoiceWithItems>> = invoiceDao.getAllInvoicesWithItems()
    val allClients: Flow<List<ClientEntity>> = clientDao.getAllClients()
    val companyProfile: Flow<CompanyProfileEntity?> = companyProfileDao.getProfile()

    fun getInvoiceById(id: Long): Flow<InvoiceWithItems?> = invoiceDao.getInvoiceWithItemsById(id)

    suspend fun getInvoiceByIdOnce(id: Long): InvoiceWithItems? = invoiceDao.getInvoiceWithItemsByIdOnce(id)

    suspend fun getProfileOnce(): CompanyProfileEntity? = companyProfileDao.getProfileOnce()

    suspend fun saveInvoice(invoice: InvoiceEntity, items: List<InvoiceItemEntity>): Long {
        return invoiceDao.saveInvoiceWithItems(invoice, items)
    }

    suspend fun updateInvoiceStatus(id: Long, newStatus: String) {
        val existing = invoiceDao.getInvoiceById(id) ?: return
        invoiceDao.updateInvoice(existing.copy(status = newStatus))
    }

    suspend fun deleteInvoice(id: Long) {
        invoiceDao.deleteInvoiceById(id)
    }

    suspend fun duplicateInvoice(id: Long): Long? {
        val existing = invoiceDao.getInvoiceWithItemsByIdOnce(id) ?: return null
        val oldNum = existing.invoice.invoiceNumber
        val newNum = generateNextInvoiceNumber(oldNum)
        val newInvoice = existing.invoice.copy(
            id = 0,
            invoiceNumber = newNum,
            createdAt = System.currentTimeMillis()
        )
        val newItems = existing.items.map { it.copy(id = 0, invoiceId = 0) }
        return invoiceDao.saveInvoiceWithItems(newInvoice, newItems)
    }

    private fun generateNextInvoiceNumber(oldNumber: String): String {
        val regex = Regex("(\\d+)")
        val match = regex.findAll(oldNumber).lastOrNull()
        return if (match != null) {
            val numStr = match.value
            val nextNum = (numStr.toLongOrNull() ?: 1L) + 1L
            val padded = nextNum.toString().padStart(numStr.length, '0')
            oldNumber.substring(0, match.range.first) + padded + oldNumber.substring(match.range.last + 1)
        } else {
            "$oldNumber-COPY"
        }
    }

    suspend fun saveClient(client: ClientEntity): Long {
        return if (client.id == 0L) {
            clientDao.insertClient(client)
        } else {
            clientDao.updateClient(client)
            client.id
        }
    }

    suspend fun deleteClient(id: Long) {
        clientDao.deleteClientById(id)
    }

    suspend fun saveProfile(profile: CompanyProfileEntity) {
        companyProfileDao.saveProfile(profile)
    }

    suspend fun seedInitialDataIfNeeded() {
        val count = invoiceDao.getInvoiceCount()
        if (count == 0) {
            // Seed default profile
            val existingProfile = companyProfileDao.getProfileOnce()
            if (existingProfile == null) {
                companyProfileDao.saveProfile(SampleData.defaultCompanyProfile)
            }
            // Seed clients
            SampleData.sampleClients.forEach { client ->
                clientDao.insertClient(client.copy(id = 0))
            }
            // Seed template invoice
            val (invoice, items) = SampleData.createTemplateInvoice()
            invoiceDao.saveInvoiceWithItems(invoice, items)
        }
    }

    suspend fun resetToTemplateInvoice(): Long {
        val (invoice, items) = SampleData.createTemplateInvoice()
        return invoiceDao.saveInvoiceWithItems(invoice, items)
    }
}
