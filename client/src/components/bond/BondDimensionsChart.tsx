import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radar } from 'recharts';
import { BOND_DIMENSIONS, calculateBondStrength, getBondStrengthInterpretation } from '@shared/bondDimensions';
import { BondAssessment } from '@shared/schema';
import { get } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// Component to display a radar chart of bond dimensions
export function BondDimensionsChart() {
  const { t } = useTranslation();
  const { couple } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('radar');
  const coupleId = couple?.id || 0;

  // Fetch bond assessments for the couple
  const { data: assessments, isLoading, error } = useQuery<BondAssessment[]>({
    queryKey: [`/api/couples/${coupleId}/bond-assessments`],
    queryFn: () => get(`/api/couples/${coupleId}/bond-assessments`),
    enabled: !!coupleId,
  });

  // Transform bond dimensions and assessments into chart data
  const getChartData = () => {
    if (!assessments) return [];

    // Create a map of dimension scores
    const dimensionScores = new Map<string, number>();
    assessments.forEach(assessment => {
      dimensionScores.set(assessment.dimensionId, assessment.score);
    });

    // Transform dimensions into chart data
    return BOND_DIMENSIONS.map(dimension => {
      return {
        subject: dimension.name,
        score: dimensionScores.get(dimension.id) || 0,
        fullMark: 10,
        color: dimension.color,
      };
    });
  };

  // Calculate overall bond strength
  const bondStrength = assessments ? calculateBondStrength(assessments) : 0;
  const bondInterpretation = getBondStrengthInterpretation(bondStrength);
  const chartData = getChartData();

  // If no couple exists or assessments aren't loaded yet, show a message
  if (coupleId === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.notConnected')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.connectWithPartner')}
        </p>
        <Button variant="outline" size="sm">
          {t('bond.findPartner')}
        </Button>
      </Card>
    );
  }

  // If assessments are loading, show skeleton
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </Card>
    );
  }

  // If there's an error fetching assessments
  if (error) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium text-destructive mb-2">{t('bond.errorLoading')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.tryAgainLater')}
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </Card>
    );
  }

  // If no assessments data exists yet
  if (!assessments || assessments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.noAssessments')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.takeAssessment')}
        </p>
        <Button size="sm">
          {t('bond.startAssessment')}
        </Button>
      </Card>
    );
  }

  // Custom tooltip for the radar chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 rounded-md shadow-md border border-border">
          <p className="font-medium">{data.subject}</p>
          <p className="text-sm">
            {t('bond.score')}: <span className="font-medium">{data.score}/10</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 md:p-6 pb-2">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-2">
          <div>
            <h3 className="text-lg font-medium">{t('bond.dimensions')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('bond.dimensionsDescription')}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              {bondStrength}% - {bondInterpretation}
            </div>
          </div>
        </div>

        <Tabs defaultValue="radar" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-2">
            <TabsTrigger value="radar">{t('bond.radarView')}</TabsTrigger>
            <TabsTrigger value="list">{t('bond.listView')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="radar" className="pt-4">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  cx="50%" 
                  cy="50%" 
                  outerRadius="80%" 
                  data={chartData}
                >
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 10]} 
                    tick={{ fill: 'var(--foreground)', fontSize: 10 }}
                  />
                  <Radar
                    name="BondScore"
                    dataKey="score"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.5}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="space-y-4 pt-4">
            {chartData.map((dimension, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderLeftColor: dimension.color, borderLeftWidth: '4px' }}
              >
                <div>
                  <h4 className="font-medium">{dimension.subject}</h4>
                  <p className="text-xs text-muted-foreground">
                    {BOND_DIMENSIONS.find(d => d.name === dimension.subject)?.description || ''}
                  </p>
                </div>
                <div 
                  className="rounded-full h-10 w-10 flex items-center justify-center font-bold text-white"
                  style={{ background: dimension.color }}
                >
                  {dimension.score}
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}