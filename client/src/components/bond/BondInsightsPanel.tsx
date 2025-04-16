import React from 'react';
import { bondDimensions, generateInsightForDimension } from '@shared/bondDimensions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, ArrowRight, Star, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

export interface BondInsightsPanelProps {
  scores: Record<string, number>;
  className?: string;
  onViewAllClick?: () => void;
  insightLimit?: number;
}

const BondInsightsPanel: React.FC<BondInsightsPanelProps> = ({
  scores,
  className = '',
  onViewAllClick,
  insightLimit = 3
}) => {
  const { t } = useTranslation();
  
  // Sort dimensions by score (lowest first)
  const sortedDimensions = [...bondDimensions].sort(
    (a, b) => (scores[a.id] || 0) - (scores[b.id] || 0)
  );
  
  // Get lowest scoring dimensions
  const lowestDimensions = sortedDimensions.slice(0, insightLimit);
  
  // Get highest scoring dimension
  const highestDimension = [...bondDimensions].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
  )[0];
  
  // Function to generate a specific tip for each dimension
  const generateTip = (dimensionId: string, score: number): string => {
    const dimension = bondDimensions.find(d => d.id === dimensionId);
    if (!dimension) return '';
    
    // These would be more sophisticated in a real implementation
    // with many more specific tips per dimension and score level
    switch (dimensionId) {
      case 'communication':
        return score < 5 
          ? "Schedule a 20-minute weekly check-in where you both share one thing you appreciated and one thing you'd like to improve."
          : "Try the 'speaker-listener' technique where one person speaks while the other listens without interrupting, then switch roles.";
      
      case 'trust':
        return score < 5
          ? "Build reliability by keeping small promises consistently - if you say you'll call, make sure you do."
          : "Share one vulnerability each week in a safe, judgment-free conversation.";
      
      case 'emotional_intimacy':
        return score < 5
          ? "Start a daily gratitude practice where you share one thing you appreciate about each other."
          : "Create a shared journal where you both write your thoughts, dreams and reflections.";
      
      case 'conflict_resolution':
        return score < 5
          ? "Adopt a 'time-out' policy where either person can pause an escalating argument to calm down."
          : "When discussing points of disagreement, try the XYZ approach: 'When you do X in situation Y, I feel Z.'";
      
      case 'physical_intimacy':
        return score < 5
          ? "Incorporate more non-sexual touch into your daily routine, like hand-holding, hugs, or massage."
          : "Try a '10-second kiss' each day to create a moment of deep connection.";
      
      case 'shared_values':
        return score < 5
          ? "Create a shared vision board or bucket list of goals you'd like to achieve together."
          : "Have a monthly 'future planning' dinner where you discuss your dreams and how to align them.";
      
      case 'fun_playfulness':
        return score < 5
          ? "Schedule a weekly 'play date' where you try something new and fun together."
          : "Start an inside joke collection or create your own couple traditions and rituals.";
      
      case 'mutual_support':
        return score < 5
          ? "Practice active listening by repeating back what your partner says before responding."
          : "Create a 'support menu' where you each list ways the other can best support you during difficult times.";
      
      case 'independence_balance':
        return score < 5
          ? "Set aside dedicated 'me time' for each of you, and respect these boundaries."
          : "Support each other's individual interests by showing curiosity and encouragement.";
      
      case 'overall_satisfaction':
        return score < 5
          ? "Focus on creating small positive interactions every day - they accumulate over time."
          : "Reminisce about your favorite memories together to reinforce your bond.";
      
      default:
        return "Focus on quality time together to strengthen your connection.";
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {t('Bond Insights')}
          </CardTitle>
          {onViewAllClick && (
            <Button variant="ghost" size="sm" onClick={onViewAllClick}>
              {t('View All')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {t('Personalized recommendations to strengthen your relationship')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-4">
          <div className="space-y-4">
            {/* Strength highlight */}
            {highestDimension && scores[highestDimension.id] >= 7 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border border-green-200">
                <div className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">
                      {t('Your Relationship Strength')}
                    </h4>
                    <p className="text-sm text-green-700 mb-2">
                      {t(`Your ${highestDimension.name.toLowerCase()} is impressive! This is a solid foundation for your relationship.`)}
                    </p>
                    <p className="text-sm text-green-600 italic">
                      {t("Continue nurturing this strength while working on other dimensions.")}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Growth opportunities */}
            <h4 className="font-medium text-gray-700 mb-2">
              {t('Growth Opportunities')}
            </h4>
            
            {lowestDimensions.map(dimension => (
              <div 
                key={dimension.id}
                className="p-4 rounded-lg border border-gray-200 mb-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dimension.color }}></span>
                  <h5 className="font-medium">{dimension.name}</h5>
                  <span className="ml-auto text-sm font-semibold text-gray-500">
                    {scores[dimension.id] || 0}/10
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {generateInsightForDimension(dimension.id, scores[dimension.id] || 0)}
                </p>
                
                <div className="bg-purple-50 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <Award className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h6 className="text-sm font-medium text-purple-700 mb-1">
                        {t('Try This Activity')}
                      </h6>
                      <p className="text-sm text-purple-600">
                        {generateTip(dimension.id, scores[dimension.id] || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default BondInsightsPanel;