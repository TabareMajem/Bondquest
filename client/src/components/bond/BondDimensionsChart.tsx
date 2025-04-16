import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { bondDimensions, getDimensionsForRadarChart } from '@shared/bondDimensions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

// Register the required Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface BondDimensionsChartProps {
  scores: Record<string, number>;
  title?: string;
  description?: string;
  className?: string;
  showLegend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  aspectRatio?: number;
}

export function BondDimensionsChart({
  scores,
  title,
  description,
  className = '',
  showLegend = false,
  size = 'md',
  aspectRatio = 1,
}: BondDimensionsChartProps) {
  const { t } = useTranslation();
  
  // Get dimension data formatted for the radar chart
  const chartData = useMemo(() => {
    return getDimensionsForRadarChart(scores);
  }, [scores]);
  
  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#222',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          // Add a description of the dimension in the tooltip
          label: function(context: any) {
            const index = context.dataIndex;
            const dimensionName = context.chart.data.labels[index];
            const dimension = bondDimensions.find(d => d.name === dimensionName);
            const score = context.raw;
            
            if (!dimension) {
              return [`${dimensionName}: ${score}/10`];
            }
            
            return [
              `${dimension.name}: ${score}/10`,
              dimension.description
            ];
          }
        }
      }
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        beginAtZero: true,
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        pointLabels: {
          font: {
            size: size === 'sm' ? 8 : size === 'md' ? 12 : 14,
          },
          color: '#666',
        },
        ticks: {
          stepSize: 2,
          backdropColor: 'transparent',
        }
      }
    },
  };

  // If no scores or all zeros, show a placeholder/empty state
  const hasValidScores = Object.values(scores).some(score => score > 0);
  
  if (!hasValidScores) {
    return (
      <Card className={`${className} flex flex-col items-center justify-center min-h-[300px]`}>
        <CardHeader>
          <CardTitle className="text-center">{title || t('Relationship Dimensions')}</CardTitle>
          {description && <CardDescription className="text-center">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p>{t('No dimension data available yet.')}</p>
          <p className="text-sm mt-2">{t('Complete the onboarding process to see your relationship insights.')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={`p-${size === 'sm' ? 2 : size === 'md' ? 4 : 6}`}>
        <Radar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}