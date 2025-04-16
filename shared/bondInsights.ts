/**
 * Bond Insights System
 * 
 * This module handles generating personalized relationship insights based on
 * bond dimension scores. It leverages the AI companion system to provide
 * tailored, actionable advice for couples.
 */

import { aiCompanions, buildCompanionSystemPrompt, getCompanionPrompt } from './aiCompanions';
import { BondDimension } from './bondDimensions';

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
  // Map dimensions to the most appropriate AI companion
  const dimensionToCompanion: Record<string, string> = {
    // Venus specializes in communication-related dimensions
    communication: 'venus',
    emotionalIntimacy: 'venus',
    conflict: 'venus',
    trust: 'venus',
    
    // Casanova specializes in romance and shared experience dimensions
    physicalIntimacy: 'casanova',
    romance: 'casanova',
    playfulness: 'casanova',
    sharedExperiences: 'casanova',
    
    // Aurora specializes in growth and planning dimensions
    growth: 'aurora',
    goals: 'aurora',
    boundaries: 'aurora',
    balance: 'aurora',
  };
  
  return dimensionToCompanion[dimensionId] || 'aurora'; // Default to Aurora
}

/**
 * Generate insight prompt variables based on dimension and scores
 */
export function generateInsightPromptVariables(
  dimension: BondDimension,
  score: number,
  relationshipLength: string = "1-3 years"
): Record<string, string> {
  // Determine score level category
  let scoreLevel = "low";
  if (score >= 7) {
    scoreLevel = "high";
  } else if (score >= 4) {
    scoreLevel = "medium";
  }
  
  // Generate challenges based on score level
  let challenges = "";
  if (scoreLevel === "low") {
    challenges = `establishing consistent patterns, core trust issues, or fundamental misalignment in ${dimension.name} expectations`;
  } else if (scoreLevel === "medium") {
    challenges = `inconsistent application, competing priorities, or unaddressed minor issues in ${dimension.name}`;
  } else {
    challenges = `maintaining consistency during stress, avoiding complacency, or continuing to evolve as your relationship changes`;
  }
  
  // Generate sample interests for personalization
  const interestPairs = [
    "travel and outdoor activities",
    "movies and board games",
    "cooking and trying new restaurants",
    "fitness and wellness",
    "reading and intellectual discussions",
    "music and arts"
  ];
  
  // Pick a random interest pair
  const interests = interestPairs[Math.floor(Math.random() * interestPairs.length)];
  
  return {
    dimension: dimension.name,
    description: dimension.description,
    scoreLevel,
    challenges,
    relationshipLength,
    interests
  };
}

/**
 * Get the appropriate scenario key for generating insights based on the dimension
 */
export function getScenarioKeyForDimension(dimensionId: string, score: number): string {
  // High scores get maintenance recommendations
  if (score >= 7) {
    return 'relationshipMaintenance';
  }
  
  // Map dimensions to the most relevant scenario template
  const dimensionToScenario: Record<string, string> = {
    communication: 'activeListing',
    emotionalIntimacy: 'emotionalIntimacy',
    trust: 'patternIdentification',
    conflict: 'difficultConversations',
    physicalIntimacy: 'intimacyBuilding',
    romance: 'reignitingSpark',
    playfulness: 'surpriseIdeas',
    sharedExperiences: 'dateIdeas',
    growth: 'habitBuilding',
    goals: 'goalSetting',
    boundaries: 'needsExpression',
    balance: 'goalSetting'
  };
  
  return dimensionToScenario[dimensionId] || 'relationshipAssessment';
}

/**
 * Generate a bond insight prompt for a specific dimension and score
 */
export function generateBondInsightPrompt(
  dimension: BondDimension,
  score: number,
  relationshipLength: string = "1-3 years"
): string {
  // Get the best companion for this dimension
  const companionId = getBestCompanionForDimension(dimension.id);
  
  // Get the appropriate scenario for this dimension and score
  const scenarioKey = getScenarioKeyForDimension(dimension.id, score);
  
  // Generate context variables
  const variables = generateInsightPromptVariables(dimension, score, relationshipLength);
  
  // Get the specific prompt for this scenario from the companion
  const specificPrompt = getCompanionPrompt(companionId, scenarioKey, variables);
  
  // Build a complete prompt
  const systemPrompt = buildCompanionSystemPrompt(companionId, {
    scenario: scenarioKey,
    variables
  });
  
  return systemPrompt;
}

/**
 * Generate structured action items for a bond dimension based on score
 */
