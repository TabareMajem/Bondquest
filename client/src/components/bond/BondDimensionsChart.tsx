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
  
  // Get dimension data formatted for the radar chart with enhanced styling
  const chartData = useMemo(() => {
    const data = getDimensionsForRadarChart(scores);
    
    // Enhanced styling with gradient
    if (data.datasets && data.datasets.length > 0) {
      // Update only the properties that exist in the RadialDataPoint type
      data.datasets[0] = {
        ...data.datasets[0],
        backgroundColor: 'rgba(147, 51, 234, 0.2)',  // Purple with transparency
        borderColor: 'rgba(147, 51, 234, 0.8)',      // Solid purple
        borderWidth: 2,
        pointBackgroundColor: 'rgba(147, 51, 234, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(147, 51, 234, 1)',
      };
    }
    
    return data;
  }, [scores]);
  
  // Use window width to adjust chart responsiveness
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  
  // Chart options with improved mobile responsiveness
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: isMobile ? 0.8 : aspectRatio,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          boxWidth: isMobile ? 8 : 12,
          padding: isMobile ? 8 : 10,
          font: {
            size: isMobile ? 10 : 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#222',
        bodyColor: '#666',
        borderColor: 'rgba(147, 51, 234, 0.3)',
        borderWidth: 1,
        padding: isMobile ? 6 : 10,
        boxPadding: isMobile ? 2 : 4,
        usePointStyle: true,
        // ChartJS type compatibility
        titleFont: {
          size: isMobile ? 12 : 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: isMobile ? 10 : 12
        },
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
            
            // On mobile, show shorter description
            if (isMobile) {
              return [`${dimension.name}: ${score}/10`];
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
          color: 'rgba(147, 51, 234, 0.1)',
        },
        grid: {
          color: 'rgba(147, 51, 234, 0.05)',
        },
        pointLabels: {
          font: {
            size: isMobile ? 
              (size === 'sm' ? 7 : size === 'md' ? 9 : 11) : 
              (size === 'sm' ? 8 : size === 'md' ? 12 : 14),
            weight: isMobile ? 'bold' : 'normal'
          },
          color: '#666',
          padding: isMobile ? 4 : 8,
          // For mobile, use shorter labels
          callback: function(label: string) {
            if (isMobile) {
              // Try to create shorter labels for mobile
              if (label === 'Communication') return 'Comm.';
              if (label === 'Emotional Intimacy') return 'Emot.';
              if (label === 'Conflict Resolution') return 'Confl.';
              if (label === 'Physical Intimacy') return 'Phys.';
              if (label === 'Shared Values/Goals') return 'Values';
              if (label === 'Fun & Playfulness') return 'Fun';
              if (label === 'Mutual Support') return 'Support';
              if (label === 'Independence Balance') return 'Indep.';
              // Otherwise return first 5 chars + .
              return label.length > 6 ? label.slice(0, 5) + '.' : label;
            }
            return label;
          }
        },
        ticks: {
          stepSize: isMobile ? 2.5 : 2,
          backdropColor: 'transparent',
          z: 1,
          font: {
            size: isMobile ? 8 : 10
          }
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