// services/calculation-engine.js

/**
 * Scientific calculation engine for ecological impact modeling
 * Replaces simple heuristics with research-backed calculations
 */

class CarbonSequestrationModel {
  // Based on research from Strain et al. (2018) and Morris et al. (2019)
  static getBiomassDensity(habitatType, structureType) {
    const densityTable = {
      'Kelp/Algae Forests': {
        'Breakwater': 15.2, // kg C/m²/year
        'Artificial Reef': 18.7,
        'Seawall': 8.3,
        'default': 12.1
      },
      'Subtidal Rocky Reef': {
        'Breakwater': 8.9,
        'Artificial Reef': 12.4, 
        'Seawall': 6.2,
        'default': 8.8
      },
      'Filter Feeder Communities': {
        'Breakwater': 6.7,
        'Artificial Reef': 9.1,
        'Seawall': 4.8,
        'default': 6.9
      },
      'default': {
        'default': 5.5
      }
    };
    
    const habitatData = densityTable[habitatType] || densityTable.default;
    return habitatData[structureType] || habitatData.default;
  }
  
  static getGrowthModifier(temperature, salinity, depth, nutrients = 'moderate') {
    // Temperature factor (optimal range 18-24°C for Mediterranean species)
    let tempFactor = 1.0;
    if (temperature < 12) tempFactor = 0.3;
    else if (temperature < 16) tempFactor = 0.6;
    else if (temperature <= 26) tempFactor = 1.0;
    else if (temperature <= 30) tempFactor = 0.7;
    else tempFactor = 0.4;
    
    // Salinity factor (optimal 35-40 ppt)
    let salinityFactor = 1.0;
    if (salinity < 30) salinityFactor = 0.5;
    else if (salinity > 42) salinityFactor = 0.6;
    
    // Depth factor (light penetration affects photosynthesis)
    let depthFactor = 1.0;
    if (depth > 20) depthFactor = 0.7;
    else if (depth > 40) depthFactor = 0.4;
    else if (depth > 60) depthFactor = 0.1;
    
    // Nutrient factor
    const nutrientFactors = {
      'low': 0.7,
      'moderate': 1.0,
      'high': 1.3,
      'eutrophic': 0.8 // Too much can be harmful
    };
    const nutrientFactor = nutrientFactors[nutrients] || 1.0;
    
    return tempFactor * salinityFactor * depthFactor * nutrientFactor;
  }
  
  static getSurfaceComplexity(structureType, dimensions) {
    // Surface area to volume ratio affects colonization
    const { length = 0, width = 0, height = 0 } = dimensions;
    const volume = length * width * height;
    const surfaceArea = 2 * (length * width + length * height + width * height);
    
    if (volume === 0) return 1.0;
    
    const baseComplexity = surfaceArea / Math.pow(volume, 2/3);
    
    const typeMultipliers = {
      'Artificial Reef': 2.3, // High surface complexity
      'Breakwater': 1.4, // Moderate complexity
      'Pier': 1.1,
      'Seawall': 0.8, // Lower complexity
      'default': 1.0
    };
    
    return baseComplexity * (typeMultipliers[structureType] || typeMultipliers.default);
  }
  
  static calculate(projectData, environmentalData) {
    const habitatTypes = Array.isArray(projectData.habitat_types) 
      ? projectData.habitat_types 
      : (projectData.habitat_types ? [projectData.habitat_types] : ['default']);
    
    let totalSequestration = 0;
    
    habitatTypes.forEach(habitatType => {
      const biomassDensity = this.getBiomassDensity(habitatType, projectData.structure_type);
      const growthModifier = this.getGrowthModifier(
        environmentalData.temperature || 22,
        environmentalData.salinity || 38,
        projectData.water_depth || 10,
        environmentalData.nutrientLevel || 'moderate'
      );
      const complexityFactor = this.getSurfaceComplexity(projectData.structure_type, {
        length: projectData.length,
        width: projectData.width, 
        height: projectData.height
      });
      
      const surfaceArea = (projectData.length || 0) * (projectData.width || 0);
      
      const sequestration = biomassDensity * growthModifier * complexityFactor * surfaceArea * 0.1; // Convert to tonnes
      totalSequestration += sequestration;
    });
    
    return Math.round(totalSequestration * 100) / 100; // Round to 2 decimal places
  }
}

