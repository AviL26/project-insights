// check-table-structure.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking compliance_deadlines table structure...\n');

// Check if table exists and its structure
db.all("PRAGMA table_info(compliance_deadlines)", (err, columns) => {
  if (err) {
    console.error('Error checking table info:', err);
    db.close();
    return;
  }

  if (columns.length === 0) {
    console.log('❌ compliance_deadlines table does not exist');
  } else {
    console.log('✅ compliance_deadlines table exists with columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
  }

  // Close database
  db.close();
});