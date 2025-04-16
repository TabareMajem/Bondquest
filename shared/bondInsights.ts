/**
 * Bond Insights System
 * 
 * This module handles generating personalized relationship insights based on
 * bond dimension scores. It leverages the AI companion system to provide
 * tailored, actionable advice for couples.
 */

import { bondDimensions, BondDimension } from './bondDimensions';
import { aiCompanions, getCompanionPrompt } from './aiCompanions';

/**
 * Represents a bond insight with guidance for a specific relationship dimension
 */
export interface BondInsight {
  id: number;
  createdAt: Date;
  title: string;
  coupleId: number;
  dimensionId: string;
  content: string;
  actionItems: string[];
  targetScoreRange: [number, number]; // [min, max] score range for which this insight is relevant
  difficulty: string; // e.g., "easy", "medium", "challenging"
  completed: boolean | null;
  expiresAt: Date | null;
  viewed: boolean | null;
}

/**
 * Type used when creating a new bond insight
 */
export interface InsertBondInsight {
  title: string;
  coupleId: number;
  dimensionId: string;
  content: string;
  actionItems: string[];
  targetScoreRange: [number, number];
  difficulty: string;
  expiresAt?: Date | null;
  completed?: boolean | null;
  viewed?: boolean | null;
}

/**
 * Get the companion best suited for advice on a specific bond dimension
 */
export function getBestCompanionForDimension(dimensionId: string): string {
  // Match dimensions to the most appropriate companion
  const dimensionToCompanion: Record<string, string> = {
    // Venus is best for communication and emotional dimensions
    'communication': 'venus',
    'emotional_intimacy': 'venus',
    'conflict_resolution': 'venus',
    'mutual_support': 'venus',
    
    // Casanova is best for romance and fun dimensions
    'physical_intimacy': 'casanova',
    'fun_playfulness': 'casanova',
    
    // Aurora is best for analytical and planning dimensions
    'trust': 'aurora',
    'shared_values': 'aurora',
    'independence_balance': 'aurora',
    'overall_satisfaction': 'aurora'
  };
  
  return dimensionToCompanion[dimensionId] || 'aurora'; // Default to Aurora if no match
}

/**
 * Generate insight prompt variables based on dimension and scores
 */
export function generateInsightPromptVariables(
  dimension: BondDimension,
  score: number,
  relationshipLength?: string,
  partnerInterests?: string[]
): Record<string, string> {
  const variables: Record<string, string> = {
    dimension: dimension.name,
    score: score.toString(),
    scoreLevel: score <= 3 ? 'low' : score <= 6 ? 'moderate' : 'high',
    description: dimension.description
  };
  
  if (relationshipLength) {
    variables.relationshipLength = relationshipLength;
  }
  
  if (partnerInterests && partnerInterests.length > 0) {
    variables.interests = partnerInterests.join(', ');
  }
  
  return variables;
}

/**
 * Get the appropriate scenario key for generating insights based on the dimension
 */
export function getScenarioKeyForDimension(dimensionId: string, score: number): string {
  // Match dimensions to companion-specific scenario templates
  const dimensionToScenario: Record<string, Record<string, string>> = {
    // Venus scenarios
    'communication': {
      low: 'difficultConversations',
      moderate: 'activeListing',
      high: 'emotionalIntimacy'
    },
    'emotional_intimacy': {
      low: 'emotionalIntimacy',
      moderate: 'emotionalIntimacy',
      high: 'emotionalIntimacy'
    },
    'conflict_resolution': {
      low: 'conflictResolution',
      moderate: 'conflictResolution',
      high: 'needsExpression'
    },
    'mutual_support': {
      low: 'needsExpression',
      moderate: 'activeListing',
      high: 'emotionalIntimacy'
    },
    
    // Casanova scenarios
    'physical_intimacy': {
      low: 'intimacyBuilding',
      moderate: 'reignitingSpark',
      high: 'surpriseIdeas'
    },
    'fun_playfulness': {
      low: 'dateIdeas',
      moderate: 'dateIdeas',
      high: 'surpriseIdeas'
    },
    
    // Aurora scenarios
    'trust': {
      low: 'patternIdentification',
      moderate: 'habitBuilding',
      high: 'relationshipMaintenance'
    },
    'shared_values': {
      low: 'goalSetting',
      moderate: 'goalSetting',
      high: 'relationshipMaintenance'
    },
    'independence_balance': {
      low: 'relationshipAssessment',
      moderate: 'habitBuilding',
      high: 'relationshipMaintenance'
    },
    'overall_satisfaction': {
      low: 'relationshipAssessment',
      moderate: 'habitBuilding',
      high: 'relationshipMaintenance'
    }
  };
  
  const scoreLevel = score <= 3 ? 'low' : score <= 6 ? 'moderate' : 'high';
  
  // Get scenario based on dimension and score level, default to assessment if not found
  return dimensionToScenario[dimensionId]?.[scoreLevel] || 'relationshipAssessment';
}

/**
 * Generate a bond insight prompt for a specific dimension and score
 */
