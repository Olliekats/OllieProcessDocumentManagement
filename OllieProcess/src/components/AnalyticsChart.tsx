import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsChartProps {
  title: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie';
  trend?: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, data, type, trend }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((point, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{point.label}</span>
            <span className="font-medium text-slate-800">{point.value}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(point.value / maxValue) * 100}%`,
                backgroundColor: point.color || '#3b82f6',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => {
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 80;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-full h-48" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (point.value / maxValue) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#3b82f6"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="flex justify-between mt-2 text-xs text-slate-600">
          {data.map((point, index) => (
            <span key={index}>{point.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;

    return (
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-48 h-48">
          {data.map((point, index) => {
            const percentage = point.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;

            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (currentAngle - 90) * (Math.PI / 180);

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={point.color || `hsl(${index * (360 / data.length)}, 70%, 60%)`}
              />
            );
          })}
        </svg>
        <div className="space-y-2">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: point.color || `hsl(${index * (360 / data.length)}, 70%, 60%)`,
                }}
              />
              <span className="text-sm text-slate-600">
                {point.label}: {point.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="text-green-600" size={20} />;
    if (trend < 0) return <TrendingDown className="text-red-600" size={20} />;
    return <Minus className="text-slate-600" size={20} />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return '';
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>
      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      {type === 'pie' && renderPieChart()}
    </div>
  );
};
