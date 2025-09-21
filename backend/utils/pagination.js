// utils/pagination.js - Complete Pagination and Performance Utilities
class PaginationHelper {
  static validatePaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  static validateSortParams(query, allowedFields = []) {
    const sort = query.sort || 'created_at';
    const order = (query.order || 'desc').toLowerCase();
    
    // Validate sort field
    const sortField = allowedFields.includes(sort) ? sort : 'created_at';
    const sortOrder = ['asc', 'desc'].includes(order) ? order : 'desc';
    
    return { sortField, sortOrder };
  }

  static buildSearchFilter(query, searchableFields = []) {
    const search = query.search ? query.search.trim() : '';
    if (!search || searchableFields.length === 0) {
      return { whereClause: '', params: [] };
    }

    const searchConditions = searchableFields.map(field => `${field} LIKE ?`);
    const whereClause = `AND (${searchConditions.join(' OR ')})`;
    const params = searchableFields.map(() => `%${search}%`);

    return { whereClause, params };
  }

  static buildResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    };
  }

  static buildFilterParams(query, allowedFilters = {}) {
    const whereConditions = [];
    const params = [];

    Object.entries(allowedFilters).forEach(([field, config]) => {
      const value = query[field];
      if (value !== undefined && value !== '') {
        if (config.type === 'exact') {
          whereConditions.push(`${field} = ?`);
          params.push(value);
        } else if (config.type === 'range') {
          if (query[`${field}_min`]) {
            whereConditions.push(`${field} >= ?`);
            params.push(query[`${field}_min`]);
          }
          if (query[`${field}_max`]) {
            whereConditions.push(`${field} <= ?`);
            params.push(query[`${field}_max`]);
          }
        } else if (config.type === 'array') {
          const values = Array.isArray(value) ? value : [value];
          const placeholders = values.map(() => '?').join(',');
          whereConditions.push(`${field} IN (${placeholders})`);
          params.push(...values);
        }
      }
    });

    const whereClause = whereConditions.length > 0 ? 
      `AND ${whereConditions.join(' AND ')}` : '';

    return { whereClause, params };
  }
}

// Enhanced Projects Service with Pagination
class ProjectsService {
  constructor(dbManager) {
    this.db = dbManager;
  }

  async getProjects(query = {}) {
    const { page, limit, offset } = PaginationHelper.validatePaginationParams(query);
    const { sortField, sortOrder } = PaginationHelper.validateSortParams(query, [
      'id', 'name', 'type', 'status', 'created_at', 'updated_at', 'budget'
    ]);

    // Build search filter
    const { whereClause: searchWhere, params: searchParams } = 
      PaginationHelper.buildSearchFilter(query, ['name', 'description', 'type']);

    // Build additional filters
    const allowedFilters = {
      status: { type: 'exact' },
      type: { type: 'exact' },
      budget: { type: 'range' },
      created_by: { type: 'exact' }
    };
    const { whereClause: filterWhere, params: filterParams } = 
      PaginationHelper.buildFilterParams(query, allowedFilters);

    // Combine all conditions
    const whereClause = `WHERE 1=1 ${searchWhere} ${filterWhere}`;
    const allParams = [...searchParams, ...filterParams];

    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM projects ${whereClause}`;
      const countResult = await this.db.query(countQuery, allParams);
      const total = countResult[0].total;

      // Get paginated results with related data
      const dataQuery = `
        SELECT 
          p.*,
          COUNT(DISTINCT m.id) as materials_count,
          COUNT(DISTINCT c.id) as compliance_count,
          COUNT(DISTINCT e.id) as ecological_count,
          COALESCE(SUM(m.total_cost), 0) as total_material_cost
        FROM projects p
        LEFT JOIN materials m ON p.id = m.project_id
        LEFT JOIN compliance c ON p.id = c.project_id
        LEFT JOIN ecological e ON p.id = e.project_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      const projects = await this.db.query(dataQuery, [...allParams, limit, offset]);

      return PaginationHelper.buildResponse(projects, total, page, limit);

    } catch (error) {
      console.error('ProjectsService.getProjects error:', error);
      throw error;
    }
  }

  async getProjectById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          COUNT(DISTINCT m.id) as materials_count,
          COUNT(DISTINCT c.id) as compliance_count,
          COUNT(DISTINCT e.id) as ecological_count,
          COALESCE(SUM(m.total_cost), 0) as total_material_cost
        FROM projects p
        LEFT JOIN materials m ON p.id = m.project_id
        LEFT JOIN compliance c ON p.id = c.project_id
        LEFT JOIN ecological e ON p.id = e.project_id
        WHERE p.id = ?
        GROUP BY p.id
      `;

      const projects = await this.db.query(query, [id]);
      return projects[0] || null;

    } catch (error) {
      console.error('ProjectsService.getProjectById error:', error);
      throw error;
    }
  }

  async createProject(projectData, userId) {
    try {
      const result = await this.db.query(`
        INSERT INTO projects (
          name, description, type, status, latitude, longitude,
          budget, start_date, end_date, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        projectData.name,
        projectData.description,
        projectData.type,
        projectData.status || 'planning',
        projectData.latitude,
        projectData.longitude,
        projectData.budget,
        projectData.start_date,
        projectData.end_date,
        userId
      ]);

      return await this.getProjectById(result.lastInsertRowid);

    } catch (error) {
      console.error('ProjectsService.createProject error:', error);
      throw error;
    }
  }

  async updateProject(id, projectData) {
    try {
      const result = await this.db.query(`
        UPDATE projects 
        SET name = COALESCE(?, name),
            description = COALESCE(?, description),
            type = COALESCE(?, type),
            status = COALESCE(?, status),
            latitude = COALESCE(?, latitude),
            longitude = COALESCE(?, longitude),
            budget = COALESCE(?, budget),
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            updated_at = datetime('now')
        WHERE id = ?
      `, [
        projectData.name,
        projectData.description,
        projectData.type,
        projectData.status,
        projectData.latitude,
        projectData.longitude,
        projectData.budget,
        projectData.start_date,
        projectData.end_date,
        id
      ]);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      return await this.getProjectById(id);

    } catch (error) {
      console.error('ProjectsService.updateProject error:', error);
      throw error;
    }
  }

  async deleteProject(id) {
    try {
      const result = await this.db.query('DELETE FROM projects WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      return { success: true, message: 'Project deleted successfully' };

    } catch (error) {
      console.error('ProjectsService.deleteProject error:', error);
      throw error;
    }
  }

  async archiveProject(id) {
    try {
      const result = await this.db.query(`
        UPDATE projects 
        SET status = 'archived', 
            archived_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `, [id]);

      if (result.changes === 0) {
        throw new Error('Project not found');
      }

      return await this.getProjectById(id);

    } catch (error) {
      console.error('ProjectsService.archiveProject error:', error);
      throw error;
    }
  }

  async getProjectStats(filters = {}) {
    try {
      const { whereClause, params } = PaginationHelper.buildFilterParams(filters, {
        status: { type: 'exact' },
        type: { type: 'exact' },
        created_by: { type: 'exact' }
      });

      const baseWhere = `WHERE 1=1 ${whereClause}`;

      const queries = await Promise.all([
        // Total projects by status
        this.db.query(`
          SELECT status, COUNT(*) as count 
          FROM projects ${baseWhere}
          GROUP BY status
        `, params),

        // Total projects by type
        this.db.query(`
          SELECT type, COUNT(*) as count 
          FROM projects ${baseWhere}
          GROUP BY type
        `, params),

        // Total budget and material costs
        this.db.query(`
          SELECT 
            COUNT(*) as total_projects,
            COALESCE(SUM(budget), 0) as total_budget,
            COALESCE(SUM(m.total_cost), 0) as total_material_cost
          FROM projects p
          LEFT JOIN materials m ON p.id = m.project_id
          ${baseWhere}
        `, params)
      ]);

      return {
        byStatus: queries[0],
        byType: queries[1],
        totals: queries[2][0]
      };

    } catch (error) {
      console.error('ProjectsService.getProjectStats error:', error);
      throw error;
    }
  }
}

