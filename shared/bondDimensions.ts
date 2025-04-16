// Bond dimensions model for relationship assessment

export interface BondDimension {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  exampleQuestions: string[];
}

export const bondDimensions: BondDimension[] = [
  {
    id: 'communication',
    name: 'Communication',
    description: 'The degree of openness, clarity, and effectiveness in how couples share thoughts, feelings, and needs.',
    color: '#8A2BE2', // Purple
    icon: 'MessageSquare',
    exampleQuestions: [
      'How comfortable do you feel expressing your true feelings to your partner?',
      'Does your partner listen attentively to your concerns?',
      'How effectively do you resolve conflicts through conversation?'
    ]
  },
  {
    id: 'trust',
    name: 'Trust',
    description: 'The level of confidence, reliability, and dependability between partners.',
    color: '#4169E1', // Royal Blue
    icon: 'Shield',
    exampleQuestions: [
      'Do you believe your partner is honest with you?',
      'Can you rely on your partner to keep commitments?',
      'Do you feel secure in your relationship?'
    ]
  },
  {
    id: 'intimacy',
    name: 'Emotional Intimacy',
    description: 'The depth of emotional connection, vulnerability, and closeness between partners.',
    color: '#FF1493', // Deep Pink
    icon: 'Heart',
    exampleQuestions: [
      'How comfortable are you being vulnerable with your partner?',
      'Do you feel emotionally connected to your partner?',
      'Do you share your inner thoughts and feelings freely?'
    ]
  },
  {
    id: 'support',
    name: 'Support',
    description: 'How partners encourage, assist, and stand by each other in various life situations.',
    color: '#32CD32', // Lime Green
    icon: 'HandsHelping',
    exampleQuestions: [
      'Does your partner encourage your personal growth?',
      'How supportive is your partner during difficult times?',
      'Do you feel your partner celebrates your successes?'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'How the relationship evolves, adapts, and develops over time.',
    color: '#FFD700', // Gold
    icon: 'Sprout',
    exampleQuestions: [
      'Has your relationship grown stronger over time?',
      'Do you feel you have learned and evolved together?',
      'How open are you to change and adaptation in your relationship?'
    ]
  },
  {
    id: 'fun',
    name: 'Playfulness',
    description: 'The level of joy, humor, and light-heartedness shared between partners.',
    color: '#FF7F50', // Coral
    icon: 'Sparkles',
    exampleQuestions: [
      'How often do you laugh together?',
      'Do you make time for fun and play in your relationship?',
      'Do you enjoy trying new activities together?'
    ]
  },
  {
    id: 'goals',
    name: 'Shared Vision',
    description: 'The alignment of future aspirations, values, and life direction between partners.',
    color: '#20B2AA', // Light Sea Green
    icon: 'Map',
    exampleQuestions: [
      'Do you share similar goals for the future?',
      'How often do you discuss your dreams and aspirations together?',
      'Do you have a shared vision for your relationship?'
    ]
  },
  {
    id: 'autonomy',
    name: 'Independence',
    description: 'The balance between togetherness and individual freedom within the relationship.',
    color: '#FF4500', // Orange Red
    icon: 'Unlink',
    exampleQuestions: [
      'Does your relationship allow space for individual interests?',
      'Do you feel you maintain your identity within the relationship?',
      'How comfortable are you spending time apart?'
    ]
  },
  {
    id: 'appreciation',
    name: 'Appreciation',
    description: 'How partners acknowledge, value, and express gratitude for each other.',
    color: '#9932CC', // Dark Orchid
    icon: 'ThumbsUp',
    exampleQuestions: [
      'How often do you express appreciation for your partner?',
      'Do you feel valued and appreciated in your relationship?',
      'Do you acknowledge the little things your partner does?'
    ]
  },
  {
    id: 'respect',
    name: 'Respect',
    description: 'The regard, consideration, and admiration partners have for each others boundaries, opinions, and differences.',
    color: '#008080', // Teal
    icon: 'UserCheck',
    exampleQuestions: [
      'Do you respect each others boundaries?',
      'How well do you accept differences in opinions?',
      'Do you feel your partner values your perspective?'
    ]
  }
];

/**
 * Calculate overall bond strength based on dimension scores
 * @param scores Record of dimension scores (1-10 for each dimension)
 * @returns Overall bond strength (1-100)
 */
export const calculateBondStrength = (scores: Record<string, number>): number => {
  // Get all dimensions we have scores for
  const scoredDimensions = Object.keys(scores).filter(id => 
    bondDimensions.some(d => d.id === id) && typeof scores[id] === 'number'
  );
  
  // If no dimensions scored, return 0
  if (scoredDimensions.length === 0) return 0;
  
  // Calculate average (scaled to 0-100)
  const sum = scoredDimensions.reduce((total, id) => total + scores[id], 0);
  return Math.round((sum / scoredDimensions.length) * 10);
};

/**
 * Generate insight content based on dimension and score
 * @param dimensionId Dimension ID
 * @param score Score (1-10)
 * @returns Insight content
 */
export const generateInsightForDimension = (dimensionId: string, score: number): string => {
  const dimension = bondDimensions.find(d => d.id === dimensionId);
  if (!dimension) return '';
  
  // Get insight based on score range
  if (score <= 3) {
    return `Your ${dimension.name.toLowerCase()} score indicates an area that needs focused attention. Building stronger ${dimension.name.toLowerCase()} takes time and consistent effort, but even small improvements can significantly enhance your relationship. Start with open conversations about how you both feel about this aspect of your relationship and what small steps you can take together.`;
  } else if (score <= 6) {
    return `Your ${dimension.name.toLowerCase()} score shows moderate strength with room for growth. You have a foundation to build upon, and with some intentional focus, this area can become a relationship strength. Consider setting aside regular time to discuss and practice skills related to ${dimension.name.toLowerCase()}.`;
  } else {
    return `Your ${dimension.name.toLowerCase()} score shows this is a strength in your relationship. Continue nurturing this aspect and consider how you might help other couples who struggle in this area. Remember that even strengths require maintenance - discuss what is working well and how you can ensure it remains strong as your relationship evolves.`;
  }
};