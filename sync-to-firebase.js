/* ==========================================================================
   INVOICE-GEN.NET - SYNC LOCAL DATABASE TO GOOGLE FIREBASE FIRESTORE
   Run: node sync-to-firebase.js
   ========================================================================== */

const firebase = require('./firebase');
const db = require('./db');

async function runSync() {
  console.log('\n===============================================================');
  console.log('   INVOICE-GEN.NET → GOOGLE FIREBASE FIRESTORE MIGRATION TOOL');
  console.log('===============================================================\n');

  const status = firebase.getStatus();
  if (!status.isReady) {
    console.log('❌ FIREBASE NOT CONNECTED YET!\n');
    console.log('Firebase কানেক্ট করার জন্য নিচের সহজ ধাপগুলো অনুসরণ করুন:');
    console.log('1. Firebase Console-এ যান (https://console.firebase.google.com)');
    console.log('2. প্রজেক্টের উপরে বামপাশে Settings (Gear icon ⚙️) -> Project settings-এ ক্লিক করুন');
    console.log('3. "Service accounts" ট্যাবে ক্লিক করুন');
    console.log('4. "Generate new private key" বাটনে ক্লিক করে JSON ফাইলটি ডাউনলোড করুন');
    console.log('5. ফাইলটিকে এই ফোল্ডারে পেস্ট করে নাম দিন: serviceAccountKey.json');
    console.log('6. তারপর আবার রান করুন: node sync-to-firebase.js\n');
    process.exit(1);
  }

  console.log(`✅ Firebase Connected! (Source: ${status.configSource})`);
  console.log('🚀 Migrating SQLite records to Cloud Firestore...\n');

  try {
    const result = await firebase.bulkSyncAll(db);
    if (result.success) {
      console.log('🎉 SYNC COMPLETE! All data is now live on Google Firebase!');
      console.log(`   - 👤 Users Synced:    ${result.usersSynced}`);
      console.log(`   - 📄 Invoices Synced: ${result.invoicesSynced}`);
      console.log(`   - 👥 Clients Synced:  ${result.clientsSynced}`);
      console.log('\nFirebase Console -> Firestore Database-এ গিয়ে রিফ্রেশ করলেই ডেটা দেখতে পাবেন!\n');
    } else {
      console.error('❌ Migration failed:', result.error);
    }
  } catch (err) {
    console.error('❌ Error during sync:', err.message);
  }
}

runSync();