// Caching Service for API Responses
class CacheService {
  constructor() {
    this.cache = new Map();
    this.maxSize = 1000;
    this.defaultTtl = 300000; // 5 minutes
    this.hitCount = 0;
    this.accessCount = 0;
  }

  generateKey(prefix, params) {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  get(key) {
    this.accessCount++;
    const item = this.cache.get(key);
    if (item && Date.now() < item.expiry) {
      this.hitCount++;
      return item.data;
    }
    if (item) {
      this.cache.delete(key);
    }
    return null;
  }

  set(key, data, ttl = this.defaultTtl) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.hitCount = 0;
    this.accessCount = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.accessCount > 0 ? this.hitCount / this.accessCount : 0,
      hitCount: this.hitCount,
      accessCount: this.accessCount
    };
  }

  middleware(prefix, ttl = this.defaultTtl) {
    return (req, res, next) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = this.generateKey(prefix, {
        url: req.originalUrl,
        query: req.query
      });

      const cached = this.get(key);
      if (cached) {
        return res.json(cached);
      }

      const originalJson = res.json;
      res.json = (data) => {
        if (res.statusCode === 200) {
          this.set(key, data, ttl);
        }
        return originalJson.call(res, data);
      };

      next();
    };
  }
}

// Performance Monitoring Service
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      queries: [],
      endpoints: new Map(),
      slowQueries: []
    };
  }

  trackQuery(query, duration, success = true) {
    const metric = {
      query: query.substring(0, 100), // Truncate long queries
      duration,
      success,
      timestamp: Date.now()
    };

    this.metrics.queries.push(metric);

    // Keep only last 1000 queries
    if (this.metrics.queries.length > 1000) {
      this.metrics.queries.shift();
    }

    // Track slow queries (>100ms)
    if (duration > 100) {
      this.metrics.slowQueries.push(metric);
      if (this.metrics.slowQueries.length > 100) {
        this.metrics.slowQueries.shift();
      }
    }
  }

  trackEndpoint(endpoint, duration, statusCode) {
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        totalRequests: 0,
        totalDuration: 0,
        errors: 0,
        avgDuration: 0
      });
    }

    const stats = this.metrics.endpoints.get(endpoint);
    stats.totalRequests++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.totalRequests;

    if (statusCode >= 400) {
      stats.errors++;
    }
  }

  getMetrics() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentQueries = this.metrics.queries.filter(q => q.timestamp > oneHourAgo);

    return {
      queries: {
        total: recentQueries.length,
        avgDuration: recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length || 0,
        slowQueries: this.metrics.slowQueries.filter(q => q.timestamp > oneHourAgo),
        errorRate: recentQueries.filter(q => !q.success).length / recentQueries.length || 0
      },
      endpoints: Array.from(this.metrics.endpoints.entries()).map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        errorRate: stats.errors / stats.totalRequests
      })),
      timestamp: new Date().toISOString()
    };
  }

  middleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackEndpoint(req.route?.path || req.path, duration, res.statusCode);
      });

      next();
    };
  }
}

module.exports = {
  PaginationHelper,
  ProjectsService,
  CacheService,
  PerformanceMonitor
};