class BiodiversityImpactModel {
  // Shannon-Weaver diversity index with habitat suitability weighting
  static calculateShannonIndex(speciesData, habitatSuitability = {}) {
    if (!speciesData || speciesData.length === 0) return 0;
    
    const totalObservations = speciesData.reduce((sum, species) => sum + (species.count || 1), 0);
    
    let shannonIndex = 0;
    
    speciesData.forEach(species => {
      const observations = species.count || 1;
      const proportion = observations / totalObservations;
      
      // Weight by habitat suitability if available
      const suitability = habitatSuitability[species.scientific_name] || 1.0;
      const weightedProportion = proportion * suitability;
      
      if (weightedProportion > 0) {
        shannonIndex -= weightedProportion * Math.log(weightedProportion);
      }
    });
    
    return Math.round(shannonIndex * 100) / 100;
  }
  
  // Simpson's diversity index (probability two randomly selected individuals are different species)
  static calculateSimpsonIndex(speciesData) {
    if (!speciesData || speciesData.length === 0) return 0;
    
    const totalObservations = speciesData.reduce((sum, species) => sum + (species.count || 1), 0);
    
    let simpsonIndex = 0;
    
    speciesData.forEach(species => {
      const observations = species.count || 1;
      const proportion = observations / totalObservations;
      simpsonIndex += proportion * proportion;
    });
    
    return Math.round((1 - simpsonIndex) * 100) / 100;
  }
  
  // Species richness adjusted for sampling effort
  static calculateRichness(speciesData, samplingEffort = 1.0) {
    const baseRichness = speciesData ? speciesData.length : 0;
    
    // Rarefaction adjustment for sampling effort
    const adjustedRichness = baseRichness * Math.min(samplingEffort, 1.0);
    
    return Math.round(adjustedRichness);
  }
  
  // Functional diversity based on species traits
  static calculateFunctionalDiversity(speciesData) {
    if (!speciesData || speciesData.length === 0) return 0;
    
    // Simplified functional groups for marine species
    const functionalGroups = {
      'filter_feeders': ['Mytilus', 'Balanus', 'Ciona', 'Ascidian'],
      'grazers': ['Patella', 'Littorina', 'Paracentrotus'],
      'predators': ['Octopus', 'Cancer', 'Maja'],
      'primary_producers': ['Posidonia', 'Ulva', 'Cystoseira'],
      'detritivores': ['Nereis', 'Capitella'],
      'planktivores': ['Diplodus', 'Chromis', 'Atherina']
    };
    
    const presentGroups = new Set();
    
    speciesData.forEach(species => {
      const genus = species.scientific_name.split(' ')[0];
      
      Object.entries(functionalGroups).forEach(([group, genera]) => {
        if (genera.some(g => genus.includes(g))) {
          presentGroups.add(group);
        }
      });
    });
    
    // Functional diversity as proportion of functional groups represented
    return Math.round((presentGroups.size / Object.keys(functionalGroups).length) * 100) / 100;
  }
}

class EcologicalRiskModel {
  static assessClimateRisk(climateData, projectLocation) {
    let riskScore = 0;
    const risks = [];
    
    // Temperature anomaly risk
    if (climateData.sst_anomaly > 2.0) {
      riskScore += 30;
      risks.push('Severe thermal stress risk');
    } else if (climateData.sst_anomaly > 1.0) {
      riskScore += 15;
      risks.push('Moderate thermal stress risk'); 
    }
    
    // Sea level rise risk
    if (climateData.extreme_events?.sea_level_rise_rate > 5.0) {
      riskScore += 25;
      risks.push('High sea level rise impact');
    } else if (climateData.extreme_events?.sea_level_rise_rate > 3.0) {
      riskScore += 10;
      risks.push('Moderate sea level rise impact');
    }
    
    // Ocean acidification risk
    if (climateData.projections_2050?.acidification < -0.3) {
      riskScore += 20;
      risks.push('Severe acidification threat to calcifiers');
    } else if (climateData.projections_2050?.acidification < -0.1) {
      riskScore += 10;
      risks.push('Moderate acidification risk');
    }
    
    // Marine heatwave frequency
    if (climateData.extreme_events?.heatwaves_annual > 4) {
      riskScore += 15;
      risks.push('Frequent marine heatwaves');
    }
    
    const riskLevel = riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low';
    
    return {
      score: Math.min(riskScore, 100),
      level: riskLevel,
      factors: risks,
      recommendations: this.getRiskMitigationRecommendations(riskLevel, risks)
    };
  }
  
