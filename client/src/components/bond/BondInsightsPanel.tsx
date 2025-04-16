import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BondInsight, BondAssessment } from '@shared/schema';
import { BOND_DIMENSIONS, getWeakestDimensions } from '@shared/bondDimensions';
import { get } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Lightbulb, 
  Check, 
  ChevronRight, 
  ArrowRight,
  Clock,
  Star,
  BadgeHelp,
} from 'lucide-react';

// Component to display relationship insights based on bond assessments
export function BondInsightsPanel() {
  const { t } = useTranslation();
  const { couple } = useAuth();
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const coupleId = couple?.id || 0;

  // Fetch bond insights for the couple
  const { data: insights, isLoading: loadingInsights } = useQuery<BondInsight[]>({
    queryKey: [`/api/couples/${coupleId}/bond-insights`],
    queryFn: () => get(`/api/couples/${coupleId}/bond-insights`),
    enabled: !!coupleId,
  });

  // Fetch bond assessments to identify weak dimensions
  const { data: assessments, isLoading: loadingAssessments } = useQuery<BondAssessment[]>({
    queryKey: [`/api/couples/${coupleId}/bond-assessments`],
    queryFn: () => get(`/api/couples/${coupleId}/bond-assessments`),
    enabled: !!coupleId,
  });

  // Helper to get the color for a dimension
  const getDimensionColor = (dimensionId: string): string => {
    const dimension = BOND_DIMENSIONS.find(d => d.id === dimensionId);
    return dimension?.color || '#6366F1'; // Default to indigo if not found
  };

  // Helper to get the name for a dimension
  const getDimensionName = (dimensionId: string): string => {
    const dimension = BOND_DIMENSIONS.find(d => d.id === dimensionId);
    return dimension?.name || dimensionId;
  };

  // Toggle expanded state for an insight
  const toggleExpand = (index: number) => {
    if (expandedInsight === index) {
      setExpandedInsight(null);
    } else {
      setExpandedInsight(index);
    }
  };

  // Loading state
  if (loadingInsights || loadingAssessments) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  // If no couple exists
  if (coupleId === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.insightsNotAvailable')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.connectToUnlock')}
        </p>
        <Button variant="outline" size="sm">
          {t('bond.findPartner')}
        </Button>
      </Card>
    );
  }

  // No insights available yet
  if (!insights || insights.length === 0) {
    // If we have assessments, suggest generating insights for weakest dimensions
    if (assessments && assessments.length > 0) {
      const weakDimensions = getWeakestDimensions(assessments, 2);
      return (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BadgeHelp className="h-5 w-5 text-primary" />
            <h3 className="font-medium">{t('bond.generateInsights')}</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {t('bond.insightsDescription')}
          </p>
          
          <div className="space-y-3 mb-4">
            {weakDimensions.map((dimensionId, index) => (
              <div 
                key={index}
                className="flex items-center p-3 bg-muted/30 rounded-md"
              >
                <div 
                  className="w-2 h-2 rounded-full mr-3"
                  style={{ backgroundColor: getDimensionColor(dimensionId) }}
                ></div>
                <span>{getDimensionName(dimensionId)}</span>
              </div>
            ))}
          </div>
          
          <Button>
            {t('bond.generateInsightsButton')}
          </Button>
        </Card>
      );
    }
    
    // If no assessments, prompt to complete assessment first
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.noInsightsYet')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.completeAssessment')}
        </p>
        <Button size="sm">
          {t('bond.startAssessment')}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 md:p-6 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium">{t('bond.relationshipInsights')}</h3>
        </div>
        
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className="border rounded-lg overflow-hidden transition-all"
            >
              <div 
                className="flex justify-between items-center p-3 cursor-pointer"
                onClick={() => toggleExpand(index)}
                style={{ 
                  borderLeft: `4px solid ${getDimensionColor(insight.dimensionId)}`,
                }}
              >
                <div className="flex items-center gap-3">
                  {insight.viewed ? (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Check className="h-3 w-3 text-gray-500" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{getDimensionName(insight.dimensionId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {insight.difficulty === 'easy' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      {t('bond.easy')}
                    </span>
                  )}
                  {insight.difficulty === 'medium' && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      {t('bond.medium')}
                    </span>
                  )}
                  {insight.difficulty === 'challenging' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                      {t('bond.challenging')}
                    </span>
                  )}
                  <ChevronRight 
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      expandedInsight === index ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </div>
              
              {expandedInsight === index && (
                <div className="p-4 bg-muted/10">
                  <p className="text-sm mb-4">{insight.content}</p>
                  
                  {insight.actionItems.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2">{t('bond.tryThese')}</h5>
                      <ul className="space-y-2">
                        {insight.actionItems.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{t('bond.expires')} {new Date(insight.expiresAt || '').toLocaleDateString()}</span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant={insight.completed ? "outline" : "default"}
                    >
                      {insight.completed ? t('bond.completed') : t('bond.markComplete')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}