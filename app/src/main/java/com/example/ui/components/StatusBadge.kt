package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.InvoiceStatus
import com.example.ui.theme.AmberPending
import com.example.ui.theme.EmeraldPaid
import com.example.ui.theme.RoseOverdue
import com.example.ui.theme.SlateDraft

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, text) = when (status) {
        InvoiceStatus.PAID.name -> Triple(EmeraldPaid.copy(alpha = 0.15f), EmeraldPaid, "PAID")
        InvoiceStatus.SENT.name -> Triple(AmberPending.copy(alpha = 0.15f), AmberPending, "SENT")
        InvoiceStatus.OVERDUE.name -> Triple(RoseOverdue.copy(alpha = 0.15f), RoseOverdue, "OVERDUE")
        else -> Triple(SlateDraft.copy(alpha = 0.15f), SlateDraft, "DRAFT")
    }

    Box(
        modifier = modifier
            .background(bgColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}
