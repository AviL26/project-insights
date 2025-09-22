// routes/auth.js - Enhanced Authentication Routes with Phase 3 Performance Monitoring
const express = require('express');
const router = express.Router();
const { 
  hashPassword, 
  comparePassword, 
  generateToken,
  authenticateToken 
} = require('../middleware/auth');
const { 
  validateUser, 
  validateLogin, 
  handleValidationErrors 
} = require('../middleware/validation');

// Use enhanced database manager
const { dbManager } = require('../db/enhanced-connection');

// Import Phase 3 utilities
const { CacheService, PerformanceMonitor } = require('../utils/pagination');

// Initialize Phase 3 services
const cacheService = new CacheService();
const performanceMonitor = new PerformanceMonitor();

// Performance monitoring middleware
router.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMonitor.trackEndpoint(req.route?.path || req.path, duration, res.statusCode);
  });
  
  next();
});

// Selective cache middleware for read-only operations
const authCacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    // Only cache GET requests for user lists (admin operations)
    if (req.method !== 'GET' || !req.originalUrl.includes('/users')) {
      return next();
    }

    const cacheKey = cacheService.generateKey('auth_users', {
      url: req.originalUrl,
      query: req.query,
      userId: req.user?.userId // Include user context for security
    });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`Auth cache hit for: ${req.originalUrl}`);
      return res.json(cached);
    }

    // Override res.json to cache successful responses
    const originalJson = res.json;
    res.json = (data) => {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
        console.log(`Cached auth response for: ${req.originalUrl}`);
      }
      return originalJson.call(res, data);
    };

    next();
  };
};

// Cache invalidation helper for user data changes
const invalidateUserCache = () => {
  cacheService.invalidate('auth_users');
  console.log('User cache invalidated');
};

// Initialize users table using enhanced database
const initializeUsersTable = async () => {
  const startTime = Date.now();
  
  try {
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        last_login_at TEXT,
        is_active BOOLEAN DEFAULT 1,
        
        CONSTRAINT email_format CHECK (email LIKE '%_@_%._%'),
        CONSTRAINT name_length CHECK (length(name) >= 2 AND length(name) <= 50)
      )
    `);

    await dbManager.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await dbManager.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await dbManager.query('CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)');
    await dbManager.query('CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at)');
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('CREATE users table', duration, true);
    
    console.log(`✅ Users table initialized with enhanced database in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('CREATE users table', duration, false);
    console.error('❌ Failed to initialize users table:', error);
  }
};

// Initialize on load
initializeUsersTable();

