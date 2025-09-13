// services/api-manager.js
import axios from 'axios';

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitForToken() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForToken();
    }
    
    this.requests.push(now);
  }
}

class RetryFetch {
  static async withExponentialBackoff(fetchFn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fetchFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay + jitter, 10000);
        
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

class APIManager {
  constructor() {
    this.cache = new Map();
    this.rateLimiter = new RateLimiter(100, 3600000); // 100 requests/hour
    this.requestQueue = [];
    this.processing = false;
  }

  async fetchWithCache(url, params = {}, options = {}) {
    const {
      ttl = 300000, // 5 minutes default
      skipCache = false,
      timeout = 10000,
      retries = 3
    } = options;

    const cacheKey = `${url}:${JSON.stringify(params)}`;
    
    // Check cache first
    if (!skipCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Fetch with retry logic
    const data = await RetryFetch.withExponentialBackoff(async () => {
      await this.rateLimiter.waitForToken();
      
      const response = await axios.get(url, {
        params,
        timeout,
        headers: {
          'User-Agent': 'ProjectInsights/1.0 (Marine Infrastructure Analysis)'
        }
      });
      
      return response.data;
    }, retries);

    // Cache successful response
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async postWithRetry(url, data, options = {}) {
    const { timeout = 10000, retries = 3 } = options;
    
    return RetryFetch.withExponentialBackoff(async () => {
      await this.rateLimiter.waitForToken();
      
      const response = await axios.post(url, data, {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ProjectInsights/1.0 (Marine Infrastructure Analysis)'
        }
      });
      
      return response.data;
    }, retries);
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  // Batch multiple requests efficiently
  async fetchBatch(requests) {
    const results = await Promise.allSettled(
      requests.map(async ({ url, params, options }) => {
        try {
          const data = await this.fetchWithCache(url, params, options);
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );

    return results.map((result, index) => ({
      ...requests[index],
      ...result.value
    }));
  }
}

// Create singleton instance
const apiManager = new APIManager();

export { apiManager, RetryFetch, RateLimiter };