export function generateBondInsightPrompt(
  dimensionId: string,
  score: number,
  contextInfo: {
    relationshipLength?: string;
    partnerInterests?: string[];
    challenges?: string[];
  } = {}
): string {
  // Get the dimension details
  const dimension = bondDimensions.find(d => d.id === dimensionId);
  if (!dimension) {
    return "No specific insights available for this dimension.";
  }
  
  // Determine best companion for this dimension
  const companionId = getBestCompanionForDimension(dimensionId);
  
  // Get the appropriate scenario key for this dimension and score
  const scenarioKey = getScenarioKeyForDimension(dimensionId, score);
  
  // Create variables for the prompt template
  const variables = generateInsightPromptVariables(
    dimension, 
    score, 
    contextInfo.relationshipLength,
    contextInfo.partnerInterests
  );
  
  // Add challenges if provided
  if (contextInfo.challenges && contextInfo.challenges.length > 0) {
    variables.challenges = contextInfo.challenges.join(', ');
  }
  
  // Get the appropriate prompt for this companion and scenario
  const prompt = getCompanionPrompt(companionId, scenarioKey, variables);
  
  return prompt;
}

/**
 * Generate structured action items for a bond dimension based on score
 */
export function generateActionItemsForDimension(dimensionId: string, score: number): string[] {
  // Basic templates for action items that would normally be generated by AI
  const actionTemplates: Record<string, string[]> = {
    'communication': [
      "Schedule a weekly 'heart-to-heart' talk with no distractions",
      "Practice active listening techniques during difficult conversations",
      "Use 'I feel' statements instead of accusatory language"
    ],
    'trust': [
      "Share one vulnerable thought or feeling each day",
      "Follow through on small promises consistently",
      "Create shared passwords or access to each other's devices"
    ],
    'emotional_intimacy': [
      "Share a childhood memory you've never told your partner",
      "Express appreciation for something specific your partner did today",
      "Create a shared journal where you both write thoughts and feelings"
    ],
    'conflict_resolution': [
      "Establish a 'time-out' word to pause heated discussions",
      "Wait 24 hours before discussing major disagreements",
      "Focus on finding solutions rather than assigning blame"
    ],
    'physical_intimacy': [
      "Create a list of physical touch preferences you both enjoy",
      "Schedule regular date nights focused on connection",
      "Try a new physical activity together like dancing or massage"
    ],
    'shared_values': [
      "Create a vision board for your relationship's future",
      "Discuss one life goal and how you can support each other",
      "Volunteer together for a cause you both believe in"
    ],
    'fun_playfulness': [
      "Plan a surprise activity for your partner this week",
      "Try a new hobby or game together",
      "Create a bucket list of fun experiences to share"
    ],
    'mutual_support': [
      "Identify your partner's current stressors and offer support",
      "Celebrate a recent accomplishment of your partner's",
      "Ask your partner what kind of support they most need right now"
    ],
    'independence_balance': [
      "Schedule dedicated 'me time' for each partner weekly",
      "Support each other in pursuing individual interests",
      "Share what you gained from your individual experiences"
    ],
    'overall_satisfaction': [
      "Create a gratitude practice focusing on relationship positives",
      "Identify one small daily habit that would improve your connection",
      "Discuss your relationship strengths and build on them"
    ]
  };
  
  // Get action items for this dimension, or use default if not found
  const actions = actionTemplates[dimensionId] || actionTemplates.overall_satisfaction;
  
  // Select appropriate number of actions based on score
  // Low scores get more actions, high scores get fewer maintenance actions
  const actionCount = score <= 3 ? 3 : score <= 6 ? 2 : 1;
  
  return actions.slice(0, actionCount);
}

/**
 * Generate a complete bond insight for a specific dimension and score
 */
export function generateBondInsight(
  coupleId: number,
  dimensionId: string,
  score: number,
  contextInfo: {
    relationshipLength?: string;
    partnerInterests?: string[];
    challenges?: string[];
  } = {}
): InsertBondInsight {
  // Get the dimension details
  const dimension = bondDimensions.find(d => d.id === dimensionId) || bondDimensions[0];
  
  // Get difficulty level based on score
  const difficulty = score <= 3 ? "challenging" : score <= 6 ? "medium" : "easy";
  
  // Generate content (this would normally come from AI)
  const content = generateBondInsightPrompt(dimensionId, score, contextInfo);
  
  // Generate action items
  const actionItems = generateActionItemsForDimension(dimensionId, score);
  
  // Create expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  // Create insight title based on dimension and score
  let title: string;
  if (score <= 3) {
    title = `Strengthening Your ${dimension.name}`;
  } else if (score <= 6) {
    title = `Enhancing Your ${dimension.name}`;
  } else {
    title = `Maintaining Strong ${dimension.name}`;
  }
  
  return {
    title,
    coupleId,
    dimensionId,
    content,
    actionItems,
    targetScoreRange: [Math.max(0, score - 2), Math.min(10, score + 2)],
    difficulty,
    expiresAt,
    completed: null,
    viewed: false
  };
}