package com.example

import com.example.util.NumberToWordsConverter
import org.junit.Assert.assertEquals
import org.junit.Test

class ExampleUnitTest {
    @Test
    fun testAmountInWordsForTemplate() {
        val words = NumberToWordsConverter.convert(17627.88, "AED")
        assertEquals(
            "UAE Dirham seventeen thousand six hundred and twenty-seven and eighty-eight Fils only",
            words
        )
    }

    @Test
    fun testAmountInWordsRoundAmount() {
        val words = NumberToWordsConverter.convert(5000.0, "AED")
        assertEquals(
            "UAE Dirham five thousand only",
            words
        )
    }
}
