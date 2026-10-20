package com.example.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.data.dao.ClientDao
import com.example.data.dao.CompanyProfileDao
import com.example.data.dao.InvoiceDao
import com.example.data.model.ClientEntity
import com.example.data.model.CompanyProfileEntity
import com.example.data.model.InvoiceEntity
import com.example.data.model.InvoiceItemEntity

@Database(
    entities = [
        InvoiceEntity::class,
        InvoiceItemEntity::class,
        ClientEntity::class,
        CompanyProfileEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun invoiceDao(): InvoiceDao
    abstract fun clientDao(): ClientDao
    abstract fun companyProfileDao(): CompanyProfileDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "invoice_generator.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
