export interface BondDimension {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  exampleQuestions: string[];
  measurementApproach: string;
  weight: number; // Weight factor for overall bond strength calculation
}

export const bondDimensions: BondDimension[] = [
  {
    id: "communication",
    name: "Communication",
    description: "The degree of openness, clarity, and effectiveness in how couples share thoughts, feelings, and information.",
    color: "#8a2be2", // Purple
    icon: "message-circle",
    exampleQuestions: [
      "How often do you feel heard and understood by your partner?",
      "Rate how comfortable you are discussing difficult topics."
    ],
    measurementApproach: "Likert scale (1 = very poor, 10 = excellent)",
    weight: 1.2 // Higher weight as it's considered more predictive of relationship success
  },
  {
    id: "trust",
    name: "Trust",
    description: "The level of confidence each partner has in the other's honesty, reliability, and loyalty.",
    color: "#4169e1", // Royal Blue
    icon: "shield",
    exampleQuestions: [
      "How secure do you feel in your partner's commitment?",
      "How often do you feel you can confide in your partner without judgment?"
    ],
    measurementApproach: "Likert scale; frequency measures (Never–Always)",
    weight: 1.2 // Higher weight as it's considered more predictive of relationship success
  },
  {
    id: "emotional_intimacy",
    name: "Emotional Intimacy",
    description: "The closeness and warmth in sharing emotions, vulnerabilities, and supportive behaviors.",
    color: "#ff69b4", // Hot Pink
    icon: "heart",
    exampleQuestions: [
      "How emotionally close do you feel to your partner?",
      "How often do you share your deepest feelings with your partner?"
    ],
    measurementApproach: "Likert scale; qualitative rating",
    weight: 1.1
  },
  {
    id: "conflict_resolution",
    name: "Conflict Resolution",
    description: "The effectiveness with which couples address disagreements and resolve conflicts respectfully.",
    color: "#ff8c00", // Dark Orange
    icon: "shield-check",
    exampleQuestions: [
      "When conflicts arise, how satisfied are you with the resolution process?",
      "How well do you and your partner manage disagreements without lingering resentment?"
    ],
    measurementApproach: "Likert scale; scenario-based responses",
    weight: 1.0
  },
  {
    id: "physical_intimacy",
    name: "Physical Intimacy",
    description: "Satisfaction with physical affection, closeness, and sexual connection.",
    color: "#ff4500", // Orange Red
    icon: "heart-handshake",
    exampleQuestions: [
      "How satisfied are you with the level of physical intimacy in your relationship?",
      "Rate your comfort with initiating physical affection."
    ],
    measurementApproach: "Likert scale; frequency (times per week/month)",
    weight: 1.0
  },
  {
    id: "shared_values",
    name: "Shared Values/Goals",
    description: "How aligned the partners are in their core life values, goals, and future plans.",
    color: "#2e8b57", // Sea Green
    icon: "compass",
    exampleQuestions: [
      "How well do your long-term goals align with your partner's?",
      "How often do you discuss your life plans together?"
    ],
    measurementApproach: "Likert scale; checklist comparisons",
    weight: 0.9
  },
  {
    id: "fun_playfulness",
    name: "Fun & Playfulness",
    description: "The ability to enjoy light-hearted moments, shared humor, and playfulness together.",
    color: "#ffbf00", // Amber
    icon: "sparkles",
    exampleQuestions: [
      "How frequently do you engage in fun activities or playful banter with each other?",
      "Rate how much you enjoy your shared leisure time."
    ],
    measurementApproach: "Likert scale; frequency-based scoring",
    weight: 0.8
  },
  {
    id: "mutual_support",
    name: "Mutual Support & Respect",
    description: "The extent to which partners provide support, affirmation, and respect for each other's individuality and efforts.",
    color: "#3cb371", // Medium Sea Green
    icon: "helping-hand",
    exampleQuestions: [
      "How valued do you feel by your partner on a daily basis?",
      "Rate your partner's support during challenging times."
    ],
    measurementApproach: "Likert scale; qualitative check-in ratings",
    weight: 1.0
  },
  {
    id: "independence_balance",
    name: "Independence & Togetherness",
    description: "The balance between healthy individual autonomy and shared couple time, ensuring personal growth alongside relationship nurturing.",
    color: "#20b2aa", // Light Sea Green
    icon: "git-branch",
    exampleQuestions: [
      "How well do you balance personal space and together time in your relationship?",
      "How satisfied are you with your independence within the couple context?"
    ],
    measurementApproach: "Likert scale; situational items; ratio measures",
    weight: 0.8
  },
  {
    id: "overall_satisfaction",
    name: "Overall Satisfaction",
    description: "A global measure reflecting the couple's overall contentment, combining all aspects of their interaction into one score.",
    color: "#9932cc", // Dark Orchid
    icon: "check-circle",
    exampleQuestions: [
      "Overall, how satisfied are you with your relationship?",
      "Rate your general happiness as a couple."
    ],
    measurementApproach: "Global rating; composite of other scales",
    weight: 1.0
  }
];

// Utility function to calculate overall bond strength based on dimension scores
export function calculateBondStrength(scores: Record<string, number>): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  bondDimensions.forEach(dimension => {
    const score = scores[dimension.id];
    if (typeof score === 'number') {
      totalScore += score * dimension.weight;
      totalWeight += dimension.weight;
    }
  });
  
  // Return a score from 0-100
  return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 10) : 0;
}

// Generate insights based on bond dimension scores
export function generateInsightForDimension(
  dimensionId: string, 
  score: number
): string {
  const dimension = bondDimensions.find(d => d.id === dimensionId);
  
  if (!dimension) {
    return "No specific insights available for this dimension.";
  }
  
  // These would be more sophisticated in a real implementation
  if (score <= 3) {
    return `Your ${dimension.name.toLowerCase()} score indicates an opportunity for significant growth. Consider prioritizing activities that strengthen this area.`;
  } else if (score <= 6) {
    return `Your ${dimension.name.toLowerCase()} score is moderate. With some focused attention, you can enhance this aspect of your relationship.`;
  } else {
    return `Your ${dimension.name.toLowerCase()} score is strong! Continue nurturing this aspect of your relationship.`;
  }
}