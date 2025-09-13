// src/hooks/useAlertSystem.js

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

    return newAlerts;
  }, [thresholds]);

  // Process alerts when ocean data changes
  useEffect(() => {
    if (oceanData) {
      const newAlerts = generateAlerts(oceanData);
      
      // Filter by user preferences
      const filteredAlerts = newAlerts.filter(alert => {
        const severityLevels