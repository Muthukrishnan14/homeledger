/**
 * One-time migration: backfill ActivityLog entries for all existing transactions.
 *
 * Usage:
 *   node scripts/backfill-activity-logs.js
 *
 * This creates an "added" activity log entry for each existing transaction,
 * preserving the original createdAt timestamp so the activity log reflects
 * the true history.
 *
 * Safe to run multiple times — it skips transactions that already have a log entry.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../src/models/Transaction');
const ActivityLog = require('../src/models/ActivityLog');

async function backfill() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const transactions = await Transaction.find({});
  console.log(`Found ${transactions.length} existing transactions`);

  let created = 0;
  let skipped = 0;

  for (const tx of transactions) {
    // Check if a log entry already exists for this transaction
    const existing = await ActivityLog.findOne({ transactionId: tx._id });
    if (existing) {
      skipped++;
      continue;
    }

    // Insert with the transaction's original createdAt timestamp
    await ActivityLog.collection.insertOne({
      action: 'added',
      transactionId: tx._id,
      subCategoryId: tx.subCategoryId,
      amount: tx.amount,
      previousAmount: null,
      date: tx.date,
      note: tx.note || '',
      createdAt: tx.createdAt,
      updatedAt: tx.createdAt,
    });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already existed): ${skipped}`);
  await mongoose.disconnect();
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