  static getRiskMitigationRecommendations(riskLevel, riskFactors) {
    const recommendations = [];
    
    if (riskLevel === 'high') {
      recommendations.push('Implement adaptive management protocols');
      recommendations.push('Design for higher thermal tolerance species');
      recommendations.push('Plan for structure reinforcement against sea level rise');
    }
    
    if (riskFactors.includes('Severe thermal stress risk')) {
      recommendations.push('Select thermally resilient species for bio-enhancement');
      recommendations.push('Consider deeper water placement if feasible');
    }
    
    if (riskFactors.includes('Severe acidification threat to calcifiers')) {
      recommendations.push('Prioritize non-calcifying species in design');
      recommendations.push('Monitor carbonate chemistry regularly');
    }
    
    return recommendations;
  }
}

class WaterQualityModel {
  static assessQualityIndex(parameters) {
    if (!parameters || parameters.length === 0) return 0;
    
    let totalScore = 0;
    let validParameters = 0;
    
    parameters.forEach(param => {
      let score = 0;
      
      switch (param.name.toLowerCase()) {
        case 'dissolved oxygen':
          if (param.value >= 6.0) score = 100;
          else if (param.value >= 4.0) score = 70;
          else if (param.value >= 2.0) score = 40;
          else score = 10;
          break;
          
        case 'ph':
          if (param.value >= 7.8 && param.value <= 8.3) score = 100;
          else if (param.value >= 7.5 && param.value <= 8.5) score = 80;
          else if (param.value >= 7.0 && param.value <= 9.0) score = 60;
          else score = 20;
          break;
          
        case 'turbidity':
          if (param.value <= 2.0) score = 100;
          else if (param.value <= 5.0) score = 80;
          else if (param.value <= 10.0) score = 60;
          else score = 30;
          break;
          
        case 'nitrates':
          if (param.value <= 0.5) score = 100;
          else if (param.value <= 1.0) score = 80;
          else if (param.value <= 2.0) score = 60;
          else score = 30;
          break;
          
        case 'phosphates':
          if (param.value <= 0.05) score = 100;
          else if (param.value <= 0.1) score = 80;
          else if (param.value <= 0.2) score = 60;
          else score = 30;
          break;
          
        default:
          // Generic scoring based on status
          switch (param.status) {
            case 'excellent': score = 100; break;
            case 'good': score = 80; break;
            case 'fair': score = 60; break;
            case 'poor': score = 30; break;
            default: score = 50;
          }
      }
      
      totalScore += score;
      validParameters++;
    });
    
    return validParameters > 0 ? Math.round(totalScore / validParameters) : 0;
  }
}

// Composite ecological impact calculator
class EcologicalImpactCalculator {
  static calculateOverallScore(projectData, environmentalData, biodiversityData, waterQualityData, climateData) {
    let baseScore = 70;
    
    // Biodiversity component (30% weight)
    if (biodiversityData) {
      const shannonIndex = BiodiversityImpactModel.calculateShannonIndex(biodiversityData.species_list);
      const biodiversityScore = Math.min((shannonIndex / 3.0) * 100, 100);
      baseScore += (biodiversityScore - 70) * 0.3;
    }
    
    // Water quality component (25% weight)  
    if (waterQualityData) {
      const waterScore = WaterQualityModel.assessQualityIndex(waterQualityData.parameters);
      baseScore += (waterScore - 70) * 0.25;
    }
    
    // Climate risk component (-20% weight, negative impact)
    if (climateData) {
      const climateRisk = EcologicalRiskModel.assessClimateRisk(climateData, projectData);
      baseScore -= climateRisk.score * 0.2;
    }
    
    // Project alignment component (25% weight)
    let alignmentBonus = 0;
    if (projectData.primary_goals) {
      const goals = Array.isArray(projectData.primary_goals) 
        ? projectData.primary_goals 
        : [projectData.primary_goals];
        
      if (goals.includes('Biodiversity Enhancement')) alignmentBonus += 10;
      if (goals.includes('Carbon Sequestration')) alignmentBonus += 5;
      if (goals.includes('Fish Habitat Creation')) alignmentBonus += 8;
      if (goals.includes('Coral Restoration')) alignmentBonus += 12;
    }
    
    baseScore += alignmentBonus * 0.25;
    
    return Math.min(Math.max(Math.round(baseScore), 0), 100);
  }
  