// User registration
router.post('/register', validateUser, handleValidationErrors, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { email, password, name, role = 'user' } = req.body;
    
    // Check if user exists using enhanced database
    const existingUsers = await dbManager.query(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );
    
    if (existingUsers.length > 0) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('SELECT user exists check', duration, true);
      
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const result = await dbManager.query(`
      INSERT INTO users (email, password_hash, name, role, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [email, hashedPassword, name, role]);
    
    // Generate token
    const token = generateToken(result.lastInsertRowid, email, role);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT user registration', duration, true);
    
    // Invalidate user cache since new user added
    invalidateUserCache();
    
    console.log(`User registered in ${duration}ms - ID: ${result.lastInsertRowid}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: { 
          id: result.lastInsertRowid, 
          email, 
          name, 
          role 
        },
        token
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('INSERT user registration', duration, false);
    
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// User login
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { email, password } = req.body;
    
    // Find user using enhanced database
    const users = await dbManager.query(`
      SELECT id, email, password_hash, name, role, last_login_at, is_active
      FROM users WHERE email = ? AND is_active = 1
    `, [email]);
    
    const user = users[0];
    if (!user) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('SELECT user login', duration, true);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('SELECT user login', duration, true);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Update last login
    await dbManager.query(
      'UPDATE users SET last_login_at = datetime("now") WHERE id = ?', 
      [user.id]
    );
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT user login', duration, true);
    
    console.log(`User login successful in ${duration}ms - ID: ${user.id}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLoginAt: user.last_login_at
        },
        token
      },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT user login', duration, false);
    
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const users = await dbManager.query(`
      SELECT id, email, name, role, created_at, last_login_at, is_active
      FROM users WHERE id = ? AND is_active = 1
    `, [req.user.userId]);
    
    const user = users[0];
    if (!user) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('SELECT user profile', duration, true);
      
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT user profile', duration, true);
    
    res.json({ 
      success: true, 
      data: { user },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT user profile', duration, false);
    
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      code: 'PROFILE_ERROR'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { name, email } = req.body;
    const userId = req.user.userId;
    
    // Basic validation
    if (name && (name.length < 2 || name.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check if email is already taken by another user
    if (email) {
      const existingUsers = await dbManager.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        const duration = Date.now() - startTime;
        performanceMonitor.trackQuery('UPDATE user profile', duration, true);
        
        return res.status(409).json({
          success: false,
          message: 'Email is already taken',
          code: 'EMAIL_TAKEN'
        });
      }
    }
    
    // Update user
    const result = await dbManager.query(`
      UPDATE users 
      SET name = COALESCE(?, name), 
          email = COALESCE(?, email),
          updated_at = datetime('now')
      WHERE id = ? AND is_active = 1
    `, [name, email, userId]);
    
    if (result.changes === 0) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('UPDATE user profile', duration, true);
      
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Fetch updated user
    const updatedUsers = await dbManager.query(`
      SELECT id, email, name, role, created_at, updated_at
      FROM users WHERE id = ?
    `, [userId]);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE user profile', duration, true);
    
    // Invalidate user cache since profile updated
    invalidateUserCache();
    
    console.log(`User profile updated in ${duration}ms - ID: ${userId}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUsers[0] },
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE user profile', duration, false);
    
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      code: 'UPDATE_ERROR'
    });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Get current user
    const users = await dbManager.query(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = 1',
      [req.user.userId]
    );
    
    const user = users[0];
    if (!user) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('UPDATE user password', duration, true);
      
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('UPDATE user password', duration, true);
      
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Update password
    await dbManager.query(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [hashedNewPassword, req.user.userId]);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE user password', duration, true);
    
    console.log(`Password changed in ${duration}ms - User ID: ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'Password updated successfully',
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('UPDATE user password', duration, false);
    
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Deactivate account (soft delete)
router.delete('/account', authenticateToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required',
        code: 'PASSWORD_REQUIRED'
      });
    }
    
    // Get current user
    const users = await dbManager.query(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = 1',
      [req.user.userId]
    );
    
    const user = users[0];
    if (!user) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('DELETE user account', duration, true);
      
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      const duration = Date.now() - startTime;
      performanceMonitor.trackQuery('DELETE user account', duration, true);
      
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // Deactivate account
    await dbManager.query(`
      UPDATE users 
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `, [req.user.userId]);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE user account', duration, true);
    
    // Invalidate user cache since user deactivated
    invalidateUserCache();
    
    console.log(`Account deactivated in ${duration}ms - User ID: ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'Account deactivated successfully',
      performance: {
        queryTime: duration
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('DELETE user account', duration, false);
    
    console.error('Account deactivation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      code: 'DEACTIVATION_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  // In a JWT system, logout is typically handled client-side by removing the token
  // For enhanced security, you could maintain a blacklist of invalidated tokens
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Token refresh endpoint
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    // Generate new token with same user data
    const newToken = generateToken(req.user.userId, req.user.email, req.user.role);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken }
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

// Admin endpoint: List all users (admin only) - WITH CACHING
router.get('/users', authenticateToken, authCacheMiddleware(180000), async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_active = 1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (email LIKE ? OR name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    // Get users with enhanced data
    const users = await dbManager.query(`
      SELECT 
        id, email, name, role, created_at, last_login_at,
        julianday('now') - julianday(last_login_at) as days_since_login,
        julianday('now') - julianday(created_at) as days_since_registration
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    // Get total count
    const countResult = await dbManager.query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);
    
    // Get user statistics
    const statsResult = await dbManager.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
        SUM(CASE WHEN role = 'viewer' THEN 1 ELSE 0 END) as viewer_count,
        SUM(CASE WHEN last_login_at >= date('now', '-30 days') THEN 1 ELSE 0 END) as active_last_30_days,
        SUM(CASE WHEN created_at >= date('now', '-7 days') THEN 1 ELSE 0 END) as new_last_7_days
      FROM users WHERE is_active = 1
    `);
    
    const total = countResult[0].total;
    const stats = statsResult[0];
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT admin user list', duration, true);
    
    console.log(`Admin user list retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        users,
        statistics: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT admin user list', duration, false);
    
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list users',
      code: 'LIST_USERS_ERROR'
    });
  }
});

// Admin endpoint: Get authentication statistics
router.get('/admin/stats', authenticateToken, authCacheMiddleware(300000), async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const [userStats, loginTrends] = await Promise.all([
      // Overall user statistics
      dbManager.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
          COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewer_users,
          COUNT(CASE WHEN last_login_at >= date('now', '-1 day') THEN 1 END) as logins_last_24h,
          COUNT(CASE WHEN last_login_at >= date('now', '-7 days') THEN 1 END) as logins_last_7d,
          COUNT(CASE WHEN last_login_at >= date('now', '-30 days') THEN 1 END) as logins_last_30d,
          COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as registrations_last_7d
        FROM users
      `),
      
      // Login trends (last 30 days)
      dbManager.query(`
        SELECT 
          DATE(last_login_at) as login_date,
          COUNT(*) as login_count
        FROM users 
        WHERE last_login_at >= date('now', '-30 days')
          AND last_login_at IS NOT NULL
        GROUP BY DATE(last_login_at)
        ORDER BY login_date DESC
        LIMIT 30
      `)
    ]);
    
    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT auth statistics', duration, true);
    
    console.log(`Auth statistics retrieved in ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        userStatistics: userStats[0],
        loginTrends: loginTrends
      },
      performance: {
        queryTime: duration,
        cached: false
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackQuery('SELECT auth statistics', duration, false);
    
    console.error('Auth stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch authentication statistics',
      code: 'AUTH_STATS_ERROR'
    });
  }
});

module.exports = router;