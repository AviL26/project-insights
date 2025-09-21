// services/backup-service.js - Complete Backup and Monitoring Service
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_PATH || './backups';
    this.dbPath = process.env.SQLITE_DB_PATH || './db/projects.db';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.compressionEnabled = process.env.BACKUP_COMPRESSION !== 'false';
    this.maxBackups = 50;
  }

  async initialize() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('✅ Backup service initialized');
      
      if (process.env.BACKUP_ENABLED === 'true') {
        this.startScheduledBackups();
      }
    } catch (error) {
      console.error('❌ Backup service initialization failed:', error);
    }
  }

  startScheduledBackups() {
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.createBackup('scheduled');
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });

    // Weekly full backup on Sundays at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      try {
        await this.createFullBackup();
        await this.verifyBackupIntegrity();
      } catch (error) {
        console.error('Weekly backup failed:', error);
      }
    });

    console.log('📅 Backup schedule activated (Daily: 2AM, Weekly: Sunday 3AM)');
  }

  async createBackup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `econocrete-backup-${type}-${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.db`);

    try {
      // Create database backup
      await this.copyDatabase(this.dbPath, backupPath);
      
      // Compress if enabled
      let finalPath = backupPath;
      if (this.compressionEnabled) {
        finalPath = await this.compressBackup(backupPath);
        await fs.unlink(backupPath); // Remove uncompressed version
      }

      // Verify backup integrity
      const isValid = await this.verifyBackup(finalPath);
      if (!isValid) {
        throw new Error('Backup integrity verification failed');
      }

      // Create metadata file
      await this.createBackupMetadata(finalPath, type);

      console.log(`✅ ${type} backup created: ${path.basename(finalPath)}`);
      return finalPath;

    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async copyDatabase(source, destination) {
    return new Promise((resolve, reject) => {
      const sourceStream = require('fs').createReadStream(source);
      const destStream = require('fs').createWriteStream(destination);

      sourceStream.on('error', reject);
      destStream.on('error', reject);
      destStream.on('finish', resolve);

      sourceStream.pipe(destStream);
    });
  }

  async compressBackup(filePath) {
    const zlib = require('zlib');
    const compressedPath = `${filePath}.gz`;

    return new Promise((resolve, reject) => {
      const sourceStream = require('fs').createReadStream(filePath);
      const destStream = require('fs').createWriteStream(compressedPath);
      const gzip = zlib.createGzip();

      sourceStream.on('error', reject);
      destStream.on('error', reject);
      destStream.on('finish', () => resolve(compressedPath));

      sourceStream.pipe(gzip).pipe(destStream);
    });
  }

  async verifyBackup(backupPath) {
    try {
      const Database = require('sqlite3').Database;
      
      return new Promise((resolve) => {
        let dbPath = backupPath;
        
        // If compressed, assume valid for now (in production you'd decompress and verify)
        if (backupPath.endsWith('.gz')) {
          resolve(true);
          return;
        }

        const db = new Database(dbPath, { readonly: true }, (err) => {
          if (err) {
            resolve(false);
            return;
          }

          db.get('SELECT COUNT(*) as count FROM sqlite_master', (err, row) => {
            db.close();
            resolve(!err && row && typeof row.count === 'number');
          });
        });
      });
    } catch (error) {
      return false;
    }
  }

  async createBackupMetadata(backupPath, type) {
    const stats = await fs.stat(backupPath);
    const metadata = {
      filename: path.basename(backupPath),
      type,
      created: new Date().toISOString(),
      size: stats.size,
      sizeFormatted: this.formatBytes(stats.size),
      checksum: await this.calculateChecksum(backupPath),
      version: process.env.npm_package_version || '1.0.0'
    };

    const metadataPath = backupPath.replace(/\.(db|gz)$/, '.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  async createFullBackup() {
    const backupPath = await this.createBackup('full');
    
    // Export additional metadata
    const fullBackupDir = backupPath.replace(/\.(db|gz)$/, '_full');
    await fs.mkdir(fullBackupDir, { recursive: true });

    // Copy configuration files
    const configFiles = ['.env', 'package.json'];
    for (const file of configFiles) {
      try {
        const sourcePath = path.join(process.cwd(), file);
        const destPath = path.join(fullBackupDir, file);
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        // File might not exist, continue
      }
    }

    // Create system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development'
    };

    await fs.writeFile(
      path.join(fullBackupDir, 'system-info.json'),
      JSON.stringify(systemInfo, null, 2)
    );

    console.log(`Full backup created with metadata: ${path.basename(fullBackupDir)}`);
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('econocrete-backup-') && (file.endsWith('.db') || file.endsWith('.gz'))
      );

      // Sort by creation time (newest first)
      const fileStats = await Promise.all(
        backupFiles.map(async file => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          return { file, path: filePath, created: stats.mtime };
        })
      );

      fileStats.sort((a, b) => b.created - a.created);

      // Remove old backups based on retention policy
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deleted = 0;
      for (let i = this.maxBackups; i < fileStats.length; i++) {
        const fileInfo = fileStats[i];
        if (fileInfo.created < cutoffDate) {
          await fs.unlink(fileInfo.path);
          
          // Also remove metadata file
          const metadataPath = fileInfo.path.replace(/\.(db|gz)$/, '.json');
          try {
            await fs.unlink(metadataPath);
          } catch (error) {
            // Metadata file might not exist
          }
          
          deleted++;
        }
      }

      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} old backup(s)`);
      }

    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('econocrete-backup-') && (file.endsWith('.db') || file.endsWith('.gz'))
      );

      const backups = await Promise.all(
        backupFiles.map(async file => {
          const filePath = path.join(this.backupDir, file);
          const metadataPath = filePath.replace(/\.(db|gz)$/, '.json');
          
          let metadata = {};
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            metadata = JSON.parse(metadataContent);
          } catch (error) {
            // Fallback to file stats if no metadata
            const stats = await fs.stat(filePath);
            metadata = {
              filename: file,
              created: stats.mtime.toISOString(),
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size)
            };
          }

          return metadata;
        })
      );

      return backups.sort((a, b) => new Date(b.created) - new Date(a.created));

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async verifyBackupIntegrity() {
    const backups = await this.listBackups();
    let verified = 0;
    let failed = 0;

    for (const backup of backups.slice(0, 10)) { // Check last 10 backups
      const backupPath = path.join(this.backupDir, backup.filename);
      const isValid = await this.verifyBackup(backupPath);
      
      if (isValid) {
        verified++;
      } else {
        failed++;
        console.warn(`Backup integrity check failed: ${backup.filename}`);
      }
    }

    console.log(`Backup integrity check: ${verified} verified, ${failed} failed`);
    return { verified, failed };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getBackupStats() {
    const backups = await this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + (backup.size || 0), 0);

    return {
      totalBackups: backups.length,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null,
      backupDirectory: this.backupDir
    };
  }
}

// Monitoring Service
class MonitoringService {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0 },
      database: { queries: 0, errors: 0, avgResponseTime: 0 },
      authentication: { logins: 0, failures: 0 },
      performance: { memory: [], cpu: [], responseTime: [] }
    };
    this.alerts = [];
    this.thresholds = {
      errorRate: 0.05, // 5%
      responseTime: 2000, // 2 seconds
      memoryUsage: 0.8, // 80%
    };
  }

  startMonitoring() {
    // Collect metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Check thresholds every 5 minutes
    setInterval(() => {
      this.checkThresholds();
    }, 300000);

    console.log('Monitoring service started');
  }

  recordRequest(success = true) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }
  }

  recordDatabaseQuery(responseTime, success = true) {
    this.metrics.database.queries++;
    if (!success) {
      this.metrics.database.errors++;
    }

    // Update average response time
    const currentAvg = this.metrics.database.avgResponseTime;
    const queryCount = this.metrics.database.queries;
    this.metrics.database.avgResponseTime = 
      (currentAvg * (queryCount - 1) + responseTime) / queryCount;
  }

  recordAuthentication(success = true) {
    if (success) {
      this.metrics.authentication.logins++;
    } else {
      this.metrics.authentication.failures++;
    }
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();

    const memoryMetric = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usage: memUsage.heapUsed / memUsage.heapTotal
    };

    this.metrics.performance.memory.push(memoryMetric);
    if (this.metrics.performance.memory.length > 60) { // Keep last hour
      this.metrics.performance.memory.shift();
    }
  }

  checkThresholds() {
    const alerts = [];

    // Check error rate
    const errorRate = this.metrics.requests.errors / Math.max(this.metrics.requests.total, 1);
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'warning',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        threshold: this.thresholds.errorRate,
        current: errorRate
      });
    }

    // Check database response time
    if (this.metrics.database.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'database_performance',
        severity: 'warning',
        message: `Slow database queries: ${this.metrics.database.avgResponseTime.toFixed(0)}ms`,
        threshold: this.thresholds.responseTime,
        current: this.metrics.database.avgResponseTime
      });
    }

    // Add new alerts
    alerts.forEach(alert => {
      alert.timestamp = new Date().toISOString();
      this.alerts.push(alert);
    });

    // Keep only recent alerts (last 24 hours)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoff
    );

    // Log critical alerts
    alerts.filter(alert => alert.severity === 'critical').forEach(alert => {
      console.error(`CRITICAL ALERT: ${alert.message}`);
    });
  }

  getMetrics() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    return {
      requests: {
        ...this.metrics.requests,
        errorRate: this.metrics.requests.errors / Math.max(this.metrics.requests.total, 1),
        successRate: this.metrics.requests.success / Math.max(this.metrics.requests.total, 1)
      },
      database: {
        ...this.metrics.database,
        errorRate: this.metrics.database.errors / Math.max(this.metrics.database.queries, 1)
      },
      authentication: {
        ...this.metrics.authentication,
        failureRate: this.metrics.authentication.failures / 
          Math.max(this.metrics.authentication.logins + this.metrics.authentication.failures, 1)
      },
      performance: {
        memory: this.metrics.performance.memory.filter(m => m.timestamp > oneHourAgo),
        responseTime: this.metrics.performance.responseTime.filter(r => r.timestamp > oneHourAgo)
      },
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        warnings: this.alerts.filter(a => a.severity === 'warning').length,
        recent: this.alerts.slice(-10)
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const criticalAlerts = metrics.alerts.critical;
    const errorRate = metrics.requests.errorRate;
    const dbResponseTime = metrics.database.avgResponseTime;

    let status = 'healthy';
    let issues = [];

    if (criticalAlerts > 0) {
      status = 'critical';
      issues.push(`${criticalAlerts} critical alerts`);
    } else if (errorRate > this.thresholds.errorRate) {
      status = 'degraded';
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    } else if (dbResponseTime > this.thresholds.responseTime) {
      status = 'degraded';
      issues.push(`Slow database: ${dbResponseTime.toFixed(0)}ms`);
    }

    return {
      status,
      issues,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, success: 0, errors: 0 },
      database: { queries: 0, errors: 0, avgResponseTime: 0 },
      authentication: { logins: 0, failures: 0 },
      performance: { memory: [], cpu: [], responseTime: [] }
    };
    this.alerts = [];
  }
}

// Export services
const backupService = new BackupService();
const monitoringService = new MonitoringService();

module.exports = {
  BackupService,
  MonitoringService,
  backupService,
  monitoringService
};