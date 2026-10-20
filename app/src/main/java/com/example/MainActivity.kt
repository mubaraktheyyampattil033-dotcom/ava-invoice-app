package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import com.example.ui.InvoiceViewModel
import com.example.ui.Screen
import com.example.ui.screens.ClientListScreen
import com.example.ui.screens.CompanyProfileScreen
import com.example.ui.screens.InvoiceEditorScreen
import com.example.ui.screens.InvoiceListScreen
import com.example.ui.screens.InvoicePreviewScreen
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

    private val viewModel: InvoiceViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                MainAppContent(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun MainAppContent(viewModel: InvoiceViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsState()

    val showBottomBar = currentScreen is Screen.List || currentScreen is Screen.Clients || currentScreen is Screen.Settings

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.testTag("main_navigation_bar")
                ) {
                    NavigationBarItem(
                        selected = currentScreen is Screen.List,
                        onClick = { viewModel.navigateTo(Screen.List) },
                        icon = { Icon(Icons.Default.Receipt, contentDescription = "Invoices") },
                        label = { Text("Invoices") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        modifier = Modifier.testTag("nav_item_invoices")
                    )
                    NavigationBarItem(
                        selected = currentScreen is Screen.Clients,
                        onClick = { viewModel.navigateTo(Screen.Clients) },
                        icon = { Icon(Icons.Default.Business, contentDescription = "Clients") },
                        label = { Text("Clients") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        modifier = Modifier.testTag("nav_item_clients")
                    )
                    NavigationBarItem(
                        selected = currentScreen is Screen.Settings,
                        onClick = { viewModel.navigateTo(Screen.Settings) },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("Settings") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        ),
                        modifier = Modifier.testTag("nav_item_settings")
                    )
                }
            }
        }
    ) { innerPadding ->
        AnimatedContent(
            targetState = currentScreen,
            transitionSpec = { fadeIn() togetherWith fadeOut() },
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            label = "ScreenTransition"
        ) { targetScreen ->
            when (targetScreen) {
                is Screen.List -> {
                    InvoiceListScreen(viewModel = viewModel)
                }
                is Screen.Editor -> {
                    InvoiceEditorScreen(
                        invoiceId = targetScreen.invoiceId,
                        viewModel = viewModel
                    )
                }
                is Screen.Preview -> {
                    InvoicePreviewScreen(
                        invoiceId = targetScreen.invoiceId,
                        viewModel = viewModel
                    )
                }
                is Screen.Clients -> {
                    ClientListScreen(viewModel = viewModel)
                }
                is Screen.Settings -> {
                    CompanyProfileScreen(viewModel = viewModel)
                }
            }
        }
    }
}
