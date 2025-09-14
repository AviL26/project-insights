// backend/db/migrate-archive-status.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

console.log('Migrating to archive status system...\n');

async function migrateToArchiveStatus() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Step 1: Add status column if it doesn't exist
      db.run(`ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived'))`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding status column:', err);
          return reject(err);
        }
        if (!err) {
          console.log('✅ Added status column to projects table');
        } else {
          console.log('ℹ️ Status column already exists');
        }
      });

      // Step 2: Migrate existing soft-deleted projects to archived status
      db.run(`UPDATE projects SET status = 'archived' WHERE deleted_at IS NOT NULL`, function(err) {
        if (err) {
          console.error('Error migrating soft-deleted projects:', err);
          return reject(err);
        }
        console.log(`✅ Migrated ${this.changes} soft-deleted projects to archived status`);
      });

      // Step 3: Clear deleted_at for archived projects (optional - we can keep it for audit trail)
      db.run(`UPDATE projects SET deleted_at = NULL WHERE status = 'archived'`, function(err) {
        if (err) {
          console.error('Error clearing deleted_at timestamps:', err);
          return reject(err);
        }
        console.log(`✅ Cleared deleted_at timestamps for ${this.changes} archived projects`);
      });

      // Step 4: Set active status for all projects that don't have archived status
      db.run(`UPDATE projects SET status = 'active' WHERE status IS NULL`, function(err) {
        if (err) {
          console.error('Error setting active status:', err);
          return reject(err);
        }
        console.log(`✅ Set active status for ${this.changes} projects`);
      });

      // Step 5: Verify the migration
      db.all(`SELECT status, COUNT(*) as count FROM projects GROUP BY status`, (err, results) => {
        if (err) {
          console.error('Error verifying migration:', err);
          return reject(err);
        }

        console.log('\n📊 Project status distribution:');
        results.forEach(row => {
          console.log(`  - ${row.status || 'null'}: ${row.count} projects`);
        });

        // Check if any projects still have deleted_at set
        db.get(`SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NOT NULL`, (err, result) => {
          if (err) {
            console.error('Error checking deleted_at:', err);
            return reject(err);
          }

          if (result.count > 0) {
            console.log(`⚠️ ${result.count} projects still have deleted_at timestamps`);
          } else {
            console.log('✅ All deleted_at timestamps cleared');
          }

          console.log('\n🎉 Migration completed successfully!');
          console.log('ℹ️ Projects are now organized by status: active or archived');
          resolve();
        });
      });
    });
  });
}

// Run migration if called directly
if (require.main === module) {
  migrateToArchiveStatus()
    .then(() => {
      db.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      db.close();
      process.exit(1);
    });
}

module.exports = { migrateToArchiveStatus };