import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: ChartData[];
  title: string;
  colorClass?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title, colorClass = 'fill-brand-green' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No data available.</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const chartHeight = 250;
  const barWidth = 40;
  const barMargin = 20;
  const chartWidth = data.length * (barWidth + barMargin);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-x-auto">
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
      <div className="w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full h-auto min-w-[200px]" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(0, 10)">
            {data.map((d, i) => {
              const barHeight = maxValue > 0 ? (d.value / maxValue) * chartHeight : 0;
              const x = i * (barWidth + barMargin) + barMargin / 2;
              const y = chartHeight - barHeight;

              return (
                <g key={d.label} className="group">
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    className={`${colorClass} transition-opacity duration-300 group-hover:opacity-80`}
                    rx="4"
                  />
                  <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="text-sm font-semibold fill-gray-800 dark:fill-gray-100">
                    {d.value}
                  </text>
                  <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-gray-500 dark:fill-gray-400 truncate">
                    {d.label}
                  </text>
                </g>
              );
            })}
             <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SimpleBarChart;
