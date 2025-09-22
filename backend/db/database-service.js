// backend/db/database-service.js - Enhanced Database Service with Connection Pooling
const pool = require('./connection-pool');
const fs = require('fs').promises;
const path = require('path');

class DatabaseService {
  constructor() {
    this.pool = pool;
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      // Initialize database schema if needed
      await this.initializeSchema();
      
      // Create indexes for performance
      await this.createIndexes();
      
      this.initialized = true;
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('Created backup directory:', this.backupDir);
    }
  }

  async initializeSchema() {
    const schemaFile = path.join(__dirname, 'schema.sql');
    
    try {
      const schema = await fs.readFile(schemaFile, 'utf8');
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.pool.execute(statement.trim(), [], 'run');
        }
      }
      
      console.log('Database schema initialized');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error initializing schema:', error);
        throw error;
      }
      console.log('No schema.sql file found, skipping schema initialization');
    }
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
      'CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)',
      'CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_ecological_data_project_id ON ecological_data(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_compliance_data_project_id ON compliance_data(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_compliance_data_due_date ON compliance_data(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)'
    ];

    for (const index of indexes) {
      try {
        await this.pool.execute(index, [], 'run');
      } catch (error) {
        console.warn('Index creation warning:', error.message);
      }
    }
    
    console.log('Database indexes created');
  }

  // Enhanced query methods with connection pooling
  async get(query, params = []) {
    await this.initialize();
    return this.pool.execute(query, params, 'get');
  }

  async all(query, params = []) {
    await this.initialize();
    return this.pool.execute(query, params, 'all');
  }

  async run(query, params = []) {
    await this.initialize();
    return this.pool.execute(query, params, 'run');
  }

  async transaction(callback) {
    await this.initialize();
    return this.pool.transaction(callback);
  }

  // Enhanced data validation
  validateProjectData(data) {
    const errors = [];
    
    // Required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Project name is required and must be a non-empty string');
    }
    
    if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push('Location is required and must be a non-empty string');
    }
    
    if (!data.type || typeof data.type !== 'string') {
      errors.push('Project type is required');
    }
    
    // Valid project types
    const validTypes = ['breakwater', 'seawall', 'pier', 'jetty', 'artificial_reef', 'coastal_protection'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push(`Project type must be one of: ${validTypes.join(', ')}`);
    }
    
    // Valid status values
    const validStatuses = ['planning', 'design', 'permitting', 'construction', 'completed', 'on_hold', 'cancelled'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Budget validation
    if (data.budget !== undefined && data.budget !== null) {
      if (typeof data.budget !== 'number' || data.budget < 0) {
        errors.push('Budget must be a positive number');
      }
    }
    
    // Date validation
    if (data.start_date && isNaN(Date.parse(data.start_date))) {
      errors.push('Start date must be a valid date');
    }
    
    if (data.end_date && isNaN(Date.parse(data.end_date))) {
      errors.push('End date must be a valid date');
    }
    
    if (data.start_date && data.end_date && new Date(data.start_date) > new Date(data.end_date)) {
      errors.push('End date must be after start date');
    }
    
    // Field length validation
    if (data.name && data.name.length > 255) {
      errors.push('Project name must be less than 255 characters');
    }
    
    if (data.description && data.description.length > 2000) {
      errors.push('Description must be less than 2000 characters');
    }
    
    if (data.location && data.location.length > 255) {
      errors.push('Location must be less than 255 characters');
    }
    
    return errors;
  }

  // Backup functionality
  async createBackup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${type}_${timestamp}.db`;
    const backupPath = path.join(this.backupDir, backupFileName);
    
    try {
      // Use SQLite's backup API
      await this.pool.execute('.backup ?', [backupPath], 'run');
      
      // Log backup creation
      await this.logActivity('BACKUP', 'database', null, {
        type,
        fileName: backupFileName,
        path: backupPath
      });
      
      console.log(`Database backup created: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async scheduleBackups() {
    // Create daily backup at 2 AM
    const now = new Date();
    const tomorrow2AM = new Date(now);
    tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
    tomorrow2AM.setHours(2, 0, 0, 0);
    
    const msUntil2AM = tomorrow2AM.getTime() - now.getTime();
    
    setTimeout(() => {
      this.createBackup('scheduled');
      // Schedule daily backups
      setInterval(() => {
        this.createBackup('scheduled');
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntil2AM);
    
    console.log('Backup scheduler initialized');
  }

  // Enhanced audit logging
  async logActivity(action, tableName, recordId, metadata = {}) {
    const logEntry = {
      action,
      table_name: tableName,
      record_id: recordId,
      metadata: JSON.stringify(metadata),
      user_id: metadata.userId || null,
      ip_address: metadata.ipAddress || null,
      user_agent: metadata.userAgent || null,
      created_at: new Date().toISOString()
    };

    try {
      await this.run(`
        INSERT INTO audit_log (action, table_name, record_id, metadata, user_id, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        logEntry.action,
        logEntry.table_name,
        logEntry.record_id,
        logEntry.metadata,
        logEntry.user_id,
        logEntry.ip_address,
        logEntry.user_agent,
        logEntry.created_at
      ]);
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking main operations
    }
  }

  // Database health check
  async healthCheck() {
    try {
      const stats = this.pool.getStats();
      
      // Test basic connectivity
      await this.get('SELECT 1 as test');
      
      // Check table existence
      const tables = await this.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      return {
        status: 'healthy',
        connectionPool: stats,
        tables: tables.map(t => t.name),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Data integrity check
  async checkDataIntegrity() {
    const issues = [];
    
    try {
      // Check for orphaned records
      const orphanedMaterials = await this.all(`
        SELECT id FROM materials 
        WHERE project_id NOT IN (SELECT id FROM projects)
      `);
      
      if (orphanedMaterials.length > 0) {
        issues.push({
          type: 'orphaned_records',
          table: 'materials',
          count: orphanedMaterials.length,
          ids: orphanedMaterials.map(r => r.id)
        });
      }
      
      const orphanedEcological = await this.all(`
        SELECT id FROM ecological_data 
        WHERE project_id NOT IN (SELECT id FROM projects)
      `);
      
      if (orphanedEcological.length > 0) {
        issues.push({
          type: 'orphaned_records',
          table: 'ecological_data',
          count: orphanedEcological.length,
          ids: orphanedEcological.map(r => r.id)
        });
      }
      
      // Check data consistency
      const invalidStatuses = await this.all(`
        SELECT id, status FROM projects 
        WHERE status NOT IN ('planning', 'design', 'permitting', 'construction', 'completed', 'on_hold', 'cancelled')
      `);
      
      if (invalidStatuses.length > 0) {
        issues.push({
          type: 'invalid_data',
          table: 'projects',
          field: 'status',
          count: invalidStatuses.length,
          records: invalidStatuses
        });
      }
      
      return {
        status: issues.length === 0 ? 'clean' : 'issues_found',
        issues,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'check_failed',
        error: error.message,
        checkedAt: new Date().toISOString()
      };
    }
  }

  // Graceful shutdown
  async close() {
    await this.pool.close();
  }
}

// Create singleton instance
const dbService = new DatabaseService();

// Initialize on startup
dbService.initialize().catch(console.error);

// Schedule backups
dbService.scheduleBackups();

module.exports = dbService;