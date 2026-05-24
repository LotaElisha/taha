import React from 'react';

interface ChartData {
  x: string;
  y: number;
}

interface SimpleLineChartProps {
  data: ChartData[];
  title: string;
  colorClass?: string;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, title, colorClass = 'stroke-brand-green' }) => {
  if (!data || data.length < 2) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Not enough data to display a chart.</p>
        </div>
      </div>
    );
  }

  const chartHeight = 250;
  const chartWidth = 500;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const maxY = Math.max(...data.map(d => d.y), 0);
  
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  const yScale = (value: number) => padding.top + (chartHeight - padding.top - padding.bottom) * (1 - value / maxY);

  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.y)}`).join(' ');

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto">
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
      <div className="w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
          {/* Y-axis labels */}
          <text x={padding.left - 8} y={padding.top} textAnchor="end" className="text-xs fill-gray-500 dark:fill-gray-400">{maxY.toLocaleString()}</text>
          <text x={padding.left - 8} y={chartHeight - padding.bottom} textAnchor="end" className="text-xs fill-gray-500 dark:fill-gray-400">0</text>
          
          {/* Axis lines */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} className="stroke-gray-200 dark:stroke-gray-700" />
          <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} className="stroke-gray-200 dark:stroke-gray-700" />
          
          {/* Line Path */}
          <path d={pathData} fill="none" className={`${colorClass}`} strokeWidth="2" />

          {/* Data points and X-axis labels */}
          {data.map((d, i) => (
              <g key={i}>
                  <circle cx={xScale(i)} cy={yScale(d.y)} r="3" className={`${colorClass.replace('stroke', 'fill')} opacity-50`} />
                   {data.length <= 10 && (
                      <text x={xScale(i)} y={chartHeight - padding.bottom + 15} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400">{d.x}</text>
                   )}
              </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default SimpleLineChart;