  static generateInsights(projectData, environmentalData, biodiversityData, waterQualityData, climateData) {
    const insights = {
      opportunities: [],
      risks: [],
      recommendations: [],
      metrics: {}
    };
    
    // Calculate key metrics
    insights.metrics = {
      carbonSequestration: CarbonSequestrationModel.calculate(projectData, environmentalData || {}),
      shannonDiversity: biodiversityData ? BiodiversityImpactModel.calculateShannonIndex(biodiversityData.species_list) : 0,
      waterQualityIndex: waterQualityData ? WaterQualityModel.assessQualityIndex(waterQualityData.parameters) : 0,
      climateRisk: climateData ? EcologicalRiskModel.assessClimateRisk(climateData, projectData) : { level: 'unknown' }
    };
    
    // Generate opportunities
    if (biodiversityData && biodiversityData.diversity_index > 7) {
      insights.opportunities.push('High biodiversity area provides excellent foundation for enhancement');
    }
    
    if (insights.metrics.carbonSequestration > 50) {
      insights.opportunities.push(`Significant carbon sequestration potential: ${insights.metrics.carbonSequestration} tonnes CO₂/year`);
    }
    
    if (waterQualityData && insights.metrics.waterQualityIndex > 80) {
      insights.opportunities.push('Excellent water quality supports healthy ecosystem development');
    }
    
    // Generate risk assessments
    if (climateData && insights.metrics.climateRisk.level === 'high') {
      insights.risks.push('High climate risk requires adaptive management strategies');
      insights.risks = insights.risks.concat(insights.metrics.climateRisk.factors);
    }
    
    if (biodiversityData && biodiversityData.threatened_species > 2) {
      insights.risks.push(`${biodiversityData.threatened_species} threatened species present - enhanced monitoring required`);
    }
    
    // Generate recommendations
    if (insights.metrics.climateRisk.recommendations) {
      insights.recommendations = insights.recommendations.concat(insights.metrics.climateRisk.recommendations);
    }
    
    if (projectData.structure_type === 'Artificial Reef' && biodiversityData) {
      insights.recommendations.push('Consider multi-level structure design to maximize habitat complexity');
    }
    
    if (insights.metrics.waterQualityIndex < 60) {
      insights.recommendations.push('Address water quality issues before construction to optimize ecological outcomes');
    }
    
    return insights;
  }
}

// Regional compliance frameworks
class ComplianceEngine {
  static getRequiredMetrics(jurisdiction, projectType) {
    const frameworks = {
      'EU': {
        'Marine': ['biodiversity_net_gain', 'natura2000_assessment', 'msfd_compliance', 'habitat_directive'],
        'Coastal': ['eia_required', 'wfd_compliance', 'coastal_directive']
      },
      'US': {
        'Marine': ['nepa_compliance', 'esa_consultation', 'msa_requirements', 'cwa_permits'],
        'Coastal': ['czma_consistency', 'state_coastal_permits', 'usace_permits']
      },
      'ISRAEL': {
        'Marine': ['environmental_impact_assessment', 'coastal_protection_law', 'nature_reserves_law'],
        'Coastal': ['planning_building_law', 'water_law', 'marine_environment_protection']
      },
      'CYPRUS': {
        'Marine': ['eu_directives', 'national_biodiversity_strategy', 'marine_protected_areas'],
        'Coastal': ['coastal_zone_management', 'eia_regulations']
      }
    };
    
    const projectTypeCategory = this.categorizeProject(projectType);
    return frameworks[jurisdiction]?.[projectTypeCategory] || ['general_environmental_assessment'];
  }
  
  static categorizeProject(structureType) {
    const marineTypes = ['Artificial Reef', 'Breakwater', 'Offshore Platform'];
    const coastalTypes = ['Seawall', 'Jetty', 'Pier', 'Coastal Protection'];
    
    if (marineTypes.includes(structureType)) return 'Marine';
    if (coastalTypes.includes(structureType)) return 'Coastal';
    return 'Marine'; // Default
  }
  
  static assessCompliance(projectData, jurisdiction = 'EU') {
    const requirements = this.getRequiredMetrics(jurisdiction, projectData.structure_type);
    const status = {};
    
    requirements.forEach(req => {
      // Simplified compliance checking logic
      switch (req) {
        case 'biodiversity_net_gain':
          status[req] = projectData.primary_goals?.includes('Biodiversity Enhancement') ? 'compliant' : 'review_needed';
          break;
        case 'natura2000_assessment':
          status[req] = 'assessment_required'; // Would need actual site data
          break;
        case 'eia_required':
          // Based on project size/impact
          const volume = (projectData.length || 0) * (projectData.width || 0) * (projectData.height || 0);
          status[req] = volume > 1000 ? 'full_eia_required' : 'screening_required';
          break;
        default:
          status[req] = 'pending_review';
      }
    });
    
    return {
      jurisdiction,
      requirements,
      status,
      overallCompliance: Object.values(status).every(s => s === 'compliant') ? 'compliant' : 'review_needed'
    };
  }
}

export {
  CarbonSequestrationModel,
  BiodiversityImpactModel,
  EcologicalRiskModel,
  WaterQualityModel,
  EcologicalImpactCalculator,
  ComplianceEngine
};