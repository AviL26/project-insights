// src/hooks/useAlertSystem.js - COMPLETE VERSION

import { useState, useEffect, useCallback, useMemo } from 'react';

export const useAlertSystem = (oceanData, currentProject) => {
  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    enableNotifications: true,
    severityThreshold: 'medium', // 'low', 'medium', 'high'
    autoRefresh: true,
    soundAlerts: false
  });

  // Environmental thresholds for alerts
  const thresholds = useMemo(() => ({
    temperature: {
      high: 28, // Celsius
      low: 10,
      rapidChange: 3 // degrees per hour
    },
    waveHeight: {
      high: 3, // meters
      extreme: 5,
      rapidChange: 1.5 // meters per hour
    },
    phLevel: {
      acidic: 7.8,
      critical: 7.6,
      alkaline: 8.3
    },
    dataQuality: {
      poor: 50,
      concerning: 30
    },
    salinity: {
      high: 40, // PSU
      low: 30,
      rapidChange: 2 // PSU per hour
    },
    currentSpeed: {
      high: 2.0, // m/s
      extreme: 3.0
    }
  }), []);

  // Generate alerts based on ocean data
  const generateAlerts = useCallback((data) => {
    if (!data) return [];

    const newAlerts = [];
    const timestamp = new Date();

    // Temperature alerts
    if (data.temperature?.current > thresholds.temperature.high) {
      newAlerts.push({
        id: `temp_high_${timestamp.getTime()}`,
        type: 'environmental',
        severity: data.temperature.current > 30 ? 'high' : 'medium',
        title: 'High Water Temperature',
        message: `Water temperature is ${data.temperature.current}°C, above normal range`,
        impact: 'May affect marine ecosystem and construction operations',
        metric: 'temperature',
        value: data.temperature.current,
        threshold: thresholds.temperature.high,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Monitor marine life activity',
          'Consider adjusting construction schedules',
          'Increase environmental monitoring frequency'
        ]
      });
    }

    if (data.temperature?.current < thresholds.temperature.low) {
      newAlerts.push({
        id: `temp_low_${timestamp.getTime()}`,
        type: 'environmental',
        severity: 'medium',
        title: 'Low Water Temperature',
        message: `Water temperature is ${data.temperature.current}°C, below normal range`,
        impact: 'May indicate unusual weather patterns',
        metric: 'temperature',
        value: data.temperature.current,
        threshold: thresholds.temperature.low,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Check weather forecasts',
          'Monitor for storm systems',
          'Verify temperature sensor accuracy'
        ]
      });
    }

    // Wave height alerts
    if (data.waveHeight?.current > thresholds.waveHeight.high) {
      const severity = data.waveHeight.current > thresholds.waveHeight.extreme ? 'high' : 'medium';
      newAlerts.push({
        id: `wave_high_${timestamp.getTime()}`,
        type: 'operational',
        severity: severity,
        title: 'High Wave Conditions',
        message: `Wave height is ${data.waveHeight.current}m, above safe operating conditions`,
        impact: 'Construction and marine operations should be suspended',
        metric: 'waveHeight',
        value: data.waveHeight.current,
        threshold: thresholds.waveHeight.high,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Suspend marine operations',
          'Secure equipment and vessels',
          'Monitor weather conditions',
          'Plan for extended downtime'
        ]
      });
    }

    // pH Level alerts
    if (data.phLevel?.current < thresholds.phLevel.acidic) {
      const severity = data.phLevel.current < thresholds.phLevel.critical ? 'high' : 'medium';
      newAlerts.push({
        id: `ph_low_${timestamp.getTime()}`,
        type: 'environmental',
        severity: severity,
        title: 'Ocean Acidification Detected',
        message: `pH level is ${data.phLevel.current}, indicating acidic conditions`,
        impact: 'May harm marine ecosystems and corrode infrastructure',
        metric: 'phLevel',
        value: data.phLevel.current,
        threshold: thresholds.phLevel.acidic,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Increase corrosion protection measures',
          'Monitor marine life impact',
          'Consider environmental mitigation',
          'Report to environmental authorities'
        ]
      });
    }

    if (data.phLevel?.current > thresholds.phLevel.alkaline) {
      newAlerts.push({
        id: `ph_high_${timestamp.getTime()}`,
        type: 'environmental',
        severity: 'medium',
        title: 'High pH Levels',
        message: `pH level is ${data.phLevel.current}, above normal alkaline range`,
        impact: 'May indicate unusual environmental conditions',
        metric: 'phLevel',
        value: data.phLevel.current,
        threshold: thresholds.phLevel.alkaline,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Verify pH sensor calibration',
          'Check for industrial discharge upstream',
          'Monitor environmental conditions',
          'Consider water quality assessment'
        ]
      });
    }

    // Salinity alerts
    if (data.salinity?.current > thresholds.salinity.high) {
      newAlerts.push({
        id: `salinity_high_${timestamp.getTime()}`,
        type: 'environmental',
        severity: 'medium',
        title: 'High Salinity Levels',
        message: `Salinity is ${data.salinity.current} PSU, above normal range`,
        impact: 'May affect marine ecosystem and material selection',
        metric: 'salinity',
        value: data.salinity.current,
        threshold: thresholds.salinity.high,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Review material corrosion resistance',
          'Monitor marine species adaptation',
          'Check for evaporation patterns',
          'Verify measurement accuracy'
        ]
      });
    }

    if (data.salinity?.current < thresholds.salinity.low) {
      newAlerts.push({
        id: `salinity_low_${timestamp.getTime()}`,
        type: 'environmental',
        severity: 'medium',
        title: 'Low Salinity Levels',
        message: `Salinity is ${data.salinity.current} PSU, below normal range`,
        impact: 'May indicate freshwater influx or unusual conditions',
        metric: 'salinity',
        value: data.salinity.current,
        threshold: thresholds.salinity.low,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Check for freshwater sources',
          'Monitor precipitation patterns',
          'Assess ecosystem impact',
          'Verify sensor functionality'
        ]
      });
    }

    // Current speed alerts
    if (data.currentSpeed?.current > thresholds.currentSpeed.high) {
      const severity = data.currentSpeed.current > thresholds.currentSpeed.extreme ? 'high' : 'medium';
      newAlerts.push({
        id: `current_high_${timestamp.getTime()}`,
        type: 'operational',
        severity: severity,
        title: 'High Current Speed',
        message: `Current speed is ${data.currentSpeed.current} m/s, above safe operating conditions`,
        impact: 'May affect construction operations and vessel safety',
        metric: 'currentSpeed',
        value: data.currentSpeed.current,
        threshold: thresholds.currentSpeed.high,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Adjust construction methods',
          'Increase safety margins',
          'Monitor vessel operations',
          'Consider operational delays'
        ]
      });
    }

    // Data quality alerts
    if (data.dataQuality < thresholds.dataQuality.poor) {
      newAlerts.push({
        id: `data_quality_${timestamp.getTime()}`,
        type: 'system',
        severity: data.dataQuality < thresholds.dataQuality.concerning ? 'high' : 'medium',
        title: 'Poor Data Quality',
        message: `Data quality is ${data.dataQuality}%, reliability may be compromised`,
        impact: 'Decision-making may be affected by unreliable data',
        metric: 'dataQuality',
        value: data.dataQuality,
        threshold: thresholds.dataQuality.poor,
        timestamp: timestamp,
        location: data.location,
        suggestions: [
          'Check API connections',
          'Verify sensor functionality',
          'Use backup data sources',
          'Contact technical support'
        ]
      });
    }

    // Project-specific alerts
    if (currentProject) {
      // Check if environmental conditions are suitable for project type
      if (currentProject.structure_type === 'artificial-reef' && data.temperature?.current < 18) {
        newAlerts.push({
          id: `project_temp_${timestamp.getTime()}`,
          type: 'project',
          severity: 'medium',
          title: 'Suboptimal Temperature for Artificial Reef',
          message: `Temperature ${data.temperature.current}°C may be too low for optimal reef development`,
          impact: 'Marine life colonization may be slower than expected',
          metric: 'temperature',
          value: data.temperature.current,
          threshold: 18,
          timestamp: timestamp,
          location: data.location,
          suggestions: [
            'Monitor seasonal temperature trends',
            'Consider alternative reef materials',
            'Adjust timeline expectations',
            'Consult marine biologists'
          ]
        });
      }

      // Check wave conditions for construction
      if (['seawall', 'breakwater'].includes(currentProject.structure_type) && 
          data.waveHeight?.current > 2) {
        newAlerts.push({
          id: `construction_waves_${timestamp.getTime()}`,
          type: 'project',
          severity: 'high',
          title: 'Construction Conditions Unsafe',
          message: `Wave height ${data.waveHeight.current}m exceeds safe construction limits`,
          impact: 'Construction work should be suspended immediately',
          metric: 'waveHeight',
          value: data.waveHeight.current,
          threshold: 2,
          timestamp: timestamp,
          location: data.location,
          suggestions: [
            'Halt construction operations',
            'Secure equipment and materials',
            'Monitor weather forecasts',
            'Plan resumption schedule'
          ]
        });
      }
    }

    return newAlerts;
  }, [thresholds, currentProject]);

  // Process alerts when ocean data changes
  useEffect(() => {
    if (oceanData) {
      const newAlerts = generateAlerts(oceanData);
      
      // Filter by user preferences
      const filteredAlerts = newAlerts.filter(alert => {
        const severityLevels = { low: 0, medium: 1, high: 2 };
        const userThreshold = severityLevels[userPreferences.severityThreshold];
        const alertLevel = severityLevels[alert.severity];
        return alertLevel >= userThreshold;
      });

      setAlerts(filteredAlerts);
      
      // Add to history
      if (filteredAlerts.length > 0) {
        setAlertHistory(prev => [...filteredAlerts, ...prev].slice(0, 100)); // Keep last 100 alerts
      }

      // Browser notifications if enabled
      if (userPreferences.enableNotifications && filteredAlerts.length > 0) {
        showBrowserNotifications(filteredAlerts);
      }

      // Sound alerts if enabled
      if (userPreferences.soundAlerts && filteredAlerts.some(alert => alert.severity === 'high')) {
        playAlertSound();
      }
    }
  }, [oceanData, generateAlerts, userPreferences]);

  // Show browser notifications
  const showBrowserNotifications = useCallback((alertsToShow) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        alertsToShow.forEach(alert => {
          if (alert.severity === 'high') {
            new Notification(`Ocean Alert: ${alert.title}`, {
              body: alert.message,
              icon: '/favicon.ico',
              tag: alert.id
            });
          }
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Play alert sound
  const playAlertSound = useCallback(() => {
    if (userPreferences.soundAlerts) {
      try {
        const audio = new Audio('/sounds/alert.mp3'); // You'll need to add this sound file
        audio.volume = 0.5;
        audio.play().catch(error => {
          console.warn('Could not play alert sound:', error);
        });
      } catch (error) {
        console.warn('Alert sound not available:', error);
      }
    }
  }, [userPreferences.soundAlerts]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Update user preferences
  const updatePreferences = useCallback((newPreferences) => {
    setUserPreferences(prev => ({ ...prev, ...newPreferences }));
    localStorage.setItem('oceanAlertPreferences', JSON.stringify({ ...userPreferences, ...newPreferences }));
  }, [userPreferences]);

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('oceanAlertPreferences');
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        setUserPreferences(prev => ({ ...prev, ...preferences }));
      } catch (error) {
        console.warn('Failed to load alert preferences:', error);
      }
    }
  }, []);

  // Request notification permissions
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Alert statistics
  const alertStats = useMemo(() => {
    const total = alerts.length;
    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {});
    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      byType,
      bySeverity,
      hasHighPriority: alerts.some(alert => alert.severity === 'high'),
      hasMediumPriority: alerts.some(alert => alert.severity === 'medium'),
      hasOperationalAlerts: alerts.some(alert => alert.type === 'operational'),
      hasEnvironmentalAlerts: alerts.some(alert => alert.type === 'environmental'),
      hasSystemAlerts: alerts.some(alert => alert.type === 'system'),
      hasProjectAlerts: alerts.some(alert => alert.type === 'project')
    };
  }, [alerts]);

  // Get alerts by type or severity
  const getAlertsByType = useCallback((type) => {
    return alerts.filter(alert => alert.type === type);
  }, [alerts]);

  const getAlertsBySeverity = useCallback((severity) => {
    return alerts.filter(alert => alert.severity === severity);
  }, [alerts]);

  // Check if specific conditions are alerting
  const isAlerting = useCallback((metric, severity = null) => {
    return alerts.some(alert => 
      alert.metric === metric && 
      (severity ? alert.severity === severity : true)
    );
  }, [alerts]);

  // Export alert data
  const exportAlerts = useCallback((format = 'json') => {
    const exportData = {
      alerts: alerts,
      history: alertHistory.slice(0, 50), // Last 50 historical alerts
      preferences: userPreferences,
      exportedAt: new Date().toISOString(),
      project: currentProject?.name || 'No project selected'
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else if (format === 'csv') {
      const csvHeaders = 'Timestamp,Type,Severity,Title,Message,Metric,Value,Threshold\n';
      const csvData = alerts.map(alert => 
        `${alert.timestamp.toISOString()},${alert.type},${alert.severity},${alert.title},"${alert.message}",${alert.metric},${alert.value},${alert.threshold}`
      ).join('\n');
      return csvHeaders + csvData;
    }
    
    return exportData;
  }, [alerts, alertHistory, userPreferences, currentProject]);

  return {
    // State
    alerts,
    alertHistory,
    userPreferences,
    alertStats,
    
    // Actions
    dismissAlert,
    clearAllAlerts,
    updatePreferences,
    requestNotificationPermission,
    
    // Queries
    getAlertsByType,
    getAlertsBySeverity,
    isAlerting,
    
    // Utilities
    exportAlerts,
    playAlertSound
  };
};