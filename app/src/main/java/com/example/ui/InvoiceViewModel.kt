package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.database.AppDatabase
import com.example.data.model.ClientEntity
import com.example.data.model.CompanyProfileEntity
import com.example.data.model.InvoiceEntity
import com.example.data.model.InvoiceItemEntity
import com.example.data.model.InvoiceStatus
import com.example.data.model.InvoiceWithItems
import com.example.data.repository.InvoiceRepository
import com.example.util.NumberToWordsConverter
import com.example.util.SampleData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

sealed interface Screen {
    data object List : Screen
    data class Editor(val invoiceId: Long? = null) : Screen
    data class Preview(val invoiceId: Long) : Screen
    data object Clients : Screen
    data object Settings : Screen
}

data class EditorState(
    val invoiceId: Long = 0,
    val invoiceNumber: String = "",
    val invoiceDate: String = "",
    val dueDate: String = "",
    val sellerName: String = "",
    val sellerAddress: String = "",
    val sellerPhone: String = "",
    val sellerEmail: String = "",
    val sellerTrn: String = "",
    val clientName: String = "",
    val clientAddress: String = "",
    val clientPoBox: String = "",
    val clientPhone: String = "",
    val clientTrn: String = "",
    val currency: String = "AED",
    val vatRate: Double = 5.0,
    val paymentTerms: String = "",
    val bankName: String = "",
    val bankAccountName: String = "",
    val bankIban: String = "",
    val bankSwift: String = "",
    val notes: String = "",
    val status: String = InvoiceStatus.DRAFT.name,
    val amountInWordsOverride: String? = null,
    val items: List<InvoiceItemEntity> = emptyList(),
    val isSaving: Boolean = false
) {
    val subtotal: Double
        get() = items.sumOf { it.quantity * it.unitPrice }

    val vatAmount: Double
        get() = subtotal * (vatRate / 100.0)

    val totalDue: Double
        get() = subtotal + vatAmount

    val calculatedAmountInWords: String
        get() {
            if (!amountInWordsOverride.isNullOrBlank()) {
                return amountInWordsOverride
            }
            return NumberToWordsConverter.convert(totalDue, currency)
        }
}

class InvoiceViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: InvoiceRepository

    init {
        val db = AppDatabase.getInstance(application)
        repository = InvoiceRepository(db.invoiceDao(), db.clientDao(), db.companyProfileDao())
        viewModelScope.launch {
            repository.seedInitialDataIfNeeded()
        }
    }

    // Navigation state
    private val _currentScreen = MutableStateFlow<Screen>(Screen.List)
    val currentScreen: StateFlow<Screen> = _currentScreen.asStateFlow()

    private val screenStack = mutableListOf<Screen>(Screen.List)

    fun navigateTo(screen: Screen) {
        screenStack.add(screen)
        _currentScreen.value = screen
    }

    fun navigateBack(): Boolean {
        if (screenStack.size > 1) {
            screenStack.removeAt(screenStack.lastIndex)
            _currentScreen.value = screenStack.last()
            return true
        }
        return false
    }

    // Invoice List & Filters
    val allInvoices: StateFlow<List<InvoiceWithItems>> = repository.allInvoices
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allClients: StateFlow<List<ClientEntity>> = repository.allClients
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val companyProfile: StateFlow<CompanyProfileEntity?> = repository.companyProfile
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _statusFilter = MutableStateFlow<InvoiceStatus?>(null)
    val statusFilter: StateFlow<InvoiceStatus?> = _statusFilter.asStateFlow()

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setStatusFilter(status: InvoiceStatus?) {
        _statusFilter.value = status
    }

    val filteredInvoices = combine(allInvoices, _searchQuery, _statusFilter) { invoices, query, filter ->
        invoices.filter { inv ->
            val matchesQuery = query.isBlank() ||
                    inv.invoice.invoiceNumber.contains(query, ignoreCase = true) ||
                    inv.invoice.clientName.contains(query, ignoreCase = true) ||
                    inv.invoice.sellerName.contains(query, ignoreCase = true)
            val matchesFilter = filter == null || inv.invoice.status == filter.name
            matchesQuery && matchesFilter
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Editor State
    private val _editorState = MutableStateFlow(EditorState())
    val editorState: StateFlow<EditorState> = _editorState.asStateFlow()

    fun openNewInvoiceEditor() {
        viewModelScope.launch {
            val profile = repository.getProfileOnce() ?: SampleData.defaultCompanyProfile
            val existingInvoices = allInvoices.value
            val nextNumber = if (existingInvoices.isNotEmpty()) {
                val latest = existingInvoices.firstOrNull()?.invoice?.invoiceNumber ?: "INV-02849"
                val match = Regex("(\\d+)").findAll(latest).lastOrNull()
                if (match != null) {
                    val num = match.value.toLongOrNull() ?: 1L
                    val nextStr = (num + 1L).toString().padStart(match.value.length, '0')
                    latest.substring(0, match.range.first) + nextStr + latest.substring(match.range.last + 1)
                } else {
                    "INV-00001"
                }
            } else {
                "INV-02849"
            }

            val dateFormat = SimpleDateFormat("dd MMM yyyy", Locale.US)
            val cal = Calendar.getInstance()
            val todayStr = dateFormat.format(cal.time)
            cal.add(Calendar.DAY_OF_YEAR, 30)
            val dueStr = dateFormat.format(cal.time)

            _editorState.value = EditorState(
                invoiceId = 0,
                invoiceNumber = nextNumber,
                invoiceDate = todayStr,
                dueDate = dueStr,
                sellerName = profile.companyName,
                sellerAddress = profile.address,
                sellerPhone = profile.phone,
                sellerEmail = profile.email,
                sellerTrn = profile.trn,
                currency = profile.defaultCurrency,
                vatRate = profile.defaultVatRate,
                paymentTerms = profile.defaultPaymentTerms,
                bankName = profile.bankName,
                bankAccountName = profile.bankAccountName,
                bankIban = profile.bankIban,
                bankSwift = profile.bankSwift,
                notes = profile.defaultNotes,
                items = listOf(
                    InvoiceItemEntity(
                        description = "Service / Delivery Description",
                        quantity = 1.0,
                        unitPrice = 1000.0,
                        orderIndex = 0
                    )
                )
            )
            navigateTo(Screen.Editor(null))
        }
    }

    fun openEditInvoice(invoiceId: Long) {
        viewModelScope.launch {
            val inv = repository.getInvoiceByIdOnce(invoiceId) ?: return@launch
            _editorState.value = EditorState(
                invoiceId = inv.invoice.id,
                invoiceNumber = inv.invoice.invoiceNumber,
                invoiceDate = inv.invoice.invoiceDate,
                dueDate = inv.invoice.dueDate,
                sellerName = inv.invoice.sellerName,
                sellerAddress = inv.invoice.sellerAddress,
                sellerPhone = inv.invoice.sellerPhone,
                sellerEmail = inv.invoice.sellerEmail,
                sellerTrn = inv.invoice.sellerTrn,
                clientName = inv.invoice.clientName,
                clientAddress = inv.invoice.clientAddress,
                clientPoBox = inv.invoice.clientPoBox,
                clientPhone = inv.invoice.clientPhone,
                clientTrn = inv.invoice.clientTrn,
                currency = inv.invoice.currency,
                vatRate = inv.invoice.vatRate,
                paymentTerms = inv.invoice.paymentTerms,
                bankName = inv.invoice.bankName,
                bankAccountName = inv.invoice.bankAccountName,
                bankIban = inv.invoice.bankIban,
                bankSwift = inv.invoice.bankSwift,
                notes = inv.invoice.notes,
                status = inv.invoice.status,
                amountInWordsOverride = inv.invoice.amountInWordsOverride,
                items = inv.items
            )
            navigateTo(Screen.Editor(invoiceId))
        }
    }

    fun updateEditorState(update: (EditorState) -> EditorState) {
        _editorState.value = update(_editorState.value)
    }

    fun applyClientToEditor(client: ClientEntity) {
        _editorState.value = _editorState.value.copy(
            clientName = client.name,
            clientAddress = client.address,
            clientPoBox = client.poBox,
            clientPhone = client.phone,
            clientTrn = client.trn
        )
    }

    fun addLineItem() {
        val currentItems = _editorState.value.items.toMutableList()
        currentItems.add(
            InvoiceItemEntity(
                invoiceId = _editorState.value.invoiceId,
                description = "",
                quantity = 1.0,
                unitPrice = 0.0,
                orderIndex = currentItems.size
            )
        )
        _editorState.value = _editorState.value.copy(items = currentItems)
    }

    fun updateLineItem(index: Int, description: String, quantity: Double, unitPrice: Double) {
        val currentItems = _editorState.value.items.toMutableList()
        if (index in currentItems.indices) {
            currentItems[index] = currentItems[index].copy(
                description = description,
                quantity = quantity,
                unitPrice = unitPrice
            )
            _editorState.value = _editorState.value.copy(items = currentItems)
        }
    }

    fun removeLineItem(index: Int) {
        val currentItems = _editorState.value.items.toMutableList()
        if (index in currentItems.indices) {
            currentItems.removeAt(index)
            _editorState.value = _editorState.value.copy(items = currentItems)
        }
    }

    fun saveCurrentInvoice(onSaved: (Long) -> Unit) {
        val state = _editorState.value
        viewModelScope.launch {
            _editorState.value = state.copy(isSaving = true)

            val invoice = InvoiceEntity(
                id = state.invoiceId,
                invoiceNumber = state.invoiceNumber.ifBlank { "INV-00001" },
                invoiceDate = state.invoiceDate,
                dueDate = state.dueDate,
                sellerName = state.sellerName,
                sellerAddress = state.sellerAddress,
                sellerPhone = state.sellerPhone,
                sellerEmail = state.sellerEmail,
                sellerTrn = state.sellerTrn,
                clientName = state.clientName.ifBlank { "Valued Customer" },
                clientAddress = state.clientAddress,
                clientPoBox = state.clientPoBox,
                clientPhone = state.clientPhone,
                clientTrn = state.clientTrn,
                currency = state.currency,
                vatRate = state.vatRate,
                paymentTerms = state.paymentTerms,
                bankName = state.bankName,
                bankAccountName = state.bankAccountName,
                bankIban = state.bankIban,
                bankSwift = state.bankSwift,
                notes = state.notes,
                status = state.status,
                amountInWordsOverride = state.amountInWordsOverride
            )

            val itemsToSave = if (state.items.isEmpty()) {
                listOf(
                    InvoiceItemEntity(
                        description = "General Services",
                        quantity = 1.0,
                        unitPrice = 0.0,
                        orderIndex = 0
                    )
                )
            } else {
                state.items
            }

            val savedId = repository.saveInvoice(invoice, itemsToSave)
            _editorState.value = state.copy(isSaving = false)
            onSaved(savedId)
        }
    }

    fun deleteInvoice(id: Long) {
        viewModelScope.launch {
            repository.deleteInvoice(id)
            if (_currentScreen.value is Screen.Preview && (_currentScreen.value as Screen.Preview).invoiceId == id) {
                navigateBack()
            }
        }
    }

    fun duplicateInvoice(id: Long) {
        viewModelScope.launch {
            val newId = repository.duplicateInvoice(id)
            if (newId != null) {
                openEditInvoice(newId)
            }
        }
    }

    fun updateStatus(id: Long, status: InvoiceStatus) {
        viewModelScope.launch {
            repository.updateInvoiceStatus(id, status.name)
        }
    }

    fun resetToTemplate() {
        viewModelScope.launch {
            val id = repository.resetToTemplateInvoice()
            navigateTo(Screen.Preview(id))
        }
    }

    // Clients Management
    fun saveClient(client: ClientEntity) {
        viewModelScope.launch {
            repository.saveClient(client)
        }
    }

    fun deleteClient(id: Long) {
        viewModelScope.launch {
            repository.deleteClient(id)
        }
    }

    // Profile Management
    fun saveCompanyProfile(profile: CompanyProfileEntity) {
        viewModelScope.launch {
            repository.saveProfile(profile)
        }
    }
}
