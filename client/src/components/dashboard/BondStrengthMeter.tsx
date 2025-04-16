import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { BondAssessment } from '@shared/schema';
import { calculateBondStrength, getBondStrengthInterpretation } from '@shared/bondDimensions';
import { get } from '@/lib/apiClient';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, TrendingUp, AlertTriangle } from 'lucide-react';

interface BondStrengthMeterProps {
  minimal?: boolean;
  showDetails?: boolean;
  onAssessClick?: () => void;
}

// Component to display the relationship bond strength meter
export default function BondStrengthMeter({ 
  minimal = false, 
  showDetails = true,
  onAssessClick
}: BondStrengthMeterProps) {
  const { t } = useTranslation();
  const { couple, user } = useAuth();
  const coupleId = couple?.id || 0;

  // Fetch assessments to calculate bond strength
  const { data: assessments, isLoading, error } = useQuery<BondAssessment[]>({
    queryKey: [`/api/couples/${coupleId}/bond-assessments`],
    queryFn: () => get(`/api/couples/${coupleId}/bond-assessments`),
    enabled: !!coupleId,
  });

  // Calculate bond strength and get interpretation
  const bondStrength = assessments ? calculateBondStrength(assessments) : 0;
  const interpretation = getBondStrengthInterpretation(bondStrength);

  // Color gradient based on bond strength
  const getColorClass = (strength: number) => {
    if (strength >= 80) return 'from-green-500 to-emerald-600';
    if (strength >= 60) return 'from-cyan-500 to-blue-600';
    if (strength >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  // If not in a couple yet
  if (coupleId === 0) {
    return (
      <div className={`rounded-lg border p-4 ${minimal ? '' : 'bg-white/5 backdrop-blur-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-foreground/80">{t('bond.bondStrength')}</h3>
          {!minimal && (
            <span className="text-xs bg-background/50 text-foreground/70 px-2 py-0.5 rounded-full">
              {t('bond.notConnected')}
            </span>
          )}
        </div>
        
        <div className="mb-4">
          <Progress value={0} className="h-2" />
        </div>
        
        {!minimal && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/70">
              {t('bond.connectPartnerToSee')}
            </p>
            <Button size="sm" variant="outline" className="h-8">
              {t('bond.connect')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`rounded-lg border p-4 ${minimal ? '' : 'bg-white/5 backdrop-blur-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-2 w-full mb-4" />
        {!minimal && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`rounded-lg border p-4 ${minimal ? '' : 'bg-white/5 backdrop-blur-sm'}`}>
        <div className="flex items-center gap-2 text-destructive mb-3">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="text-base font-medium">{t('bond.errorLoading')}</h3>
        </div>
        <p className="text-sm text-foreground/70 mb-3">
          {t('bond.tryAgainLater')}
        </p>
        {!minimal && (
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        )}
      </div>
    );
  }

  // Handle no assessments yet
  if (!assessments || assessments.length === 0) {
    return (
      <div className={`rounded-lg border p-4 ${minimal ? '' : 'bg-white/5 backdrop-blur-sm'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-foreground/80">{t('bond.bondStrength')}</h3>
          {!minimal && (
            <span className="text-xs bg-background/50 text-foreground/70 px-2 py-0.5 rounded-full">
              {t('bond.noData')}
            </span>
          )}
        </div>
        
        <div className="mb-4">
          <Progress value={10} className="h-2" />
        </div>
        
        {!minimal && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground/70">
              {t('bond.takeAssessmentToSee')}
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8"
              onClick={onAssessClick}
            >
              {t('bond.assess')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${minimal ? '' : 'bg-white/5 backdrop-blur-sm'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-foreground/80">
          {t('bond.bondStrength')}
        </h3>
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <span className="text-sm font-medium">{bondStrength}%</span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="h-2 bg-background/60 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getColorClass(bondStrength)}`}
            style={{ width: `${bondStrength}%` }}
          ></div>
        </div>
      </div>
      
      <div className={`flex ${showDetails ? 'justify-between' : 'justify-center'} items-center`}>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background/50">
          {interpretation}
        </span>
        
        {showDetails && !minimal && (
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-foreground/70">+5% {t('bond.lastMonth')}</span>
          </div>
        )}
      </div>
      
      {!minimal && showDetails && (
        <div className="mt-3 pt-3 border-t">
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7"
            onClick={onAssessClick}
          >
            {assessments.length > 0 ? t('bond.updateAssessment') : t('bond.takeAssessment')}
          </Button>
        </div>
      )}
    </div>
  );
}