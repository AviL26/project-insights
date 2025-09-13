// utils/styles.js

/**
 * Dynamic Tailwind class utilities that work with JIT compilation
 * Avoids template literal issues by using predefined class mappings
 */

// Status-based color schemes
const statusColors = {
  excellent: {
    text: 'text-green-800',
    bg: 'bg-green-100', 
    border: 'border-green-200',
    ring: 'ring-green-500',
    gradient: 'from-green-50 to-green-100'
  },
  good: {
    text: 'text-blue-800',
    bg: 'bg-blue-100',
    border: 'border-blue-200', 
    ring: 'ring-blue-500',
    gradient: 'from-blue-50 to-blue-100'
  },
  fair: {
    text: 'text-yellow-800',
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
    ring: 'ring-yellow-500', 
    gradient: 'from-yellow-50 to-yellow-100'
  },
  poor: {
    text: 'text-red-800',
    bg: 'bg-red-100',
    border: 'border-red-200',
    ring: 'ring-red-500',
    gradient: 'from-red-50 to-red-100'
  },
  unknown: {
    text: 'text-gray-800',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    ring: 'ring-gray-500',
    gradient: 'from-gray-50 to-gray-100'
  }
};

// Conservation status color schemes
const conservationColors = {
  'critically endangered': {
    text: 'text-red-900',
    bg: 'bg-red-200',
    border: 'border-red-400'
  },
  'endangered': {
    text: 'text-red-800', 
    bg: 'bg-red-100',
    border: 'border-red-300'
  },
  'vulnerable': {
    text: 'text-orange-800',
    bg: 'bg-orange-100', 
    border: 'border-orange-300'
  },
  'near threatened': {
    text: 'text-yellow-800',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300'
  },
  'least concern': {
    text: 'text-green-800',
    bg: 'bg-green-100',
    border: 'border-green-300'
  },
  'data deficient': {
    text: 'text-gray-800',
    bg: 'bg-gray-100', 
    border: 'border-gray-300'
  },
  'unknown': {
    text: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  }
};

// Metric card color schemes
const metricCardColors = {
  green: {
    gradient: 'from-green-50 to-green-100',
    border: 'border-green-200',
    iconBg: 'bg-green-200',
    iconText: 'text-green-600', 
    titleText: 'text-green-900',
    subtitleText: 'text-green-800',
    captionText: 'text-green-600'
  },
  blue: {
    gradient: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
    iconBg: 'bg-blue-200',
    iconText: 'text-blue-600',
    titleText: 'text-blue-900', 
    subtitleText: 'text-blue-800',
    captionText: 'text-blue-600'
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    iconBg: 'bg-purple-200',
    iconText: 'text-purple-600',
    titleText: 'text-purple-900',
    subtitleText: 'text-purple-800', 
    captionText: 'text-purple-600'
  },
  cyan: {
    gradient: 'from-cyan-50 to-cyan-100',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-200',
    iconText: 'text-cyan-600',
    titleText: 'text-cyan-900',
    subtitleText: 'text-cyan-800',
    captionText: 'text-cyan-600'
  },
  orange: {
    gradient: 'from-orange-50 to-orange-100', 
    border: 'border-orange-200',
    iconBg: 'bg-orange-200',
    iconText: 'text-orange-600',
    titleText: 'text-orange-900',
    subtitleText: 'text-orange-800',
    captionText: 'text-orange-600'
  },
  red: {
    gradient: 'from-red-50 to-red-100',
    border: 'border-red-200', 
    iconBg: 'bg-red-200',
    iconText: 'text-red-600',
    titleText: 'text-red-900',
    subtitleText: 'text-red-800',
    captionText: 'text-red-600'
  }
};

// Trend indicator colors
const trendColors = {
  up: {
    icon: 'text-red-500',
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Rising'
  },
  down: {
    icon: 'text-red-500', 
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Declining'
  },
  stable: {
    icon: 'text-blue-500',
    bg: 'bg-blue-100', 
    text: 'text-blue-700',
    label: 'Stable'
  }
};

// Utility functions
export const getStatusColors = (status, element = 'text') => {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  return statusColors[normalizedStatus]?.[element] || statusColors.unknown[element];
};

export const getConservationStatusColors = (status, element = 'text') => {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  return conservationColors[normalizedStatus]?.[element] || conservationColors.unknown[element];
};

export const getMetricCardClasses = (color = 'green') => {
  return metricCardColors[color] || metricCardColors.green;
};

export const getTrendClasses = (trend) => {
  const normalizedTrend = trend?.toLowerCase() || 'stable';
  return trendColors[normalizedTrend] || trendColors.stable;
};

export const getPriorityClasses = (priority) => {
  const priorityMap = {
    high: 'border-l-red-500 bg-red-50',
    medium: 'border-l-yellow-500 bg-yellow-50', 
    low: 'border-l-green-500 bg-green-50',
    default: 'border-l-gray-500 bg-gray-50'
  };
  
  return priorityMap[priority?.toLowerCase()] || priorityMap.default;
};

export const getAvailabilityClasses = (availability) => {
  const availabilityMap = {
    'in-stock': 'text-green-700 bg-green-100',
    'limited': 'text-yellow-700 bg-yellow-100',
    'scheduled': 'text-blue-700 bg-blue-100', 
    'backordered': 'text-red-700 bg-red-100',
    'out-of-stock': 'text-gray-700 bg-gray-100'
  };
  
  return availabilityMap[availability?.toLowerCase()] || availabilityMap['in-stock'];
};

// Progress bar utilities
export const getProgressBarClasses = (percentage, color = 'blue') => {
  const colorMap = {
    blue: 'bg-blue-600',
    green: 'bg-green-600', 
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  };
  
  return colorMap[color] || colorMap.blue;
};

// Combine multiple utility classes safely
export const combineClasses = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Generate a complete component class string
export const buildComponentClasses = (baseClasses, conditionalClasses = {}) => {
  const classes = [baseClasses];
  
  Object.entries(conditionalClasses).forEach(([condition, className]) => {
    if (condition && className) {
      classes.push(className);
    }
  });
  
  return combineClasses(...classes);
};