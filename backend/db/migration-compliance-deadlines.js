// backend/db/migration-compliance-deadlines.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'projects.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration: Add compliance_deadlines table...');

// Create compliance_deadlines table with all columns we need
const createComplianceDeadlinesTable = `
  CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    task TEXT NOT NULL,
    due_date DATE NOT NULL,
    framework TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'overdue')),
    description TEXT,
    responsible_party TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  );
`;

// Add indices for better performance
const createIndices = [
  'CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_project_id ON compliance_deadlines(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_due_date ON compliance_deadlines(due_date);',
  'CREATE INDEX IF NOT EXISTS idx_compliance_deadlines_priority ON compliance_deadlines(priority);'
];

// Check if we need to add lat/lon columns to projects table
const checkAndAddColumns = async () => {
  return new Promise((resolve) => {
    // Check if latitude column exists
    db.get("PRAGMA table_info(projects)", (err, info) => {
      if (err) {
        console.log('Could not check table info, columns may already exist');
        resolve();
        return;
      }

      // Get all columns
      db.all("PRAGMA table_info(projects)", (err, columns) => {
        if (err) {
          console.log('Could not get column info');
          resolve();
          return;
        }

        const columnNames = columns.map(col => col.name);
        const hasLatitude = columnNames.includes('latitude');
        const hasLongitude = columnNames.includes('longitude');

        if (!hasLatitude) {
          db.run('ALTER TABLE projects ADD COLUMN latitude REAL', (err) => {
            if (err) {
              console.log('Latitude column may already exist or failed to add');
            } else {
              console.log('✅ Added latitude column to projects table');
            }
          });
        }

        if (!hasLongitude) {
          db.run('ALTER TABLE projects ADD COLUMN longitude REAL', (err) => {
            if (err) {
              console.log('Longitude column may already exist or failed to add');
            } else {
              console.log('✅ Added longitude column to projects table');
            }
          });
        }

        resolve();
      });
    });
  });
};

// Sample data for testing - FIXED: Only use columns that exist in our table
const sampleDeadlines = [
  {
    project_id: 1,
    task: 'Submit Environmental Impact Assessment',
    due_date: '2025-10-15',
    framework: 'EU EIA Directive',
    priority: 'high',
    description: 'Complete and submit EIA documentation to regulatory authority',
    responsible_party: 'Environmental Consultant'
  },
  {
    project_id: 1,
    task: 'Marine Construction Permit Application',
    due_date: '2025-11-01',
    framework: 'National Marine Protection Laws',
    priority: 'high',
    description: 'Apply for marine construction permit from coastal authority',
    responsible_party: 'Regulatory Affairs Manager'
  },
  {
    project_id: 1,
    task: 'Stakeholder Consultation Meeting',
    due_date: '2025-09-30',
    framework: 'Local Coastal Management Plan',
    priority: 'medium',
    description: 'Organize public consultation meeting with local stakeholders',
    responsible_party: 'Community Relations Manager'
  }
];

async function runMigration() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      // First check/add lat/lon columns
      await checkAndAddColumns();

      // Create compliance_deadlines table
      db.run(createComplianceDeadlinesTable, (err) => {
        if (err) {
          console.error('Error creating compliance_deadlines table:', err);
          return reject(err);
        }
        console.log('✅ compliance_deadlines table created successfully');
      });

      // Create indices
      createIndices.forEach((indexSql, i) => {
        db.run(indexSql, (err) => {
          if (err) {
            console.error(`Error creating index ${i + 1}:`, err);
          } else {
            console.log(`✅ Index ${i + 1} created successfully`);
          }
        });
      });

      // Check if we have any projects to attach deadlines to
      db.get('SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL', (err, result) => {
        if (err) {
          console.error('Error checking projects:', err);
          return reject(err);
        }

        if (result.count === 0) {
          console.log('ℹ️ No projects found - skipping sample data insertion');
          console.log('ℹ️ Sample deadlines will be added when you create your first project');
          
          // Verify table creation
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='compliance_deadlines'", (err, row) => {
            if (err) {
              return reject(err);
            }
            if (row) {
              console.log('✅ Migration completed successfully!');
              resolve();
            } else {
              reject(new Error('compliance_deadlines table was not created'));
            }
          });
          return;
        }

        // Insert sample data only if we have projects
        const insertDeadline = db.prepare(`
          INSERT OR IGNORE INTO compliance_deadlines 
          (project_id, task, due_date, framework, priority, description, responsible_party)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        let inserted = 0;
        sampleDeadlines.forEach((deadline, index) => {
          insertDeadline.run([
            deadline.project_id,
            deadline.task,
            deadline.due_date,
            deadline.framework,
            deadline.priority,
            deadline.description,
            deadline.responsible_party
          ], (err) => {
            if (err) {
              console.error('Error inserting sample deadline:', err);
            } else {
              inserted++;
              console.log(`✅ Inserted sample deadline: ${deadline.task}`);
            }

            // Check if this was the last insertion
            if (index === sampleDeadlines.length - 1) {
              insertDeadline.finalize();

              // Verify the migration
              db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='compliance_deadlines'", (err, row) => {
                if (err) {
                  console.error('Error verifying migration:', err);
                  return reject(err);
                }
                
                if (row) {
                  console.log('✅ Migration completed successfully!');
                  console.log('ℹ️ compliance_deadlines table is ready for use');
                  console.log(`ℹ️ Sample deadlines inserted: ${inserted} records`);
                  resolve();
                } else {
                  reject(new Error('compliance_deadlines table was not created'));
                }
              });
            }
          });
        });
      });
    });
  });
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Database migration completed successfully!');
      db.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      db.close();
      process.exit(1);
    });
}

module.exports = { runMigration };