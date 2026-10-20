package com.example.util

import java.util.Locale
import kotlin.math.roundToLong

object NumberToWordsConverter {

    private val units = arrayOf(
        "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"
    )

    private val tens = arrayOf(
        "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    )

    fun convert(amount: Double, currency: String = "AED"): String {
        if (amount == 0.0) {
            return when (currency.uppercase(Locale.ROOT)) {
                "AED" -> "UAE Dirham zero only"
                "USD" -> "US Dollars zero only"
                else -> "$currency zero only"
            }
        }

        val totalCents = (amount * 100.0).roundToLong()
        val majorPart = totalCents / 100
        val minorPart = (totalCents % 100).toInt()

        val majorWords = numberToEnglishWords(majorPart)
        val minorWords = if (minorPart > 0) numberToEnglishWords(minorPart.toLong()) else ""

        val curr = currency.uppercase(Locale.ROOT).trim()

        return when (curr) {
            "AED" -> {
                if (minorPart > 0) {
                    "UAE Dirham $majorWords and $minorWords Fils only"
                } else {
                    "UAE Dirham $majorWords only"
                }
            }
            "SAR" -> {
                if (minorPart > 0) {
                    "Saudi Riyal $majorWords and $minorWords Halalas only"
                } else {
                    "Saudi Riyal $majorWords only"
                }
            }
            "USD" -> {
                if (minorPart > 0) {
                    "US Dollars $majorWords and $minorWords Cents only"
                } else {
                    "US Dollars $majorWords only"
                }
            }
            "EUR" -> {
                if (minorPart > 0) {
                    "Euros $majorWords and $minorWords Cents only"
                } else {
                    "Euros $majorWords only"
                }
            }
            "GBP" -> {
                if (minorPart > 0) {
                    "Pounds Sterling $majorWords and $minorWords Pence only"
                } else {
                    "Pounds Sterling $majorWords only"
                }
            }
            "QAR" -> {
                if (minorPart > 0) {
                    "Qatari Riyal $majorWords and $minorWords Dirhams only"
                } else {
                    "Qatari Riyal $majorWords only"
                }
            }
            else -> {
                if (minorPart > 0) {
                    "$curr $majorWords and $minorWords/100 only"
                } else {
                    "$curr $majorWords only"
                }
            }
        }
    }

    private fun numberToEnglishWords(n: Long): String {
        if (n == 0L) return "zero"
        if (n < 0) return "minus " + numberToEnglishWords(-n)

        val sb = StringBuilder()

        val billions = n / 1_000_000_000L
        var remainder = n % 1_000_000_000L
        if (billions > 0) {
            sb.append(convertChunk(billions.toInt())).append(" billion ")
        }

        val millions = remainder / 1_000_000L
        remainder %= 1_000_000L
        if (millions > 0) {
            sb.append(convertChunk(millions.toInt())).append(" million ")
        }

        val thousands = remainder / 1_000L
        remainder %= 1_000L
        if (thousands > 0) {
            sb.append(convertChunk(thousands.toInt())).append(" thousand ")
        }

        if (remainder > 0) {
            sb.append(convertChunk(remainder.toInt()))
        }

        return sb.toString().trim().replace(Regex("\\s+"), " ")
    }

    private fun convertChunk(number: Int): String {
        var num = number
        val sb = StringBuilder()

        if (num >= 100) {
            sb.append(units[num / 100]).append(" hundred ")
            num %= 100
            if (num > 0) {
                sb.append("and ")
            }
        }

        if (num > 0) {
            if (num < 20) {
                sb.append(units[num])
            } else {
                sb.append(tens[num / 10])
                val unit = num % 10
                if (unit > 0) {
                    sb.append("-").append(units[unit])
                }
            }
        }

        return sb.toString().trim()
    }
}