export function generateActionItemsForDimension(dimensionId: string, score: number): string[] {
  // Low score action items (foundational)
  if (score <= 3) {
    switch(dimensionId) {
      case 'communication':
        return [
          "Schedule a weekly 'communication check-in' for 15 minutes",
          "Practice active listening by repeating back what your partner says",
          "Write down one thing you appreciate about your partner daily"
        ];
      case 'trust':
        return [
          "Share one small vulnerability with your partner this week",
          "Follow through on a small promise to build reliability",
          "Practice transparent communication about your schedule"
        ];
      case 'emotionalIntimacy':
        return [
          "Share one meaningful feeling each day with your partner",
          "Create a 'connection ritual' before bed (like sharing highlights)",
          "Ask deeper questions beyond daily logistics"
        ];
      case 'physicalIntimacy':
        return [
          "Establish a daily 6-second kiss ritual",
          "Practice non-sexual touch daily (hand holding, hugs, shoulder rubs)",
          "Create a 'touch menu' of physical connections you both enjoy"
        ];
      default:
        return [
          "Set aside 10 minutes daily to focus on this dimension",
          "Identify one small step to improve in this area",
          "Discuss your expectations for this dimension with your partner"
        ];
    }
  }
  // Medium score action items (strengthening)
  else if (score <= 6) {
    switch(dimensionId) {
      case 'communication':
        return [
          "Try the 'speaker-listener' technique for difficult conversations",
          "Create code words for when you need space or support",
          "Schedule a monthly deeper conversation about relationship growth"
        ];
      case 'trust':
        return [
          "Share a deeper fear or insecurity with your partner",
          "Discuss a past trust breach and what you learned from it",
          "Identify one way you could be more reliable to each other"
        ];
      case 'emotionalIntimacy':
        return [
          "Share your personal goals and ask for your partner's support",
          "Create a 'emotional weather report' ritual to check in regularly",
          "Discuss what makes you feel truly seen and understood"
        ];
      case 'physicalIntimacy':
        return [
          "Try the 'sensate focus' exercise to deepen physical connection",
          "Create a relaxing bedtime ritual together",
          "Share three things that help you feel more connected physically"
        ];
      default:
        return [
          "Identify patterns that strengthen and weaken this dimension",
          "Schedule a dedicated time weekly to focus on this area",
          "Read a book or article together about this dimension"
        ];
    }
  }
  // High score action items (maintaining/advancing)
  else {
    switch(dimensionId) {
      case 'communication':
        return [
          "Learn a new communication skill together (like non-violent communication)",
          "Practice communicating effectively during stress or conflict",
          "Create a 'state of the relationship' monthly discussion"
        ];
      case 'trust':
        return [
          "Share dreams and vulnerabilities you haven't yet expressed",
          "Create a ritual to acknowledge and appreciate trustworthy actions",
          "Discuss how you might support each other through a major life change"
        ];
      case 'emotionalIntimacy':
        return [
          "Create a deeper intimacy practice like meditation together",
          "Write a letter to your partner about your hopes for your future",
          "Discuss how your emotional needs have evolved over time"
        ];
      case 'physicalIntimacy':
        return [
          "Create a 'desire map' to understand patterns in your connection",
          "Try a new physical practice together (dance, yoga, massage)",
          "Plan a sensual experience focusing entirely on each other"
        ];
      default:
        return [
          "Mentor another couple in strengthening this dimension",
          "Create a vision for how this dimension might evolve over years",
          "Challenge yourselves to take this dimension to a new level"
        ];
    }
  }
}

/**
 * Generate a complete bond insight for a specific dimension and score
 */
export function generateBondInsight(
  coupleId: number,
  dimension: BondDimension,
  score: number,
  relationshipLength: string = "1-3 years"
): InsertBondInsight {
  // Determine difficulty based on score
  let difficulty = "medium";
  if (score <= 3) {
    difficulty = "easy"; // Easier tasks for struggling areas
  } else if (score >= 7) {
    difficulty = "challenging"; // More advanced tasks for strong areas
  }
  
  // Set expiration date to 14 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  
  // Generate action items specific to this dimension and score
  const actionItems = generateActionItemsForDimension(dimension.id, score);
  
  // Generate insight title based on score
  let title = `Strengthening ${dimension.name} in Your Relationship`;
  if (score <= 3) {
    title = `Building a Foundation of ${dimension.name}`;
  } else if (score >= 7) {
    title = `Maintaining Excellence in ${dimension.name}`;
  }
  
  // Generate content placeholder (would be replaced by AI content in production)
  const content = `This insight focuses on ${dimension.name} in your relationship, which currently scores ${score}/10.
  
  ${dimension.description}
  
  Based on your score, we recommend focusing on strengthening this area through consistent small actions.
  The action items below are designed to help you make meaningful progress.`;
  
  // Define score range this insight applies to
  let targetScoreRange: [number, number] = [0, 10];
  if (score <= 3) {
    targetScoreRange = [0, 3];
  } else if (score <= 6) {
    targetScoreRange = [4, 6];
  } else {
    targetScoreRange = [7, 10];
  }
  
  return {
    title,
    coupleId,
    dimensionId: dimension.id,
    content,
    actionItems,
    targetScoreRange,
    difficulty,
    expiresAt,
    completed: false,
    viewed: false
  };
}