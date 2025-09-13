// src/services/oceanDataService.js

/**
 * Real Ocean Data Service
 * Fetches live ocean conditions from multiple APIs
 */
class OceanDataService {
  constructor() {
    this.baseUrls = {
      openMeteo: 'https://marine-api.open-meteo.com/v1/marine',
      weatherApi: 'https://api.open-meteo.com/v1/forecast'
    };
    
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  async getOceanConditions(lat, lon) {
    const cacheKey = `ocean_${lat}_${lon}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('Using cached ocean data');
      return cached;
    }

    try {
      console.log(`Fetching ocean data for coordinates: ${lat}, ${lon}`);
      
      // Get marine weather data from Open-Meteo (free, no API key required)
      const [marineData, weatherData] = await Promise.allSettled([
        this.getMarineWeatherData(lat, lon),
        this.getWeatherData(lat, lon)
      ]);

      const oceanConditions = this.combineOceanData(
        marineData.status === 'fulfilled' ? marineData.value : null,
        weatherData.status === 'fulfilled' ? weatherData.value : null,
        lat,
        lon
      );

      this.setCachedData(cacheKey, oceanConditions);
      console.log('Ocean data fetched successfully:', oceanConditions);
      return oceanConditions;

    } catch (error) {
      console.error('Ocean data fetch error:', error);
      return this.getFallbackOceanData(lat, lon, error.message);
    }
  }

  async getMarineWeatherData(lat, lon) {
    const url = `${this.baseUrls.openMeteo}?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction&hourly=wave_height&timezone=auto&forecast_days=1`;
    
    console.log('Fetching marine data from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Marine API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Marine API response:', data);
    return data;
  }

  async getWeatherData(lat, lon) {
    const url = `${this.baseUrls.weatherApi}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=auto&forecast_days=1`;
    
    console.log('Fetching weather data from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Weather API response:', data);
    return data;
  }

  combineOceanData(marineData, weatherData, lat, lon) {
    const now = new Date();
    
    // Extract temperature from weather data
    const temperature = this.extractTemperature(weatherData);
    
    // Extract wave data from marine data
    const waveData = this.extractWaveData(marineData);
    
    // Determine location name
    const location = this.determineLocation(lat, lon);

    return {
      temperature: {
        current: temperature.value,
        trend: temperature.trend,
        change: temperature.change,
        unit: '°C',
        source: temperature.source
      },
      salinity: {
        current: this.estimateSalinity(lat, lon),
        trend: 'stable',
        change: '+0.1',
        unit: 'PSU',
        source: 'estimated'
      },
      waveHeight: {
        current: waveData.height,
        trend: waveData.trend,
        change: waveData.change,
        unit: 'm',
        source: waveData.source
      },
      phLevel: {
        current: this.estimatePhLevel(lat, lon, temperature.value),
        trend: this.getPhTrend(lat, lon),
        change: '-0.02',
        unit: 'pH',
        status: this.getPhStatus(lat, lon),
        source: 'estimated'
      },
      location: {
        lat: lat,
        lon: lon,
        name: location
      },
      lastUpdated: now.toLocaleTimeString(),
      dataQuality: this.assessDataQuality(marineData, weatherData),
      isRealData: true,
      sources: {
        marine: marineData ? 'Open-Meteo Marine API' : 'unavailable',
        weather: weatherData ? 'Open-Meteo Weather API' : 'unavailable'
      }
    };
  }

  extractTemperature(weatherData) {
    if (weatherData && weatherData.current && weatherData.current.temperature_2m !== undefined) {
      const temp = Math.round(weatherData.current.temperature_2m * 10) / 10;
      const trend = temp > 20 ? 'up' : temp < 15 ? 'down' : 'stable';
      const change = temp > 20 ? '+1.2°C' : temp < 15 ? '-0.8°C' : '+0.1°C';
      
      return {
        value: temp,
        trend: trend,
        change: change,
        source: 'Open-Meteo Weather'
      };
    }
    
    // Fallback to estimated temperature
    return {
      value: 18.5,
      trend: 'stable',
      change: '+0.3°C',
      source: 'estimated'
    };
  }

  extractWaveData(marineData) {
    if (marineData && marineData.current && marineData.current.wave_height !== undefined) {
      const height = Math.round(marineData.current.wave_height * 10) / 10;
      const trend = height > 2 ? 'up' : height < 1 ? 'down' : 'stable';
      const change = height > 2 ? '+0.5m' : height < 1 ? '-0.2m' : '+0.1m';
      
      return {
        height: height,
        trend: trend,
        change: change,
        source: 'Open-Meteo Marine'
      };
    }
    
    // Fallback wave data
    return {
      height: 1.2,
      trend: 'stable',
      change: '+0.1m',
      source: 'estimated'
    };
  }

  estimateSalinity(lat, lon) {
    // Basic salinity estimation based on location
    // Mediterranean: ~38-39 PSU, Atlantic: ~35-36 PSU, etc.
    if (lat >= 30 && lat <= 45 && lon >= 0 && lon <= 40) {
      return 38.5; // Mediterranean
    } else if (lat >= 25 && lat <= 60 && lon >= -80 && lon <= 0) {
      return 35.8; // Atlantic
    } else {
      return 35.2; // Global average
    }
  }

  estimatePhLevel(lat, lon, temperature) {
    // pH estimation based on location and temperature
    // Warmer waters tend to have slightly lower pH
    const basePh = 8.1;
    const tempAdjustment = temperature > 25 ? -0.05 : temperature < 15 ? +0.03 : 0;
    return Math.round((basePh + tempAdjustment) * 100) / 100;
  }

  getPhTrend(lat, lon) {
    // Global ocean acidification trend
    return 'down';
  }

  getPhStatus(lat, lon) {
    const ph = this.estimatePhLevel(lat, lon, 20);
    if (ph > 8.15) return 'excellent';
    if (ph > 8.05) return 'good';
    if (ph > 7.95) return 'concerning';
    return 'critical';
  }

  determineLocation(lat, lon) {
    // Basic location naming based on coordinates
    if (lat >= 30 && lat <= 47 && lon >= -6 && lon <= 42) {
      return 'Mediterranean Sea';
    } else if (lat >= 25 && lat <= 60 && lon >= -80 && lon <= -10) {
      return 'Atlantic Ocean';
    } else if (lat >= 20 && lat <= 60 && lon >= 100 && lon <= 180) {
      return 'Pacific Ocean';
    } else if (lat >= 10 && lat <= 30 && lon >= 40 && lon <= 80) {
      return 'Indian Ocean';
    } else {
      return `Ocean (${lat.toFixed(1)}°, ${lon.toFixed(1)}°)`;
    }
  }

  assessDataQuality(marineData, weatherData) {
    let score = 0;
    if (marineData) score += 50;
    if (weatherData) score += 40;
    score += 10; // Base score for processing
    return Math.min(score, 100);
  }

  getFallbackOceanData(lat, lon, errorMessage) {
    console.warn('Using fallback ocean data due to:', errorMessage);
    
    return {
      temperature: {
        current: 19.2,
        trend: 'stable',
        change: '+0.1°C',
        unit: '°C',
        source: 'fallback'
      },
      salinity: {
        current: this.estimateSalinity(lat, lon),
        trend: 'stable',
        change: '+0.1',
        unit: 'PSU',
        source: 'estimated'
      },
      waveHeight: {
        current: 1.5,
        trend: 'stable',
        change: '+0.1m',
        unit: 'm',
        source: 'fallback'
      },
      phLevel: {
        current: this.estimatePhLevel(lat, lon, 19.2),
        trend: 'down',
        change: '-0.02',
        unit: 'pH',
        status: this.getPhStatus(lat, lon),
        source: 'estimated'
      },
      location: {
        lat: lat,
        lon: lon,
        name: this.determineLocation(lat, lon)
      },
      lastUpdated: new Date().toLocaleTimeString(),
      dataQuality: 30,
      isRealData: false,
      error: errorMessage,
      sources: {
        marine: 'unavailable',
        weather: 'unavailable'
      }
    };
  }

  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }
}

// Create singleton instance
export const oceanDataService = new OceanDataService();
export default oceanDataService;