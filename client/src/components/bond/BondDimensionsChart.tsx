import React from 'react';
import { bondDimensions, BondDimension } from '@shared/bondDimensions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface BondDimensionsChartProps {
  scores: Record<string, number>;
  className?: string;
  showScores?: boolean;
  showDetails?: boolean;
  title?: string;
  description?: string;
  onDimensionClick?: (dimensionId: string) => void;
}

const BondDimensionsChart: React.FC<BondDimensionsChartProps> = ({
  scores,
  className = '',
  showScores = true,
  showDetails = true,
  title = 'Bond Dimensions',
  description = 'A visual representation of your relationship dimensions',
  onDimensionClick
}) => {
  const { t } = useTranslation();
  
  // Calculate which dimensions to highlight (lowest scores)
  const sortedDimensions = [...bondDimensions].sort(
    (a, b) => (scores[a.id] || 0) - (scores[b.id] || 0)
  );
  
  const needsAttention = sortedDimensions.slice(0, 2).map(d => d.id);
  
  // Size settings for the radar chart
  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4; // Slightly smaller than half to leave room for labels
  
  const renderRadarChart = () => {
    // Calculate points for each dimension
    const points = bondDimensions.map((dimension, index) => {
      const angle = (Math.PI * 2 * index) / bondDimensions.length - Math.PI / 2;
      const score = scores[dimension.id] || 0;
      const distance = (score / 10) * radius;
      
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      
      return { x, y, dimension };
    });
    
    // Create the polygon points string
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
    
    // Create marker circles
    const markers = points.map((point, i) => (
      <circle
        key={`marker-${i}`}
        cx={point.x}
        cy={point.y}
        r={4}
        fill={point.dimension.color}
        stroke="white"
        strokeWidth="1"
      />
    ));
    
    // Create the background circles for the scale
    const circles = [2, 4, 6, 8, 10].map((value, i) => (
      <circle
        key={`circle-${i}`}
        cx={centerX}
        cy={centerY}
        r={(value / 10) * radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="1"
        strokeDasharray={i === 4 ? "none" : "2,2"}
      />
    ));
    
    // Create the dimension axes
    const axes = bondDimensions.map((dimension, i) => {
      const angle = (Math.PI * 2 * i) / bondDimensions.length - Math.PI / 2;
      const x2 = centerX + radius * Math.cos(angle);
      const y2 = centerY + radius * Math.sin(angle);
      
      return (
        <line
          key={`axis-${i}`}
          x1={centerX}
          y1={centerY}
          x2={x2}
          y2={y2}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      );
    });
    
    // Create the dimension labels
    const labels = bondDimensions.map((dimension, i) => {
      const angle = (Math.PI * 2 * i) / bondDimensions.length - Math.PI / 2;
      const labelDistance = radius * 1.15; // Place labels slightly outside the chart
      const x = centerX + labelDistance * Math.cos(angle);
      const y = centerY + labelDistance * Math.sin(angle);
      
      // Adjust text-anchor based on position around the circle
      let textAnchor = "middle";
      if (angle > -Math.PI * 0.25 && angle < Math.PI * 0.25) textAnchor = "start";
      else if (angle > Math.PI * 0.75 || angle < -Math.PI * 0.75) textAnchor = "end";
      
      return (
        <text
          key={`label-${i}`}
          x={x}
          y={y}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          fontSize="10"
          fontWeight={needsAttention.includes(dimension.id) ? "bold" : "normal"}
          fill={needsAttention.includes(dimension.id) ? dimension.color : "#64748b"}
          className="cursor-pointer"
          onClick={() => onDimensionClick && onDimensionClick(dimension.id)}
        >
          {dimension.name}
        </text>
      );
    });
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="m-auto">
        {/* Background elements */}
        {circles}
        {axes}
        
        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(138, 43, 226, 0.2)"
          stroke="rgba(138, 43, 226, 0.8)"
          strokeWidth="2"
        />
        
        {/* Markers and labels */}
        {markers}
        {labels}
      </svg>
    );
  };
  
  // Show dimension cards with scores and descriptions
  const renderDimensionCards = () => {
    return bondDimensions.map(dimension => {
      const score = scores[dimension.id] || 0;
      const isLow = needsAttention.includes(dimension.id);
      
      return (
        <div 
          key={dimension.id} 
          className={`p-3 rounded-lg border ${isLow ? 'border-orange-300 bg-orange-50' : 'border-gray-200'} 
            mb-2 cursor-pointer transition-all hover:shadow-md`}
          onClick={() => onDimensionClick && onDimensionClick(dimension.id)}
        >
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dimension.color }}></span>
              {dimension.name}
              {isLow && <Badge variant="outline" className="text-orange-600 border-orange-300">Needs attention</Badge>}
            </div>
            {showScores && (
              <span className="text-lg font-bold">{score}/10</span>
            )}
          </div>
          <Progress 
            value={score * 10} 
            className={`h-2 mb-2 ${isLow ? "bg-orange-500" : ""}`} 
          />
          <p className="text-sm text-gray-600 mt-1">{dimension.description}</p>
        </div>
      );
    });
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-5 w-5 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>{t('This chart shows the ten core dimensions of your relationship bond. Higher scores indicate stronger areas, while lower scores highlight opportunities for growth.')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            {renderRadarChart()}
          </div>
          
          {showDetails && (
            <div className="w-full lg:w-1/2 max-h-96 overflow-y-auto pr-2">
              {renderDimensionCards()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BondDimensionsChart;